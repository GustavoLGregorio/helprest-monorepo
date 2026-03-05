import { Image, ImageSourcePropType, StyleSheet } from "react-native";

type ImageRoundedProps = {
	imageSource: ImageSourcePropType;
	width: number;
	height: number;
	alt: string;
};

const ImageRounded: React.FC<ImageRoundedProps> = ({ imageSource, width, height, alt }) => {
	return (
		<Image
			style={styles.image}
			source={imageSource}
			width={width}
			height={height}
			alt={alt}
			resizeMode="cover"

			// className="aspect-square rounded-3xl object-cover object-center"
		></Image>
	);
};

const styles = StyleSheet.create({
	image: {
		display: "flex",
		borderRadius: 24,
	},
});

export default ImageRounded;
