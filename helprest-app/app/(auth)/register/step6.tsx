import { StyleSheet, View, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { saveUserLoginStatus } from "@/storage/userLoginStatus";

export default function Step4() {
    const router = useRouter();
    const nextStep = () => {
        saveUserLoginStatus(true);
        router.replace("/(app)/(tabs)/(home)");
    };

    return (
        <SafeAreaView style={styles.container}>
            <UserProgress size={6} current={6} />
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
                    label={"Insira o código enviado ao seu e-mail"}
                    placeholder="000000"
                    changeTextAction={(t) => console.log(t)}
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
    userInfo: {
        display: "flex",
        gap: 20,
    },
});
