import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import Container from "@/components/login/Container";
import { api } from "@/services/api";
import { loadUserName, loadUserBirthDate, loadUserDefaultLocation } from "@/utils/saveUserRegisterInfo";

interface ApiFlag {
    id: string;
    type: string;
    identifier: string;
    description: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
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
        flag.identifier.toLowerCase().includes(searchText.toLowerCase())
    );

    const finalizeRegistration = async () => {
        setIsLoading(true);
        try {
            const name = loadUserName();
            const birthDate = loadUserBirthDate();
            const defaultLocation = loadUserDefaultLocation();

            // Update user profile with collected data
            const profileUpdate: Record<string, unknown> = {};
            if (name) profileUpdate.name = name;
            if (birthDate) profileUpdate.birthDate = birthDate;
            if (defaultLocation) {
                profileUpdate.location = {
                    address: defaultLocation,
                };
            }

            if (Object.keys(profileUpdate).length > 0) {
                await api.patch("/api/users/me", {
                    body: profileUpdate,
                    authenticated: true,
                });
            }

            // Update user flags
            if (selectedFlagIds.length > 0) {
                await api.patch("/api/users/me/flags", {
                    body: { flagIds: selectedFlagIds },
                    authenticated: true,
                });
            }

            // Navigate to home
            router.replace("/(app)/(tabs)/(home)");
        } catch (error) {
            console.error("Error finalizing registration:", error);
            Alert.alert("Erro", "Ocorreu um erro ao salvar seus dados. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
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
                <UserInput
                    label={"Selecione suas restrições alimentares"}
                    placeholder="Buscar restrição"
                    changeTextAction={(t) => setSearchText(t)}
                    isSearchInput={true}
                />
                <Container width="100%" height={448} marginTop={16}>
                    {isFlagsLoading ? (
                        <ActivityIndicator size="large" color="#009C9D" />
                    ) : filteredFlags.length === 0 ? (
                        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
                            Nenhuma restrição encontrada
                        </Text>
                    ) : (
                        filteredFlags.map((flag) => (
                            <TouchableOpacity
                                key={flag.id}
                                onPress={() => toggleFlag(flag.id)}
                            >
                                <View style={{ alignItems: "center" }}>
                                    <View
                                        style={{
                                            width: 108,
                                            height: 108,
                                            borderRadius: 16,
                                            borderWidth: 4,
                                            borderColor: selectedFlagIds.includes(flag.id)
                                                ? "#009C9D"
                                                : "#EEE",
                                            backgroundColor: flag.backgroundColor || "#F5F5F5",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: "600",
                                            color: flag.textColor || "#333",
                                            textAlign: "center",
                                            paddingHorizontal: 4,
                                        }}>
                                            {flag.tag}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            marginTop: 10,
                                            fontWeight: "500",
                                            textTransform: "capitalize",
                                            maxWidth: 108,
                                        }}
                                    >
                                        {flag.tag}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </Container>
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
        paddingHorizontal: "30%",
        backgroundColor: "#FFF",
        height: "100%",
        paddingVertical: 24,
    },
    header: {
        marginTop: 24,
        marginBottom: 100,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    contentContainer: {
        width: "100%",
        display: "flex",
        position: "absolute",
        alignSelf: "center",
        top: 280,
    },
    buttonContainer: {
        display: "flex",
        position: "absolute",
        bottom: 54,
        width: "100%",
        alignSelf: "center",
    },
    infoText: {
        fontSize: 16,
        textAlign: "center",
    },
});
