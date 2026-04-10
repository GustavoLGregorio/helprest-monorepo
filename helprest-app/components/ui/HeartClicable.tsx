import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { GestureResponderEvent, Pressable, ViewStyle } from "react-native";

type HeartClicableProps = {
	size?: number;
	activateAction: () => void;
	deactivateAction: () => void;
	startActivated?: boolean;
};

const HeartClicable: React.FC<HeartClicableProps> = ({
	size = 28,
	activateAction,
	deactivateAction,
	startActivated = false,
}) => {
	const [buttonClicked, setButtonClicked] = useState<boolean>(startActivated);
	const [heartIcon, setHeartIcon] = useState<"heart" | "heart-outline">(startActivated ? "heart" : "heart-outline");
	const [heartColor, setHeartColor] = useState<"gray" | "red">(startActivated ? "red" : "gray");

	React.useEffect(() => {
		setButtonClicked(startActivated);
		setHeartIcon(startActivated ? "heart" : "heart-outline");
		setHeartColor(startActivated ? "red" : "gray");
	}, [startActivated]);

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
		<Pressable onPress={handleButtonClick} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ paddingHorizontal: 4 }}>
			<MaterialCommunityIcons
				size={size}
				name={heartIcon}
				color={heartColor}
			></MaterialCommunityIcons>
		</Pressable>
	);
};

export default HeartClicable;
