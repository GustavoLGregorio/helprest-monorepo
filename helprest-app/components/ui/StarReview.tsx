import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ColorValue, StyleSheet, Text, View } from "react-native";

type StarReviewProps = {
	backgroundColor?: ColorValue;
	textColor?: ColorValue;
	ratingValue: number;
};

const StarReview: React.FC<StarReviewProps> = ({
	backgroundColor = "gray",
	textColor = "white",
	ratingValue = 4.3,
}) => {
	const handleReviewScore = (reviewScore: number) => {
		const simplifiedScore = reviewScore / 20;
		if (simplifiedScore <= 1) return Math.ceil(Number(simplifiedScore));
		else return Number(simplifiedScore.toPrecision(2));
	};

	return (
		<View style={[styles.container, backgroundColor && { backgroundColor: backgroundColor }]}>
			<MaterialCommunityIcons
				name="star"
				size={12}
				color={Colors.light.gold}
			></MaterialCommunityIcons>
			<Text style={[styles.ratingNumber, textColor && { color: textColor }]}>
				{String(handleReviewScore(ratingValue))}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 1_000,
	},
	ratingNumber: {
		fontSize: 14,
	},
});

export default StarReview;
