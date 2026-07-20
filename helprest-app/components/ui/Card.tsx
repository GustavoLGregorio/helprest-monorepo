import { useFonts } from "expo-font";
import React from "react";
import { ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import FlagColoredText, { FlagColoredTextProps } from "./FlagColoredText";
import IconCircle from "./IconCircle";
import ImageRounded from "./ImageRounded";

type CardProps = {
	children: [
		React.ReactElement<ComposableComponent>,
		React.ReactElement<ComposableComponent>,
		React.ReactElement<ComposableComponent>,
	];
	direction?: "row" | "column" | "row-reverse" | "column-reverse";
	gap?: number;
	width?: number | "auto";
	maxWidth?: number | "auto";
	/** Navigation callback. If not provided, the card is not pressable. */
	onPress?: () => void;
};
type CardComposedComponent = React.FC<CardProps> & {
	Header: any;
	Body: any;
	Footer: any;
};

type ComposableComponentProps = {
	children:
		| React.ReactElement<
				CardImageProps | CardIconProps | CardTitleProps | CardTextProps | FlagColoredTextProps
		  >
		| React.ReactElement<
				CardImageProps | CardIconProps | CardTitleProps | CardTextProps | FlagColoredTextProps
		  >[];
	direction: "row" | "column" | "row-reverse" | "column-reverse";
};
type ComposableComponent = React.FC<ComposableComponentProps> & {
	Image?: React.FC<CardImageProps>;
	Icon?: React.FC<CardIconProps>;
	Title?: React.FC<CardTitleProps>;
	Text?: React.FC<CardTextProps>;
	Flag?: React.FC<FlagColoredTextProps>;
};

type CardImageProps = {
	source: ImageSourcePropType;
	width: number;
	height: number;
	alt: string;
};
type CardIconProps = {
	source: ImageSourcePropType;
	size: number;
	alt: string;
};
type CardTitleProps = {
	title: string;
	align: "auto" | "center" | "justify" | "left" | "right";
};
type CardTextProps = {
	text: string;
	align: "auto" | "center" | "justify" | "left" | "right";
};

// CARD
const Card: CardComposedComponent = ({ children, direction = "column", gap, width, maxWidth, onPress }) => {
	let gapSize: number = 4;
	let widthSize: number | "auto" = 150;

	if (gap) gapSize = gap;
	if (width) widthSize = width;

	let maxWidthSize: number | "auto" = widthSize;
	if (maxWidth) maxWidthSize = maxWidth;

	return (
		<Pressable onPress={onPress} style={{ opacity: onPress ? 1 : 1 }}>
			<View
				style={[
					styles.card,
					{
						gap: gapSize,
						rowGap: gapSize,
						width: widthSize,
						maxWidth: maxWidthSize,
						flexDirection: direction,
					},
				]}
			>
				{children}
			</View>
		</Pressable>
	);
};

// CARD CHILDREN
const CardHeader: ComposableComponent = ({ children, direction = "column" }) => {
	return <View style={[styles.header, direction && { flexDirection: direction }]}>{children}</View>;
};
const CardBody: ComposableComponent = ({ children, direction = "column" }) => {
	return <View style={[styles.body, direction && { flexDirection: direction }]}>{children}</View>;
};
const CardFooter: ComposableComponent = ({ children, direction = "column" }) => {
	return (
		<View style={[styles.footer, direction && { flexDirection: direction, alignItems: "center" }]}>
			{children}
		</View>
	);
};

// CARD CHILDREN CONTENTS
const CardImage: React.FC<CardImageProps> = ({ source, width, height, alt }) => {
	return <ImageRounded imageSource={source} width={width} height={height} alt={alt} />;
};
const CardIcon: React.FC<CardIconProps> = ({ source, size, alt }) => {
	return <IconCircle imageSource={source} size={size} alt={alt}></IconCircle>;
};
const CardTitle: React.FC<CardTitleProps> = ({ title, align = "left" }) => {
	useFonts({
		Roboto: require("@/assets/fonts/Roboto-Variable.ttf"),
	});
	return <Text style={[styles.title, align && { textAlign: align }]}>{title}</Text>;
};
const CardText: React.FC<CardTextProps> = ({ text, align = "left" }) => {
	useFonts({
		Roboto: require("@/assets/fonts/Roboto-Variable.ttf"),
	});
	return <Text style={[styles.text, align && { textAlign: align }]}>{text}</Text>;
};
const CardFlag: React.FC<FlagColoredTextProps> = ({ text, backgroundColor, textColor }) => {
	return <FlagColoredText text={text} backgroundColor={backgroundColor} textColor={textColor} />;
};

const styles = StyleSheet.create({
	card: {
		display: "flex",
		borderColor: "#ddd",
		borderWidth: 1,
		borderRadius: 12,
		boxSizing: "content-box",
		paddingHorizontal: 4,
		paddingVertical: 6,
	},
	header: {
		display: "flex",
		alignContent: "center",
		alignItems: "center",
	},
	body: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	footer: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 4,
	},
	text: {
		fontFamily: "Roboto",
		fontSize: 12,
		textTransform: "capitalize",
		color: "#333",
	},
	title: {
		fontFamily: "Roboto",
		maxWidth: 100,
		fontSize: 14,
		textTransform: "capitalize",
		color: "#333",
		fontWeight: "bold",
	},
});

// COMPOSING COMPONENT
CardHeader.Title = CardTitle;
CardHeader.Image = CardImage;
CardHeader.Icon = CardIcon;

CardBody.Icon = CardIcon;
CardBody.Image = CardImage;
CardBody.Title = CardTitle;

CardFooter.Text = CardText;
CardFooter.Flag = CardFlag;

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
