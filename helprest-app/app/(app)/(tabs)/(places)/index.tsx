import MiddleDot from "@/components/atoms/MiddleDot";
import Card from "@/components/ui/Card";
import CardHorizontal from "@/components/ui/CardHorizontal";
import { Colors } from "@/constants/Colors";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
    ImageSourcePropType,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { EstabelecimentoType } from "../../../../models/Estabelecimento";
import ImageRounded from "@/components/ui/ImageRounded";

export type TempPlacesType = {
    id: number;
    empresa: string;
    flags: [string, string];
    logo_empresa: ImageSourcePropType;
    icone?: string;
    fotos: [ImageSourcePropType];
};

function PlacesScreen() {
    const [fontLoaded, fontError] = useFonts({
        Roboto: require("@/assets/fonts/Roboto-Variable.ttf"),
        RobotoMono: require("@/assets/fonts/RobotoMono-Variable.ttf"),
    });

    const { data, error } = useQuery<EstabelecimentoType[]>({
        queryKey: ["places"],
        queryFn: () =>
            fetch("https://prototipo-help-rest.vercel.app/api/locais").then(
                (res) => res.json()
            ),
    });

    useEffect(() => {
        if (fontLoaded || fontError) SplashScreen.hideAsync();
    }, [fontLoaded, fontError]);

    if (!fontLoaded && !fontError) {
        return (
            <SafeAreaView>
                <Text>Carregando fontes...</Text>
            </SafeAreaView>
        );
    }

    if (!data || error) return;

    const temp_places: TempPlacesType[] = [
        {
            id: 0,
            empresa: "Verde Oliva Bistrô",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/1.jpeg"),
            fotos: [require("@/assets/images/places/10.jpeg")],
        },
        {
            id: 1,
            empresa: "Raízes do Campo",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/2.jpeg"),
            fotos: [require("@/assets/images/places/9.jpeg")],
        },
        {
            id: 2,
            empresa: "Alquimia dos Grãos",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/3.jpeg"),
            fotos: [require("@/assets/images/places/8.jpeg")],
        },
        {
            id: 3,
            empresa: "Pura Vida Lab",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/4.jpeg"),
            fotos: [require("@/assets/images/places/7.jpeg")],
        },
        {
            id: 4,
            empresa: "Bistrô Sem Culpa",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/5.jpeg"),
            fotos: [require("@/assets/images/places/6.jpeg")],
        },
        {
            id: 5,
            empresa: "Equilíbrio Natural",
            flags: ["gluten", "vegan"],
            logo_empresa: require("@/assets/images/places/4.jpeg"),
            fotos: [require("@/assets/images/places/5.jpeg")],
        },
    ];

    return (
        <SafeAreaView
            style={{ height: "100%", paddingBottom: 0, marginBottom: 0 }}
        >
            <View style={{ height: "105%" }}>
                <ScrollView
                    style={styles.container}
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                    bounces={false}
                    decelerationRate="normal"
                >
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>para você</Text>

                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            overScrollMode="never"
                            bounces={false}
                            decelerationRate="normal"
                        >
                            <View
                                style={[
                                    styles.horizontalContainer,
                                    styles.smallGap,
                                ]}
                            >
                                {temp_places.map((place, index) => {
                                    return (
                                        <Card key={place.id} width={150}>
                                            <Card.Header>
                                                <ImageRounded
                                                    imageSource={place.fotos[0]}
                                                    width={142}
                                                    height={142}
                                                    alt="img"
                                                />
                                            </Card.Header>

                                            <Card.Body direction="row">
                                                <Card.Header.Icon
                                                    source={place.logo_empresa}
                                                    size={32}
                                                    alt="icon"
                                                />
                                                <Card.Header.Title
                                                    title={place.empresa}
                                                />
                                            </Card.Body>

                                            <Card.Footer direction="row">
                                                <Card.Footer.Text text="200m" />
                                                <MiddleDot
                                                    size={3}
                                                    color="#333"
                                                />
                                                <Card.Footer.Flag
                                                    text={place.flags[0].substring(
                                                        0,
                                                        6
                                                    )}
                                                    backgroundColor={
                                                        Colors.light.tint
                                                    }
                                                    textColor="white"
                                                />
                                                <Card.Footer.Flag
                                                    text={place.flags[1].substring(
                                                        0,
                                                        6
                                                    )}
                                                    backgroundColor={
                                                        Colors.light.tint
                                                    }
                                                    textColor="white"
                                                />
                                            </Card.Footer>
                                        </Card>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            novidades próximas
                        </Text>
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            overScrollMode="never"
                            bounces={false}
                            decelerationRate="normal"
                        >
                            <View
                                style={[
                                    styles.horizontalContainer,
                                    styles.smallGap,
                                ]}
                            >
                                {temp_places.map((place, id) => {
                                    return (
                                        <Card
                                            key={id}
                                            gap={1}
                                            width={88}
                                            maxWidth={88}
                                        >
                                            <Card.Header>
                                                <Card.Header.Icon
                                                    source={place.fotos[0]}
                                                    size={88}
                                                    alt="icon"
                                                ></Card.Header.Icon>
                                            </Card.Header>

                                            <Card.Body direction="row">
                                                <Card.Header.Title
                                                    title={place.empresa}
                                                    align="center"
                                                />
                                            </Card.Body>

                                            <Card.Footer>
                                                <Card.Footer.Text text="Patrocinado" />
                                            </Card.Footer>
                                        </Card>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>

                    {/* PROXIMOS DE VOCE */}
                    <View
                        style={[styles.sectionContainer, { marginBottom: 20 }]}
                    >
                        <Text style={styles.sectionTitle}>
                            próximos de você
                        </Text>

                        <View
                            style={[styles.verticalContainer, styles.mediumGap]}
                        >
                            {temp_places.map((place, index) => (
                                <CardHorizontal
                                    key={index}
                                    icon={place.logo_empresa}
                                    locationTitle={place.empresa}
                                    locationVisibleTags={[
                                        place.flags[0],
                                        place.flags[1],
                                    ]}
                                    locationDistance={200}
                                    isLocationPromoted={true}
                                    locationReviewScore={85}
                                ></CardHorizontal>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        height: "100%",
    },
    sectionContainer: {
        marginTop: 18,
        overflowX: "scroll",
        overflowY: "none",
        marginHorizontal: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        textAlign: "left",
        fontSize: 20,
        fontFamily: "Roboto",
        textTransform: "uppercase",
        fontWeight: "bold",
    },
    verticalContainer: {
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "column",
    },
    horizontalContainer: {
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
    },
    smallGap: {
        gap: 8,
    },
    mediumGap: {
        gap: 10,
    },
});

export default PlacesScreen;
