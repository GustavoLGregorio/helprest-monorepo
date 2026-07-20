import { Text, TextProps, StyleSheet } from "react-native";

export default function CustomText({ children, style, ...props }: TextProps) {
	return (
		<Text style={[styles.text, style]} {...props}>
			{children}
		</Text>
	);
}

const styles = StyleSheet.create({
	text: {
		backgroundColor: "hsl(220, 100%, 20%)",
	},
});
