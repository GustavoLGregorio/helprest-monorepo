import React from "react";
import { ColorValue, Text } from "react-native";

type MiddleDotProps = {
	size: number;
	color: ColorValue;
};

const MiddleDot: React.FC<MiddleDotProps> = ({ size = 4, color = "#333" }) => {
	return (
		<Text
			style={{
				backgroundColor: color,
				width: size,
				height: size,
				borderRadius: 100,
				alignSelf: "center",
			}}
		></Text>
	);
};

export default MiddleDot;
