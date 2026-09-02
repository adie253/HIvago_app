import * as Location from 'expo-location';

export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export const getCurrentPositionWithFallback = (
    onSuccess: (position: any) => void,
    onError: (error: any, message: string) => void,
    options?: GeolocationOptions
) => {
    (async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                onError(
                    { code: 1, message: "Permission Denied" },
                    "Location access is required to show nearby restaurants. Please enable location services in your device settings."
                );
                return;
            }

            // High accuracy first
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            onSuccess({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
                timestamp: position.timestamp,
            });
        } catch (e: any) {
            console.warn("Native Geolocation failed", e);
            onError(
                { code: 2, message: e.message || "Position Unavailable" },
                "Unable to detect your location. Please check your GPS settings and try again."
            );
        }
    })();
};

export const isMobileDevice = (): boolean => {
    return true; // We are in React Native, so it's always a mobile device
};
