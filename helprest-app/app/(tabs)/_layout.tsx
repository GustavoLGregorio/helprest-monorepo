import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#007AFF",
				tabBarStyle: {
					height: 52,
					width: "100%",
					// width: "90%",
					margin: "auto",
					elevation: 1,
					// borderRadius: 100,
				},
			}}
		>
			<Tabs.Screen
				name="home/index"
				options={{
					title: "Inicio",
					tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="places/index"
				options={{
					title: "Lugares",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons size={28} name="map-marker" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="social/index"
				options={{
					title: "Social",
					tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="cog" color={color} />,
				}}
			/>
		</Tabs>
	);
}
