import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Switch, ActivityIndicator, Alert, RefreshControl } from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/services/api";
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
    description: string;
    price: number;
    imageUrl: string | null;
    ingredients: string[];
    flags: Flag[];
    isActive: boolean;
}

interface Establishment {
    id: string;
    products: Product[];
}

export default function EstablishmentMenu() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const loadMenu = useCallback(async () => {
        try {
            const res = await api.get<Establishment>("/api/establishments/my-establishment", {
                authenticated: true,
            });

            if (res.ok && res.data) {
                setProducts(res.data.products || []);
            } else {
                console.error("Failed to load establishment menu:", res);
            }
        } catch (error) {
            console.error("Error loading menu:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Reload menu whenever screen is focused (e.g. returning from product-form)
    useFocusEffect(
        useCallback(() => {
            loadMenu();
        }, [loadMenu])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadMenu();
    };

    const toggleProductActive = async (productId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            
            // Optimistic UI update
            setProducts(prev => 
                prev.map(p => p.id === productId ? { ...p, isActive: newStatus } : p)
            );

            const res = await api.patch<{ id: string }>(`/api/products/${productId}`, {
                body: { isActive: newStatus },
                authenticated: true,
            });

            if (!res.ok) {
                // Revert UI update on failure
                setProducts(prev => 
                    prev.map(p => p.id === productId ? { ...p, isActive: currentStatus } : p)
                );
                Alert.alert("Erro", "Não foi possível alterar o status do produto.");
            }
        } catch (error) {
            // Revert UI update on error
            setProducts(prev => 
                prev.map(p => p.id === productId ? { ...p, isActive: currentStatus } : p)
            );
            console.error("Error toggling product status:", error);
            Alert.alert("Erro", "Erro ao alterar o status do produto.");
        }
    };

    const handleDeleteProduct = (productId: string) => {
        Alert.alert(
            "Excluir Produto",
            "Tem certeza que deseja excluir permanentemente este produto do seu cardápio?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await api.delete(`/api/products/${productId}`, {
                                authenticated: true,
                            });
                            if (res.ok) {
                                setProducts(prev => prev.filter(p => p.id !== productId));
                                Alert.alert("Sucesso", "Produto excluído com sucesso.");
                            } else {
                                Alert.alert("Erro", "Não foi possível excluir o produto.");
                            }
                        } catch (error) {
                            console.error("Error deleting product:", error);
                            Alert.alert("Erro", "Erro ao excluir o produto.");
                        }
                    }
                }
            ]
        );
    };

    const renderProductItem = ({ item }: { item: Product }) => {
        return (
            <View style={[styles.productCard, !item.isActive && styles.inactiveCard]}>
                <Image
                    source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop" }}
                    style={styles.productImage}
                />
                
                <View style={styles.productInfo}>
                    <View style={styles.productTitleRow}>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.productPrice}>
                            R$ {item.price.toFixed(2).replace(".", ",")}
                        </Text>
                    </View>

                    <Text style={styles.productDesc} numberOfLines={2}>
                        {item.description || "Sem descrição disponível."}
                    </Text>

                    {item.flags && item.flags.length > 0 && (
                        <View style={styles.flagsRow}>
                            {item.flags.map(f => (
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

                    <View style={styles.actionsRow}>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusText, { color: item.isActive ? "#1B5E20" : "#687076" }]}>
                                {item.isActive ? "Ativo" : "Inativo"}
                            </Text>
                            <Switch
                                value={item.isActive}
                                onValueChange={() => toggleProductActive(item.id, item.isActive)}
                                trackColor={{ false: "#E0E0E0", true: "#A7FFEB" }}
                                thumbColor={item.isActive ? Colors.light.tint : "#B0BEC5"}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>

                        <View style={styles.buttonActions}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => router.push(`/(app)/(establishment)/product-form?id=${item.id}` as never)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="pencil" size={16} color="#009C9D" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteProduct(item.id)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="trash-can" size={16} color="#D32F2F" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Carregando cardápio...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cardápio do Estabelecimento</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => router.push("/(app)/(establishment)/product-form" as never)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                    <Text style={styles.addButtonText}>Adicionar</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={renderProductItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.light.tint]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="silverware" size={50} color="#CCC" />
                        <Text style={styles.emptyTitle}>Seu cardápio está vazio</Text>
                        <Text style={styles.emptySub}>
                            Adicione produtos ao cardápio para que os clientes possam visualizá-los e fazer avaliações.
                        </Text>
                        <TouchableOpacity 
                            style={styles.emptyAddButton}
                            onPress={() => router.push("/(app)/(establishment)/product-form" as never)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.emptyAddButtonText}>Cadastrar Primeiro Produto</Text>
                        </TouchableOpacity>
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderColor: "#EAEAEA",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#11181C",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        elevation: 2,
    },
    addButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 13,
        marginLeft: 4,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    productCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderColor: "#EAEAEA",
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
    },
    inactiveCard: {
        opacity: 0.65,
        backgroundColor: "#F5F5F5",
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 14,
        backgroundColor: "#EEE",
    },
    productInfo: {
        flex: 1,
        justifyContent: "space-between",
    },
    productTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    productName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#11181C",
        flex: 1,
        marginRight: 8,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: "bold",
        color: Colors.light.tint,
    },
    productDesc: {
        fontSize: 13,
        color: "#687076",
        marginTop: 4,
        marginBottom: 8,
    },
    flagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
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
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderColor: "#F0F0F0",
        paddingTop: 8,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        marginRight: 4,
    },
    buttonActions: {
        flexDirection: "row",
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
        borderWidth: 1,
    },
    editButton: {
        borderColor: "#B2DFDB",
        backgroundColor: "#E0F2F1",
    },
    deleteButton: {
        borderColor: "#FFCDD2",
        backgroundColor: "#FFEBEE",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
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
    emptyAddButton: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    emptyAddButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
});
