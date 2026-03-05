import { View, Text, StyleSheet, TouchableHighlight, GestureResponderEvent } from "react-native";
import React from "react";
import { Image } from "expo-image";

type LoginOptionProps = {
	icon: any;
	text: string;
	action: (e?: GestureResponderEvent) => void;
};

export default function LoginOption(props: LoginOptionProps) {
	return (
		<TouchableHighlight onPress={props.action} style={{ borderRadius: 1_000 }}>
			<View style={styles.container}>
				<Image style={styles.icon} source={props.icon} contentFit="contain" />
				<Text style={styles.text}>{props.text}</Text>
			</View>
		</TouchableHighlight>
	);
}

const styles = StyleSheet.create({
	container: {
		display: "flex",
		width: "100%",
		height: 74,
		backgroundColor: "#FFF",
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 1_000,
	},
	icon: {
		width: 54,
		height: 54,
		marginHorizontal: 18,
	},
	text: {
		fontSize: 18,
		fontWeight: "500",
		letterSpacing: 0.5,
	},
});
