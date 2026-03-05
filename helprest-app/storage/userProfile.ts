import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "user-profile" });

export interface CachedUserProfile {
    id: string;
    name: string;
    email: string;
    birthDate?: string;
    profilePhoto?: string;
    flags: string[];
    location?: {
        state?: string;
        city?: string;
        neighborhood?: string;
        address?: string;
        coordinates?: {
            type: string;
            coordinates: [number, number];
        };
    };
    socialLinksEnabled?: boolean;
    socialLinks?: Record<string, string>;
}

export function saveUserProfile(profile: CachedUserProfile): void {
    try {
        storage.set("profile", JSON.stringify(profile));
    } catch (error) {
        console.error("Error saving user profile:", error);
    }
}

export function loadUserProfile(): CachedUserProfile | null {
    try {
        const raw = storage.getString("profile");
        if (raw) return JSON.parse(raw) as CachedUserProfile;
        return null;
    } catch (error) {
        console.error("Error loading user profile:", error);
        return null;
    }
}

export function clearUserProfile(): void {
    try {
        storage.delete("profile");
    } catch (error) {
        console.error("Error clearing user profile:", error);
    }
}

/**
 * Check which onboarding fields are still missing.
 * Returns the first incomplete step number, or null if all complete.
 */
export function getIncompleteOnboardingStep(profile: CachedUserProfile): number | null {
    if (!profile.name || profile.name.trim().length === 0) return 1;
    if (!profile.birthDate) return 2;
    if (!profile.location?.address && !profile.location?.city) return 3;
    // Step 4 (flags) is optional — user can skip
    return null;
}
