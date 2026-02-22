import Card from "@/components/ui/Card";
import { useApi } from "@/hooks/useApi";
import {
	getRecommended,
	getNearby,
	listEstablishments,
} from "@/services/establishment.service";
import type {
	EstablishmentDTO,
	RecommendedEstablishmentDTO,
	PaginatedResponse,
} from "@/types/api.types";
import { useFonts } from "expo-font";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Default location: Curitiba centro
const DEFAULT_LAT = -25.429;
const DEFAULT_LNG = -49.27;

function PlacesTab() {
	useFonts({
		Roboto: require("@/assets/fonts/Roboto-Variable.ttf"),
	});

	// ── API Calls ──
	const recommended = useApi<RecommendedEstablishmentDTO[]>(
		() => getRecommended(DEFAULT_LAT, DEFAULT_LNG, 10),
		[],
	);

	const nearby = useApi<EstablishmentDTO[]>(
		() => getNearby(DEFAULT_LAT, DEFAULT_LNG, 5000, 10),
		[],
	);

	const all = useApi<PaginatedResponse<EstablishmentDTO>>(
		() => listEstablishments(1, 10),
		[],
	);

	// ── Helpers ──
	function formatDistance(meters: number | undefined): string {
		if (!meters) return "";
		if (meters < 1000) return `${Math.round(meters)}m`;
		return `${(meters / 1000).toFixed(1)}km`;
	}

	function renderLoading() {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="small" color="#888" />
			</View>
		);
	}

	function renderError(message: string) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.errorText}>{message}</Text>
			</View>
		);
	}

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
				{/* ── Recomendados ── */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Recomendados</Text>
					{recommended.loading ? (
						renderLoading()
					) : recommended.error ? (
						renderError(recommended.error)
					) : (
						<ScrollView
							horizontal={true}
							showsHorizontalScrollIndicator={false}
							overScrollMode="never"
							bounces={false}
							decelerationRate="normal"
						>
							<View style={styles.horizontalContainer}>
								{(recommended.data ?? []).map((est) => (
									<Card key={est.id} width={150}>
										<Card.Header>
											<Card.Header.Image
												source={{ uri: est.logo }}
												width={142}
												height={142}
											/>
										</Card.Header>

										<Card.Body direction="row">
											<Card.Header.Icon
												source={{ uri: est.logo }}
												size={32}
												alt={est.companyName}
											/>
											<Card.Header.Title title={est.companyName} />
										</Card.Body>

										<Card.Footer direction="row">
											{est.distanceMeters ? (
												<>
													<Card.Footer.Text
														text={formatDistance(est.distanceMeters)}
													/>
													<Card.Footer.Text text="·" />
												</>
											) : null}
											{est.flags.map((flag) => (
												<Card.Footer.Flag
													key={flag.id}
													text={flag.identifier}
													backgroundColor={flag.backgroundColor}
													textColor={flag.textColor}
												/>
											))}
										</Card.Footer>
									</Card>
								))}
							</View>
						</ScrollView>
					)}
				</View>

				{/* ── Locais Próximos ── */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Locais Próximos</Text>
					{nearby.loading ? (
						renderLoading()
					) : nearby.error ? (
						renderError(nearby.error)
					) : (
						<ScrollView
							horizontal={true}
							showsHorizontalScrollIndicator={false}
							overScrollMode="never"
							bounces={false}
							decelerationRate="normal"
						>
							<View
								style={[styles.horizontalContainer, styles.cardGapLarge]}
							>
								{(nearby.data ?? []).map((est) => (
									<Card key={est.id} gap={1} width={88} maxWidth={88}>
										<Card.Header>
											<Card.Header.Icon
												source={{ uri: est.logo }}
												size={88}
												alt={est.companyName}
											/>
										</Card.Header>

										<Card.Body direction="row">
											<Card.Header.Title
												title={est.companyName}
												align="center"
											/>
										</Card.Body>

										<Card.Footer>
											{est.isSponsored ? (
												<Card.Footer.Text text="Patrocinado" />
											) : (
												<Card.Footer.Text
													text={est.location.neighborhood}
												/>
											)}
										</Card.Footer>
									</Card>
								))}
							</View>
						</ScrollView>
					)}
				</View>

				{/* ── Estabelecimentos ── */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>Estabelecimentos</Text>
					{all.loading ? (
						renderLoading()
					) : all.error ? (
						renderError(all.error)
					) : (
						<View style={styles.verticalContainer}>
							{(all.data?.data ?? []).map((est) => (
								<Card
									key={est.id}
									gap={1}
									direction="row"
									width="auto"
								>
									<Card.Header>
										<Card.Header.Icon
											source={{ uri: est.logo }}
											size={62}
											alt={est.companyName}
										/>
									</Card.Header>

									<Card.Body direction="column">
										<Card.Header.Title
											title={est.companyName}
											align="center"
										/>
										{est.isSponsored ? (
											<Card.Footer.Text text="Patrocinado" />
										) : (
											<Card.Footer.Text
												text={`${est.location.neighborhood}, ${est.location.city}`}
											/>
										)}
									</Card.Body>

									<Card.Footer direction="column">
										{est.flags.slice(0, 2).map((flag) => (
											<Card.Footer.Flag
												key={flag.id}
												text={flag.identifier}
												backgroundColor={flag.backgroundColor}
												textColor={flag.textColor}
											/>
										))}
									</Card.Footer>
								</Card>
							))}
						</View>
					)}
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
	loadingContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 24,
	},
	errorText: {
		color: "#EB5757",
		fontSize: 14,
		fontFamily: "Roboto",
		textAlign: "center",
	},
});

export default PlacesTab;
