import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { Restaurant } from './FilterContext';

interface FavoritesContextType {
    favorites: Restaurant[];
    toggleFavorite: (restaurant: Restaurant) => void;
    isFavorite: (restaurantId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const STORAGE_KEY = 'hivago_favorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Restaurant[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) setFavorites(JSON.parse(data));
        } catch (error) {
            console.error('Failed to load favorites', error);
        }
    }, []);

    const toggleFavorite = useCallback((restaurant: Restaurant) => {
        setFavorites((prev) => {
            const isFav = prev.some((r) => r.id === restaurant.id);
            const newFavorites = isFav
                ? prev.filter((r) => r.id !== restaurant.id)
                : [...prev, restaurant];

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
                if (isFav) {
                    showToast(`Removed ${restaurant.name} from favorites`, "info");
                } else {
                    showToast(`Added ${restaurant.name} to favorites`, "success");
                }
            } catch (error) {
                console.error('Failed to save favorites', error);
            }
            return newFavorites;
        });
    }, [showToast]);

    const isFavorite = useCallback((restaurantId: string) => {
        return favorites.some((r) => r.id === restaurantId);
    }, [favorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
