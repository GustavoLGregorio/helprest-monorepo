import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Pressable, Modal } from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import IconCircle from "@/components/ui/IconCircle";
import { Colors } from "@/constants/Colors";
import Card from "@/components/ui/Card";
import StarReview from "@/components/ui/StarReview";
import MiddleDot from "@/components/atoms/MiddleDot";
import FlagColoredText from "@/components/ui/FlagColoredText";
import HeartClicable from "@/components/ui/HeartClicable";
import { useLocalSearchParams, Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { getCurrentPosition } from "@/services/location";
import { loadUserProfile } from "@/storage/userProfile";
import { useFavorites } from "@/hooks/queries/useFavorites";
import ProductBottomSheet from "@/components/ui/ProductBottomSheet";

const PLACEHOLDER_LOGO = require("@/assets/images/icon.png");
const PLACEHOLDER_BANNER = require("@/assets/images/places/3.jpeg");

interface FlagDTO {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
    images: { tag: string | null; pin: string | null };
}

export interface ProductDTO {
    id: string;
    id: string;
    category?: string; // Mantido por retrocompatibilidade se necessário, mas não utilizado agora
    flags: FlagDTO[];
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    ingredients?: string[];
}

interface EstablishmentDetailDTO {
    id: string;
    companyName: string;
    location: {
        state: string;
        city: string;
        neighborhood: string;
        address: string;
        coordinates: { lat: number; lng: number };
    };
    flags: FlagDTO[];
    logo: string;
    rating: number;
    ratingCount: number;
    isSponsored: boolean;
    products: ProductDTO[];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

const PlaceDetailsScreen = () => {
    // Tratamos tanto "id" quanto "place" para retrocompatibilidade do router push anterior
    const { id, place } = useLocalSearchParams<{ id?: string; place?: string }>();
    const actualId = id || place;

    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [activeTab, setActiveTab] = useState<"forYou" | "others">("forYou");
    const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
    const [productSheetTab, setProductSheetTab] = useState<"description" | "ingredients">("description");

    const { isFavorite, toggleFavorite } = useFavorites();

    const userFlagIds = useMemo(() => {
        const profile = loadUserProfile();
        return new Set<string>(profile?.flags || []);
    }, []);

    const resolveLocation = useCallback(async () => {
        try {
            const gps = await getCurrentPosition();
            if (gps) {
                setUserCoords({ lat: gps.latitude, lng: gps.longitude });
                return;
            }
        } catch { /* GPS indisponível */ }
        const profile = loadUserProfile();
        if (profile?.location?.coordinates?.coordinates) {
            const [lng, lat] = profile.location.coordinates.coordinates as [number, number];
            setUserCoords({ lat, lng });
        }
    }, []);

    useEffect(() => { resolveLocation(); }, [resolveLocation]);

    const { data: est, isPending, error } = useQuery<EstablishmentDetailDTO>({
        queryKey: ["establishment", actualId],
        queryFn: async () => {
            if (!actualId) throw new Error("ID não fornecido");
            const res = await api.get<EstablishmentDetailDTO>(
                `/api/establishments/${actualId}`,
                { authenticated: true }
            );
            if (!res.ok) throw new Error("Falha ao carregar detalhes");
            return res.data;
        },
        enabled: !!actualId,
    });

    if (isPending) {
        return (
            <View style={styles.feedbackContainer}>
                <ActivityIndicator size="large" color="#009C9D" />
                <Text style={styles.feedbackText}>Carregando estabelecimento...</Text>
            </View>
        );
    }

    if (error || !est) {
        return (
            <View style={styles.feedbackContainer}>
                <Text style={[styles.feedbackText, { color: "#D32F2F" }]}>Erro ao carregar os dados.</Text>
            </View>
        );
    }

    const distLabel = userCoords && est.location?.coordinates?.lat != null
        ? formatDistance(haversineMeters(
            userCoords.lat, userCoords.lng,
            est.location.coordinates.lat,
            est.location.coordinates.lng
        ))
        : "—";

    const ratingLabel = est.rating > 0 ? est.rating.toFixed(1) : "Novo";
    const logoSource = est.logo ? { uri: est.logo } : PLACEHOLDER_LOGO;
    
    // Fallback de banner (já que a API não possui uma propriedade explícita native-banner por enquanto)
    const firstFlagBanner = est.flags[0]?.images?.tag;
    const bannerSource = firstFlagBanner ? { uri: firstFlagBanner } : PLACEHOLDER_BANNER;



    const matchedProducts: ProductDTO[] = [];
    const otherProducts: ProductDTO[] = [];

    if (est?.products) {
        est.products.forEach(p => {
            const hasMatch = p.flags?.some(f => userFlagIds.has(f.id));
            if (hasMatch) matchedProducts.push(p);
            else otherProducts.push(p);
        });
    }

    const groupedMatched = matchedProducts.reduce((acc, p) => {
        const matchedFlag = p.flags?.find(f => userFlagIds.has(f.id));
        if (matchedFlag) {
            if (!acc[matchedFlag.tag]) acc[matchedFlag.tag] = [];
            acc[matchedFlag.tag].push(p);
        }
        return acc;
    }, {} as Record<string, ProductDTO[]>);

    const groupedOthers = otherProducts.reduce((acc, p) => {
        const defaultTag = p.flags?.length > 0 ? p.flags[0].tag : "Outras Opções";
        if (!acc[defaultTag]) acc[defaultTag] = [];
        acc[defaultTag].push(p);
        return acc;
    }, {} as Record<string, ProductDTO[]>);



    const renderProductList = (grouped: Record<string, ProductDTO[]>) => (
        Object.entries(grouped).map(([category, products]) => (
            <View key={category} style={styles.foodSectionContainer}>
                <Text style={styles.foodSectionTitle}>{category}</Text>
                {products.map((food) => (
                    <Pressable 
                        key={food.id}
                        style={styles.foodCard}
                        onPress={() => {
                            setSelectedProduct(food);
                            setProductSheetTab("description");
                        }}
                    >
                        <View style={styles.foodCardContent}>
                            <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                            <Text style={styles.foodDescription} numberOfLines={2}>
                                {food.description}
                            </Text>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                                <Text style={styles.foodPrice}>R$ {food.price.toFixed(2).replace('.', ',')}</Text>
                                <HeartClicable 
                                    size={22} 
                                    startActivated={isFavorite(food.id, "product")}
                                    activateAction={() => toggleFavorite(food.id, "product")} 
                                    deactivateAction={() => toggleFavorite(food.id, "product")} 
                                />
                            </View>
                        </View>
                        <View style={styles.foodCardImageContainer}>
                            <Image 
                                source={food.imageUrl ? { uri: food.imageUrl } : require("@/assets/images/icon.png")} 
                                style={styles.foodImage}
                                contentFit="cover"
                            />
                        </View>
                    </Pressable>
                ))}
            </View>
        ))
    );

    return (
        <ScrollView
            style={styles.container}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
            decelerationRate="normal"
        >
            <Image source={bannerSource} style={styles.banner} />
            
            <View style={styles.card}>
                <View style={{ height: "22.5%" }}>
                    <IconCircle
                        style={styles.cardImage}
                        imageSource={logoSource}
                        size={76}
                    />
                </View>
                <View style={styles.cardContentContainer}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.cardTitle}>{est.companyName || "—"}</Text>
                        </View>
                        <View style={styles.cardTopTexts}>
                            <Text style={styles.text}>{distLabel}</Text>
                            {est.flags.length > 0 && <MiddleDot color={Colors.light.gray} size={5} />}
                            {est.flags.slice(0, 3).map((flag) => (
                                <FlagColoredText
                                    key={flag.id}
                                    text={flag.tag.substring(0, 12)}
                                    textColor={flag.textColor || "white"}
                                    backgroundColor={flag.backgroundColor || Colors.light.tint}
                                />
                            ))}
                            <View style={{ display: "flex", flexGrow: 1, alignItems: "flex-end" }}>
                                <HeartClicable
                                    size={28}
                                    startActivated={isFavorite(actualId as string, "establishment")}
                                    activateAction={() => toggleFavorite(actualId as string, "establishment")}
                                    deactivateAction={() => toggleFavorite(actualId as string, "establishment")}
                                />
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.cardMiddle}>
                        <StarReview
                            ratingValue={est.rating * 20} // Converte rating de 0-5 para porcentagem (se o StarReview assumir percentual, senão apenas passe est.rating)
                            backgroundColor="none"
                            textColor={Colors.light.gold}
                        />
                        <Text style={styles.text}> {ratingLabel} ({est.ratingCount} Avaliações)</Text>
                    </View>
                    
                    <View style={styles.cardBottom}>
                        <Text style={styles.text}>Retirada</Text>
                        <MiddleDot size={6} color={Colors.light.text} />
                        <Text style={styles.text}>Entrega</Text>
                        <Text style={styles.text}>{"❯"}</Text>
                        <Text style={styles.text}>40-50 min</Text>
                        <Text style={[styles.text, { color: Colors.light.tint }]}>Grátis</Text>
                    </View>
                </View>
            </View>

            {est.products && est.products.length > 0 ? (
                <View style={styles.menuContainer}>
                    <View style={styles.tabContainer}>
                        <Pressable 
                            style={[styles.tabButton, activeTab === "forYou" && styles.tabButtonActive]} 
                            onPress={() => setActiveTab("forYou")}
                        >
                            <Text style={[styles.tabText, activeTab === "forYou" && styles.tabTextActive]}>Para você</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.tabButton, activeTab === "others" && styles.tabButtonActive]} 
                            onPress={() => setActiveTab("others")}
                        >
                            <Text style={[styles.tabText, activeTab === "others" && styles.tabTextActive]}>Outros Itens</Text>
                        </Pressable>
                    </View>

                    {activeTab === "forYou" ? (
                        matchedProducts.length > 0 ? (
                            renderProductList(groupedMatched)
                        ) : (
                            <Text style={styles.emptyTabText}>Nhum item do cardápio bate com as suas restrições neste estabelecimento!</Text>
                        )
                    ) : (
                        otherProducts.length > 0 ? (
                            renderProductList(groupedOthers)
                        ) : (
                            <Text style={styles.emptyTabText}>Todos os pratos batem com alguma restrição sua. Aproveite o "Para você"!</Text>
                        )
                    )}
                </View>
            ) : (
                <View style={styles.menuEmptyState}>
                    <IconCircle imageSource={require("@/assets/images/icon.png")} size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <Text style={styles.menuEmptyTitle}>Cardápio em Breve</Text>
                    <Text style={styles.menuEmptyDescription}>
                        Este estabelecimento ainda não cadastrou o cardápio digital no sistema.
                    </Text>
                </View>
            )}

            <ProductBottomSheet 
                product={selectedProduct} 
                visible={!!selectedProduct} 
                onClose={() => setSelectedProduct(null)}
                productSheetTab={productSheetTab}
                setProductSheetTab={setProductSheetTab}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: Colors.light.background,
        position: "relative",
    },
    feedbackContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.light.background,
    },
    feedbackText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },
    banner: {
        width: "100%",
        aspectRatio: "16/8",
        objectFit: "cover",
    },
    card: {
        display: "flex",
        position: "absolute",
        width: "90%",
        height: 240,
        backgroundColor: "white",
        left: "50%",
        transform: [{ translateX: "-50%" }],
        top: 130,
        borderColor: Colors.light.gray,
        borderWidth: 1,
        borderRadius: 32,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.light.text,
    },
    cardImage: {
        position: "absolute",
        left: "50%",
        transform: [{ translateX: "-50%" }],
        top: -(76 / 2), // 76 = icon size
        backgroundColor: "white",
        borderColor: Colors.light.gray,
        borderWidth: 2,
    },
    cardContentContainer: {
        height: "77.5%",
        paddingHorizontal: "7.5%",
    },
    cardTop: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        paddingBottom: 12,
    },
    cardTopTexts: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cardMiddle: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderColor: Colors.light.lightgray,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    cardBottom: {
        display: "flex",
        flexDirection: "row",
        paddingVertical: 12,
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        color: Colors.light.text,
        fontWeight: "500",
    },
    menuEmptyState: {
        marginTop: "45%",
        marginHorizontal: "5%",
        padding: 32,
        borderWidth: 1,
        borderColor: Colors.light.lightgray,
        borderRadius: 16,
        alignItems: "center",
        backgroundColor: "#FCFCFC",
    },
    menuEmptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.light.text,
        marginBottom: 8,
    },
    menuEmptyDescription: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
    },
    menuContainer: {
        marginTop: 180,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    foodSectionContainer: {
        marginBottom: 8,
    },
    foodSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        color: Colors.light.text,
    },
    foodCard: {
        flexDirection: "row",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: Colors.light.lightgray,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "space-between",
    },
    foodCardContent: {
        flex: 1,
        paddingRight: 12,
        flexDirection: "column",
        justifyContent: "space-between",
        height: 90,
    },
    foodName: {
        fontSize: 15,
        fontWeight: "bold",
        color: Colors.light.text,
        marginBottom: 4,
    },
    foodDescription: {
        fontSize: 12,
        color: "#666",
        lineHeight: 16,
        flex: 1,
    },
    foodPrice: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.light.tint,
        marginTop: 4,
    },
    foodCardImageContainer: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: "hidden",
    },
    foodImage: {
        width: "100%",
        height: "100%",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Colors.light.lightgray,
        borderRadius: 24,
        padding: 4,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 20,
    },
    tabButtonActive: {
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    tabTextActive: {
        color: Colors.light.text,
    },
    emptyTabText: {
        textAlign: "center",
        color: "#666",
        marginTop: 20,
        fontSize: 14,
    },
});

export default PlaceDetailsScreen;
