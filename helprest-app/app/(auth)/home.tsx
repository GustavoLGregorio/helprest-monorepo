import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";
import LoginOption from "@/components/login/LoginOption";
import { useRouter } from "expo-router";
import { signInWithGoogle } from "@/services/auth";
import { saveUserName } from "@/utils/saveUserRegisterInfo";
import { api } from "@/services/api";
import { saveUserProfile, getIncompleteOnboardingStep, type CachedUserProfile } from "@/storage/userProfile";

export default function LoginScreen() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		try {
			const result = await signInWithGoogle();
			if (result.success) {
				if (result.isNewUser) {
					// Pre-populate name from Google for step1
					if (result.user?.name) {
						saveUserName(result.user.name);
					}
					router.replace("/(auth)/register/step1");
				} else {
					// Validate profile and check onboarding for existing users
					await validateAndNavigate();
				}
			} else {
				if (result.error !== "Login cancelled") {
					Alert.alert("Erro", result.error || "Falha ao fazer login");
				}
			}
		} catch (error) {
			Alert.alert("Erro", "Ocorreu um erro inesperado");
		} finally {
			setIsLoading(false);
		}
	};

	const validateAndNavigate = async () => {
		try {
			const response = await api.get<CachedUserProfile>("/api/users/me", { authenticated: true });
			if (!response.ok) {
				Alert.alert("Erro", "Falha ao validar sessão");
				return;
			}

			const profile = response.data;
			saveUserProfile(profile);

			const incompleteStep = getIncompleteOnboardingStep(profile);
			if (incompleteStep !== null) {
				router.replace(`/(auth)/register/step${incompleteStep}` as never);
			} else {
				router.replace("/(app)/(tabs)/(home)");
			}
		} catch {
			// Fallback: navigate to home and let root layout handle it
			router.replace("/(app)/(tabs)/(home)");
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Image
					style={styles.logo}
					source={require("@/assets/images/logo/logo_bare.png")}
					contentFit="contain"
				/>
				<Text style={styles.title}>Bem vindo ao HelpRest!</Text>
			</View>
			<View style={styles.registerContainer}>
				{isLoading ? (
					<ActivityIndicator size="large" color="#FFF" />
				) : (
					<>
						<LoginOption
							icon={require("@/assets/images/logo/logo_google.svg")}
							text="Continuar com o Google"
							action={handleGoogleLogin}
						/>
						<LoginOption
							icon={require("@/assets/images/icon/icon_envelope.svg")}
							text="Continuar com o e-mail"
							action={() => Alert.alert("Em breve", "Login com e-mail será implementado futuramente")}
						/>
					</>
				)}
			</View>
			<View style={styles.loginContainer}>
				<Text style={styles.text}>Já tem uma conta?</Text>
				<TouchableOpacity
					style={{
						backgroundColor: "transparent",
						borderRadius: 1_000,
						borderColor: "#FFF",
						borderWidth: 2,
						padding: 4,
						paddingVertical: 6,
						width: 120,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
					onPress={() => Alert.alert("Em breve", "Login com e-mail será implementado futuramente")}
				>
					<Text style={{ fontSize: 20, color: "#FFF" }}>Entrar</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.light.tint,
		flex: 1,
		paddingHorizontal: "5%",
	},
	header: {
		display: "flex",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 16,
	},
	logo: {
		width: 124,
		height: 124,
	},
	title: {
		fontSize: 48,
		color: "#FFF",
		textAlign: "center",
	},
	registerContainer: {
		display: "flex",
		gap: 12,
		marginBottom: 24,
	},
	loginContainer: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		marginBottom: 32,
	},
	text: {
		fontSize: 22,
		fontWeight: "500",
		color: "#FFF",
	},
});

