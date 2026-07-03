import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator, useWindowDimensions } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { loadCompanyBasicInfo, loadCompanyLocation, clearCompanyRegisterInfo } from "@/utils/saveCompanyRegisterInfo";
import { saveUserProfile, type CachedUserProfile } from "@/storage/userProfile";

interface Flag {
    id: string;
    tag: string;
    identifier: string;
    description: string;
    backgroundColor: string;
    textColor: string;
}

export default function CompanyStep3() {
    const router = useRouter();
    const [flags, setFlags] = useState<Flag[]>([]);
    const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
    const [loadingFlags, setLoadingFlags] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const res = await api.get<Flag[]>("/api/flags", { authenticated: true });
                if (res.ok && res.data) {
                    setFlags(res.data);
                } else {
                    Alert.alert("Erro", "Não foi possível carregar as flags alimentares.");
                }
            } catch (error) {
                console.error("Error loading flags:", error);
                Alert.alert("Erro", "Erro ao carregar as flags alimentares.");
            } finally {
                setLoadingFlags(false);
            }
        };

        fetchFlags();
    }, []);

    const toggleFlag = (flagId: string) => {
        if (selectedFlags.includes(flagId)) {
            setSelectedFlags(selectedFlags.filter((id) => id !== flagId));
        } else {
            setSelectedFlags([...selectedFlags, flagId]);
        }
    };

    const finishRegistration = async () => {
        const basicInfo = loadCompanyBasicInfo();
        const locationInfo = loadCompanyLocation();

        if (!basicInfo.companyName || !basicInfo.cnpj) {
            Alert.alert("Erro", "Informações básicas da empresa não encontradas. Por favor, volte ao passo 1.");
            router.replace("/(auth)/register-establishment/step1" as never);
            return;
        }

        if (!locationInfo || !locationInfo.address || !locationInfo.city || !locationInfo.state) {
            Alert.alert("Erro", "Informações de localização não encontradas. Por favor, volte ao passo 2.");
            router.replace("/(auth)/register-establishment/step2" as never);
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Establishment Profile
            const estRes = await api.post<{ id: string }>("/api/establishments", {
                body: {
                    companyName: basicInfo.companyName,
                    logo: basicInfo.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
                    location: {
                        state: locationInfo.state,
                        city: locationInfo.city,
                        neighborhood: locationInfo.neighborhood || "",
                        address: locationInfo.address,
                        coordinates: locationInfo.coordinates,
                    },
                    flagIds: selectedFlags,
                },
                authenticated: true,
            });

            if (!estRes.ok) {
                const errorData = estRes.data as any;
                Alert.alert(
                    "Erro ao cadastrar",
                    errorData?.message || "Ocorreu um erro ao criar o perfil do estabelecimento."
                );
                setSubmitting(false);
                return;
            }

            // 2. Update User role to establishment
            const userRes = await api.patch<{ success: boolean }>("/api/users/me", {
                body: { role: "establishment" },
                authenticated: true,
            });

            if (!userRes.ok) {
                Alert.alert("Erro", "Falha ao associar seu usuário ao perfil da empresa.");
                setSubmitting(false);
                return;
            }

            // 3. Update cached user profile
            const profileRes = await api.get<CachedUserProfile>("/api/users/me", {
                authenticated: true,
            });

            if (profileRes.ok && profileRes.data) {
                saveUserProfile(profileRes.data);
            }

            // 4. Clean registration cache
            clearCompanyRegisterInfo();

            Alert.alert("Sucesso", "Estabelecimento cadastrado com sucesso!", [
                {
                    text: "Ir para o Painel",
                    onPress: () => {
                        router.replace("/(app)/(establishment)/dashboard" as never);
                    },
                },
            ]);
        } catch (error) {
            console.error("Error during establishment onboarding completion:", error);
            Alert.alert("Erro", "Ocorreu um erro ao finalizar o cadastro.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <View style={{ flex: 1, paddingHorizontal, paddingVertical: 12 }}>
                <UserProgress size={3} current={3} />
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        Quais restrições alimentares você atende?
                    </Text>
                    <Text style={styles.infoText}>
                        Selecione as flags alimentares que o seu estabelecimento está preparado para atender com segurança.
                    </Text>
                </View>

                {loadingFlags ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#009C9D" />
                        <Text style={styles.loaderText}>Carregando flags alimentares...</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                        <View style={styles.grid}>
                            {flags.map((flag) => {
                                const isSelected = selectedFlags.includes(flag.id);
                                return (
                                    <TouchableOpacity
                                        key={flag.id}
                                        style={[
                                            styles.flagCard,
                                            isSelected && {
                                                backgroundColor: flag.backgroundColor,
                                                borderColor: flag.backgroundColor,
                                            },
                                        ]}
                                        onPress={() => toggleFlag(flag.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.flagTag,
                                                { color: isSelected ? flag.textColor : "#555" },
                                            ]}
                                        >
                                            {flag.tag}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.flagDesc,
                                                { color: isSelected ? flag.textColor : "#888" },
                                            ]}
                                        >
                                            {flag.description}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}

                <View style={styles.buttonContainer}>
                    {submitting ? (
                        <ActivityIndicator size="large" color="#009C9D" />
                    ) : (
                        <NextButton
                            text="Finalizar Cadastro"
                            action={() => finishRegistration()}
                            disabled={loadingFlags}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 16,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 15,
        textAlign: "center",
        color: "#666",
        lineHeight: 22,
    },
    scroll: {
        flex: 1,
        marginBottom: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderText: {
        marginTop: 12,
        color: "#666",
        fontSize: 14,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingBottom: 20,
    },
    flagCard: {
        width: "48%",
        backgroundColor: "#F9F9F9",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        padding: 16,
        marginBottom: 16,
    },
    flagTag: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 6,
    },
    flagDesc: {
        fontSize: 12,
        lineHeight: 16,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 10,
        paddingBottom: 20,
    },
});
