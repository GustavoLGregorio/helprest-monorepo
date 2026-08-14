import { MMKV } from "react-native-mmkv";
import { StorageKeys, StorageInstances } from "./keys";

const storage = new MMKV({ id: StorageInstances.APP_STATE });

export const saveUserLoginStatus = (status: boolean): void => {
    try {
        storage.set(StorageKeys.USER.LOGIN_STATUS, status);
    } catch (error) {
        console.warn("Error saving userLoginStatus: ", error);
    }
};

export const loadUserLoginStatus = (): boolean | undefined => {
    try {
        if (!storage.contains(StorageKeys.USER.LOGIN_STATUS)) {
            return undefined;
        }
        return storage.getBoolean(StorageKeys.USER.LOGIN_STATUS);
    } catch (error) {
        console.warn("Error loading userLoginStatus: ", error);
        return undefined;
    }
};

export const clearUserLoginStatus = (): void => {
    try {
        storage.delete(StorageKeys.USER.LOGIN_STATUS);
    } catch (error) {
        console.warn("Error clearing userLoginStatus: ", error);
    }
};
