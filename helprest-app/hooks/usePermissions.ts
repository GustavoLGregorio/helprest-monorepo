import { useState, useEffect, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export interface PermissionsStatus {
    locationForeground: boolean;
    locationBackground: boolean;
    notifications: boolean;
}

/**
 * Centralized hook for requesting and managing all app permissions.
 * Provides methods with rationale popups (Android best practice).
 */
export function usePermissions() {
    const [permissions, setPermissions] = useState<PermissionsStatus>({
        locationForeground: false,
        locationBackground: false,
        notifications: false,
    });
    const [isChecking, setIsChecking] = useState(true);

    // Check current status on mount
    useEffect(() => {
        checkAllPermissions();
    }, []);

    const checkAllPermissions = useCallback(async () => {
        setIsChecking(true);
        try {
            const [fgLocation, bgLocation, notif] = await Promise.all([
                Location.getForegroundPermissionsAsync(),
                Location.getBackgroundPermissionsAsync(),
                Notifications.getPermissionsAsync(),
            ]);

            setPermissions({
                locationForeground: fgLocation.status === "granted",
                locationBackground: bgLocation.status === "granted",
                notifications: notif.status === "granted",
            });
        } finally {
            setIsChecking(false);
        }
    }, []);

    /**
     * Request foreground location permission with rationale popup.
     * Returns true if granted.
     */
    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        if (existingStatus === "granted") {
            setPermissions((p) => ({ ...p, locationForeground: true }));
            return true;
        }

        // Show rationale before requesting
        return new Promise((resolve) => {
            Alert.alert(
                "Localização necessária",
                "O HelpRest precisa da sua localização para mostrar estabelecimentos próximos a você no mapa e registrar suas visitas.",
                [
                    {
                        text: "Não permitir",
                        style: "cancel",
                        onPress: () => resolve(false),
                    },
                    {
                        text: "Permitir",
                        onPress: async () => {
                            const { status } = await Location.requestForegroundPermissionsAsync();
                            const granted = status === "granted";
                            setPermissions((p) => ({ ...p, locationForeground: granted }));
                            if (!granted) {
                                showSettingsAlert("localização");
                            }
                            resolve(granted);
                        },
                    },
                ],
            );
        });
    }, []);

    /**
     * Request background location permission (requires foreground first).
     * Needed for proximity detection / visit tracking.
     */
    const requestBackgroundLocationPermission = useCallback(async (): Promise<boolean> => {
        // Foreground must be granted first
        if (!permissions.locationForeground) {
            const fgGranted = await requestLocationPermission();
            if (!fgGranted) return false;
        }

        const { status: existingStatus } = await Location.getBackgroundPermissionsAsync();
        if (existingStatus === "granted") {
            setPermissions((p) => ({ ...p, locationBackground: true }));
            return true;
        }

        return new Promise((resolve) => {
            Alert.alert(
                "Localização em segundo plano",
                "Para detectar quando você está próximo de um estabelecimento e registrar visitas automaticamente, o HelpRest precisa acessar sua localização mesmo em segundo plano.\n\nSelecione \"Permitir o tempo todo\" na próxima tela.",
                [
                    {
                        text: "Agora não",
                        style: "cancel",
                        onPress: () => resolve(false),
                    },
                    {
                        text: "Permitir",
                        onPress: async () => {
                            const { status } = await Location.requestBackgroundPermissionsAsync();
                            const granted = status === "granted";
                            setPermissions((p) => ({ ...p, locationBackground: granted }));
                            resolve(granted);
                        },
                    },
                ],
            );
        });
    }, [permissions.locationForeground, requestLocationPermission]);

    /**
     * Request notification permission with rationale popup.
     */
    const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === "granted") {
            setPermissions((p) => ({ ...p, notifications: true }));
            return true;
        }

        return new Promise((resolve) => {
            Alert.alert(
                "Notificações",
                "O HelpRest gostaria de enviar notificações sobre estabelecimentos próximos e atualizações importantes.",
                [
                    {
                        text: "Não permitir",
                        style: "cancel",
                        onPress: () => resolve(false),
                    },
                    {
                        text: "Permitir",
                        onPress: async () => {
                            const { status } = await Notifications.requestPermissionsAsync();
                            const granted = status === "granted";
                            setPermissions((p) => ({ ...p, notifications: granted }));
                            resolve(granted);
                        },
                    },
                ],
            );
        });
    }, []);

    return {
        permissions,
        isChecking,
        checkAllPermissions,
        requestLocationPermission,
        requestBackgroundLocationPermission,
        requestNotificationPermission,
    };
}

function showSettingsAlert(permissionName: string) {
    Alert.alert(
        "Permissão negada",
        `A permissão de ${permissionName} foi negada. Você pode habilitá-la nas configurações do dispositivo.`,
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Abrir configurações",
                onPress: () => Linking.openSettings(),
            },
        ],
    );
}
