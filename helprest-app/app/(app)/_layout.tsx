import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { loadTokens } from "@/storage/authTokens";
import { loadUserProfile, getIncompleteOnboardingStep } from "@/storage/userProfile";

export default function AppLayout() {
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const tokens = loadTokens();
        if (!tokens) {
            // Not authenticated
            router.replace("/(auth)/home");
            return;
        }

        const profile = loadUserProfile();
        if (!profile) {
            // No profile cache? Force validate via login screen
            router.replace("/(auth)/home");
            return;
        }

        // If user is normal user (not establishment), check if onboarding is complete
        if (profile.role !== "establishment") {
            const incompleteStep = getIncompleteOnboardingStep(profile);
            if (incompleteStep !== null) {
                // Redirect immediately to their current incomplete step
                router.replace(`/(auth)/register/step${incompleteStep}` as never);
            }
        }
    }, [segments, router]);

    return <Slot />;
}
