import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    FlatList,
    TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { loadUserName, loadUserBirthDate, loadUserDefaultLocation } from "@/utils/saveUserRegisterInfo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";

interface ApiFlag {
    id: string;
    type: string;
    identifier: string;
    description: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
    images: {
        tag: string | null;
        pin: string | null;
    };
}

export default function Step4() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFlagsLoading, setIsFlagsLoading] = useState(true);
    const [flags, setFlags] = useState<ApiFlag[]>([]);
    const [selectedFlagIds, setSelectedFlagIds] = useState<string[]>([]);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        try {
            const response = await api.get<ApiFlag[]>("/api/flags");
            if (response.ok && Array.isArray(response.data)) {
                setFlags(response.data);
            }
        } catch (error) {
            console.error("Error loading flags:", error);
        } finally {
            setIsFlagsLoading(false);
        }
    };

    const toggleFlag = (id: string) => {
        setSelectedFlagIds((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
        );
    };

    const filteredFlags = flags.filter((flag) =>
        searchText.length === 0 ||
        flag.tag.toLowerCase().includes(searchText.toLowerCase()) ||
        flag.identifier.toLowerCase().includes(searchText.toLowerCase()),
    );

    const finalizeRegistration = async () => {
        setIsLoading(true);
        try {
            const name = loadUserName();
            const birthDate = loadUserBirthDate();
            const defaultLocation = loadUserDefaultLocation();

            const profileUpdate: Record<string, unknown> = {};
            if (name) profileUpdate.name = name;
            if (birthDate) profileUpdate.birthDate = birthDate;
            if (defaultLocation) {
                profileUpdate.location = { address: defaultLocation };
            }

            if (Object.keys(profileUpdate).length > 0) {
                const profileRes = await api.patch("/api/users/me", {
                    body: profileUpdate,
                    authenticated: true,
                });
                if (!profileRes.ok) {
                    console.error("Failed to update profile:", profileRes.data);
                }
            }

            if (selectedFlagIds.length > 0) {
                const flagsRes = await api.patch("/api/users/me/flags", {
                    body: { flagIds: selectedFlagIds },
                    authenticated: true,
                });
                if (!flagsRes.ok) {
                    console.error("Failed to update flags:", flagsRes.data);
                }
            }

            router.replace("/(app)/(tabs)/(home)");
        } catch (error) {
            console.error("Error finalizing registration:", error);
            Alert.alert("Erro", "Ocorreu um erro ao salvar seus dados. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderFlagItem = ({ item }: { item: ApiFlag }) => {
        const isSelected = selectedFlagIds.includes(item.id);
        const hasTagImage = !!item.images?.tag;
        return (
            <TouchableOpacity
                style={styles.flagItem}
                onPress={() => toggleFlag(item.id)}
                activeOpacity={0.7}
            >
                <View
                    style={[
                        styles.flagCard,
                        {
                            backgroundColor: item.backgroundColor || "#F5F5F5",
                            borderColor: isSelected ? "#009C9D" : "transparent",
                        },
                    ]}
                >
                    {hasTagImage ? (
                        <Image
                            source={{ uri: item.images.tag! }}
                            style={styles.flagImage}
                            contentFit="contain"
                        />
                    ) : (
                        <Text
                            style={[styles.flagCardText, { color: item.textColor || "#333" }]}
                            numberOfLines={2}
                        >
                            {item.tag}
                        </Text>
                    )}
                </View>
                <Text style={styles.flagLabel} numberOfLines={1}>{item.tag}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <UserProgress size={4} current={4} />
            <View style={styles.header}>
                <Text style={styles.headerText}>
                    Nos conte um pouco sobre você.
                </Text>
                <Text style={styles.infoText}>
                    Selecione restrições alimentares para localizar
                    estabelecimentos próximos a você
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.sectionLabel}>Selecione suas restrições alimentares</Text>

                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar restrição"
                        placeholderTextColor="#AAA"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <MaterialCommunityIcons name="magnify" size={22} color="#AAA" />
                </View>

                <View style={styles.flagsWrapper}>
                    {isFlagsLoading ? (
                        <ActivityIndicator size="large" color="#009C9D" style={{ marginTop: 40 }} />
                    ) : filteredFlags.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhuma restrição encontrada</Text>
                    ) : (
                        <FlatList
                            data={filteredFlags}
                            renderItem={renderFlagItem}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            columnWrapperStyle={styles.flagRow}
                            contentContainerStyle={styles.flagListContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>

            <View style={styles.buttonContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#009C9D" />
                ) : (
                    <NextButton text="Finalizar" action={finalizeRegistration} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFF",
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    header: {
        marginTop: 24,
        marginBottom: 32,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 16,
        textAlign: "center",
        color: "#555",
    },
    contentContainer: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
    flagsWrapper: {
        flex: 1,
        backgroundColor: "#F0F0F0",
        borderRadius: 16,
        padding: 8,
    },
    flagRow: {
        justifyContent: "flex-start",
        gap: 8,
    },
    flagListContent: {
        gap: 12,
        paddingVertical: 8,
    },
    flagItem: {
        flex: 1,
        maxWidth: "33.33%",
        alignItems: "center",
    },
    flagCard: {
        width: "90%",
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 3,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    flagImage: {
        width: "70%",
        height: "70%",
    },
    flagCardText: {
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        paddingHorizontal: 2,
    },
    flagLabel: {
        textAlign: "center",
        marginTop: 4,
        fontWeight: "500",
        fontSize: 11,
        color: "#555",
    },
    emptyText: {
        textAlign: "center",
        color: "#999",
        marginTop: 40,
    },
    buttonContainer: {
        paddingTop: 16,
    },
});
