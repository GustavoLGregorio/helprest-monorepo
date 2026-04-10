import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, Animated, PanResponder } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/Colors";
import HeartClicable from "@/components/ui/HeartClicable";
import { useFavorites } from "@/hooks/queries/useFavorites";

interface ProductBottomSheetProps {
    product: any | null;
    visible: boolean;
    onClose: () => void;
    // We pass state controls from parent
    productSheetTab: "description" | "ingredients";
    setProductSheetTab: (tab: "description" | "ingredients") => void;
}

export default function ProductBottomSheet({
    product,
    visible,
    onClose,
    productSheetTab,
    setProductSheetTab
}: ProductBottomSheetProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const panY = React.useRef(new Animated.Value(1000)).current; // Start hidden below screen

    React.useEffect(() => {
        if (visible) {
            panY.setValue(1000);
            Animated.spring(panY, {
                toValue: 0,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) {
                    panY.setValue(gs.dy);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 120 || gs.vy > 1.2) {
                    onClose();
                    setTimeout(() => panY.setValue(0), 300);
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    if (!product) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }] }]}>
                        <View {...panResponder.panHandlers} style={styles.dragZone}>
                            <View style={styles.dragIndicator} />
                        </View>
                        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} bounces={false}>
                            <View style={styles.productSheetImageContainer}>
                                <Image 
                                    source={product.imageUrl ? { uri: product.imageUrl } : require("@/assets/images/icon.png")} 
                                    style={styles.productSheetImage} 
                                    contentFit="cover"
                                    transition={0}
                                />
                            </View>
                            
                            <View style={styles.productSheetInfo}>
                                <View style={styles.productSheetHeader}>
                                    <Text style={styles.productSheetName}>{product.name}</Text>
                                    <HeartClicable 
                                        size={28} 
                                        startActivated={isFavorite(product.id, "product")}
                                        activateAction={() => toggleFavorite(product.id, "product")} 
                                        deactivateAction={() => toggleFavorite(product.id, "product")} 
                                    />
                                </View>
                                
                                <Text style={styles.productSheetPrice}>R$ {product.price.toFixed(2).replace('.', ',')}</Text>
                                
                                <View style={styles.productTabContainer}>
                                    <Pressable 
                                        style={[styles.productTabBtn, productSheetTab === "description" && styles.productTabBtnActive]} 
                                        onPress={() => setProductSheetTab("description")}
                                    >
                                        <Text style={[styles.productTabText, productSheetTab === "description" && styles.productTabTextActive]}>Descrição</Text>
                                    </Pressable>
                                    {product.ingredients && product.ingredients.length > 0 && (
                                        <Pressable 
                                            style={[styles.productTabBtn, productSheetTab === "ingredients" && styles.productTabBtnActive]} 
                                            onPress={() => setProductSheetTab("ingredients")}
                                        >
                                            <Text style={[styles.productTabText, productSheetTab === "ingredients" && styles.productTabTextActive]}>Ingredientes</Text>
                                        </Pressable>
                                    )}
                                </View>

                                {productSheetTab === "description" ? (
                                    <Text style={styles.productSheetDescription}>
                                        {product.description ? product.description.slice(0, 500) : "Nenhuma descrição fornecida para este item."}
                                        {product.description && product.description.length > 500 && "..."}
                                    </Text>
                                ) : (
                                    <View style={styles.ingredientsSection}>
                                        <View style={styles.ingredientsCard}>
                                            <View style={{ gap: 8 }}>
                                                {product.ingredients?.map((ing: string, i: number) => (
                                                    <Text key={i} style={styles.ingredientItem}>• {ing.slice(0, 150)}{ing.length > 150 ? "..." : ""}</Text>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                        
                        <View style={styles.productSheetFooter}>
                            <Pressable style={styles.addButton} onPress={() => {
                                console.log("Add to cart", product.id);
                                onClose();
                            }}>
                                <Text style={styles.addButtonText}>Adicionar Carrinho</Text>
                                <Text style={styles.addButtonPrice}>R$ {product.price.toFixed(2).replace('.', ',')}</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Pressable>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: "62%",
        display: "flex",
        flexDirection: "column",
        maxHeight: "85%",
    },
    dragZone: {
        width: "100%",
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: "transparent",
    },
    dragIndicator: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E0E0E0",
        alignSelf: "center",
    },
    sheetContent: {
        paddingBottom: 20,
    },
    productSheetImageContainer: {
        width: "100%",
        height: 160,
        overflow: "hidden",
        marginBottom: 16,
        backgroundColor: Colors.light.lightgray,
        borderRadius: 20,
        marginHorizontal: 16,
        alignSelf: "center",
        width: "92%",
    },
    productSheetImage: {
        width: "100%",
        height: "100%",
    },
    productSheetInfo: {
        paddingHorizontal: 24,
    },
    productSheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    productSheetName: {
        fontSize: 24,
        fontWeight: "900",
        color: Colors.light.text,
        flex: 1,
        marginRight: 16,
    },
    productSheetPrice: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.light.tint,
        marginBottom: 16,
    },
    productSheetDescription: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
        marginBottom: 24,
    },
    ingredientsSection: {
        marginBottom: 24,
    },
    ingredientsCard: {
        backgroundColor: "#F9F9F9",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EEE",
    },
    ingredientItem: {
        fontSize: 15,
        color: "#555",
        lineHeight: 22,
    },
    productSheetFooter: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    addButton: {
        backgroundColor: Colors.light.tint,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
        borderRadius: 16,
    },
    addButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    addButtonPrice: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    productTabContainer: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        marginBottom: 16,
    },
    productTabBtn: {
        paddingVertical: 10,
        marginRight: 24,
        position: "relative",
    },
    productTabBtnActive: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.light.tint,
        marginBottom: -1,
    },
    productTabText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#999",
    },
    productTabTextActive: {
        color: Colors.light.tint,
        fontWeight: "bold",
    },
});
