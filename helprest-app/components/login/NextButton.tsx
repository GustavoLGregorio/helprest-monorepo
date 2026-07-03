import {
    StyleSheet,
    Text,
    TouchableOpacity,
    GestureResponderEvent,
} from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";

type NextButtonProps = {
    text: string;
    action: (e?: GestureResponderEvent) => void;
    disabled?: boolean;
};
export default function NextButton(props: NextButtonProps) {
    return (
        <TouchableOpacity 
            style={[styles.container, props.disabled && styles.disabled]} 
            onPress={props.action}
            disabled={props.disabled}
        >
            <Text style={styles.text}>{props.text}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        backgroundColor: Colors.light.tint,
        borderRadius: 1_000,
        width: "100%",
        paddingVertical: 12,
    },
    disabled: {
        backgroundColor: "#EAEAEA",
    },
    text: {
        color: Colors.light.background,
        fontSize: 24,
        fontWeight: "500",
        letterSpacing: 0.5,
        textAlign: "center",
    },
});
