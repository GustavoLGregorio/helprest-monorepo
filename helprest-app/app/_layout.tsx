import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator } from "react-native";
import { loadTokens, clearTokens } from "@/storage/authTokens";
import {
    saveUserProfile,
    loadUserProfile,
    clearUserProfile,
    getIncompleteOnboardingStep,
    type CachedUserProfile,
} from "@/storage/userProfile";
import { api } from "@/services/api";

const queryClient = new QueryClient();

type AuthState = "loading" | "authenticated" | "unauthenticated" | "onboarding";

export default function RootLayout() {
    const router = useRouter();
    const [authState, setAuthState] = useState<AuthState>("loading");
    const [onboardingStep, setOnboardingStep] = useState<number>(1);

    // Initial validation on mount
    useEffect(() => {
        validateSession();
    }, []);

    useEffect(() => {
        if (authState === "loading") return;

        switch (authState) {
            case "authenticated":
                router.replace("/(app)/(tabs)/(home)");
                break;
            case "unauthenticated":
                router.replace("/(auth)/home");
                break;
            case "onboarding":
                router.replace(`/(auth)/register/step${onboardingStep}` as never);
                break;
        }
    }, [authState, onboardingStep]);

    async function validateSession() {
        setAuthState("loading");
        const tokens = loadTokens();

        // No tokens → go to login
        if (!tokens) {
            setAuthState("unauthenticated");
            return;
        }

        // Has tokens → validate with backend
        try {
            const response = await api.get<CachedUserProfile>("/api/users/me", {
                authenticated: true,
            });

            if (!response.ok) {
                // Token invalid or user deleted → clear everything
                clearTokens();
                clearUserProfile();
                setAuthState("unauthenticated");
                return;
            }

            const profile = response.data;

            // Cache profile locally
            saveUserProfile(profile);

            // Check if onboarding is complete
            const incompleteStep = getIncompleteOnboardingStep(profile);
            if (incompleteStep !== null) {
                setOnboardingStep(incompleteStep);
                setAuthState("onboarding");
                return;
            }

            // All good
            setAuthState("authenticated");
        } catch {
            // Network error — try to refresh token before falling back to cache
            const tokens = loadTokens();
            if (tokens?.refreshToken) {
                try {
                    const refreshResponse = await api.post<{ accessToken: string; refreshToken: string }>(
                        "/api/auth/refresh",
                        { body: { refreshToken: tokens.refreshToken } },
                    );
                    if (refreshResponse.ok) {
                        // Refresh succeeded — re-run full validation
                        validateSession();
                        return;
                    }
                } catch {
                    // Refresh also failed — tokens are dead
                }
            }

            // Tokens dead or no network + no refresh — fall back to cache
            const cached = loadUserProfile();
            if (cached) {
                setAuthState("authenticated");
            } else {
                clearTokens();
                setAuthState("unauthenticated");
            }
        }
    }

    if (authState === "loading") {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF" }}>
                <ActivityIndicator size="large" color="#009C9D" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(app)/(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)/product/[id]" options={{ presentation: "modal" }} />
            </Stack>
        </QueryClientProvider>
    );
}

