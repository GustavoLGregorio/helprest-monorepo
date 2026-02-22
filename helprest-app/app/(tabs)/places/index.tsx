import Card from "@/components/ui/Card";
import { useFonts } from "expo-font";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function PlacesTab() {
	useFonts({
		Roboto: require("@/assets/fonts/Roboto-Variable.ttf"),
	});

	const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

	return (
		<SafeAreaView>
			<ScrollView
				style={styles.container}
				horizontal={false}
				showsVerticalScrollIndicator={false}
				overScrollMode="never"
				bounces={false}
				decelerationRate="normal"
			>
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Recomendados</Text>
					<ScrollView
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						overScrollMode="never"
						bounces={false}
						decelerationRate="normal"
					>
						<View style={styles.horizontalContainer}>
							{items.map((value, key) => {
								return (
									<Card key={key} width={150}>
										<Card.Header>
											<Card.Header.Image
												source={require("@/assets/images/8.jpeg")}
												width={142}
												height={142}
											></Card.Header.Image>
										</Card.Header>

										<Card.Body direction="row">
											<Card.Header.Icon
												source={require("@/assets/images/8.jpeg")}
												size={32}
												alt="icon"
											/>
											<Card.Header.Title title="Restaurante Fitness" />
										</Card.Body>

										<Card.Footer direction="row">
											<Card.Footer.Text text="200m" />
											<Card.Footer.Text text="·" />
											<Card.Footer.Flag text="vegan" backgroundColor="#56CCF2" textColor="white" />
											<Card.Footer.Flag text="vegan" backgroundColor="#56CCF2" textColor="white" />
										</Card.Footer>
									</Card>
								);
							})}
						</View>
					</ScrollView>
				</View>

				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Locais Próximos</Text>
					<ScrollView
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						overScrollMode="never"
						bounces={false}
						decelerationRate="normal"
					>
						<View style={[styles.horizontalContainer, styles.cardGapLarge]}>
							{items.map((value, key) => {
								return (
									<Card key={key} gap={1} width={88} maxWidth={88}>
										<Card.Header>
											<Card.Header.Icon
												source={require("@/assets/images/8.jpeg")}
												size={88}
												alt="icon"
											></Card.Header.Icon>
										</Card.Header>

										<Card.Body direction="row">
											<Card.Header.Title title="Restaurante Fitness" align="center" />
										</Card.Body>

										<Card.Footer>
											<Card.Footer.Text text="Patrocinado" />
										</Card.Footer>
									</Card>
								);
							})}
						</View>
					</ScrollView>
				</View>

				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Estabelecimentos</Text>
					<View style={styles.verticalContainer}>
						{items.map((value, key) => {
							return (
								<Card key={key} gap={1} direction="row" width="auto">
									<Card.Header>
										<Card.Header.Icon
											source={require("@/assets/images/8.jpeg")}
											size={62}
											alt="icon"
										></Card.Header.Icon>
									</Card.Header>

									<Card.Body direction="column">
										<Card.Header.Title title="Restaurante Fitness" align="center" />
										<Card.Footer.Text text="Patrocinado" />
									</Card.Body>

									<Card.Footer direction="column">
										<Card.Header.Icon
											source={require("@/assets/images/8.jpeg")}
											size={62}
											alt="icon"
										></Card.Header.Icon>
									</Card.Footer>
								</Card>
							);
						})}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {},
	sectionContainer: {
		flexGrow: 1,
		marginTop: 18,
		overflowX: "scroll",
		overflowY: "none",
		marginHorizontal: 12,
	},
	sectionTitle: {
		textAlign: "left",
		marginBottom: 12,
		fontSize: 20,
		fontFamily: "Roboto",
		textTransform: "capitalize",
	},
	verticalContainer: {
		display: "flex",
		justifyContent: "flex-start",
		flexDirection: "column",
		gap: 8,
		backgroundColor: "green",
	},
	horizontalContainer: {
		display: "flex",
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
	},
	cardGapSmall: {
		gap: 4,
	},
	cardGapMedium: {
		gap: 8,
	},
	cardGapLarge: {
		gap: 12,
	},
});

export default PlacesTab;
