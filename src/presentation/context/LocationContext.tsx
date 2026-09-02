import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { getAddresses, isTokenValid, reverseGeocode } from '../../data/api';
import { getCurrentPositionWithFallback } from '../../utils/geolocation';

export interface Address {
    id: string;
    label: string;
    addressLine: string;
    landmark: string | null;
    isDefault: boolean;
    latitude: number;
    longitude: number;
    pincode?: string;
    city?: string;
}

interface LocationContextType {
    addresses: Address[];
    selectedLocation: Address | null;
    isLoadingAddresses: boolean;
    isLoadingGps: boolean;
    selectLocation: (address: Address) => void;
    refreshAddresses: () => Promise<void>;
    clearLocationData: () => void;
    useDeviceLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Address | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [isLoadingGps, setIsLoadingGps] = useState(false);
    const { showToast } = useToast();
    
    const selectedLocationRef = React.useRef<Address | null>(null);

    // Function to fetch current device GPS location and reverse-geocode address
    const useDeviceLocation = useCallback(async (): Promise<void> => {
        setIsLoadingGps(true);
        return new Promise((resolve) => {
            getCurrentPositionWithFallback(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    let addressLine = 'Using device GPS location';
                    let city = '';

                    try {
                        const geo = await reverseGeocode(latitude, longitude);
                        if (geo) {
                            if (geo.addressLine) addressLine = geo.addressLine;
                            if (geo.city) city = geo.city;
                        }
                    } catch (err) {
                        console.warn("Reverse geocode failed:", err);
                    }

                    const currentLoc: Address = {
                        id: 'current-location',
                        label: 'Current Location',
                        addressLine: addressLine,
                        landmark: null,
                        isDefault: false,
                        latitude,
                        longitude,
                        city
                    };

                    setSelectedLocation(currentLoc);
                    selectedLocationRef.current = currentLoc;
                    localStorage.setItem('selected_location', JSON.stringify(currentLoc));
                    sessionStorage.setItem('location_asked', 'true');
                    setIsLoadingGps(false);
                    showToast("Using device's current location", "success");
                    resolve();
                },
                (error, message) => {
                    console.warn("GPS location error:", error);
                    setIsLoadingGps(false);
                    showToast(message || "Unable to detect device location", "error");
                    resolve();
                },
                { timeout: 8000 }
            );
        });
    }, [showToast]);

    // Initial load from local storage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('selected_location');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSelectedLocation(parsed);
                selectedLocationRef.current = parsed;
            } else {
                // Fetch device location automatically on first load if none saved
                useDeviceLocation();
            }
        } catch (e) {
            console.error('Failed to load selected location from storage', e);
            useDeviceLocation();
        }
    }, [useDeviceLocation]);

    const refreshAddresses = useCallback(async () => {
        if (!isTokenValid()) {
            setAddresses([]);
            try {
                const saved = localStorage.getItem('selected_location');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setSelectedLocation(parsed);
                    selectedLocationRef.current = parsed;
                } else {
                    if (!selectedLocationRef.current) {
                        useDeviceLocation();
                    }
                }
            } catch (e) {
                if (!selectedLocationRef.current) {
                    useDeviceLocation();
                }
            }
            return;
        }

        setIsLoadingAddresses(true);
        try {
            const data = await getAddresses();
            const addrList = data || [];
            setAddresses(addrList);
            
            if (addrList.length > 0) {
                const currentSelection = selectedLocationRef.current;
                if (currentSelection) {
                    const stillExists = addrList.find(a => a.id === currentSelection.id);
                    if (stillExists) {
                        setSelectedLocation(stillExists);
                        selectedLocationRef.current = stillExists;
                        return;
                    } else if (currentSelection.id === 'current-location') {
                        // Preserve current GPS location if user chose it
                        return;
                    }
                }
                
                const defaultAdd = addrList.find(a => a.isDefault) || addrList[0];
                setSelectedLocation(defaultAdd);
                selectedLocationRef.current = defaultAdd;
                localStorage.setItem('selected_location', JSON.stringify(defaultAdd));
            } else {
                // Keep current GPS location if no database addresses exist
                if (selectedLocationRef.current?.id !== 'current-location') {
                    useDeviceLocation();
                }
            }
        } catch (e) {
            console.error("Failed to fetch addresses:", e);
        } finally {
            setIsLoadingAddresses(false);
        }
    }, [useDeviceLocation]);

    // Sync on token/login changes
    useEffect(() => {
        refreshAddresses();
    }, [refreshAddresses]);

    const selectLocation = (address: Address) => {
        if (
            selectedLocationRef.current &&
            selectedLocationRef.current.latitude === address.latitude &&
            selectedLocationRef.current.longitude === address.longitude &&
            selectedLocationRef.current.id === address.id
        ) {
            return;
        }
        selectedLocationRef.current = address;
        setSelectedLocation(address);
        localStorage.setItem('selected_location', JSON.stringify(address));
        showToast(`Delivery address: ${address.label}`, "success");
    };

    const clearLocationData = () => {
        setAddresses([]);
        setSelectedLocation(null);
        selectedLocationRef.current = null;
        localStorage.removeItem('selected_location');
    };

    return (
        <LocationContext.Provider value={{
            addresses,
            selectedLocation,
            isLoadingAddresses,
            isLoadingGps,
            selectLocation,
            refreshAddresses,
            clearLocationData,
            useDeviceLocation
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useUserLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useUserLocation must be used within a LocationProvider');
    }
    return context;
};

