import React from "react";
import { Image, StyleSheet } from "react-native";
import { ImageProps } from "../Types";
import { ImageStyle } from "expo-image";

type IconCircleProps = ImageProps & {
	style?: ImageStyle;
};

const IconCircle: React.FC<IconCircleProps> = ({ imageSource, size, alt, style }) => {
	return (
		<Image
			style={[styles.image, style]}
			source={imageSource}
			width={size}
			height={size}
			alt={alt}
		></Image>
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
