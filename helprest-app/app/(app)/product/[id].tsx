import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Colors } from "@/constants/Colors";
import HeartClicable from "@/components/ui/HeartClicable";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailsModal() {
    const { id, data } = useLocalSearchParams<{ id: string; data: string }>();
    const router = useRouter();

    if (!data) return <View><Text>Produto não encontrado</Text></View>;

    let food;
    try {
        food = JSON.parse(data);
    } catch {
        return <View><Text>Erro ao ler produto</Text></View>;
    }

    const priceFormatted = `R$ ${Number(food.price).toFixed(2).replace('.', ',')}`;

    return (
        <View style={styles.container}>
            {/* Imagem de Capa Wide */}
            <View style={styles.imageContainer}>
                <Image 
                    source={food.imageUrl ? { uri: food.imageUrl } : require("@/assets/images/icon.png")} 
                    style={styles.coverImage}
                    contentFit="cover"
                />
                
                {/* Botão de Fechar Absoluto */}
                <Pressable style={styles.closeButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color="#333" />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* Header do Produto */}
                <View style={styles.headerRow}>
                    <Text style={styles.productName}>{food.name}</Text>
                    <HeartClicable 
                        size={32} 
                        activateAction={() => console.log('Favoritado', food.id)} 
                        deactivateAction={() => console.log('Desfavoritado', food.id)} 
                    />
                </View>
                
                <Text style={styles.priceText}>{priceFormatted}</Text>

                <Text style={styles.description}>{food.description}</Text>

                {/* Ingredientes Opcionais */}
                {food.ingredients && food.ingredients.length > 0 && (
                    <View style={styles.ingredientsSection}>
                        <Text style={styles.sectionTitle}>Ingredientes</Text>
                        <View style={styles.ingredientsList}>
                            {food.ingredients.map((ing: string, index: number) => (
                                <Text key={index} style={styles.ingredientItem}>• {ing}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Flags (opcional visualmente aqui tbm se quiser) */}
            </ScrollView>

            {/* Bottom Footer para Adicionar */}
            <View style={styles.footer}>
                <Pressable style={styles.addButton} onPress={() => {
                    console.log('Adicionar ao carrinho', food.id);
                    router.back();
                }}>
                    <Text style={styles.addButtonText}>Adicionar</Text>
                    <Text style={styles.addButtonPrice}>{priceFormatted}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    imageContainer: {
        width: "100%",
        aspectRatio: "16/9",
        position: "relative",
    },
    coverImage: {
        width: "100%",
        height: "100%",
    },
    closeButton: {
        position: "absolute",
        top: Platform.OS === "ios" ? 20 : 16,
        left: 16,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 20,
        padding: 6,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100, // Espaço para o footer fixo
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    productName: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.light.text,
        flex: 1,
        marginRight: 16,
    },
    priceText: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.light.tint,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
        marginBottom: 24,
    },
    ingredientsSection: {
        marginTop: 8,
        paddingTop: 24,
        borderTopWidth: 1,
        borderColor: Colors.light.lightgray,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.light.text,
        marginBottom: 12,
    },
    ingredientsList: {
        display: "flex",
        gap: 6,
    },
    ingredientItem: {
        fontSize: 15,
        color: "#555",
        lineHeight: 22,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFF",
        padding: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        borderTopWidth: 1,
        borderColor: "#EEE",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    addButton: {
        backgroundColor: Colors.light.tint,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addButtonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    addButtonPrice: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        opacity: 0.9,
    },
});
