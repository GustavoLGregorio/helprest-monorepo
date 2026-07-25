import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/services/api";
import { Colors } from "@/constants/Colors";

interface Flag {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
    description: string;
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

export default function ProductForm() {
    const router = useRouter();
    const { id: editProductId } = useLocalSearchParams<{ id?: string }>();
    const isEditMode = !!editProductId;

    const [establishmentId, setEstablishmentId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [ingredientsInput, setIngredientsInput] = useState<string>("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [allFlags, setAllFlags] = useState<Flag[]>([]);
    const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const loadFormData = async () => {
            try {
                // 1. Fetch flags
                const flagsRes = await api.get<Flag[]>("/api/flags", { authenticated: true });
                if (flagsRes.ok && flagsRes.data) {
                    setAllFlags(flagsRes.data);
                }

                // 2. Fetch establishment details and check if editing
                const estRes = await api.get<Establishment>("/api/establishments/my-establishment", {
                    authenticated: true,
                });

                if (estRes.ok && estRes.data) {
                    setEstablishmentId(estRes.data.id);

                    if (isEditMode) {
                        const productToEdit = estRes.data.products?.find(p => p.id === editProductId);
                        if (productToEdit) {
                            setName(productToEdit.name);
                            setDescription(productToEdit.description || "");
                            setPrice(productToEdit.price.toString());
                            setIngredientsInput(productToEdit.ingredients?.join(", ") || "");
                            setImageUri(productToEdit.imageUrl);
                            
                            // Map flag objects to IDs
                            const mappedIds = productToEdit.flags?.map(f => f.id) || [];
                            setSelectedFlags(mappedIds);
                        } else {
                            Alert.alert("Erro", "Produto não encontrado.");
                            router.back();
                            return;
                        }
                    }
                } else {
                    Alert.alert("Erro", "Não foi possível carregar as informações do seu estabelecimento.");
                    router.back();
                    return;
                }
            } catch (error) {
                console.error("Error loading product form data:", error);
                Alert.alert("Erro", "Erro ao carregar dados do formulário.");
            } finally {
                setLoading(false);
            }
        };

        loadFormData();
    }, [editProductId, isEditMode, router]);

    const pickImage = async () => {
        // Request media library permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão necessária", "Precisamos de permissão para acessar suas fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        // Request camera permission
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

    const selectImageSource = () => {
        Alert.alert(
            "Selecionar Foto do Produto",
            "Escolha uma das opções abaixo:",
            [
                { text: "Câmera", onPress: takePhoto },
                { text: "Galeria", onPress: pickImage },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    const toggleFlag = (flagId: string) => {
        if (selectedFlags.includes(flagId)) {
            setSelectedFlags(selectedFlags.filter(id => id !== flagId));
        } else {
            setSelectedFlags([...selectedFlags, flagId]);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Erro", "O nome do produto é obrigatório.");
            return;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            Alert.alert("Erro", "Insira um preço válido (maior ou igual a 0).");
            return;
        }

        // Process ingredients string into array
        const ingredients = ingredientsInput
            .split(",")
            .map(i => i.trim())
            .filter(i => i.length > 0);

        setSubmitting(true);
        try {
            const bodyData = {
                name: name.trim(),
                description: description.trim(),
                price: parsedPrice,
                imageUrl: imageUri || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
                ingredients,
                flags: selectedFlags,
                establishmentId,
            };

            let res;
            if (isEditMode) {
                // Update product
                res = await api.patch<{ id: string }>(`/api/products/${editProductId}`, {
                    body: bodyData,
                    authenticated: true,
                });
            } else {
                // Create product
                res = await api.post<{ id: string }>("/api/products", {
                    body: bodyData,
                    authenticated: true,
                });
            }

            if (res.ok) {
                Alert.alert(
                    "Sucesso",
                    isEditMode ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                const errorData = res.data as { message?: string } | null;
                Alert.alert("Erro", errorData?.message || "Não foi possível salvar o produto.");
            }
        } catch (error) {
            console.error("Error saving product:", error);
            Alert.alert("Erro", "Erro ao salvar o produto.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Carregando formulário...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditMode ? "Editar Produto" : "Novo Produto"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Product Image Section */}
                <TouchableOpacity style={styles.imageSelector} onPress={selectImageSource} activeOpacity={0.8}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="camera-plus" size={40} color="#BBB" />
                            <Text style={styles.imagePlaceholderText}>Adicionar foto do prato</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form fields */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nome do Produto</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Hambúrguer de Grão de Bico"
                        style={styles.input}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Descreva os ingredientes principais ou sabor..."
                        multiline
                        numberOfLines={3}
                        style={[styles.input, styles.multilineInput]}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Preço (R$)</Text>
                    <TextInput
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Ex: 29.90"
                        keyboardType="decimal-pad"
                        style={styles.input}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Ingredientes (separados por vírgula)</Text>
                    <TextInput
                        value={ingredientsInput}
                        onChangeText={setIngredientsInput}
                        placeholder="Ex: pão, hambúrguer vegano, alface, tomate, maionese verde"
                        multiline
                        style={[styles.input, styles.multilineInput]}
                    />
                </View>

                {/* Flags Selector */}
                <View style={styles.flagsSection}>
                    <Text style={styles.label}>Flags Alimentares do Produto</Text>
                    <Text style={styles.subLabel}>Selecione as categorias que se aplicam a este item do cardápio:</Text>
                    
                    <View style={styles.flagsGrid}>
                        {allFlags.map((flag) => {
                            const isSelected = selectedFlags.includes(flag.id);
                            return (
                                <TouchableOpacity
                                    key={flag.id}
                                    style={[
                                        styles.flagCard,
                                        isSelected && {
                                            backgroundColor: flag.backgroundColor,
                                            borderColor: flag.backgroundColor
                                        }
                                    ]}
                                    onPress={() => toggleFlag(flag.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.flagTag, { color: isSelected ? flag.textColor : "#555" }]}>
                                        {flag.tag}
                                    </Text>
                                    <Text style={[styles.flagDesc, { color: isSelected ? flag.textColor : "#888" }]} numberOfLines={1}>
                                        {flag.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Save button */}
                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave}
                    disabled={submitting}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Salvar Produto</Text>
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
    imageSelector: {
        height: 180,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        borderStyle: "dashed",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    selectedImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imagePlaceholder: {
        alignItems: "center",
    },
    imagePlaceholderText: {
        color: "#888",
        fontSize: 14,
        marginTop: 8,
        fontWeight: "500",
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#11181C",
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: "#687076",
        marginBottom: 12,
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
        minHeight: 80,
    },
    flagsSection: {
        marginTop: 10,
        marginBottom: 24,
    },
    flagsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    flagCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        padding: 12,
        marginBottom: 12,
    },
    flagTag: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 4,
    },
    flagDesc: {
        fontSize: 10,
    },
    saveButton: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    saveButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
});
