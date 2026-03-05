import { Platform, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback, useRef } from "react";
import UserBar from "@/components/ui/UserBar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";
import {
    getCurrentPosition,
    startForegroundTracking,
    onLocationUpdate,
    type LocationCoords,
} from "@/services/location";
import { onMapRecenter } from "@/utils/mapEvents";
import { loadUserProfile } from "@/storage/userProfile";

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

// Default location (Curitiba centro) as last resort
const DEFAULT_LOCATION: LocationCoords = {
    latitude: -25.4284,
    longitude: -49.2733,
};

// Default pin for fallback (when no pin image URL exists)
const DEFAULT_PIN = require("@/assets/images/pins/min/pin_vegan.png");

export default function HomeScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { permissions, requestLocationPermission } = usePermissions();
    const [currentLocation, setCurrentLocation] = useState<LocationCoords>(DEFAULT_LOCATION);
    const [locationReady, setLocationReady] = useState(false);
    const [locationSource, setLocationSource] = useState<"gps" | "profile" | "default">("default");

    // Fetch establishments — staleTime keeps data alive across tab switches
    const { data: establishmentsData, isPending, error } = useQuery<EstablishmentsResponse>({
        queryKey: ["places"],
        queryFn: async () => {
            const response = await api.get<EstablishmentsResponse>(
                "/api/establishments?page=1&limit=50",
                { authenticated: true },
            );
            if (!response.ok) {
                console.error("Establishments fetch failed:", response.status, response.data);
                throw new Error("Falha ao carregar estabelecimentos");
            }
            return response.data;
        },
        staleTime: 5 * 60 * 1000,       // Data considered fresh for 5 minutes
        gcTime: 30 * 60 * 1000,          // Keep in cache for 30 minutes
        refetchOnWindowFocus: false,      // Don't refetch when tab regains focus
    });

    // Determine location: GPS > profile.location > default
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

    useEffect(() => {
        const unsub = onMapRecenter(() => {
            mapRef.current?.animateCamera(
                { center: currentLocation, zoom: 15 },
                { duration: 500 },
            );
        });
        return () => unsub();
    }, [currentLocation]);

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

    const establishments = establishmentsData?.data ?? [];

    if (Platform.OS === "android") {
        const placeMarkers = establishments
            .filter((p) => p.location?.coordinates?.lat != null && p.location?.coordinates?.lng != null)
            .map((place) => {
                // Use the first flag's pin image, or fallback to default
                const firstFlagWithPin = place.flags.find((f) => f.images?.pin);
                const pinImage = firstFlagWithPin?.images?.pin;

                return {
                    id: place.id,
                    coordinates: {
                        latitude: place.location.coordinates.lat,
                        longitude: place.location.coordinates.lng,
                    },
                    title: place.companyName,
                    pinImage,
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

                <MapView
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
                            icon={require("@/assets/images/min_user_marker.png")}
                            tracksViewChanges={false}
                        />
                    )}

                    {placeMarkers.map((place) => (
                        <Marker
                            key={place.id}
                            coordinate={place.coordinates}
                            title={place.title}
                            icon={
                                place.pinImage
                                    ? { uri: place.pinImage }
                                    : DEFAULT_PIN
                            }
                            tracksViewChanges={false}
                            onPress={() =>
                                router.push({
                                    pathname: "../../details/place",
                                    params: { place: place.id },
                                })
                            }
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
