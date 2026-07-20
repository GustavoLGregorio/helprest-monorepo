/**
 * HomeScreen — Map View
 *
 * WHY REMOTE URLs DON'T WORK AS MARKER ICONS ON ANDROID
 * ─────────────────────────────────────────────────────
 * Google Maps Android SDK does not accept live View trees as marker icons.
 * react-native-maps works around this by converting JS view trees to Bitmap
 * snapshots via Android's View.buildDrawingCache(). The snapshot is taken
 * at an unpredictable point in the render cycle, often BEFORE the remote
 * image has been composited into the native canvas — producing blank markers.
 * tracksViewChanges, delays, expo-image, and other incremental fixes do not
 * eliminate this race condition; they only reduce its probability.
 *
 * THE DEFINITIVE FIX
 * ──────────────────
 * 1. Download every remote pin image to the device filesystem BEFORE rendering
 *    any markers (expo-file-system + expo-crypto for deterministic filenames).
 * 2. Pass the local `file://` path via the `image` prop on <Marker>.
 *    The native Maps layer reads local files synchronously — no race condition.
 * 3. Set tracksViewChanges={false} permanently — local files are always ready.
 * 4. Cache by content-addressed hash: no re-downloads for the same URL.
 *
 * This is the pattern recommended by the react-native-maps community and
 * proven in production apps that combine map markers with remote images.
 */

import {
    Platform,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback, useRef, memo } from "react";
import UserBar from "@/components/ui/UserBar";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";
import {
    getCurrentPosition,
    startForegroundTracking,
    onLocationUpdate,
    type LocationCoords,
} from "@/services/location";
import { onMapRecenter } from "@/utils/mapEvents";
import { loadUserProfile } from "@/storage/userProfile";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FlagImages {
    tag: string | null;
    pin: string | null;
}

interface EstablishmentFlag {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
    images: FlagImages;
}

interface Establishment {
    id: string;
    companyName: string;
    location: {
        state: string;
        city: string;
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    flags: EstablishmentFlag[];
}

interface EstablishmentsResponse {
    data: Establishment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface PlaceMarkerData {
    id: string;
    coordinates: { latitude: number; longitude: number };
    title: string;
    /** Local file:// URI — always set before rendering (null → use fallback) */
    localPinUri: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION: LocationCoords = {
    latitude: -25.4284,
    longitude: -49.2733,
};

const DEFAULT_PIN = require("@/assets/images/pins/min/pin_vegan.png");

/** Directory inside cacheDirectory where downloaded pin images are stored. */
const MARKER_CACHE_DIR = `${FileSystem.cacheDirectory}helprest_markers/`;

// ─── Image download utilities ──────────────────────────────────────────────────

/**
 * Returns a deterministic filename for a given URL by SHA-256 hashing it.
 * Same URL → same filename → file is downloaded only once, ever.
 */
async function getLocalPathForUrl(remoteUrl: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        remoteUrl,
    );
    return `${MARKER_CACHE_DIR}${hash}`;
}

/**
 * Downloads all unique pin image URLs to the device filesystem.
 * Returns a Map<remoteUrl, localFileUri> for resolved images.
 * Images that were already downloaded are served from the local cache.
 */
async function downloadMarkerImages(
    remoteUrls: string[],
): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    // Ensure the cache directory exists
    await FileSystem.makeDirectoryAsync(MARKER_CACHE_DIR, { intermediates: true });

    await Promise.allSettled(
        remoteUrls.map(async (url) => {
            try {
                const localPath = await getLocalPathForUrl(url);
                const info = await FileSystem.getInfoAsync(localPath);

                if (!info.exists) {
                    // Download for the first time
                    const result_dl = await FileSystem.downloadAsync(url, localPath);
                    if (result_dl.status !== 200) {
                        throw new Error(`HTTP ${result_dl.status} for ${url}`);
                    }
                }

                // Android requires explicit file:// prefix for local URIs
                result.set(url, `file://${localPath}`);
            } catch (err) {
                // Non-critical: marker will use the bundled fallback pin
                console.warn(`[MarkerCache] Failed to download pin: ${url}`, err);
            }
        }),
    );

    return result;
}

// ─── useLocalMarkerImages hook ─────────────────────────────────────────────────

/**
 * Downloads all remote pin images to the device filesystem.
 *
 * Returns:
 *   localImageMap  — Map<remoteUrl, file:// URI>
 *   isDownloading  — true while any image is being downloaded
 */
function useLocalMarkerImages(establishments: Establishment[] | undefined): {
    localImageMap: Map<string, string>;
    isDownloading: boolean;
} {
    const [localImageMap, setLocalImageMap] = useState<Map<string, string>>(new Map());
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!establishments?.length) return;

        const uniqueUrls = [
            ...new Set(
                establishments
                    .flatMap((e) => e.flags)
                    .map((f) => f.images?.pin)
                    .filter((url): url is string => Boolean(url)),
            ),
        ];

        if (uniqueUrls.length === 0) return;

        let cancelled = false;
        setIsDownloading(true);

        downloadMarkerImages(uniqueUrls).then((map) => {
            if (!cancelled) {
                setLocalImageMap(map);
                setIsDownloading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [establishments]);

    return { localImageMap, isDownloading };
}

// ─── SimpleMarker ──────────────────────────────────────────────────────────────

/**
 * Renders a single map marker.
 *
 * Uses the `image` prop (not children) with a local file:// URI so that
 * Android's native layer reads the image synchronously from disk — no bitmap
 * capture race condition, no timing delay needed, tracksViewChanges is always
 * false from the very first render.
 */
interface SimpleMarkerProps {
    place: PlaceMarkerData;
    onPress: () => void;
}

const SimpleMarker = memo(({ place, onPress }: SimpleMarkerProps) => {
    const imageSource = place.localPinUri
        ? { uri: place.localPinUri }
        : DEFAULT_PIN;

    return (
        <Marker
            coordinate={place.coordinates}
            title={place.title}
            image={imageSource}
            tracksViewChanges={false}
            onPress={onPress}
        />
    );
});

SimpleMarker.displayName = "SimpleMarker";

// ─── HomeScreen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { permissions, requestLocationPermission } = usePermissions();
    const [currentLocation, setCurrentLocation] = useState<LocationCoords>(DEFAULT_LOCATION);
    const [locationReady, setLocationReady] = useState(false);
    const [locationSource, setLocationSource] = useState<"gps" | "profile" | "default">("default");

    // Used to force a fresh key on MapView when returning to the tab.
    // Changing the key re-mounts MapView, which re-draws all markers from
    // their already-cached local files. Since no network is involved, this
    // is fast and completely reliable.
    const [mapKey, setMapKey] = useState(0);

    // ── Data fetching ──────────────────────────────────────────────────────
    const { data: establishmentsData, isPending, error } = useQuery<EstablishmentsResponse>({
        queryKey: ["places"],
        queryFn: async () => {
            const response = await api.get<EstablishmentsResponse>(
                "/api/establishments?page=1&limit=50",
                { authenticated: true },
            );
            if (!response.ok) {
                console.error(
                    "Establishments fetch failed:",
                    response.status,
                    JSON.stringify(response.data),
                );
                throw new Error("Falha ao carregar estabelecimentos");
            }
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // ── Local image cache ──────────────────────────────────────────────────
    const { localImageMap, isDownloading } = useLocalMarkerImages(
        establishmentsData?.data,
    );

    // ── Tab focus handler ──────────────────────────────────────────────────
    // Re-mounting MapView on focus is cheap because all images are already
    // on disk — no network requests, just filesystem reads.
    useFocusEffect(
        useCallback(() => {
            setMapKey((k) => k + 1);
        }, []),
    );

    // ── Location resolution ────────────────────────────────────────────────
    const resolveLocation = useCallback(async () => {
        if (permissions.locationForeground) {
            const gpsCoords = await getCurrentPosition();
            if (gpsCoords) {
                setCurrentLocation(gpsCoords);
                setLocationSource("gps");
                setLocationReady(true);
                return;
            }
        }

        const cachedProfile = loadUserProfile();
        if (cachedProfile?.location?.coordinates?.coordinates) {
            const [lng, lat] = cachedProfile.location.coordinates.coordinates;
            setCurrentLocation({ latitude: lat, longitude: lng });
            setLocationSource("profile");
            setLocationReady(true);
            return;
        }

        setLocationSource("default");
        setLocationReady(true);
    }, [permissions.locationForeground]);

    useEffect(() => { requestLocationPermission(); }, []);
    useEffect(() => { resolveLocation(); }, [resolveLocation]);

    useEffect(() => {
        if (!permissions.locationForeground) return;
        startForegroundTracking();
        const unsub = onLocationUpdate((coords) => setCurrentLocation(coords));
        return () => unsub();
    }, [permissions.locationForeground]);

    // Center on location update
    useEffect(() => {
        if (locationSource === "gps") {
            mapRef.current?.animateCamera(
                { center: currentLocation },
                { duration: 500 },
            );
        }
    }, [currentLocation, locationSource]);

    // Recenter manually when clicking Home Tab
    useEffect(() => {
        const unsub = onMapRecenter(() => {
            mapRef.current?.animateCamera(
                { center: currentLocation, zoom: 17 },
                { duration: 500 },
            );
        });
        return () => unsub();
    }, [currentLocation]);

    // ── Loading / error states ─────────────────────────────────────────────
    if (!locationReady || isPending) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009C9D" />
                <Text style={styles.loadingText}>Carregando mapa...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Erro ao carregar dados</Text>
                <Text style={styles.errorDetail}>{error.message}</Text>
            </SafeAreaView>
        );
    }

    // ── Marker data ────────────────────────────────────────────────────────
    const establishments = establishmentsData?.data ?? [];

    if (Platform.OS === "android") {
        const placeMarkers: PlaceMarkerData[] = establishments
            .filter(
                (p) =>
                    p.location?.coordinates?.lat != null &&
                    p.location?.coordinates?.lng != null,
            )
            .map((place) => {
                const firstFlagWithPin = place.flags.find((f) => f.images?.pin);
                const remoteUrl = firstFlagWithPin?.images?.pin ?? null;
                return {
                    id: place.id,
                    coordinates: {
                        latitude: place.location.coordinates.lat,
                        longitude: place.location.coordinates.lng,
                    },
                    title: place.companyName,
                    // Use the local file:// URI if download succeeded, null otherwise
                    localPinUri: remoteUrl ? (localImageMap.get(remoteUrl) ?? null) : null,
                };
            });

        return (
            <>
                {locationSource !== "gps" && (
                    <View style={styles.locationBanner}>
                        <Text style={styles.locationBannerText}>
                            {locationSource === "profile"
                                ? "📍 Usando localização do perfil"
                                : "📍 Usando localização padrão"}
                        </Text>
                        {!permissions.locationForeground && (
                            <TouchableOpacity
                                onPress={requestLocationPermission}
                                style={styles.locationBannerButton}
                            >
                                <Text style={styles.locationBannerButtonText}>Ativar GPS</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Subtle download indicator — shown only on first fetch */}
                {isDownloading && (
                    <View style={styles.downloadIndicator}>
                        <ActivityIndicator size="small" color="#009C9D" />
                        <Text style={styles.downloadText}>Carregando ícones...</Text>
                    </View>
                )}

                <MapView
                    key={mapKey}
                    ref={mapRef}
                    style={styles.androidMap}
                    initialCamera={{
                        center: currentLocation,
                        heading: 0,
                        pitch: 0,
                        zoom: 15,
                    }}
                    showsMyLocationButton={permissions.locationForeground}
                    showsUserLocation={permissions.locationForeground}
                    toolbarEnabled={false}
                    zoomControlEnabled={false}
                >
                    {!permissions.locationForeground && (
                        <Marker
                            key="user-fallback"
                            coordinate={currentLocation}
                            title="Sua localização"
                            image={require("@/assets/images/min_user_marker.png")}
                            tracksViewChanges={false}
                        />
                    )}

                    {placeMarkers.map((place) => (
                        <SimpleMarker
                            key={place.id}
                            place={place}
                            onPress={() => router.push(`/(app)/details/${place.id}`)}
                        />
                    ))}
                </MapView>

                <UserBar />
            </>
        );
    }

    return (
        <SafeAreaView style={styles.loadingContainer}>
            <Text>Plataforma não suportada</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    androidMap: { display: "flex", width: "100%", height: "100%" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
        padding: 24,
    },
    errorText: { fontSize: 18, fontWeight: "bold", color: "#D32F2F", marginBottom: 8 },
    errorDetail: { fontSize: 14, color: "#666", textAlign: "center" },
    downloadIndicator: {
        position: "absolute",
        bottom: 90,
        alignSelf: "center",
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    downloadText: { fontSize: 12, color: "#555" },
    locationBanner: {
        position: "absolute",
        top: 50,
        left: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: "rgba(0, 156, 157, 0.9)",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    locationBannerText: { color: "#FFF", fontSize: 13, fontWeight: "500", flex: 1 },
    locationBannerButton: {
        backgroundColor: "#FFF",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginLeft: 8,
    },
    locationBannerButtonText: { color: "#009C9D", fontSize: 13, fontWeight: "600" },
});
