import { View, StyleSheet, TextInput } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ProfileSheet from "./ProfileSheet";

/**
 * Top search bar with location icon and profile button.
 * Self-contained — profile button manages its own modal internally.
 */
const UserBar: React.FC = () => {
	return (
		<View style={styles.container}>
			<View>
				<MaterialCommunityIcons name="map-marker" size={42} color={Colors.light.gray} />
			</View>
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchText}
					placeholder="Pesquise aqui"
					placeholderTextColor={Colors.light.gray}
				/>
			</View>
			<ProfileSheet />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		flexDirection: "row",
		gap: 16,
		paddingHorizontal: 16,
		width: "90%",
		height: 56,
		position: "absolute",
		top: "6.25%",
		left: "50%",
		backgroundColor: Colors.light.background,
		transform: "translate(-50%)",
		borderRadius: 1_000,
		boxShadow: "0px 2px 6px 2px rgba(0, 0, 0, 0.2)",
	},
	searchContainer: {
		flexGrow: 2,
	},
	searchText: {
		color: Colors.light.gray,
		fontSize: 18,
		fontWeight: "600",
	},
});

export default UserBar;
