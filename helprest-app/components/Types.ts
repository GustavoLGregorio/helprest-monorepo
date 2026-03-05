import { ImageSourcePropType } from "react-native";

export type ImageProps = {
	imageSource: ImageSourcePropType;
	width?: number;
	height?: number;
	size?: number;
	alt?: string;
};
