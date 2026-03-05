import { View, Text, StyleSheet } from "react-native";
import React from "react";

export default function TextDistance({ distance }: { distance: number }) {
	const handleDistance = (distance: number) => {
		let simplifiedDistance: number;
		let distanceUnit: string;
		if (distance >= 1000) {
			simplifiedDistance = distance / 1000;
			distanceUnit = "km";
		} else {
			simplifiedDistance = distance;
			distanceUnit = "m";
		}

		return String(simplifiedDistance.toPrecision(3) + distanceUnit);
	};
	return <Text style={styles.textDistance}>{handleDistance(distance)}</Text>;
}

const styles = StyleSheet.create({
	textDistance: {
		fontSize: 12,
		textTransform: "capitalize",
		color: "#333",
	},
});
