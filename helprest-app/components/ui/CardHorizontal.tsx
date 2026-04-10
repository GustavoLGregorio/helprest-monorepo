import { Colors } from "@/constants/Colors";
import React from "react";
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MiddleDot from "../atoms/MiddleDot";
import FlagColoredText from "./FlagColoredText";
import HeartClicable from "./HeartClicable";
import IconCircle from "./IconCircle";
import StarReview from "./StarReview";
import TextDistance from "../atoms/TextDistance";
import { useFavorites } from "@/hooks/queries/useFavorites";

type CardHorizontalProps = {
    id: string; // Adicionado ID para favoritos
    locationTitle: string;
    /** Variable-length list of flag tags. Up to 2 are shown. */
    locationVisibleTags: string[];
    /** Pre-formatted distance string (e.g. "200m", "1.2km") or null when unknown. */
    locationDistanceLabel?: string | null;
    /** Legacy numeric distance prop (metres) — kept for backward compat */
    locationDistance?: number | null;
    isLocationPromoted: boolean;
    locationReviewScore: number;
    icon: ImageSourcePropType;
    onPress?: () => void;
};

const CardHorizontal: React.FC<CardHorizontalProps> = ({
    id,
    locationTitle,
    locationVisibleTags,
    locationDistanceLabel,
    locationDistance,
    isLocationPromoted,
    locationReviewScore,
    icon,
    onPress,
}) => {
    const { isFavorite, toggleFavorite } = useFavorites();

    // Prefer the pre-formatted label; fall back to the numeric prop; then "—"
    const distDisplay = locationDistanceLabel
        ?? (locationDistance != null ? `${locationDistance}m` : null)
        ?? "—";

    // Show at most 2 flags; guard against empty arrays
    const flags = locationVisibleTags.slice(0, 2);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
            <View style={styles.item}>
                <View style={styles.iconContainer}>
                    <IconCircle imageSource={icon} size={62}></IconCircle>
                </View>
                <View style={styles.infoContainer}>
                    {isLocationPromoted && (
                        <Text style={styles.text}>Patrocinado</Text>
                    )}
                    <Text style={styles.title} numberOfLines={1}>{locationTitle}</Text>
                    <View style={styles.infoPlaceContainer}>
                        <StarReview
                            backgroundColor="transparent"
                            textColor={Colors.light.gold}
                            ratingValue={locationReviewScore}
                        />
                        <Text style={styles.text}>{distDisplay}</Text>
                        {flags.length > 0 && <MiddleDot size={4} color="#333" />}
                        {flags.map((tag, i) => (
                            <FlagColoredText
                                key={i}
                                text={tag}
                                backgroundColor={Colors.light.tint}
                                textColor={Colors.light.background}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.heartContainer}>
                    <HeartClicable
                        size={28}
                        startActivated={isFavorite(id, "establishment")}
                        activateAction={() => toggleFavorite(id, "establishment")}
                        deactivateAction={() => toggleFavorite(id, "establishment")}
                    ></HeartClicable>
                </View>
            </View>
        </TouchableOpacity>
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
