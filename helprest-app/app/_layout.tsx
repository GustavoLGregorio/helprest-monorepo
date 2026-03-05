import { Stack, Redirect } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAuthenticated } from "@/storage/authTokens";

const queryClient = new QueryClient();

export default function RootLayout() {
    const authenticated = isAuthenticated();

    return (
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(app)/(tabs)" />
                <Stack.Screen name="(auth)" />
            </Stack>
            {authenticated ? (
                <Redirect href="/(app)/(tabs)/(home)" />
            ) : (
                <Redirect href="/(auth)/home" />
            )}
        </QueryClientProvider>
    );
}


