import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ColorValue } from "react-native";
import { emitMapRecenter } from "@/utils/mapEvents";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                animation: "shift",
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: Colors.light.tint,
                freezeOnBlur: true,

                tabBarStyle: {
                    elevation: 1,
                    height: 70,
                    paddingTop: 8,
                    paddingBottom: 8,
                    boxShadow: "0 0px 16px 1px rgba(0, 0, 0, 0.2)",
                },
            }}
        >
            <Tabs.Screen
                name="(home)/index"
                options={{
                    title: "Inicio",
                    tabBarLabel: "Inicio",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="home"
                            color={color}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => emitMapRecenter(),
                }}
            />
            <Tabs.Screen
                name="(places)/index"
                options={{
                    title: "Lugares",
                    tabBarLabel: "Lugares",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="map-marker"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="(favorites)/index"
                options={{
                    title: "Favoritos",
                    tabBarLabel: "Favoritos",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="heart"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="(social)/index"
                options={{
                    title: "Social",
                    tabBarLabel: "Social",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="account-circle"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
