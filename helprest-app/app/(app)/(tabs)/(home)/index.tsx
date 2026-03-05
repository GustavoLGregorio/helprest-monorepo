import { Platform, StyleSheet, View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import {
    saveUserLocation,
    loadUserLocation,
    UserLocation,
} from "@/utils/saveUserLocation";
import { useEffect, useState } from "react";
import UserBar from "@/components/ui/UserBar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";

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

export default function HomeScreen() {
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<UserLocation>({
        latitude: -25.326779,
        longitude: -49.218587,
        timestamp: 0,
    });

    const { data, isPending, error } = useQuery<EstablishmentsResponse>({
        queryKey: ["places"],
        queryFn: async () => {
            const response = await api.get<EstablishmentsResponse>(
                "/api/establishments?page=1&limit=50",
                { authenticated: true },
            );
            if (!response.ok) throw new Error("Failed to load establishments");
            return response.data;
        },
    });

    const router = useRouter();

    useEffect(() => {
        (async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionGranted(status === "granted");
            const savedLocation = await loadUserLocation();
            if (savedLocation) setCurrentLocation(savedLocation);
        })();

        getAndSaveLocation();
    }, []);

    const getAndSaveLocation = async () => {
        try {
            const { coords } = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const location: UserLocation = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                timestamp: Date.now(),
            };

            setCurrentLocation(location);
            await saveUserLocation(location);
        } catch (error) {
            console.error("Error getting location:", error);
        }
    };

    // RENDERIZACAO DE COMPONENTES

    if (isPending) {
        return (
            <SafeAreaView
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <View>
                    <Text style={{ fontSize: 24 }}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const establishments = data?.data ?? [];

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Erro: {error?.message}</Text>
            </View>
        );
    }

    if (Platform.OS === "android") {
        const userLocation = {
            id: "user_location",
            coordinates: currentLocation,
            icon: require("@/assets/images/min_user_marker.png"),
        };

        const placeMarkers = establishments
            .filter((place) => place.location?.coordinates?.coordinates)
            .map((place) => ({
                id: place.id,
                coordinates: {
                    latitude: place.location.coordinates.coordinates[1], // GeoJSON: [lng, lat]
                    longitude: place.location.coordinates.coordinates[0],
                },
                title: place.companyName,
                icon: require("@/assets/images/pins/min/pin_vegan.png"), // TODO: map by flag type
            }));

        return (
            <>
                {userLocation.coordinates &&
                    userLocation.coordinates.latitude &&
                    userLocation.coordinates.longitude && (
                        <MapView
                            style={styles.androidMap}
                            initialCamera={{
                                center: currentLocation,
                                heading: 0,
                                pitch: 0,
                                zoom: 16,
                            }}
                            showsMyLocationButton={true}
                            toolbarEnabled={false}
                            zoomControlEnabled={false}
                        >
                            {/* User location marker */}
                            <Marker
                                key="user"
                                coordinate={{
                                    latitude: currentLocation.latitude,
                                    longitude: currentLocation.longitude,
                                }}
                                icon={userLocation.icon}
                            />
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
                    )}
                <UserBar />
            </>
        );
    }
}

const styles = StyleSheet.create({
    androidMap: {
        display: "flex",
        width: "100%",
        height: "100%",
    },
});
