import React from "react";
import { Image, StyleSheet } from "react-native";
import { ImageProps } from "../Types";

const IconCircle: React.FC<ImageProps> = ({ imageSource, size, alt }) => {
	return (
		<Image style={styles.image} source={imageSource} width={size} height={size} alt={alt}></Image>
	);
};

const styles = StyleSheet.create({
	image: {
		borderRadius: 10_000,
		display: "flex",
		borderWidth: 0,
		padding: 0,
		margin: 0,
	},
});

export default IconCircle;
