import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_LOCATION_TASK = "HELPREST_BACKGROUND_LOCATION";

export interface LocationCoords {
    latitude: number;
    longitude: number;
}

type LocationCallback = (coords: LocationCoords) => void;

let watchSubscription: Location.LocationSubscription | null = null;
let locationListeners: LocationCallback[] = [];

/**
 * Subscribe to location updates.
 * Returns an unsubscribe function.
 */
export function onLocationUpdate(callback: LocationCallback): () => void {
    locationListeners.push(callback);
    return () => {
        locationListeners = locationListeners.filter((cb) => cb !== callback);
    };
}

function notifyListeners(coords: LocationCoords) {
    locationListeners.forEach((cb) => cb(coords));
}

/**
 * Start foreground location watching with high accuracy.
 * Updates are emitted to all subscribed listeners.
 */
export async function startForegroundTracking(): Promise<void> {
    if (watchSubscription) return; // Already tracking

    watchSubscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,      // at most every 5 seconds
            distanceInterval: 10,    // or every 10 meters
        },
        (location) => {
            notifyListeners({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        },
    );
}

/**
 * Stop foreground location tracking.
 */
export function stopForegroundTracking(): void {
    if (watchSubscription) {
        watchSubscription.remove();
        watchSubscription = null;
    }
}

/**
 * Start background location tracking using TaskManager.
 * Requires background location permission.
 */
export async function startBackgroundTracking(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) return;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000,      // every 30 seconds
        distanceInterval: 50,     // or every 50 meters
        deferredUpdatesInterval: 30000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: "HelpRest",
            notificationBody: "Rastreando sua localização para encontrar estabelecimentos",
            notificationColor: "#009C9D",
        },
    });
}

/**
 * Stop background location tracking.
 */
export async function stopBackgroundTracking(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
}

/**
 * Get the current position once (high accuracy).
 * Returns null if location cannot be determined.
 */
export async function getCurrentPosition(): Promise<LocationCoords | null> {
    try {
        const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        return {
            latitude: coords.latitude,
            longitude: coords.longitude,
        };
    } catch {
        return null;
    }
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula).
 */
export function distanceBetween(a: LocationCoords, b: LocationCoords): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
        sinDLat * sinDLat +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ─── Background Task Definition ─────────────────────────────────
// This must be at module level (outside any component)

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
    if (error) {
        console.error("Background location error:", error.message);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations.length > 0) {
            const latest = locations[locations.length - 1];
            notifyListeners({
                latitude: latest.coords.latitude,
                longitude: latest.coords.longitude,
            });
        }
    }
});
