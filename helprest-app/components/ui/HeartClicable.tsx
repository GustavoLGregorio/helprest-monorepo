import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { GestureResponderEvent, Pressable, ViewStyle } from "react-native";

type HeartClicableProps = {
	size: number;
	activateAction: () => void;
	deactivateAction: () => void;
};

const HeartClicable: React.FC<HeartClicableProps> = ({
	size = 28,
	activateAction,
	deactivateAction,
}) => {
	const [buttonClicked, setButtonClicked] = useState<boolean>(false);
	const [heartIcon, setHeartIcon] = useState<"heart" | "heart-outline">("heart-outline");
	const [heartColor, setHeartColor] = useState<"gray" | "red">("gray");

	const handleButtonClick = () => {
		if (!buttonClicked) {
			setButtonClicked(true);
			setHeartIcon("heart");
			setHeartColor("red");
			activateAction();
		} else {
			setButtonClicked(false);
			setHeartIcon("heart-outline");
			setHeartColor("gray");
			deactivateAction();
			// logica de coracao clicado
			// TODO: adicionar item favoritado aos favoritos do usuario
		}
	};

	return (
		<Pressable onPress={handleButtonClick} style={{ paddingHorizontal: 4 }}>
			<MaterialCommunityIcons
				size={size}
				name={heartIcon}
				color={heartColor}
			></MaterialCommunityIcons>
		</Pressable>
	);
};

export default HeartClicable;
