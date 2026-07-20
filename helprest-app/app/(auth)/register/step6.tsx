import { StyleSheet, View, Text, useWindowDimensions, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { saveUserLoginStatus } from "@/storage/userLoginStatus";

export default function Step6() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    const nextStep = () => {
        saveUserLoginStatus(true);
        router.replace("/(app)/(tabs)/(home)");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <ScrollView 
                contentContainerStyle={{ 
                    flexGrow: 1, 
                    paddingHorizontal, 
                    paddingVertical: 24, 
                    justifyContent: "space-between" 
                }}
                showsVerticalScrollIndicator={false}
            >
                <View>
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
                </View>

                <View style={styles.buttonContainer}>
                    <NextButton text="Avançar" action={() => nextStep()} />
                </View>
            </ScrollView>
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
        marginTop: 32,
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
