import { Colors } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const TextStyle = StyleSheet.create({
	normalText: {
		color: Colors.light.text,
	},
	contrastText: {
		color: Colors.light.background,
	},
});

export const TitleStyle = StyleSheet.create({
	normalTitle: {
		color: Colors.light.background,
		fontSize: 24,
	},
});

export const SizeStyle = StyleSheet.create({
	fontSM: {
		fontSize: 12,
	},
	fontMD: {
		fontSize: 18,
	},
	fontLG: {
		fontSize: 24,
	},
	fontXL: {
		fontSize: 30,
	},
	fontXXL: {
		fontSize: 40,
	},
	fontXXXL: {
		fontSize: 56,
	},
});
