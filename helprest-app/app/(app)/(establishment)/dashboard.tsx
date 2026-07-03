import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { clearTokens } from "@/storage/authTokens";
import { clearUserProfile, loadUserProfile } from "@/storage/userProfile";
import { Colors } from "@/constants/Colors";

interface Flag {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

interface Establishment {
    id: string;
    companyName: string;
    logo: string;
    location: {
        address: string;
        city: string;
        state: string;
    };
    flags: Flag[];
    rating: number;
    ratingCount: number;
    products: Product[];
}

interface Visit {
    id: string;
    userId: string;
    date: string;
    review: string;
    rating: number;
    photoUrls: string[];
}

export default function EstablishmentDashboard() {
    const router = useRouter();
    const [establishment, setEstablishment] = useState<Establishment | null>(null);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const loadData = useCallback(async () => {
        try {
            // Fetch current establishment profile
            const estRes = await api.get<Establishment>("/api/establishments/my-establishment", {
                authenticated: true,
            });

            if (estRes.ok && estRes.data) {
                setEstablishment(estRes.data);

                // Fetch recent visits/reviews for this establishment
                const visitsRes = await api.get<Visit[]>(
                    `/api/visits/establishment/${estRes.data.id}?limit=5`,
                    { authenticated: true }
                );
                if (visitsRes.ok && visitsRes.data) {
                    setVisits(visitsRes.data);
                }
            } else {
                console.error("Failed to load establishment data:", estRes);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleLogout = () => {
        clearTokens();
        clearUserProfile();
        router.replace("/(auth)/home" as never);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Carregando painel administrativo...</Text>
            </SafeAreaView>
        );
    }

    const activeProductsCount = establishment?.products?.length || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={{ uri: establishment?.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop" }}
                        style={styles.logo}
                    />
                    <View style={styles.headerInfo}>
                        <Text style={styles.companyName} numberOfLines={1}>
                            {establishment?.companyName || "Minha Empresa"}
                        </Text>
                        <Text style={styles.address} numberOfLines={1}>
                            {establishment?.location.address}, {establishment?.location.city} - {establishment?.location.state}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.light.tint]} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* Metrics row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <View style={[styles.iconContainer, { backgroundColor: "#EAFBF6" }]}>
                            <MaterialCommunityIcons name="star" size={24} color={Colors.light.gold} />
                        </View>
                        <Text style={styles.metricValue}>
                            {establishment?.rating ? establishment.rating.toFixed(1) : "0.0"}
                        </Text>
                        <Text style={styles.metricLabel}>Média de Notas</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={[styles.iconContainer, { backgroundColor: "#E0F7FA" }]}>
                            <MaterialCommunityIcons name="clipboard-check" size={24} color="#00838F" />
                        </View>
                        <Text style={styles.metricValue}>{establishment?.ratingCount || 0}</Text>
                        <Text style={styles.metricLabel}>Visitas Validadas</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={[styles.iconContainer, { backgroundColor: "#E8EAF6" }]}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#3F51B5" />
                        </View>
                        <Text style={styles.metricValue}>{activeProductsCount}</Text>
                        <Text style={styles.metricLabel}>Itens no Menu</Text>
                    </View>
                </View>

                {/* Flags managed section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Flags de Acessibilidade Alimentar</Text>
                    <View style={styles.flagContainer}>
                        {establishment?.flags && establishment.flags.length > 0 ? (
                            establishment.flags.map((flag) => (
                                <View
                                    key={flag.id}
                                    style={[
                                        styles.flagBadge,
                                        { backgroundColor: flag.backgroundColor || "#EFEFEF" },
                                    ]}
                                >
                                    <Text style={[styles.flagText, { color: flag.textColor || "#333" }]}>
                                        {flag.tag}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Nenhuma flag configurada.</Text>
                        )}
                    </View>
                </View>

                {/* Recent Reviews section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Avaliações e Visitas Recentes</Text>
                    {visits.length > 0 ? (
                        visits.map((visit) => (
                            <View key={visit.id} style={styles.visitCard}>
                                <View style={styles.visitHeader}>
                                    <View style={styles.starsRow}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <MaterialCommunityIcons
                                                key={i}
                                                name={i < visit.rating ? "star" : "star-outline"}
                                                size={16}
                                                color={Colors.light.gold}
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.visitDate}>
                                        {new Date(visit.date).toLocaleDateString("pt-BR")}
                                    </Text>
                                </View>
                                <Text style={styles.visitReview}>{visit.review}</Text>

                                {visit.photoUrls && visit.photoUrls.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.visitPhotosContainer}
                                    >
                                        {visit.photoUrls.map((url, index) => (
                                            <Image
                                                key={index}
                                                source={{ uri: url }}
                                                style={styles.visitPhoto}
                                            />
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <MaterialCommunityIcons name="comment-text-outline" size={40} color="#BBB" />
                            <Text style={styles.emptyCardText}>
                                Nenhuma avaliação recebida ainda.
                            </Text>
                        </View>
                    )}
                </View>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderColor: "#EAEAEA",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 16,
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#11181C",
    },
    address: {
        fontSize: 12,
        color: "#687076",
        marginTop: 2,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: "#FFEBEE",
        borderRadius: 8,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    metricCard: {
        width: "31%",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        borderColor: "#EAEAEA",
        borderWidth: 1,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#11181C",
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: "#687076",
        textAlign: "center",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11181C",
        marginBottom: 12,
    },
    flagContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    flagBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    flagText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    emptyText: {
        color: "#888",
        fontSize: 14,
    },
    visitCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    visitHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: "row",
    },
    visitDate: {
        fontSize: 12,
        color: "#888",
    },
    visitReview: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
    },
    visitPhotosContainer: {
        flexDirection: "row",
        marginTop: 12,
    },
    visitPhoto: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: "#EEE",
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    emptyCardText: {
        marginTop: 12,
        color: "#888",
        fontSize: 14,
        textAlign: "center",
    },
});
