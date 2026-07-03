import { StyleSheet, View, Text, ScrollView, Alert, useWindowDimensions } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NextButton from "@/components/login/NextButton";
import UserInput from "@/components/login/UserInput";
import UserProgress from "@/components/login/UserProgress";
import { useRouter } from "expo-router";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { saveCompanyLocation, loadCompanyLocation } from "@/utils/saveCompanyRegisterInfo";

// Default coordinates: Curitiba centro
const DEFAULT_LAT = -25.4296;
const DEFAULT_LNG = -49.2699;

export default function CompanyStep2() {
    const router = useRouter();
    const [state, setState] = useState<string>("PR");
    const [city, setCity] = useState<string>("Curitiba");
    const [neighborhood, setNeighborhood] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
    });
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 768;
    const paddingHorizontal = isLargeScreen ? width * 0.25 : 24;

    useEffect(() => {
        const cached = loadCompanyLocation();
        if (cached) {
            setState(cached.state);
            setCity(cached.city);
            setNeighborhood(cached.neighborhood);
            setAddress(cached.address);
            setCoordinates(cached.coordinates);
        }
    }, []);

    const handleMapPress = (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setCoordinates({ lat: latitude, lng: longitude });
    };

    const nextStep = () => {
        if (!state.trim() || !city.trim() || !address.trim()) {
            Alert.alert("Erro", "Por favor, preencha o estado, cidade e endereço.");
            return;
        }

        saveCompanyLocation({
            state,
            city,
            neighborhood,
            address,
            coordinates,
        });

        router.push("/(auth)/register-establishment/step3" as never);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ 
                    paddingHorizontal, 
                    paddingTop: 12, 
                    paddingBottom: 40 
                }}
            >
                <UserProgress size={3} current={2} />
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        Onde fica o seu estabelecimento?
                    </Text>
                    <Text style={styles.infoText}>
                        Insira o endereço e marque a localização exata tocando no mapa.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.row}>
                        <View style={{ flex: 3 }}>
                            <UserInput
                                label="Cidade"
                                placeholder="Curitiba"
                                changeTextAction={(t) => setCity(t)}
                                value={city}
                            />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={{ flex: 1 }}>
                            <UserInput
                                label="Estado (UF)"
                                placeholder="PR"
                                changeTextAction={(t) => setState(t)}
                                value={state}
                            />
                        </View>
                    </View>
                    
                    <View style={{ height: 16 }} />
                    
                    <UserInput
                        label="Bairro"
                        placeholder="Batel"
                        changeTextAction={(t) => setNeighborhood(t)}
                        value={neighborhood}
                    />
                    
                    <View style={{ height: 16 }} />
                    
                    <UserInput
                        label="Endereço (Rua, Número, Comp.)"
                        placeholder="Rua Bispo Dom José, 2117"
                        changeTextAction={(t) => setAddress(t)}
                        value={address}
                    />
                </View>

                <Text style={styles.mapLabel}>Toque no mapa para ajustar a posição precisa:</Text>
                
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: coordinates.lat,
                            longitude: coordinates.lng,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.015,
                        }}
                        onPress={handleMapPress}
                    >
                        <Marker
                            coordinate={{
                                latitude: coordinates.lat,
                                longitude: coordinates.lng,
                            }}
                            title="Posição do Estabelecimento"
                            draggable
                            onDragEnd={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                setCoordinates({ lat: latitude, lng: longitude });
                            }}
                        />
                    </MapView>
                </View>

                <View style={styles.buttonContainer}>
                    <NextButton 
                        text="Avançar" 
                        action={() => nextStep()} 
                        disabled={!state.trim() || !city.trim() || !address.trim()}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 16,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 15,
        textAlign: "center",
        color: "#666",
    },
    form: {
        width: "100%",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
    },
    mapLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    mapContainer: {
        height: 220,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        borderColor: "#DDD",
        borderWidth: 1,
        marginBottom: 30,
    },
    map: {
        flex: 1,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 10,
    },
});
