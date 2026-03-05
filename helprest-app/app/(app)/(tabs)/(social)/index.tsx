import React from "react";
import { Text } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SocialScreen() {
    return (
        <SafeAreaView
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                backgroundColor: "#FFF",
            }}
        >
            <Text style={{ fontSize: 32 }}>Aréa em construção!</Text>
            <Image
                source={require("@/assets/gifs/under_construction.gif")}
                style={{ display: "flex", width: 248, height: 248 }}
            />
        </SafeAreaView>
    );
}
