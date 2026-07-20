import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EstablishmentLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                animation: "shift",
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: Colors.light.tint,
                freezeOnBlur: true,
                tabBarStyle: {
                    elevation: 1,
                    height: 60 + insets.bottom,
                    paddingTop: 8,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    boxShadow: "0 0px 16px 1px rgba(0, 0, 0, 0.2)",
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarLabel: "Painel",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="view-dashboard"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "Cardápio",
                    tabBarLabel: "Cardápio",
                    tabBarIcon: ({ color }: { color: ColorValue }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="food-fork-drink"
                            color={color}
                        />
                    ),
                }}
            />
            {/* Form screens to edit/add products will be stack pages or sibling screens but we will hide them from the tab bar */}
            <Tabs.Screen
                name="product-form"
                options={{
                    href: null, // Hides from tab bar
                    title: "Produto",
                }}
            />
        </Tabs>
    );
}
