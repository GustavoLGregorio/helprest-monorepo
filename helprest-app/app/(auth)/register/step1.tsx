import { StyleSheet, View, Text } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { saveUserName, loadUserName } from "@/utils/saveUserRegisterInfo";

export default function Step1() {
    const [userName, setUserName] = useState<string>("");
    const router = useRouter();

    const nextStep = () => {
        saveUserName(userName);
        router.push("/(auth)/register/step2");
    };

    return (
        <SafeAreaView style={styles.container}>
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
                    value={loadUserName()}
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
        paddingHorizontal: "30%",
        backgroundColor: "#FFF",
        height: "100%",
        paddingVertical: 24,
    },
    header: {
        marginTop: 24,
        // marginBottom: 100,
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
