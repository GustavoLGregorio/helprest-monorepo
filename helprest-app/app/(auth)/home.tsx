import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";
import LoginOption from "@/components/login/LoginOption";
import { useRouter } from "expo-router";
import { signInWithGoogle } from "@/services/auth";
import { saveUserName } from "@/utils/saveUserRegisterInfo";

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
					router.replace("/(app)/(tabs)/(home)");
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
		width: "100%",
		height: "100%",
		paddingHorizontal: "30%",
	},
	header: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 140,
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
		marginTop: 140,
	},
	loginContainer: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		marginTop: 60,
	},
	text: {
		fontSize: 22,
		fontWeight: "500",
		color: "#FFF",
	},
});

