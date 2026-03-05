import { View, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";

type UserProgressProps = {
    size: number;
    current: number;
};

export default function UserProgress(props: UserProgressProps) {
    const progressArray = [];
    for (let i = 0; i < props.size; ++i) {
        progressArray.push(i + 1);
    }

    const handleIconName = (position: number) => {
        if (position === props.current) return "dot-circle-o";
        else if (position > props.current) return "circle-o";
        else return "circle";
    };

    return (
        <View style={styles.container}>
            {progressArray.map((number) => (
                <FontAwesome key={number} name={handleIconName(number)} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        alignItems: "center",
    },
});
