import { StyleSheet, View, Text, useWindowDimensions, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import { saveCompanyNameAndCNPJ, loadCompanyBasicInfo } from "@/utils/saveCompanyRegisterInfo";

const DEFAULT_LOGO = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop";

export default function CompanyStep1() {
    const router = useRouter();
    const [companyName, setCompanyName] = useState<string>("");
    const [cnpj, setCnpj] = useState<string>("");
    const [logo, setLogo] = useState<string>(DEFAULT_LOGO);
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    useEffect(() => {
        const info = loadCompanyBasicInfo();
        if (info.companyName) setCompanyName(info.companyName);
        if (info.cnpj) setCnpj(info.cnpj);
        if (info.logo) setLogo(info.logo);
    }, []);

    const nextStep = () => {
        if (!companyName.trim() || !cnpj.trim()) {
            return; // Basic validation
        }
        saveCompanyNameAndCNPJ(companyName, cnpj, logo);
        router.push("/(auth)/register-establishment/step2" as never);
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
                    <UserProgress size={3} current={1} />
                    <View style={styles.header}>
                        <Text style={styles.headerText}>
                            Cadastro do Estabelecimento
                        </Text>
                        <Text style={styles.infoText}>
                            Insira as informações básicas da sua empresa para começarmos a configurar seu portal.
                        </Text>
                    </View>

                    <View style={styles.contentContainer}>
                        <UserInput
                            label="Razão Social / Nome Fantasia"
                            placeholder="Ex: Vegano Bistrô"
                            changeTextAction={(t) => setCompanyName(t)}
                            value={companyName}
                        />
                        <View style={{ height: 20 }} />
                        <UserInput
                            label="CNPJ"
                            placeholder="Ex: 00.000.000/0001-00"
                            changeTextAction={(t) => setCnpj(t)}
                            value={cnpj}
                        />
                        <View style={{ height: 20 }} />
                        <UserInput
                            label="Link da Logomarca (URL)"
                            placeholder="Ex: https://suaimagem.com/logo.png"
                            changeTextAction={(t) => setLogo(t)}
                            value={logo}
                        />
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <NextButton 
                        text="Avançar" 
                        action={() => nextStep()} 
                        disabled={!companyName.trim() || !cnpj.trim()}
                    />
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
