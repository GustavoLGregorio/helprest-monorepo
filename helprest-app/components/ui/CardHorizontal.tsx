import { Colors } from "@/constants/Colors";
import React from "react";
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import MiddleDot from "../atoms/MiddleDot";
import FlagColoredText from "./FlagColoredText";
import HeartClicable from "./HeartClicable";
import IconCircle from "./IconCircle";
import StarReview from "./StarReview";
import TextDistance from "../atoms/TextDistance";

type CardHorizontalProps = {
    locationTitle: string;
    locationVisibleTags: [string, string];
    locationDistance: number;
    isLocationPromoted: boolean;
    locationReviewScore: number;
    icon: ImageSourcePropType;
};

const CardHorizontal: React.FC<CardHorizontalProps> = ({
    locationTitle,
    locationVisibleTags,
    locationDistance,
    isLocationPromoted,
    locationReviewScore,
    icon,
}) => {
    return (
        <View style={styles.item}>
            <View style={styles.iconContainer}>
                <IconCircle imageSource={icon} size={62}></IconCircle>
            </View>
            <View style={styles.infoContainer}>
                {isLocationPromoted && (
                    <Text style={styles.text}>Patrocinado</Text>
                )}
                <Text style={styles.title}>{locationTitle}</Text>
                <View style={styles.infoPlaceContainer}>
                    <StarReview
                        backgroundColor="transparent"
                        textColor={Colors.light.gold}
                        ratingValue={locationReviewScore}
                    />
                    <TextDistance distance={locationDistance} />
                    <MiddleDot size={4} color="#333" />
                    <FlagColoredText
                        text={locationVisibleTags[0]}
                        backgroundColor={Colors.light.tint}
                        textColor={Colors.light.background}
                    />
                    <FlagColoredText
                        text={locationVisibleTags[1]}
                        backgroundColor={Colors.light.tint}
                        textColor={Colors.light.background}
                    />
                </View>
            </View>
            <View style={styles.heartContainer}>
                <HeartClicable
                    size={28}
                    activateAction={() => console.log("favorited")}
                    deactivateAction={() => console.log("unfavorited")}
                ></HeartClicable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBlockColor: "#ddd",
        borderBottomWidth: 1,
        paddingBottom: 12,
    },
    iconContainer: {},
    infoContainer: {
        flexGrow: 1,
    },
    heartContainer: {
        marginRight: 16,
    },
    infoPlaceContainer: {
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "baseline",
    },
    text: {
        color: "#333",
        fontSize: 12,
        letterSpacing: 0.25,
    },

    title: {
        color: "#333",
        fontFamily: "Roboto",
        fontSize: 14,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});

export default CardHorizontal;
