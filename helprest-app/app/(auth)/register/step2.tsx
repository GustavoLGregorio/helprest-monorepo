import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
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

    const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
        setShowPicker(Platform.OS === "ios"); // iOS keeps picker open
        if (date) {
            setSelectedDate(date);
            setHasSelected(true);
        }
    };

    const nextStep = () => {
        if (!hasSelected) return;
        saveUserBirthDate(toISODateString(selectedDate));
        router.push("/(auth)/register/step3");
    };

    // Max date: 13 years ago (minimum age)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 13);

    // Min date: 120 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);

    return (
        <SafeAreaView style={styles.container}>
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

            <View style={styles.buttonContainer}>
                <NextButton
                    text="Avançar"
                    action={nextStep}
                />
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
