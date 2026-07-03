import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { api } from "@/services/api";
import { distanceBetween, getCurrentPosition } from "@/services/location";
import { Colors } from "@/constants/Colors";

interface Establishment {
    id: string;
    companyName: string;
    location: {
        address: string;
        city: string;
        coordinates: { lat: number; lng: number };
    };
}

export default function CreateVisit() {
    const router = useRouter();
    const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();

    const [establishment, setEstablishment] = useState<Establishment | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [review, setReview] = useState<string>("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    
    const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [checkingLocation, setCheckingLocation] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const loadEstablishment = async () => {
            if (!establishmentId) {
                Alert.alert("Erro", "Estabelecimento não identificado.");
                router.back();
                return;
            }

            try {
                // Fetch establishment to get coordinates
                const res = await api.get<Establishment>(`/api/establishments/${establishmentId}`, {
                    authenticated: true,
                });

                if (res.ok && res.data) {
                    setEstablishment(res.data);
                    // Check user location to compute initial distance
                    await checkUserDistance(res.data);
                } else {
                    Alert.alert("Erro", "Não foi possível encontrar o estabelecimento.");
                    router.back();
                }
            } catch (error) {
                console.error("Error loading establishment:", error);
                Alert.alert("Erro", "Erro ao carregar dados do estabelecimento.");
            } finally {
                setLoading(false);
            }
        };

        loadEstablishment();
    }, [establishmentId]);

    const checkUserDistance = async (est: Establishment) => {
        setCheckingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Localização Necessária",
                    "Precisamos de permissão de localização precisa para validar sua presença física se você desejar publicar fotos da visita."
                );
                setCheckingLocation(false);
                return;
            }

            const coords = await getCurrentPosition();
            if (coords) {
                setUserCoords(coords);
                const estCoords = est.location.coordinates;
                const dist = distanceBetween(
                    coords,
                    { latitude: estCoords.lat, longitude: estCoords.lng }
                );
                setDistance(dist);
            } else {
                console.warn("Could not determine user location");
            }
        } catch (error) {
            console.error("Error checking distance:", error);
        } finally {
            setCheckingLocation(false);
        }
    };

    const takePhoto = async () => {
        // Double check distance before launching camera
        if (distance === null || distance > 100) {
            Alert.alert("Geofencing", "Você precisa estar a menos de 100 metros do estabelecimento para publicar fotos da visita.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de permissão para usar sua câmera.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handlePublish = async () => {
        if (!review.trim()) {
            Alert.alert("Erro", "O texto do comentário é obrigatório.");
            return;
        }

        if (imageUri && (distance === null || distance > 100)) {
            Alert.alert("Erro de Geofencing", "Não é permitido publicar fotos se você estiver a mais de 100 metros do estabelecimento.");
            return;
        }

        setSubmitting(true);
        try {
            const bodyData: Record<string, any> = {
                establishmentId,
                rating,
                review: review.trim(),
                photoUrls: imageUri ? [imageUri] : [],
            };

            // Include coordinates if image is present
            if (imageUri && userCoords) {
                bodyData.coordinates = {
                    lat: userCoords.latitude,
                    lng: userCoords.longitude,
                };
            }

            const res = await api.post<{ id: string }>("/api/visits", {
                body: bodyData,
                authenticated: true,
            });

            if (res.ok) {
                Alert.alert(
                    "Visita Registrada!",
                    "Obrigado por compartilhar sua experiência no HelpRest.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                const errorData = res.data as any;
                Alert.alert(
                    "Erro ao publicar", 
                    errorData?.message || "Ocorreu um erro ao salvar a sua visita."
                );
            }
        } catch (error) {
            console.error("Error creating visit:", error);
            Alert.alert("Erro", "Erro ao salvar a sua visita.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Carregando estabelecimento...</Text>
            </SafeAreaView>
        );
    }

    const isGeofenceBlocked = distance === null || distance > 100;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="close" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar Visita</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Establishment Profile Card */}
                <View style={styles.estCard}>
                    <Text style={styles.estName}>{establishment?.companyName}</Text>
                    <Text style={styles.estAddress}>{establishment?.location.address}</Text>
                    
                    {/* Location Validation Status */}
                    <View style={styles.locationContainer}>
                        {checkingLocation ? (
                            <View style={styles.row}>
                                <ActivityIndicator size="small" color={Colors.light.tint} />
                                <Text style={styles.locationText}>Verificando proximidade geográfica...</Text>
                            </View>
                        ) : distance !== null ? (
                            <View style={styles.row}>
                                <MaterialCommunityIcons 
                                    name={distance <= 100 ? "checkbox-marked-circle" : "alert-circle"} 
                                    size={18} 
                                    color={distance <= 100 ? "#2E7D32" : "#C62828"} 
                                />
                                <Text style={[
                                    styles.locationText, 
                                    { color: distance <= 100 ? "#2E7D32" : "#C62828" }
                                ]}>
                                    {distance <= 100 
                                        ? `Você está no local (a ${Math.round(distance)}m). Foto liberada!` 
                                        : `Você está a ${Math.round(distance)}m. Foto bloqueada (limite 100m).`
                                    }
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.refreshLocButton} 
                                onPress={() => establishment && checkUserDistance(establishment)}
                            >
                                <MaterialCommunityIcons name="refresh" size={16} color={Colors.light.tint} />
                                <Text style={styles.refreshLocText}>Tentar obter localização novamente</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Rating selection (Stars) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Qual a sua nota para o local?</Text>
                    <View style={styles.starsContainer}>
                        {Array.from({ length: 5 }).map((_, i) => {
                            const starValue = i + 1;
                            const isSelected = starValue <= rating;
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => setRating(starValue)}
                                    activeOpacity={0.7}
                                    style={styles.starTouch}
                                >
                                    <MaterialCommunityIcons 
                                        name={isSelected ? "star" : "star-outline"} 
                                        size={40} 
                                        color={Colors.light.gold} 
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Review Text */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Comentário</Text>
                    <TextInput
                        value={review}
                        onChangeText={setReview}
                        placeholder="Como foi a sua experiência? Conte sobre o atendimento, acessibilidade e comida..."
                        multiline
                        numberOfLines={5}
                        style={[styles.input, styles.multilineInput]}
                    />
                </View>

                {/* Photo Selector (Camera only, if distance <= 100m) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Foto do prato ou local (Opcional)</Text>
                    
                    {isGeofenceBlocked ? (
                        <View style={styles.blockedBox}>
                            <MaterialCommunityIcons name="camera-off" size={24} color="#757575" />
                            <Text style={styles.blockedText}>
                                O envio de fotos só é permitido se você estiver no local (raio de 100 metros).
                            </Text>
                        </View>
                    ) : imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                                <MaterialCommunityIcons name="close-circle" size={24} color="#D32F2F" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="camera" size={32} color={Colors.light.tint} />
                            <Text style={styles.cameraButtonText}>Tirar foto agora</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Submit button */}
                <TouchableOpacity 
                    style={[styles.publishButton, submitting && styles.disabledButton]} 
                    onPress={handlePublish}
                    disabled={submitting}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.publishButtonText}>Publicar Avaliação</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        color: "#666",
        fontSize: 15,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderColor: "#EAEAEA",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#11181C",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    estCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderColor: "#EAEAEA",
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    estName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#11181C",
    },
    estAddress: {
        fontSize: 13,
        color: "#687076",
        marginTop: 4,
    },
    locationContainer: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: "#F0F0F0",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    locationText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
        flex: 1,
    },
    refreshLocButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    refreshLocText: {
        color: Colors.light.tint,
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#11181C",
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 12,
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    starTouch: {
        padding: 4,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#11181C",
    },
    multilineInput: {
        textAlignVertical: "top",
        minHeight: 100,
    },
    blockedBox: {
        backgroundColor: "#EEEEEE",
        borderRadius: 16,
        borderColor: "#EAEAEA",
        borderWidth: 1,
        padding: 16,
        alignItems: "center",
        flexDirection: "row",
    },
    blockedText: {
        fontSize: 12,
        color: "#616161",
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    cameraButton: {
        backgroundColor: "#E0F2F1",
        borderColor: "#B2DFDB",
        borderWidth: 1,
        borderRadius: 16,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        borderStyle: "dashed",
    },
    cameraButtonText: {
        color: Colors.light.tint,
        fontWeight: "bold",
        fontSize: 14,
        marginTop: 8,
    },
    imagePreviewContainer: {
        position: "relative",
        height: 180,
        borderRadius: 16,
        overflow: "hidden",
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    previewImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    removeImageButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#FFF",
        borderRadius: 12,
    },
    publishButton: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    publishButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
});
