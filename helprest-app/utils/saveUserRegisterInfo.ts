import { MMKV } from "react-native-mmkv";

export type UserRegisterInfo = {
    name: string;
    birthDate: string;
    defaultLocation: string;
    flags: string | string[];
    email: string;
    password: string;
};

const storage = new MMKV();

export const saveUserName = (name: string) => {
    try {
        storage.set("userName", name);
    } catch (error) {
        console.error("Error writing userName: ", error);
    }
};
export const loadUserName = (): string | undefined => {
    try {
        const name = storage.getString("userName");
        return name;
    } catch (error) {
        console.error("Error loading userName: ", error);
    }
};

export const saveUserBirthDate = (date: string) => {
    try {
        storage.set("userBirthDate", date);
    } catch (error) {
        console.error("Error writing userBirthDate: ", error);
    }
};
export const loadUserBirthDate = (): string | undefined => {
    try {
        const birthDate = storage.getString("userBirthDate");
        return birthDate;
    } catch (error) {
        console.error("Error loading userBirthDate: ", error);
    }
};

export const saveUserDefaultLocation = (defaultLocation: string) => {
    try {
        storage.set("userDefaultLocation", defaultLocation);
    } catch (error) {
        console.error("Error writing userDefaultLocation: ", error);
    }
};
export const loadUserDefaultLocation = (): string | undefined => {
    try {
        const defaultLocation = storage.getString("userDefaultLocation");
        return defaultLocation;
    } catch (error) {
        console.error("Error loading userDefaultLocation: ", error);
    }
};
