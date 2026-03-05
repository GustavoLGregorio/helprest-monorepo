import { MMKV } from "react-native-mmkv";

export interface UserLocation {
	latitude: number;
	longitude: number;
	timestamp: number;
}

// Inicializar MMKV
const storage = new MMKV();

export const saveUserLocation = (location: UserLocation) => {
	try {
		storage.set("userLocation", JSON.stringify(location));
	} catch (error) {
		console.error("Erro ao salvar localização com MMKV:", error);
	}
};

export const loadUserLocation = (): UserLocation | null => {
	try {
		const json = storage.getString("userLocation");
		return json ? JSON.parse(json) : null;
	} catch (error) {
		console.error("Erro ao carregar localização com MMKV:", error);
		return null;
	}
};
