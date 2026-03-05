import { Text, TextProps } from "react-native";

export default function CustomText({ children }: TextProps) {
	return <Text className="bg-[hsl(220,100%,20%)]">{children}</Text>;
}
