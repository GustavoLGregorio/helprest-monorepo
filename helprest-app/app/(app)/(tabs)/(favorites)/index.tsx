import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { useFavorites } from "@/hooks/queries/useFavorites";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image } from "expo-image";
import HeartClicable from "@/components/ui/HeartClicable";
import StarReview from "@/components/ui/StarReview";
import FlagColoredText from "@/components/ui/FlagColoredText";
import IconCircle from "@/components/ui/IconCircle";
import ProductBottomSheet from "@/components/ui/ProductBottomSheet";

export default function FavoritesScreen() {
    const { favorites, isLoading, toggleFavorite } = useFavorites();
    const [activeTab, setActiveTab] = useState<"establishments" | "products">("establishments");

    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [productSheetTab, setProductSheetTab] = useState<"description" | "ingredients">("description");

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    if (!favorites || (favorites.establishments.length === 0 && favorites.products.length === 0)) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="heart-broken-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>Sem Favoritos</Text>
                <Text style={styles.emptyText}>Você ainda não salvou nenhum local ou produto favorito na sua conta!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Seus Favoritos</Text>
                <View style={styles.tabContainer}>
                    <Pressable 
                        style={[styles.tabButton, activeTab === "establishments" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("establishments")}
                    >
                        <Text style={[styles.tabText, activeTab === "establishments" && styles.tabTextActive]}>Locais</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.tabButton, activeTab === "products" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("products")}
                    >
                        <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>Produtos</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === "establishments" && (
                    favorites.establishments.length > 0 ? (
                        favorites.establishments.map((est: any) => (
                            <Link key={est.id} href={{ pathname: "/(app)/details/[id]", params: { id: est.id } }} asChild>
                                <Pressable style={styles.estCard}>
                                    <View style={styles.estCardHeader}>
                                        <IconCircle imageSource={est.logo ? { uri: est.logo } : require("@/assets/images/icon.png")} size={48} />
                                        <View style={styles.estInfo}>
                                            <Text style={styles.estName}>{est.companyName}</Text>
                                            <View style={styles.estMeta}>
                                                <StarReview ratingValue={(est.rating || 0) * 20} textColor={Colors.light.gold} backgroundColor="transparent" />
                                                <Text style={styles.estRatingText}>{(est.rating || 0).toFixed(1)}</Text>
                                            </View>
                                        </View>
                                        <HeartClicable 
                                            size={28} 
                                            startActivated={true} 
                                            activateAction={() => toggleFavorite(est.id, "establishment")} 
                                            deactivateAction={() => toggleFavorite(est.id, "establishment")} 
                                        />
                                    </View>
                                    {est.flags && est.flags.length > 0 && (
                                        <View style={styles.estFlags}>
                                            {est.flags.slice(0, 3).map((f: any) => (
                                                <FlagColoredText key={f.id} text={f.tag} backgroundColor={f.backgroundColor} textColor={f.textColor} />
                                            ))}
                                        </View>
                                    )}
                                </Pressable>
                            </Link>
                        ))
                    ) : (
                        <Text style={styles.emptyTabText}>Você não favoritou nenhum estabelecimento ainda.</Text>
                    )
                )}

                {activeTab === "products" && (
                    favorites.products.length > 0 ? (
                        favorites.products.map((food: any) => (
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
                                    <Text style={styles.foodDescription} numberOfLines={2}>{food.description}</Text>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                                        <Text style={styles.foodPrice}>R$ {(food.price || 0).toFixed(2).replace('.', ',')}</Text>
                                        <HeartClicable 
                                            size={22} 
                                            startActivated={true}
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
                        ))
                    ) : (
                        <Text style={styles.emptyTabText}>Nenhum produto salvo nos favoritos.</Text>
                    )
                )}
            </ScrollView>

            <ProductBottomSheet 
                product={selectedProduct} 
                visible={!!selectedProduct} 
                onClose={() => setSelectedProduct(null)}
                productSheetTab={productSheetTab}
                setProductSheetTab={setProductSheetTab}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.light.background,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: Colors.light.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        lineHeight: 24,
    },
    header: {
        paddingTop: 64,
        paddingHorizontal: 24,
        paddingBottom: 8,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.light.text,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Colors.light.lightgray,
        borderRadius: 24,
        padding: 4,
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
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyTabText: {
        textAlign: "center",
        color: "#666",
        marginTop: 40,
        fontSize: 15,
    },
    
    // Establishment Card
    estCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: Colors.light.lightgray,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    estCardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    estInfo: {
        flex: 1,
        marginLeft: 12,
    },
    estName: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.light.text,
        marginBottom: 4,
    },
    estMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    estRatingText: {
        color: "#666",
        fontWeight: "500",
        fontSize: 14,
    },
    estFlags: {
        flexDirection: "row",
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.lightgray,
    },

    // Food Card (adapted from Details)
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
});
