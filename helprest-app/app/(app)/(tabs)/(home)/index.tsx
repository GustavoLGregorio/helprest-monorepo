import { Platform, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
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

interface EstablishmentLocation {
    state: string;
    city: string;
    neighborhood?: string;
    address?: string;
    coordinates: {
        type: string;
        coordinates: [number, number]; // [lng, lat] GeoJSON
    };
}

interface Establishment {
    id: string;
    companyName: string;
    location: EstablishmentLocation;
    flags: Array<{ id: string; tag: string; backgroundColor: string; textColor: string }>;
    logo?: string;
    rating: number;
    ratingCount: number;
    isSponsored: boolean;
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

interface UserProfile {
    id: string;
    name: string;
    email: string;
    location?: {
        state?: string;
        city?: string;
        address?: string;
        coordinates?: {
            type: string;
            coordinates: [number, number];
        };
    };
}

// Default location (Curitiba centro) as last resort
const DEFAULT_LOCATION: LocationCoords = {
    latitude: -25.4284,
    longitude: -49.2733,
};

export default function HomeScreen() {
    const router = useRouter();
    const { permissions, requestLocationPermission } = usePermissions();
    const [currentLocation, setCurrentLocation] = useState<LocationCoords>(DEFAULT_LOCATION);
    const [locationReady, setLocationReady] = useState(false);
    const [locationSource, setLocationSource] = useState<"gps" | "profile" | "default">("default");

    // Fetch user profile for fallback location
    const { data: userProfile } = useQuery<UserProfile>({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const response = await api.get<UserProfile>("/api/users/me", {
                authenticated: true,
            });
            if (!response.ok) throw new Error("Failed to load profile");
            return response.data;
        },
    });

    // Fetch establishments
    const { data: establishmentsData, isPending, error } = useQuery<EstablishmentsResponse>({
        queryKey: ["places"],
        queryFn: async () => {
            const response = await api.get<EstablishmentsResponse>(
                "/api/establishments?page=1&limit=50",
                { authenticated: true },
            );
            if (!response.ok) throw new Error("Falha ao carregar estabelecimentos");
            return response.data;
        },
    });

    // Determine location: GPS > profile.location > default
    const resolveLocation = useCallback(async () => {
        // 1. Try GPS if permission is granted
        if (permissions.locationForeground) {
            const gpsCoords = await getCurrentPosition();
            if (gpsCoords) {
                setCurrentLocation(gpsCoords);
                setLocationSource("gps");
                setLocationReady(true);
                return;
            }
        }

        // 2. Fallback: user profile location
        if (userProfile?.location?.coordinates?.coordinates) {
            const [lng, lat] = userProfile.location.coordinates.coordinates;
            setCurrentLocation({ latitude: lat, longitude: lng });
            setLocationSource("profile");
            setLocationReady(true);
            return;
        }

        // 3. Last resort: default coordinates
        setLocationSource("default");
        setLocationReady(true);
    }, [permissions.locationForeground, userProfile]);

    // Request location permission on mount
    useEffect(() => {
        (async () => {
            await requestLocationPermission();
        })();
    }, []);

    // Resolve location when permissions or profile change
    useEffect(() => {
        resolveLocation();
    }, [resolveLocation]);

    // Start foreground tracking if GPS is available
    useEffect(() => {
        if (!permissions.locationForeground) return;

        startForegroundTracking();
        const unsubscribe = onLocationUpdate((coords) => {
            setCurrentLocation(coords);
        });

        return () => {
            unsubscribe();
        };
    }, [permissions.locationForeground]);

    // RENDERING

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
            .filter((place) => place.location?.coordinates?.coordinates)
            .map((place) => ({
                id: place.id,
                coordinates: {
                    latitude: place.location.coordinates.coordinates[1],
                    longitude: place.location.coordinates.coordinates[0],
                },
                title: place.companyName,
                icon: require("@/assets/images/pins/min/pin_vegan.png"),
            }));

        return (
            <>
                {/* Location source indicator */}
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
                                <Text style={styles.locationBannerButtonText}>
                                    Ativar GPS
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <MapView
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
                    {/* Show manual marker only when not using native "showsUserLocation" */}
                    {!permissions.locationForeground && (
                        <Marker
                            key="user-fallback"
                            coordinate={currentLocation}
                            title="Sua localização"
                            icon={require("@/assets/images/min_user_marker.png")}
                        />
                    )}

                    {/* Establishment markers */}
                    {placeMarkers.map((place) => (
                        <Marker
                            key={place.id}
                            coordinate={place.coordinates}
                            title={place.title}
                            icon={place.icon}
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

    // Fallback for non-Android
    return (
        <SafeAreaView style={styles.loadingContainer}>
            <Text>Plataforma não suportada</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    androidMap: {
        display: "flex",
        width: "100%",
        height: "100%",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
        padding: 24,
    },
    errorText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#D32F2F",
        marginBottom: 8,
    },
    errorDetail: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
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
    locationBannerText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
    locationBannerButton: {
        backgroundColor: "#FFF",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginLeft: 8,
    },
    locationBannerButtonText: {
        color: "#009C9D",
        fontSize: 13,
        fontWeight: "600",
    },
});
