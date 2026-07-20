import { StyleSheet, View, Text, TouchableOpacity, Platform, useWindowDimensions, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
    saveUserBirthDate,
    loadUserBirthDate,
} from "@/utils/saveUserRegisterInfo";
import { api } from "@/services/api";

function parseStoredDate(stored: string | null | undefined): Date {
    if (stored) {
        const parsed = new Date(stored);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    // Default: 18 years ago
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
}

function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function toISODateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export default function Step2() {
    const router = useRouter();
    const stored = loadUserBirthDate();
    const [selectedDate, setSelectedDate] = useState<Date>(parseStoredDate(stored));
    const [showPicker, setShowPicker] = useState(false);
    const [hasSelected, setHasSelected] = useState(!!stored);
    const [isSaving, setIsSaving] = useState(false);
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
        setShowPicker(Platform.OS === "ios"); // iOS keeps picker open
        if (date) {
            setSelectedDate(date);
            setHasSelected(true);
        }
    };

    const nextStep = async () => {
        if (!hasSelected) return;
        setIsSaving(true);
        const birthDateString = toISODateString(selectedDate);
        try {
            const res = await api.patch("/api/users/me", {
                body: { birthDate: birthDateString },
                authenticated: true
            });
            if (res.ok) {
                saveUserBirthDate(birthDateString);
                router.push("/(auth)/register/step3");
            } else {
                Alert.alert("Erro", "Não foi possível salvar sua data de nascimento. Tente novamente.");
            }
        } catch {
            Alert.alert("Erro", "Erro de conexão com o servidor. Verifique sua internet.");
        } finally {
            setIsSaving(false);
        }
    };

    // Max date: 13 years ago (minimum age)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 13);

    // Min date: 120 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <View style={{ flex: 1, paddingHorizontal, paddingVertical: 24, justifyContent: "space-between" }}>
                <View>
                    <UserProgress size={4} current={2} />
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
                        <Text style={styles.label}>Quando você nasceu?</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dateText, !hasSelected && styles.datePlaceholder]}>
                                {hasSelected ? formatDisplayDate(selectedDate) : "Toque para selecionar"}
                            </Text>
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={maxDate}
                                minimumDate={minDate}
                                locale="pt-BR"
                            />
                        )}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    {isSaving ? (
                        <ActivityIndicator size="large" color="#009C9D" />
                    ) : (
                        <NextButton
                            text="Avançar"
                            action={nextStep}
                            disabled={!hasSelected}
                        />
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
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    dateButton: {
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    dateText: {
        fontSize: 17,
        fontWeight: "500",
        color: "#1A1A1A",
    },
    datePlaceholder: {
        color: "#AAA",
    },
});
