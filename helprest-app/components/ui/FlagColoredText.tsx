import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type FlagColoredTextProps = {
	text: string;
	backgroundColor: string;
	textColor: string;
};

const FlagColoredText: React.FC<FlagColoredTextProps> = ({ text, backgroundColor, textColor }) => {
	return (
		<View style={[styles.container, backgroundColor && { backgroundColor: backgroundColor }]}>
			<Text style={[styles.text, textColor && { color: textColor }]}>{text}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 6,
	},
	text: {
		fontSize: 12,
		textTransform: "lowercase",
	},
});

export default FlagColoredText;
