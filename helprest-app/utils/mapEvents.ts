import { DeviceEventEmitter } from "react-native";

export const MAP_RECENTER_EVENT = "MAP_RECENTER";

/**
 * Emit event to re-center the map to current user position.
 */
export function emitMapRecenter(): void {
    DeviceEventEmitter.emit(MAP_RECENTER_EVENT);
}

/**
 * Subscribe to map re-center events.
 * Returns an unsubscribe function.
 */
export function onMapRecenter(callback: () => void): () => void {
    const subscription = DeviceEventEmitter.addListener(MAP_RECENTER_EVENT, callback);
    return () => subscription.remove();
}
