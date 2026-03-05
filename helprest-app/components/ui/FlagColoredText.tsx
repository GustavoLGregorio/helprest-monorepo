import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export type FlagColoredTextProps = {
	text: string;
	backgroundColor: string;
	textColor: string;
	style?: ViewStyle;
};

const FlagColoredText: React.FC<FlagColoredTextProps> = ({
	text,
	backgroundColor,
	textColor,
	style,
}) => {
	return (
		<View style={[styles.container, backgroundColor && { backgroundColor: backgroundColor }]}>
			<Text style={[styles.text, textColor && { color: textColor }]}>{text}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 6,
	},
	text: {
		fontFamily: "monospace",
		fontSize: 10,
		textTransform: "uppercase",
	},
});

export default FlagColoredText;
