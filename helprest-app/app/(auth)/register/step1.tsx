import { StyleSheet, View, Text, useWindowDimensions, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { saveUserName, loadUserName } from "@/utils/saveUserRegisterInfo";
import { api } from "@/services/api";

export default function Step1() {
    const [userName, setUserName] = useState<string>(loadUserName() || "");
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    const nextStep = async () => {
        if (!userName.trim()) {
            Alert.alert("Aviso", "Por favor, insira o seu nome.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await api.patch("/api/users/me", {
                body: { name: userName },
                authenticated: true
            });
            if (res.ok) {
                saveUserName(userName);
                router.push("/(auth)/register/step2");
            } else {
                Alert.alert("Erro", "Não foi possível salvar suas informações. Tente novamente.");
            }
        } catch {
            Alert.alert("Erro", "Erro de conexão com o servidor. Verifique sua internet.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <View style={{ flex: 1, paddingHorizontal, paddingVertical: 24, justifyContent: "space-between" }}>
                <View>
                    <UserProgress size={4} current={1} />
                    <View style={styles.header}>
                        <Text style={styles.headerText}>
                            Nos conte um pouco sobre você.
                        </Text>
                        <Text style={styles.infoText}>
                            Utilizamos essas informações para mostrar as melhores opções
                            para você, no que você mais precisar!
                        </Text>
                    </View>

                    <View style={styles.contentContainer}>
                        <UserInput
                            label="Qual o seu nome?"
                            placeholder="Insira seu nome aqui"
                            changeTextAction={(t) => setUserName(t)}
                            value={userName}
                        />
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    {isSaving ? (
                        <ActivityIndicator size="large" color="#009C9D" />
                    ) : (
                        <NextButton text="Avançar" action={() => nextStep()} disabled={!userName.trim()} />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 24,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    contentContainer: {
        width: "100%",
        marginTop: 40,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 20,
    },
    infoText: {
        fontSize: 16,
        textAlign: "center",
        color: "#555",
        marginTop: 8,
    },
});
