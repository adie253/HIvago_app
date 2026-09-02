import React, { createContext, useContext, ReactNode } from 'react';

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export const GoogleMapsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <GoogleMapsContext.Provider value={{ isLoaded: true, loadError: undefined }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export const useGoogleMaps = () => {
    const context = useContext(GoogleMapsContext);
    if (context === undefined) {
        throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
    }
    return context;
};
