import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const saveUserLoginStatus = (status: boolean) => {
    try {
        storage.set("userLoginStatus", String(status));
    } catch (error) {
        console.warn("Error saving userLoginStatus: ", error);
    }
};

export const loadUserLoginStatus = (): boolean | undefined => {
    try {
        const loginStatus = storage.getString("userLoginStatus");
        return Boolean(loginStatus);
    } catch (error) {
        console.warn("Error loading userLoginStatus: ", error);
    }
};
