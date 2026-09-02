import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Search as SearchIcon, Star, Clock, Utensils, ChevronRight, ShoppingBag } from 'lucide-react-native';
import { searchDishes, fetchRestaurants } from '../../data/api';
import { Restaurant } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useUserLocation } from '../context/LocationContext';
import { getFallbackImage } from '../../utils/imageUtils';
import { haversineKm } from '../../utils/distanceUtils';

const TRENDING_SEARCHES = ['Biryani', 'Pizza', 'Burgers', 'Paneer', 'Thali', 'Ice Cream', 'Momos', 'Noodles'];

export const SearchScreen = ({ navigation }: { navigation: any }) => {
    const { showToast } = useToast();
    const { cartItems, cartTotal } = useCart();
    const { selectedLocation } = useUserLocation();
    const isCartNotEmpty = cartItems.length > 0;
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'dishes' | 'restaurants'>('dishes');
    const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [dishResults, setDishResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch all restaurants once for local search
    useEffect(() => {
        const loadAllRestaurants = async () => {
            try {
                const data = await fetchRestaurants();
                setAllRestaurants(data);
            } catch (e) {
                console.error("Failed to load restaurants for search:", e);
            } finally {
                setInitialLoading(false);
            }
        };
        loadAllRestaurants();
    }, []);

    // Perform search on query change
    useEffect(() => {
        if (!query.trim()) {
            setDishResults([]);
            setFilteredRestaurants([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                if (activeTab === 'dishes') {
                    const results = await searchDishes(query);
                    setDishResults(results);
                } else {
                    const filtered = allRestaurants.filter(r => {
                        const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase()) ||
                            r.cuisines.some((c: string) => c.toLowerCase().includes(query.toLowerCase()));
                        if (!matchesQuery) return false;

                        if (selectedLocation?.latitude != null && selectedLocation?.longitude != null) {
                            const dist = (r.latitude != null && r.longitude != null)
                                ? haversineKm(selectedLocation.latitude, selectedLocation.longitude, r.latitude, r.longitude)
                                : parseFloat(r.distance);
                            return !isNaN(dist) ? dist <= 5.0 : true;
                        }
                        return true;
                    });
                    setFilteredRestaurants(filtered);
                }
            } catch (err) {
                console.error("Search failed:", err);
                showToast("Search failed. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query, activeTab, allRestaurants, selectedLocation]);

    const handleTrendingPress = (term: string) => {
        setQuery(term);
    };

    const handleDishPress = (restaurantId: string, restaurantName: string) => {
        navigation.navigate('RestaurantMenu', { restaurantId, restaurantName });
    };

    const renderDishItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity 
                style={styles.dishCard}
                onPress={() => handleDishPress(item.restaurantId, item.restaurantName)}
                activeOpacity={0.9}
            >
                <View style={styles.dishCardLeft}>
                    <View style={styles.typeBadgeRow}>
                        <View style={[styles.typeBadge, item.type === 'Veg' ? styles.typeVeg : styles.typeNonVeg]}>
                            <View style={[styles.typeBadgeDot, item.type === 'Veg' ? styles.typeVegDot : styles.typeNonVegDot]} />
                        </View>
                        <Text style={styles.dishCategoryText}>{item.category || 'Dish'}</Text>
                    </View>
                    <Text style={styles.dishName}>{item.name}</Text>
                    <Text style={styles.dishPrice}>₹{item.price}</Text>
                    {item.description ? (
                        <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <View style={styles.servedByRow}>
                        <Utensils size={12} color="#6B7280" />
                        <Text style={styles.servedByText} numberOfLines={1}>
                            From <Text style={styles.servedByBold}>{item.restaurantName || 'Restaurant'}</Text>
                        </Text>
                    </View>
                </View>
                <View style={styles.dishCardRight}>
                    <Image 
                        source={{ uri: item.imageUrl || getFallbackImage(item.name, item.category) }} 
                        style={styles.dishImage} 
                    />
                    <TouchableOpacity 
                        style={styles.viewMenuBtn}
                        onPress={() => handleDishPress(item.restaurantId, item.restaurantName)}
                    >
                        <Text style={styles.viewMenuBtnText}>ORDER</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderRestaurantItem = ({ item }: { item: Restaurant }) => {
        return (
            <TouchableOpacity 
                style={styles.restaurantCard}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id, restaurantName: item.name })}
                activeOpacity={0.9}
            >
                <Image source={{ uri: item.imageUrl }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantHeader}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={12} color="white" fill="white" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>
                    <Text style={styles.cuisineText} numberOfLines={1}>{item.cuisines.join(', ')}</Text>
                    <View style={styles.restaurantFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.footerText}>{item.deliveryTime}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.distance}</Text>
                    </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" style={styles.chevron} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Header */}
            <View style={styles.header}>
                <View style={styles.searchBarContainer}>
                    <SearchIcon size={20} color="#9CA3AF" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search for dishes, restaurants..."
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={true}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <TouchableOpacity 
                    style={styles.headerCartButton}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <ShoppingBag size={22} color="#1F2937" />
                    {cartItems.length > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>
                                {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Segmented Control / Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'dishes' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('dishes')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'dishes' && styles.tabButtonTextActive]}>
                        Dishes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'restaurants' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('restaurants')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'restaurants' && styles.tabButtonTextActive]}>
                        Restaurants
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            {initialLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF4732" />
                    <Text style={styles.loadingText}>Initializing search...</Text>
                </View>
            ) : !query.trim() ? (
                <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.emptyTitle}>What are you craving today?</Text>
                    <Text style={styles.emptySubtitle}>Search your favorite restaurant or dishes directly</Text>
                    
                    <Text style={styles.sectionTitle}>Trending Searches</Text>
                    <View style={styles.trendingGrid}>
                        {TRENDING_SEARCHES.map((term) => (
                            <TouchableOpacity 
                                key={term}
                                style={styles.trendingPill}
                                onPress={() => handleTrendingPress(term)}
                            >
                                <Text style={styles.trendingText}>{term}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF4732" />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : (activeTab === 'dishes' ? dishResults.length === 0 : filteredRestaurants.length === 0) ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.noResultsText}>No results found for "{query}"</Text>
                    <Text style={styles.noResultsSubtitle}>Try searching with different keywords</Text>
                </View>
            ) : (
                <FlatList 
                    data={activeTab === 'dishes' ? dishResults : filteredRestaurants}
                    renderItem={activeTab === 'dishes' ? renderDishItem : renderRestaurantItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        flex: 1,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#1F2937',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#FF4732',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabButtonTextActive: {
        color: '#FF4732',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    emptyContainer: {
        padding: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    trendingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    trendingPill: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    trendingText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4B5563',
    },
    noResultsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    noResultsSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 6,
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    dishCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    dishCardLeft: {
        flex: 1,
        paddingRight: 12,
    },
    typeBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    typeBadge: {
        width: 14,
        height: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
    },
    typeVeg: {
        borderColor: '#10B981',
    },
    typeNonVeg: {
        borderColor: '#EF4444',
    },
    typeBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    typeVegDot: {
        backgroundColor: '#10B981',
    },
    typeNonVegDot: {
        backgroundColor: '#EF4444',
    },
    dishCategoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    dishName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    dishPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 4,
    },
    dishDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        lineHeight: 16,
    },
    servedByRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 12,
    },
    servedByText: {
        fontSize: 12,
        color: '#6B7280',
    },
    servedByBold: {
        fontWeight: '600',
        color: '#4B5563',
    },
    dishCardRight: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dishImage: {
        width: 100,
        height: 100,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
    },
    viewMenuBtn: {
        position: 'absolute',
        bottom: -8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FF4732',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    viewMenuBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF4732',
        letterSpacing: 0.5,
    },
    restaurantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    restaurantImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    restaurantInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 6,
    },
    restaurantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restaurantName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4732',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    ratingText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cuisineText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    restaurantFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    footerText: {
        fontSize: 11,
        color: '#6B7280',
    },
    dot: {
        marginHorizontal: 4,
        color: '#D1D5DB',
    },
    chevron: {
        marginRight: 4,
    },
    headerCartButton: {
        position: 'relative',
        padding: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FF4732',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
});
