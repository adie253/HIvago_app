import React, { createContext, useContext, useState, useMemo } from 'react';
import { useRestaurants } from '../../hooks/useRestaurants';
import { RestaurantFilters, RestaurantListItem, RestaurantSort } from '../../types/api';
import { useUserLocation } from './LocationContext';
import { getFallbackImage } from '../../utils/imageUtils';
import { formatDistance, haversineKm } from '../../utils/distanceUtils';

export interface FoodItem {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
    isVeg: boolean;
    category: string;
    restaurantId?: string;
    restaurantName?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    cuisines: string[];
    rating: number;
    deliveryTime: string;
    distance: string;
    costForTwo: string;
    imageUrl: string;
    promoted?: boolean;
    discount?: string;
    isVeg: boolean;
    categories: string[];
    acceptsPickup: boolean;
    isAcceptingOrders: boolean;
    menu: any[];
    addressLine?: string;
    latitude?: number;
    longitude?: number;
    pincode?: string;
    city?: string;
    phone?: string;
}

interface FilterContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    isVegOnly: boolean;
    setIsVegOnly: (value: boolean) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    isVeganFriendly: boolean;
    setIsVeganFriendly: (value: boolean) => void;
    isJainOptions: boolean;
    setIsJainOptions: (value: boolean) => void;
    isOpenNow: boolean;
    setIsOpenNow: (value: boolean) => void;
    maxPrepTime: number | null;
    setMaxPrepTime: (time: number | null) => void;
    priceRange: [number, number] | null;
    setPriceRange: (range: [number, number] | null) => void;
    fulfillmentType: 'Delivery' | 'Pickup' | 'Both';
    setFulfillmentType: (type: 'Delivery' | 'Pickup' | 'Both') => void;
    isNewlyAdded: boolean;
    setIsNewlyAdded: (value: boolean) => void;
    minRating: number;
    setMinRating: (value: number) => void;
    isPopular: boolean;
    setIsPopular: (value: boolean) => void;
    filteredRestaurants: Restaurant[];
    allRestaurants: Restaurant[];
    totalCount: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    isLoading: boolean;
    error: any;
    refreshData: () => void;
    isLocationRequired: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { selectedLocation } = useUserLocation();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isVegOnly, setIsVegOnly] = useState(false);
    const [isVeganFriendly, setIsVeganFriendly] = useState(false);
    const [isJainOptions, setIsJainOptions] = useState(false);
    const [isOpenNow, setIsOpenNow] = useState(false);
    const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
    const [fulfillmentType, setFulfillmentType] = useState<'Delivery' | 'Pickup' | 'Both'>('Both');
    const [sortBy, setSortBy] = useState('Relevance');
    const [isNewlyAdded, setIsNewlyAdded] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [isPopular, setIsPopular] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const mapSortValue = (uiSort: string): RestaurantSort | undefined => {
        if (isNewlyAdded) return 'newest';
        switch (uiSort) {
            case 'Low to high': return 'cost_asc';
            case 'High to low': return 'cost_desc';
            case 'Fastest Delivery': return 'prep_time';
            case 'Relevance': return searchQuery ? 'relevance' : undefined;
            default: return undefined;
        }
    };

    const filters: RestaurantFilters = useMemo(() => ({
        lat: selectedLocation?.latitude ?? undefined,
        lng: selectedLocation?.longitude ?? undefined,
        radiusKm: 5,
        search: searchQuery || undefined,
        cuisines: activeCategory !== 'All' ? [activeCategory] : undefined,
        pureVeg: isVegOnly || undefined,
        veganFriendly: isVeganFriendly || undefined,
        jainOptions: isJainOptions || undefined,
        hasJainOptions: isJainOptions || undefined,
        isVeganFriendly: isVeganFriendly || undefined,
        isPureVeg: isVegOnly || undefined,
        openNow: isOpenNow || undefined,
        maxPrepTimeMins: maxPrepTime || undefined,
        minPrice: priceRange?.[0],
        maxPrice: priceRange?.[1],
        supportsPickup: fulfillmentType === 'Pickup' ? true : undefined,
        acceptsPickup: fulfillmentType === 'Pickup' ? true : undefined,
        isAcceptingOrders: true,
        sort: mapSortValue(sortBy),
        page: currentPage,
        pageSize: pageSize
    }), [
        selectedLocation, 
        searchQuery, 
        activeCategory, 
        isVegOnly, 
        isVeganFriendly, 
        isJainOptions, 
        isOpenNow, 
        maxPrepTime, 
        priceRange, 
        fulfillmentType, 
        sortBy, 
        currentPage, 
        pageSize
    ]);

    const { data, isLoading, error, refetch } = useRestaurants(filters);

    const filteredRestaurants: Restaurant[] = useMemo(() => {
        if (!data?.items) return [];
        return data.items
            .filter((item: RestaurantListItem) => {
                if (!item.isAcceptingOrders) return false;
                
                // Strictly filter restaurants within 5km radius of user location
                if (selectedLocation?.latitude != null && selectedLocation?.longitude != null) {
                    const dist = (item.latitude != null && item.longitude != null)
                        ? haversineKm(selectedLocation.latitude, selectedLocation.longitude, item.latitude, item.longitude)
                        : (item.distanceKm ?? Infinity);
                    return dist <= 5.0;
                }
                
                if (item.distanceKm != null) {
                    return item.distanceKm <= 5.0;
                }
                
                return false;
            })
            .map((item: RestaurantListItem) => {
                const dist = (selectedLocation?.latitude != null && selectedLocation?.longitude != null && item.latitude != null && item.longitude != null)
                    ? haversineKm(selectedLocation.latitude, selectedLocation.longitude, item.latitude, item.longitude)
                    : item.distanceKm;

                return {
                    id: item.id,
                    name: item.name,
                    cuisines: item.cuisineTypes.length > 0 ? item.cuisineTypes : ["Multi-cuisine"],
                    rating: 4.2,
                    deliveryTime: `${item.avgPrepTimeMins}-${item.avgPrepTimeMins + 10} min`,
                    distance: dist != null ? formatDistance(dist) : "-- km",
                    costForTwo: `₹${item.minOrderAmount > 0 ? item.minOrderAmount * 2 : 150}`,
                    imageUrl: (item.logoUrl && item.logoUrl !== 'null' && item.logoUrl !== 'undefined' && !item.logoUrl.includes('example.com'))
                        ? item.logoUrl
                        : getFallbackImage(item.name, item.cuisineTypes[0] || 'General', 'restaurant'),
                    promoted: false,
                    discount: dist != null && dist < 3 ? "FREE Delivery" : undefined,
                    isVeg: item.isPureVeg,
                    categories: item.cuisineTypes.length > 0 ? item.cuisineTypes : ["Multi-cuisine"],
                    acceptsPickup: item.acceptsPickup,
                    isAcceptingOrders: item.isAcceptingOrders,
                    menu: [],
                    addressLine: item.addressLine,
                    latitude: item.latitude,
                    longitude: item.longitude
                };
            });
    }, [data, selectedLocation]);

    const totalCount = data?.totalCount || 0;
    const isLocationRequired = !selectedLocation?.latitude || !selectedLocation?.longitude;

    return (
        <FilterContext.Provider value={{
            searchQuery,
            setSearchQuery,
            activeCategory,
            setActiveCategory,
            isVegOnly,
            setIsVegOnly,
            isVeganFriendly,
            setIsVeganFriendly,
            isJainOptions,
            setIsJainOptions,
            isOpenNow,
            setIsOpenNow,
            maxPrepTime,
            setMaxPrepTime,
            priceRange,
            setPriceRange,
            fulfillmentType,
            setFulfillmentType,
            sortBy,
            setSortBy,
            isNewlyAdded,
            setIsNewlyAdded,
            minRating,
            setMinRating,
            isPopular,
            setIsPopular,
            filteredRestaurants,
            allRestaurants: filteredRestaurants,
            totalCount,
            currentPage,
            setCurrentPage,
            pageSize,
            setPageSize,
            isLoading,
            error,
            refreshData: refetch,
            isLocationRequired
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
