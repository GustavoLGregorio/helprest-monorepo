import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "company-register-info" });

export interface CompanyRegisterInfo {
    companyName: string;
    cnpj: string;
    logo: string;
    location: {
        state: string;
        city: string;
        neighborhood: string;
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    flagIds: string[];
}

export const saveCompanyNameAndCNPJ = (name: string, cnpj: string, logo: string) => {
    try {
        storage.set("companyName", name);
        storage.set("cnpj", cnpj);
        storage.set("logo", logo);
    } catch (error) {
        console.error("Error writing company registration basic info: ", error);
    }
};

export const loadCompanyBasicInfo = () => {
    try {
        return {
            companyName: storage.getString("companyName") || "",
            cnpj: storage.getString("cnpj") || "",
            logo: storage.getString("logo") || "",
        };
    } catch (error) {
        console.error("Error loading company basic info: ", error);
        return { companyName: "", cnpj: "", logo: "" };
    }
};

export const saveCompanyLocation = (location: CompanyRegisterInfo["location"]) => {
    try {
        storage.set("location", JSON.stringify(location));
    } catch (error) {
        console.error("Error writing company location: ", error);
    }
};

export const loadCompanyLocation = (): CompanyRegisterInfo["location"] | null => {
    try {
        const raw = storage.getString("location");
        return raw ? JSON.parse(raw) as CompanyRegisterInfo["location"] : null;
    } catch (error) {
        console.error("Error loading company location: ", error);
        return null;
    }
};

export const clearCompanyRegisterInfo = () => {
    try {
        storage.delete("companyName");
        storage.delete("cnpj");
        storage.delete("logo");
        storage.delete("location");
    } catch (error) {
        console.error("Error clearing company registration info: ", error);
    }
};
