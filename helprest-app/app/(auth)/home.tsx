import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, useWindowDimensions } from "react-native";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";
import LoginOption from "@/components/login/LoginOption";
import { useRouter } from "expo-router";
import { signInWithGoogle } from "@/services/auth";
import { saveUserName } from "@/utils/saveUserRegisterInfo";
import { api } from "@/services/api";
import { 
    saveUserProfile, 
    getIncompleteOnboardingStep, 
    type CachedUserProfile, 
    saveCompanyOnboardingStatus 
} from "@/storage/userProfile";

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompanyMode, setIsCompanyMode] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                if (result.isNewUser) {
                    // Pre-populate name from Google for step1
                    if (result.user?.name) {
                        saveUserName(result.user.name);
                    }
                    
                    if (isCompanyMode) {
                        saveCompanyOnboardingStatus(true);
                        router.replace("/(auth)/register-establishment/step1" as never);
                    } else {
                        saveCompanyOnboardingStatus(false);
                        router.replace("/(auth)/register/step1");
                    }
                } else {
                    // Validate profile and check onboarding for existing users
                    await validateAndNavigate();
                }
            } else {
                if (result.error !== "Login cancelled") {
                    Alert.alert("Erro", result.error || "Falha ao fazer login");
                }
            }
        } catch {
            Alert.alert("Erro", "Ocorreu um erro inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const validateAndNavigate = async () => {
        try {
            const response = await api.get<CachedUserProfile>("/api/users/me", { authenticated: true });
            if (!response.ok) {
                Alert.alert("Erro", "Falha ao validar sessão");
                return;
            }

            const profile = response.data;
            saveUserProfile(profile);

            if (profile.role === "establishment") {
                setIsLoading(true);
                const estRes = await api.get<unknown>("/api/establishments/my-establishment", {
                    authenticated: true,
                });
                setIsLoading(false);

                if (estRes.ok && estRes.data) {
                    router.replace("/(app)/(establishment)/dashboard" as never);
                } else {
                    saveCompanyOnboardingStatus(true);
                    router.replace("/(auth)/register-establishment/step1" as never);
                }
                return;
            }

            if (isCompanyMode) {
                // If a normal user logs in under company mode, update their role and redirect to onboarding
                setIsLoading(true);
                const patchResponse = await api.patch<CachedUserProfile>("/api/users/me", {
                    body: { role: "establishment" },
                    authenticated: true
                });
                setIsLoading(false);

                if (patchResponse.ok) {
                    const updatedProfile = { ...profile, role: "establishment" as const };
                    saveUserProfile(updatedProfile);
                    saveCompanyOnboardingStatus(true);
                    router.replace("/(auth)/register-establishment/step1" as never);
                    return;
                }
            }

            const incompleteStep = getIncompleteOnboardingStep(profile);
            if (incompleteStep !== null) {
                router.replace(`/(auth)/register/step${incompleteStep}` as never);
            } else {
                router.replace("/(app)/(tabs)/(home)");
            }
        } catch {
            // Fallback: navigate to home and let root layout handle it
            router.replace("/(app)/(tabs)/(home)");
        }
    };

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    return (
        <View style={[styles.container, { flex: 1 }]}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "space-between",
                    paddingHorizontal,
                    paddingTop: Math.max(insets.top, 24),
                    paddingBottom: Math.max(insets.bottom, 24),
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Image
                        style={styles.logo}
                        source={require("@/assets/images/logo/logo_bare.png")}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>
                        {isCompanyMode ? "HelpRest Empresas" : "Bem vindo ao HelpRest!"}
                    </Text>
                    {isCompanyMode ? (
                        <Text style={styles.subtitle}>
                            Gerencie seu cardápio e aumente sua visibilidade na região
                        </Text>
                    ) : (
                        <Text style={styles.subtitle}>
                            Encontre estabelecimentos e pratos compatíveis com suas restrições alimentares
                        </Text>
                    )}
                </View>

                <View style={styles.registerContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#FFF" style={{ marginVertical: 20 }} />
                    ) : (
                        <>
                            <LoginOption
                                icon={require("@/assets/images/logo/logo_google.svg")}
                                text={isCompanyMode ? "Entrar como Empresa com Google" : "Continuar com o Google"}
                                action={handleGoogleLogin}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setIsCompanyMode(!isCompanyMode)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.toggleText}>
                                    {isCompanyMode ? "Voltar para Clientes" : "Sou uma Empresa / Estabelecimento"}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade do HelpRest.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.light.tint,
        width: "100%",
        height: "100%",
    },
    header: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
    },
    logo: {
        width: 124,
        height: 124,
    },
    title: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#FFF",
        textAlign: "center",
        marginTop: 12,
    },
    subtitle: {
        fontSize: 15,
        color: "#E0F2F1",
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 16,
        lineHeight: 22,
    },
    registerContainer: {
        display: "flex",
        gap: 16,
        marginVertical: 32,
    },
    toggleButton: {
        marginTop: 8,
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    toggleText: {
        fontSize: 15,
        color: "#FFF",
        textDecorationLine: "underline",
        fontWeight: "600",
        textAlign: "center",
    },
    footerContainer: {
        alignItems: "center",
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    footerText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        lineHeight: 18,
    },
});
