import { MMKV } from "react-native-mmkv";
import { StorageKeys, StorageInstances } from "./keys";

const storage = new MMKV({ id: StorageInstances.USER_PROFILE });

export interface CachedUserProfile {
    id: string;
    name: string;
    email: string;
    birthDate?: string;
    profilePhoto?: string;
    flags: string[];
    role?: "user" | "establishment";
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
        storage.set(StorageKeys.USER.PROFILE, JSON.stringify(profile));
    } catch (error) {
        console.error("Error saving user profile:", error);
    }
}

export function loadUserProfile(): CachedUserProfile | null {
    try {
        const raw = storage.getString(StorageKeys.USER.PROFILE);
        if (raw) return JSON.parse(raw) as CachedUserProfile;
        return null;
    } catch (error) {
        console.error("Error loading user profile:", error);
        return null;
    }
}

export function clearUserProfile(): void {
    try {
        storage.delete(StorageKeys.USER.PROFILE);
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

export function saveCompanyOnboardingStatus(isCompany: boolean): void {
    try {
        storage.set(StorageKeys.ONBOARDING.IS_COMPANY, isCompany);
    } catch (error) {
        console.error("Error saving company onboarding status:", error);
    }
}

export function loadCompanyOnboardingStatus(): boolean {
    try {
        return storage.getBoolean(StorageKeys.ONBOARDING.IS_COMPANY) ?? false;
    } catch (error) {
        console.error("Error loading company onboarding status:", error);
        return false;
    }
}

export function clearCompanyOnboardingStatus(): void {
    try {
        storage.delete(StorageKeys.ONBOARDING.IS_COMPANY);
    } catch (error) {
        console.error("Error clearing company onboarding status:", error);
    }
}
