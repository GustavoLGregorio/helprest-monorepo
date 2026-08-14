/**
 * Strongly typed storage keys for MMKV storage domains
 */
export const StorageKeys = {
    AUTH: {
        ACCESS_TOKEN: "accessToken",
        REFRESH_TOKEN: "refreshToken",
        GOOGLE_USER: "googleUser",
    },
    USER: {
        PROFILE: "profile",
        LOGIN_STATUS: "userLoginStatus",
    },
    ONBOARDING: {
        IS_COMPANY: "is_company_onboarding",
    },
} as const;

export const StorageInstances = {
    AUTH: "auth-tokens",
    USER_PROFILE: "user-profile",
    APP_STATE: "app-state",
} as const;
