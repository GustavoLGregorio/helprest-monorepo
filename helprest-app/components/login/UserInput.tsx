import { View, Text, TextInput, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";

type UserInputProps = {
    placeholder: string;
    changeTextAction: (text: string) => void;
    label: string;
    isSearchInput?: boolean;
    value?: string;
};
export default function UserInput(props: UserInputProps) {
    if (props.isSearchInput) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>{props.label}</Text>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 12,
                        boxShadow: "-1px 1px 0px 1px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <TextInput
                        style={[
                            {
                                fontSize: 20,
                                backgroundColor: "#EEE",
                                paddingLeft: 18,
                                color: "#555",
                                width: "80%",
                                borderRadius: 0,
                                borderTopLeftRadius: 12,
                                borderBottomLeftRadius: 12,
                            },
                        ]}
                        onChangeText={props.changeTextAction}
                        placeholder={props.placeholder}
                    >
                        {props.value}
                    </TextInput>
                    <FontAwesome
                        style={{
                            display: "flex",
                            padding: 10,
                            paddingLeft: 28,
                            height: "100%",
                            backgroundColor: "#EEE",
                            width: "20%",
                            borderTopRightRadius: 12,
                            borderBottomRightRadius: 12,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        name="search"
                        color="#555"
                        size={24}
                    ></FontAwesome>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{props.label}</Text>
            <TextInput
                style={styles.input}
                onChangeText={props.changeTextAction}
                placeholder={props.placeholder}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    label: {
        fontSize: 20,
        fontWeight: "500",
    },
    input: {
        fontSize: 20,
        backgroundColor: "#EEE",
        borderRadius: 12,
        paddingLeft: 18,
        width: "100%",
        color: "#555",
        boxShadow: "-1px 1px 0px 1px rgba(0, 0, 0, 0.1)",
    },
});
