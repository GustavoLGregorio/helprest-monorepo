import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Image } from "expo-image";
import IconCircle from "@/components/ui/IconCircle";
import { ScrollView } from "react-native";
import { Colors } from "@/constants/Colors";
import StarReview from "@/components/ui/StarReview";
import MiddleDot from "@/components/atoms/MiddleDot";
import FlagColoredText from "@/components/ui/FlagColoredText";
import HeartClicable from "@/components/ui/HeartClicable";
import TextDistance from "@/components/atoms/TextDistance";
import ImageRounded from "@/components/ui/ImageRounded";
import { TempPlacesType } from "../(tabs)/(places)";

type TempFoodType = {
	id: number;
	foodname: string;
	image: any;
	price: number;
};

const SocialScreen = () => {
	const temp_places: TempPlacesType[] = [
		{
			id: 0,
			empresa: "Sem Culpa - Sem Glúten",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/1.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
		{
			id: 1,
			empresa: "Espaço Vegano",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/2.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
		{
			id: 2,
			empresa: "Real Food Place",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/3.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
		{
			id: 3,
			empresa: "Comida Saudável",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/4.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
		{
			id: 4,
			empresa: "Definitavamente um Restaurante",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/5.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
		{
			id: 5,
			empresa: "Mais um Restaurante",
			flags: ["gluten", "vegan"],
			logo_empresa: require("@/assets/images/places/6.jpeg"),
			fotos: [require("@/assets/images/places/10.jpeg")],
		},
	];

	const temp_foods: TempFoodType[] = [
		{
			id: 0,
			foodname: "Almoço vegano",
			image: require("@/assets/images/places/5.jpeg"),
			price: 24.99,
		},
		{
			id: 1,
			foodname: "Salada de vegetais",
			image: require("@/assets/images/places/6.jpeg"),
			price: 34.99,
		},
		{
			id: 2,
			foodname: "Mais vegetais",
			image: require("@/assets/images/places/7.jpeg"),
			price: 32.99,
		},
		{
			id: 3,
			foodname: "Saladinha",
			image: require("@/assets/images/places/8.jpeg"),
			price: 45.99,
		},
		{
			id: 4,
			foodname: "Sla, mais salada",
			image: require("@/assets/images/places/9.jpeg"),
			price: 99.99,
		},
		{
			id: 5,
			foodname: "Salada com carne de jaca",
			image: require("@/assets/images/places/13.jpeg"),
			price: 12.35,
		},
	];

	return (
		<ScrollView
			style={styles.container}
			horizontal={false}
			showsHorizontalScrollIndicator={false}
			overScrollMode="never"
			bounces={false}
			decelerationRate="normal"
		>
			<Image source={require("@/assets/images/places/3.jpeg")} style={styles.banner} />
			<View style={styles.card}>
				<View style={{ height: "22.5%" }}>
					<IconCircle
						style={styles.cardImage}
						imageSource={require("@/assets/images/8.jpeg")}
						size={76}
					/>
				</View>
				<View style={styles.cardContentContainer}>
					<View style={styles.cardTop}>
						<View>
							<Text style={styles.cardTitle}>Sabor Natural</Text>
						</View>
						<View style={styles.cardTopTexts}>
							<TextDistance distance={1850} />
							<MiddleDot color={Colors.light.gray} size={5} />
							<FlagColoredText text="vegan" textColor="white" backgroundColor={Colors.light.tint} />
							<FlagColoredText
								text="gluten-free"
								textColor="white"
								backgroundColor={Colors.light.tint}
							/>
							<View
								style={{
									display: "flex",
									flexGrow: 1,
									alignItems: "flex-end",
								}}
							>
								<HeartClicable
									size={28}
									activateAction={() => console.log("favorited")}
									deactivateAction={() => console.log("unfavorited")}
								/>
							</View>
						</View>
					</View>
					<View style={styles.cardMiddle}>
						<StarReview
							ratingValue={85}
							backgroundColor="none"
							textColor={Colors.light.gold}
						></StarReview>
						<Text style={styles.text}>(150 Avaliações)</Text>
					</View>
					<View style={styles.cardBottom}>
						<Text style={styles.text}>Retirada</Text>
						<MiddleDot size={6} color={Colors.light.text} />
						<Text style={styles.text}>Entrega</Text>
						<Text style={styles.text}>{"❯"}</Text>
						<Text style={styles.text}>40-50 min</Text>
						<Text style={[styles.text, { color: Colors.light.tint }]}>Grátis</Text>
					</View>
				</View>
			</View>
			<View style={styles.foodContainer}>
				<View style={styles.foodSectionContainer}>
					<Text style={styles.foodSectionTitle}>Vegan</Text>
					<View style={styles.foodSectionInnerContainer}>
						{temp_foods.map((food, id) => (
							<View key={id} style={styles.foodCard}>
								<ImageRounded imageSource={food.image} width={112} height={112} alt={String(id)} />
								<View style={styles.foodCardTextContainer}>
									<Text style={[styles.foodName, styles.text]}>{food.foodname}</Text>
									<Text style={[styles.foodPrice]}>R$ {food.price}</Text>
								</View>
							</View>
						))}
					</View>
				</View>
				<View style={styles.foodSectionContainer}>
					<Text style={styles.foodSectionTitle}>Gluten-free</Text>
					<View style={styles.foodSectionInnerContainer}>
						{temp_foods.map((food, id) => (
							<View key={id} style={styles.foodCard}>
								<ImageRounded imageSource={food.image} width={112} height={112} alt={String(id)} />
								<View style={styles.foodCardTextContainer}>
									<Text style={[styles.foodName, styles.text]}>{food.foodname}</Text>
									<Text style={[styles.foodPrice]}>R$ {food.price}</Text>
								</View>
							</View>
						))}
					</View>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		display: "flex",
		width: "100%",
		height: "100%",
		backgroundColor: Colors.light.background,
		position: "relative",
	},
	image: {
		display: "flex",
		width: 200,
		height: 200,
	},
	banner: {
		width: "100%",
		aspectRatio: "16/8",
		objectFit: "cover",
	},
	card: {
		display: "flex",
		position: "absolute",
		width: "90%",
		height: 240,
		backgroundColor: "white",
		left: "50%",
		transform: "translate(-50%)",
		top: 130,
		borderColor: Colors.light.gray,
		borderWidth: 1,
		borderRadius: 32,
	},
	cardTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: Colors.light.text,
	},
	cardImage: {
		position: "absolute",
		left: "50%",
		transform: "translate(-50%)",
		top: -(76 / 2), // 76 = icon size
		boxSizing: "content-box",
		borderColor: Colors.light.gray,
		borderWidth: 2,
	},
	cardContentContainer: {
		height: "77.5%",
		paddingHorizontal: "7.5%",
	},
	cardTop: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		paddingBottom: 12,
	},
	cardTopTexts: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	cardMiddle: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		borderColor: Colors.light.lightgray,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderBottomWidth: 1,
	},
	cardBottom: {
		display: "flex",
		flexDirection: "row",
		paddingVertical: 12,
		gap: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	text: {
		color: Colors.light.text,
		fontWeight: 500,
	},
	foodContainer: {
		display: "flex",
		marginHorizontal: "5%",
		marginTop: "45%",
	},
	foodSectionContainer: {
		marginBottom: 32,
	},
	foodSectionTitle: {
		fontSize: 20,
		fontWeight: 500,
		textTransform: "uppercase",
		marginBottom: 16,
	},
	foodSectionInnerContainer: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-evenly",
		rowGap: 12,
	},
	foodCard: {
		display: "flex",
		maxWidth: 112,
		rowGap: 4,
		backgroundColor: Colors.light.lightgray,
		borderRadius: 16,
	},
	foodCardTextContainer: {
		paddingHorizontal: 8,
		paddingBottom: 8,
		rowGap: 2,
	},
	foodName: {
		fontSize: 14,
	},
	foodPrice: {
		fontSize: 14,
	},
});

export default SocialScreen;
