import { StyleSheet, View, Text } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import {
    saveUserDefaultLocation,
    loadUserDefaultLocation,
} from "@/utils/saveUserRegisterInfo";

export default function Step3() {
    const [userDefaultLocation, setUserDefaultLocation] = useState<string>("");
    const router = useRouter();

    const nextStep = () => {
        saveUserDefaultLocation(userDefaultLocation);
        router.push("/(auth)/register/step4");
    };

    return (
        <SafeAreaView style={styles.container}>
            <UserProgress size={4} current={3} />
            <View style={styles.header}>
                <Text style={styles.headerText}>
                    Nos conte um pouco sobre você.
                </Text>
                <Text style={styles.infoText}>
                    Utilizamos essa informação para te notificar sobre novidades
                    na sua região, para que saiba quando aparecer um novo
                    estabelecimento pertinho de você!
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <UserInput
                    label={"Insira um endereço padrão"}
                    placeholder="Digite aqui o endereço"
                    changeTextAction={(t) => setUserDefaultLocation(t)}
                    value={loadUserDefaultLocation()}
                />
            </View>

            <View style={styles.buttonContainer}>
                <NextButton text="Avançar" action={() => nextStep()} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "5%",
        backgroundColor: "#FFF",
        flex: 1,
        paddingVertical: 24,
    },
    header: {
        marginTop: 24,
        marginBottom: 16,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
    },
    buttonContainer: {
        paddingBottom: 16,
    },
    infoText: {
        fontSize: 16,
        textAlign: "center",
    },
});
