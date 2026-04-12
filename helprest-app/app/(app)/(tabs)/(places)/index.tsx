/**
 * PlacesScreen — Discovery tab
 *
 * Three sections powered by the HelpRest API:
 *
 *   1. "para você"         → GET /api/establishments/recommended
 *      Personalised flag-match ranking + proximity score. Requires user location.
 *      Falls back to the paginated list when location is unavailable.
 *
 *   2. "novidades próximas" → sponsored establishments from the paginated list
 *      Filtered from the same cached response as section 3 (zero extra call).
 *
 *   3. "próximos de você"  → GET /api/establishments?page=1&limit=50
 *      Full paginated list. Distance is calculated client-side from user coords
 *      when available, otherwise shown as "—".
 *
 * Null-safety rules:
 *   - logo missing / empty → bundled placeholder
 *   - flags empty → no tag chips shown
 *   - rating === 0 → shown as "Novo"
 *   - distance unavailable → "—"
 *   - any string field → falls back to "—"
 */

import MiddleDot from "@/components/atoms/MiddleDot";
import Card from "@/components/ui/Card";
import CardHorizontal from "@/components/ui/CardHorizontal";
import { Colors } from "@/constants/Colors";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ImageSourcePropType,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import ImageRounded from "@/components/ui/ImageRounded";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/services/api";
import { loadUserProfile } from "@/storage/userProfile";
import { getCurrentPosition } from "@/services/location";

// ─── Fallback asset ────────────────────────────────────────────────────────────

const PLACEHOLDER_LOGO = require("@/assets/images/icon.png");

// ─── DTO types (mirror the API response from establishment use cases) ──────────

interface FlagDTO {
    id: string;
    tag: string;
    identifier: string;
    backgroundColor: string;
    textColor: string;
    images: { tag: string | null; pin: string | null };
}

interface EstablishmentDTO {
    id: string;
    companyName: string;
    location: {
        state: string;
        city: string;
        neighborhood: string;
        address: string;
        coordinates: { lat: number; lng: number };
    };
    flags: FlagDTO[];
    logo: string;
    rating: number;
    isSponsored: boolean;
}

interface EstablishmentsListResponse {
    data: EstablishmentDTO[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** Recommended endpoint adds distance fields to the base DTO */
interface RecommendedEstablishment extends EstablishmentDTO {
    score: number;
    flagMatchCount: number;
    distanceMeters: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Format metres → human-readable distance string */
function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

/** Haversine formula — approximate distance between two GPS coords (metres) */
function haversineMeters(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Resolve logo → ImageSourcePropType (URI or bundled placeholder) */
function logoSource(logo: string | null | undefined): ImageSourcePropType {
    return logo ? { uri: logo } : PLACEHOLDER_LOGO;
}

/** Format rating → display string */
function formatRating(rating: number): string {
    return rating > 0 ? rating.toFixed(1) : "Novo";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlacesScreen() {
    const router = useRouter();

    // ── User location (GPS → profile cache → null) ─────────────────────────
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

    const resolveLocation = useCallback(async () => {
        try {
            const gps = await getCurrentPosition();
            if (gps) {
                setUserCoords({ lat: gps.latitude, lng: gps.longitude });
                return;
            }
        } catch { /* GPS unavailable */ }

        const profile = loadUserProfile();
        if (profile?.location?.coordinates?.coordinates) {
            const [lng, lat] = profile.location.coordinates.coordinates as [number, number];
            setUserCoords({ lat, lng });
        }
    }, []);

    useEffect(() => { resolveLocation(); }, [resolveLocation]);

    // ── Query 1: full establishment list (shared cache with HomeScreen) ─────
    const {
        data: listData,
        isPending: listPending,
        error: listError,
    } = useQuery<EstablishmentsListResponse>({
        queryKey: ["places"],
        queryFn: async () => {
            const res = await api.get<EstablishmentsListResponse>(
                "/api/establishments?page=1&limit=50",
                { authenticated: true },
            );
            if (!res.ok) throw new Error("Falha ao carregar estabelecimentos");
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // ── Query 2: personalised recommendations (requires location) ──────────
    const {
        data: recommendedData,
        isPending: recommendedPending,
    } = useQuery<RecommendedEstablishment[]>({
        queryKey: ["places/recommended", userCoords?.lat, userCoords?.lng],
        queryFn: async () => {
            const res = await api.get<RecommendedEstablishment[]>(
                `/api/establishments/recommended?lat=${userCoords!.lat}&lng=${userCoords!.lng}&limit=10`,
                { authenticated: true },
            );
            if (!res.ok) throw new Error("Falha ao carregar recomendações");
            return res.data;
        },
        enabled: userCoords !== null,
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // ── Derived data ───────────────────────────────────────────────────────
    const allEstablishments: EstablishmentDTO[] = listData?.data ?? [];

    /** "para você" — recommended list when available, otherwise full list */
    const forYou: (EstablishmentDTO & { distanceMeters?: number })[] =
        recommendedData && recommendedData.length > 0
            ? recommendedData
            : allEstablishments.slice(0, 10);

    /** "novidades próximas" — sponsored establishments */
    const sponsored: EstablishmentDTO[] = allEstablishments.filter((e) => e.isSponsored);

    /** "próximos de você" — all establishments (with calculated distance) */
    const nearby = allEstablishments;

    // ── Navigate to detail ─────────────────────────────────────────────────
    function goToDetail(id: string) {
        router.push(`/(app)/details/${id}`);
    }

    // ── Loading state ──────────────────────────────────────────────────────
    if (listPending) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009C9D" />
                <Text style={styles.loadingText}>Carregando lugares...</Text>
            </SafeAreaView>
        );
    }

    if (listError) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Erro ao carregar</Text>
                <Text style={styles.errorDetail}>{(listError as Error).message}</Text>
            </SafeAreaView>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, paddingBottom: 0, marginBottom: 0 }}>
            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.container}
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                    bounces={false}
                    decelerationRate="normal"
                >
                    {/* ─── SECTION 1: Para você ─────────────────────────── */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>para você</Text>

                        {recommendedPending && userCoords !== null && (
                            <ActivityIndicator size="small" color="#009C9D" style={{ marginVertical: 8 }} />
                        )}

                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            overScrollMode="never"
                            bounces={false}
                            decelerationRate="normal"
                        >
                            <View style={[styles.horizontalContainer, styles.smallGap]}>
                                {forYou.map((place) => {
                                    const firstFlag = place.flags[0];
                                    // Prefer flag tag image → logo → placeholder
                                    const headerImgUri =
                                        firstFlag?.images?.tag || place.logo || null;
                                    const headerImg: ImageSourcePropType = headerImgUri
                                        ? { uri: headerImgUri }
                                        : PLACEHOLDER_LOGO;

                                    const distLabel =
                                        "distanceMeters" in place && typeof (place as RecommendedEstablishment).distanceMeters === "number"
                                            ? formatDistance((place as RecommendedEstablishment).distanceMeters)
                                            : userCoords && place.location?.coordinates?.lat != null
                                                ? formatDistance(haversineMeters(
                                                    userCoords.lat, userCoords.lng,
                                                    place.location.coordinates.lat,
                                                    place.location.coordinates.lng,
                                                ))
                                                : "—";

                                    return (
                                        <Card
                                            key={place.id}
                                            width={150}
                                            onPress={() => goToDetail(place.id)}
                                        >
                                            <Card.Header>
                                                <ImageRounded
                                                    imageSource={headerImg}
                                                    width={142}
                                                    height={142}
                                                    alt={place.companyName}
                                                />
                                            </Card.Header>

                                            <Card.Body direction="row">
                                                <Card.Header.Icon
                                                    source={logoSource(place.logo)}
                                                    size={32}
                                                    alt="logo"
                                                />
                                                <Card.Header.Title
                                                    title={place.companyName || "—"}
                                                />
                                            </Card.Body>

                                            <Card.Footer direction="row">
                                                <Card.Footer.Text text={distLabel} />
                                                {place.flags.length > 0 && (
                                                    <MiddleDot size={3} color="#333" />
                                                )}
                                                {place.flags.slice(0, 2).map((flag) => (
                                                    <Card.Footer.Flag
                                                        key={flag.id}
                                                        text={flag.tag.substring(0, 6)}
                                                        backgroundColor={flag.backgroundColor || Colors.light.tint}
                                                        textColor={flag.textColor || "white"}
                                                    />
                                                ))}
                                            </Card.Footer>
                                        </Card>
                                    );
                                })}

                                {forYou.length === 0 && (
                                    <Text style={styles.emptyText}>Nenhum lugar encontrado</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>

                    {/* ─── SECTION 2: Novidades próximas ────────────────── */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>novidades próximas</Text>
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            overScrollMode="never"
                            bounces={false}
                            decelerationRate="normal"
                        >
                            <View style={[styles.horizontalContainer, styles.smallGap]}>
                                {(sponsored.length > 0 ? sponsored : allEstablishments.slice(0, 6)).map((place) => {
                                    const firstFlag = place.flags[0];
                                    const headerImgUri = firstFlag?.images?.tag || place.logo || null;
                                    const headerImg: ImageSourcePropType = headerImgUri
                                        ? { uri: headerImgUri }
                                        : PLACEHOLDER_LOGO;

                                    return (
                                        <Card
                                            key={place.id}
                                            gap={1}
                                            width={88}
                                            maxWidth={88}
                                            onPress={() => goToDetail(place.id)}
                                        >
                                            <Card.Header>
                                                <Card.Header.Icon
                                                    source={headerImg}
                                                    size={88}
                                                    alt="cover"
                                                />
                                            </Card.Header>

                                            <Card.Body direction="row">
                                                <Card.Header.Title
                                                    title={place.companyName || "—"}
                                                    align="center"
                                                />
                                            </Card.Body>

                                            <Card.Footer>
                                                <Card.Footer.Text
                                                    text={place.isSponsored ? "Patrocinado" : formatRating(place.rating)}
                                                />
                                            </Card.Footer>
                                        </Card>
                                    );
                                })}

                                {allEstablishments.length === 0 && (
                                    <Text style={styles.emptyText}>Sem novidades no momento</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>

                    {/* ─── SECTION 3: Próximos de você ──────────────────── */}
                    <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
                        <Text style={styles.sectionTitle}>próximos de você</Text>

                        <View style={[styles.verticalContainer, styles.mediumGap]}>
                            {nearby.map((place) => {
                                const distLabel = userCoords && place.location?.coordinates?.lat != null
                                    ? formatDistance(haversineMeters(
                                        userCoords.lat, userCoords.lng,
                                        place.location.coordinates.lat,
                                        place.location.coordinates.lng,
                                    ))
                                    : null;

                                const rating = place.rating > 0 ? place.rating : 0;
                                const flagTags = place.flags.map((f) => f.tag);

                                return (
                                    <CardHorizontal
                                        key={place.id}
                                        id={place.id}
                                        icon={logoSource(place.logo)}
                                        locationTitle={place.companyName || "—"}
                                        locationVisibleTags={flagTags}
                                        locationDistanceLabel={distLabel}
                                        isLocationPromoted={place.isSponsored}
                                        locationReviewScore={rating}
                                        onPress={() => goToDetail(place.id)}
                                    />
                                );
                            })}

                            {nearby.length === 0 && (
                                <Text style={styles.emptyText}>Nenhum estabelecimento próximo</Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    sectionContainer: {
        marginTop: 18,
        marginHorizontal: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        textAlign: "left",
        fontSize: 20,
        fontFamily: "Roboto",
        textTransform: "uppercase",
        fontWeight: "bold",
        marginBottom: 8,
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
    smallGap: { gap: 8 },
    mediumGap: { gap: 10 },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#FFF",
    },
    errorText: { fontSize: 18, fontWeight: "bold", color: "#D32F2F", marginBottom: 8 },
    errorDetail: { fontSize: 14, color: "#666", textAlign: "center" },
    emptyText: { fontSize: 14, color: "#999", paddingVertical: 12 },
});
