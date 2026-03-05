import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { api } from "./api";
import {
    saveTokens,
    saveGoogleUserInfo,
    type GoogleUserInfo,
} from "@/storage/authTokens";

// Configure Google Sign-In with web client ID (for ID token audience)
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    offlineAccess: false,
});

interface GoogleAuthApiResponse {
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        profilePhoto?: string;
    };
}

/**
 * Sign in with Google using the native Google Sign-In SDK.
 * Returns success status, isNewUser flag, and user info.
 */
export async function signInWithGoogle(): Promise<{
    success: boolean;
    isNewUser: boolean;
    user?: GoogleUserInfo;
    error?: string;
}> {
    try {
        // Check if Play Services are available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Trigger native Google Sign-In
        const response = await GoogleSignin.signIn();

        if (!response.data?.idToken) {
            return { success: false, isNewUser: false, error: "No ID token received" };
        }

        const idToken = response.data.idToken;

        // Send ID token to our backend for verification
        const apiResponse = await api.post<GoogleAuthApiResponse>(
            "/api/auth/google",
            {
                body: { googleIdToken: idToken },
            },
        );

        if (!apiResponse.ok) {
            return {
                success: false,
                isNewUser: false,
                error: "Authentication failed",
            };
        }

        const { accessToken, refreshToken, isNewUser, user } = apiResponse.data;

        // Save tokens securely
        saveTokens({ accessToken, refreshToken });

        // Save Google user info for pre-populating register steps
        saveGoogleUserInfo({
            id: user.id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto,
        });

        return {
            success: true,
            isNewUser,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
            },
        };
    } catch (error: unknown) {
        const typedError = error as { code?: string };
        if (typedError.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, isNewUser: false, error: "Login cancelled" };
        } else if (typedError.code === statusCodes.IN_PROGRESS) {
            return { success: false, isNewUser: false, error: "Sign-in already in progress" };
        } else if (typedError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, isNewUser: false, error: "Google Play Services not available" };
        }
        console.error("Google sign-in error:", error);
        return {
            success: false,
            isNewUser: false,
            error: "An unexpected error occurred",
        };
    }
}
