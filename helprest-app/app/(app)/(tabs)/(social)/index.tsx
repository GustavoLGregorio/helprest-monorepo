import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { getCurrentPosition } from "@/services/location";
import { Colors } from "@/constants/Colors";

interface UserDTO {
    id: string;
    name: string;
    profilePhoto: string | null;
}

interface FlagDTO {
    id: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
}

interface EstablishmentDTO {
    id: string;
    companyName: string;
    logo: string;
    distanceMeters?: number;
    flags?: FlagDTO[];
}

interface FeedItem {
    id: string;
    type: "visit" | "new_establishment";
    date: string;
    rating?: number;
    review?: string;
    photoUrls?: string[];
    user?: UserDTO;
    establishment?: EstablishmentDTO;
}

export default function SocialFeed() {
    const router = useRouter();
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const loadFeed = useCallback(async (pageNum: number, isRefresh = false) => {
        try {
            // Get location for distance calculations
            let lat = 0;
            let lng = 0;
            let coords = userCoords;

            if (!coords) {
                coords = await getCurrentPosition();
                if (coords) {
                    setUserCoords(coords);
                    lat = coords.latitude;
                    lng = coords.longitude;
                }
            } else {
                lat = coords.latitude;
                lng = coords.longitude;
            }

            const path = `/api/social/feed?lat=${lat}&lng=${lng}&page=${pageNum}&limit=10`;
            const res = await api.get<FeedItem[]>(path, { authenticated: true });

            if (res.ok && res.data) {
                const newItems = res.data;
                
                if (newItems.length < 10) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                if (isRefresh || pageNum === 1) {
                    setFeed(newItems);
                } else {
                    // Filter duplicates
                    setFeed(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
                        return [...prev, ...uniqueNew];
                    });
                }
            } else {
                console.error("Failed to load social feed:", res);
            }
        } catch (error) {
            console.error("Error loading social feed:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [userCoords]);

    useEffect(() => {
        loadFeed(1);
    }, [loadFeed]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        await loadFeed(1, true);
    };

    const handleLoadMore = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        loadFeed(nextPage);
    };

    const formatDistance = (meters?: number): string => {
        if (meters === undefined) return "";
        if (meters < 1000) return `• a ${meters}m`;
        return `• a ${(meters / 1000).toFixed(1)}km`;
    };

    const renderFeedItem = ({ item }: { item: FeedItem }) => {
        if (item.type === "visit") {
            const hasPhotos = item.photoUrls && item.photoUrls.length > 0;
            return (
                <View style={styles.card}>
                    {/* Visit Header */}
                    <View style={styles.cardHeader}>
                        <Image
                            source={{ uri: item.user?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" }}
                            style={styles.avatar}
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.userName}>{item.user?.name}</Text>
                            <Text style={styles.cardSub}>
                                avaliou <Text style={styles.estNameBold}>{item.establishment?.companyName}</Text> {formatDistance(item.establishment?.distanceMeters)}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </Text>
                    </View>

                    {/* Rating Stars & Comment */}
                    <View style={styles.ratingRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <MaterialCommunityIcons
                                key={i}
                                name={i < (item.rating || 0) ? "star" : "star-outline"}
                                size={18}
                                color={Colors.light.gold}
                            />
                        ))}
                    </View>
                    
                    <Text style={styles.reviewText}>{item.review}</Text>

                    {/* Photos horizontal list */}
                    {hasPhotos && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.photoContainer}
                            contentContainerStyle={{ paddingRight: 10 }}
                        >
                            {item.photoUrls?.map((url, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: url }}
                                    style={styles.feedPhoto}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {/* Establishment link card footer */}
                    <TouchableOpacity 
                        style={styles.cardLink}
                        onPress={() => router.push(`/details/${item.establishment?.id}` as never)}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: item.establishment?.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop" }}
                            style={styles.linkLogo}
                        />
                        <View style={styles.linkInfo}>
                            <Text style={styles.linkTitle} numberOfLines={1}>{item.establishment?.companyName}</Text>
                            <Text style={styles.linkDesc} numberOfLines={1}>Ver cardápio e mais informações</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9BA1A6" />
                    </TouchableOpacity>
                </View>
            );
        } else if (item.type === "new_establishment") {
            const est = item.establishment;
            return (
                <View style={[styles.card, styles.newEstCard]}>
                    <View style={styles.newEstBadge}>
                        <MaterialCommunityIcons name="party-popper" size={16} color="#FFF" />
                        <Text style={styles.newEstBadgeText}>NOVA INAUGURAÇÃO</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <Image
                            source={{ uri: est?.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop" }}
                            style={styles.newEstLogo}
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.newEstName}>{est?.companyName}</Text>
                            <Text style={styles.newEstDistance}>
                                Acaba de chegar na região {formatDistance(est?.distanceMeters)}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </Text>
                    </View>

                    {est?.flags && est.flags.length > 0 && (
                        <View style={styles.flagsRow}>
                            {est.flags.map(f => (
                                <View
                                    key={f.id}
                                    style={[styles.flagBadge, { backgroundColor: f.backgroundColor || "#EEE" }]}
                                >
                                    <Text style={[styles.flagText, { color: f.textColor || "#555" }]}>
                                        {f.tag}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.newEstButton}
                        onPress={() => router.push(`/details/${est?.id}` as never)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.newEstButtonText}>Conhecer Estabelecimento</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    };

    if (loading && page === 1) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Carregando feed social...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Feed Social</Text>
                <Text style={styles.headerSub}>Descubra visitas e inaugurações na sua região</Text>
            </View>

            <FlatList
                data={feed}
                keyExtractor={(item) => item.id}
                renderItem={renderFeedItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.light.tint]} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 16 }}>
                            <ActivityIndicator size="small" color={Colors.light.tint} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-group-outline" size={50} color="#CCC" />
                        <Text style={styles.emptyTitle}>Feed Silencioso</Text>
                        <Text style={styles.emptySub}>
                            Não encontramos postagens recentes de visitas com foto ou novos estabelecimentos perto de você ainda.
                        </Text>
                    </View>
                }
            />
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderColor: "#EAEAEA",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#11181C",
    },
    headerSub: {
        fontSize: 13,
        color: "#687076",
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderColor: "#EAEAEA",
        borderWidth: 1,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
    },
    newEstCard: {
        borderWidth: 1.5,
        borderColor: "#B2DFDB",
        backgroundColor: "#F4FDFB",
    },
    newEstBadge: {
        position: "absolute",
        top: -10,
        left: 16,
        backgroundColor: "#009C9D",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    newEstBadgeText: {
        color: "#FFF",
        fontSize: 9,
        fontWeight: "bold",
        marginLeft: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: "#EEE",
    },
    newEstLogo: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: "#EEE",
    },
    headerTextContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#11181C",
    },
    newEstName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11181C",
    },
    cardSub: {
        fontSize: 12,
        color: "#687076",
        marginTop: 2,
    },
    estNameBold: {
        fontWeight: "700",
        color: "#009C9D",
    },
    newEstDistance: {
        fontSize: 12,
        color: "#687076",
        marginTop: 2,
    },
    dateText: {
        fontSize: 11,
        color: "#9BA1A6",
        alignSelf: "flex-start",
    },
    ratingRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    reviewText: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
        marginBottom: 12,
    },
    photoContainer: {
        flexDirection: "row",
        marginBottom: 14,
    },
    feedPhoto: {
        width: 140,
        height: 105,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: "#EEE",
    },
    cardLink: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F9F9",
        borderRadius: 12,
        padding: 8,
        borderColor: "#EAEAEA",
        borderWidth: 1,
    },
    linkLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: "#EEE",
    },
    linkInfo: {
        flex: 1,
    },
    linkTitle: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#11181C",
    },
    linkDesc: {
        fontSize: 11,
        color: "#687076",
        marginTop: 2,
    },
    flagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
        marginBottom: 16,
    },
    flagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 6,
        marginBottom: 4,
    },
    flagText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    newEstButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#009C9D",
        paddingVertical: 10,
        borderRadius: 10,
    },
    newEstButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 13,
        marginRight: 6,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        paddingHorizontal: 30,
        marginTop: 8,
        lineHeight: 20,
    },
});
