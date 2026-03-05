import { View, StyleSheet, TextInput } from "react-native";
import React, { useState } from "react";
import { Colors } from "@/constants/Colors";
import IconCircle from "./IconCircle";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const UserBar = () => {
	const [searchText, onChangeSearchText] = useState<string>("Pesquise aqui");

	return (
		<View style={[styles.container]}>
			<View>
				<MaterialCommunityIcons name="map-marker" size={42} color={Colors.light.gray} />
			</View>
			<View style={{ flexGrow: 2 }}>
				<TextInput style={styles.searchText} onChangeText={onChangeSearchText} value={searchText} />
			</View>
			<View>
				<IconCircle
					imageSource={require("@/assets/images/markers/u_min_profile_0.png")}
					size={42}
				/>
			</View>
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
	searchText: {
		color: Colors.light.gray,
		fontSize: 18,
		fontWeight: "600",
	},
});

export default UserBar;
