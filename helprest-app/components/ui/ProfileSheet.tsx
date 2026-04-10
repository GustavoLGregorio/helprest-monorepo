import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Pressable,
    Animated,
    PanResponder,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { clearAll } from "@/storage/authTokens";
import { loadUserProfile, clearUserProfile, type CachedUserProfile } from "@/storage/userProfile";
import { signOutGoogle } from "@/services/auth";

interface FlagItem {
    id: string;
    tag: string;
    backgroundColor: string;
    textColor: string;
}

interface VisitsResponse {
    data: unknown[];
    pagination: { total: number };
}

/**
 * Self-contained profile sheet modal.
 * Manages its own visibility and fetches its own data.
 */
const ProfileSheet: React.FC = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [visible, setVisible] = useState(false);
    const [profile, setProfile] = useState<CachedUserProfile | null>(() => loadUserProfile());

    const panY = React.useRef(new Animated.Value(1000)).current;

    useEffect(() => {
        if (visible) {
            panY.setValue(1000);
            Animated.spring(panY, {
                toValue: 0,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) {
                    panY.setValue(gs.dy);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 120 || gs.vy > 1.2) {
                    setVisible(false);
                    setTimeout(() => panY.setValue(0), 300);
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    // Re-load cached profile when modal opens (catches updates)
    useEffect(() => {
        if (visible) {
            setProfile(loadUserProfile());
        }
    }, [visible]);

    // Fetch user flags details
    const { data: allFlags } = useQuery<FlagItem[]>({
        queryKey: ["flags"],
        queryFn: async () => {
            const response = await api.get<FlagItem[]>("/api/flags");
            if (!response.ok) return [];
            return response.data;
        },
        enabled: visible,
    });

    // Get user's active flags
    const activeFlags = (allFlags ?? []).filter(
        (flag) => profile?.flags?.includes(flag.id),
    );

    const handleLogout = async () => {
        setVisible(false);
        // Sign out of Google SDK (revokes cached session)
        await signOutGoogle();
        // Clear all local auth + profile data
        clearAll();
        clearUserProfile();
        // Clear react-query cache
        queryClient.clear();
        router.replace("/(auth)/home");
    };

    const profileInitials = profile?.name
        ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : "?";

    return (
        <>
            {/* Trigger button — profile photo circle */}
            <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8}>
                {profile?.profilePhoto ? (
                    <Image
                        source={{ uri: profile.profilePhoto }}
                        style={styles.triggerPhoto}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.triggerPhoto, styles.triggerInitials]}>
                        <Text style={styles.triggerInitialsText}>{profileInitials}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Bottom sheet modal */}
            <Modal
                visible={visible}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={() => setVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }] }]}>
                        {/* Drag zone */}
                        <View {...panResponder.panHandlers} style={styles.dragZone}>
                            <View style={styles.dragIndicator} />
                        </View>

                        {/* Profile header */}
                        <View style={styles.profileHeader}>
                            {profile?.profilePhoto ? (
                                <Image
                                    source={{ uri: profile.profilePhoto }}
                                    style={styles.profilePhoto}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[styles.profilePhoto, styles.profileInitials]}>
                                    <Text style={styles.profileInitialsText}>{profileInitials}</Text>
                                </View>
                            )}
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{profile?.name ?? "Usuário"}</Text>
                                <Text style={styles.profileEmail}>{profile?.email ?? ""}</Text>
                            </View>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Active flags */}
                            <Text style={styles.sectionTitle}>Restrições alimentares</Text>
                            {activeFlags.length > 0 ? (
                                <View style={styles.flagsContainer}>
                                    {activeFlags.map((flag) => (
                                        <View
                                            key={flag.id}
                                            style={[styles.flagChip, { backgroundColor: flag.backgroundColor }]}
                                        >
                                            <Text style={[styles.flagChipText, { color: flag.textColor }]}>
                                                {flag.tag}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>Nenhuma restrição selecionada</Text>
                            )}

                            {/* Location */}
                            {profile?.location && (
                                <>
                                    <Text style={styles.sectionTitle}>Localização padrão</Text>
                                    <Text style={styles.locationText}>
                                        {[profile.location.address, profile.location.city, profile.location.state]
                                            .filter(Boolean)
                                            .join(", ") || "Não definida"}
                                    </Text>
                                </>
                            )}

                            {/* Menu options */}
                            <View style={styles.menuSection}>
                                <MenuItem
                                    icon="account-outline"
                                    label="Meu Perfil"
                                    onPress={() => {
                                        setVisible(false);
                                        // TODO: navigate to profile edit screen
                                    }}
                                />
                                <MenuItem
                                    icon="cog-outline"
                                    label="Configurações"
                                    onPress={() => {
                                        setVisible(false);
                                        // TODO: navigate to settings
                                    }}
                                />
                                <MenuItem
                                    icon="logout"
                                    label="Sair"
                                    onPress={handleLogout}
                                    danger
                                />
                            </View>
                        </ScrollView>
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
};

// ─── Atoms ────────────────────────────────────────────

interface MenuItemProps {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    label: string;
    onPress: () => void;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <MaterialCommunityIcons
            name={icon}
            size={22}
            color={danger ? "#D32F2F" : "#333"}
        />
        <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>
            {label}
        </Text>
    </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
    // Trigger button
    triggerPhoto: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    triggerInitials: {
        backgroundColor: "#009C9D",
        justifyContent: "center",
        alignItems: "center",
    },
    triggerInitialsText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    // Overlay
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },

    // Sheet
    sheet: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
        maxHeight: "75%",
    },
    dragZone: {
        width: "100%",
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: "transparent",
    },
    dragIndicator: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E0E0E0",
        alignSelf: "center",
    },

    // Profile header
    profileHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    profilePhoto: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    profileInitials: {
        backgroundColor: "#009C9D",
        justifyContent: "center",
        alignItems: "center",
    },
    profileInitialsText: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "700",
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    profileEmail: {
        fontSize: 14,
        color: "#888",
        marginTop: 2,
    },

    // Content
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 16,
    },

    // Flags
    flagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    flagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    flagChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    emptyText: {
        fontSize: 14,
        color: "#AAA",
        fontStyle: "italic",
    },

    // Location
    locationText: {
        fontSize: 14,
        color: "#555",
    },

    // Menu
    menuSection: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        paddingTop: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
    },
    menuItemText: {
        fontSize: 16,
        color: "#333",
    },
    menuItemDanger: {
        color: "#D32F2F",
    },
});

export default ProfileSheet;
