import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Search as SearchIcon, Star, Clock, Utensils, ArrowLeft, X, Mic, RotateCcw } from 'lucide-react-native';
import { searchDishes, fetchRestaurants } from '../../data/api';
import { Restaurant } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useUserLocation } from '../context/LocationContext';
import { getFallbackImage } from '../../utils/imageUtils';
import { haversineKm } from '../../utils/distanceUtils';
import { RestaurantCard } from '../components/RestaurantCard';

const RECENT_SEARCHES = ['Biryani', 'Cafe Good Luck', 'Vohuman Cafe'];

export const SearchScreen = ({ navigation }: { navigation: any }) => {
    const { showToast } = useToast();
    const { selectedLocation } = useUserLocation();
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

    const handleRecentSearchPress = (term: string) => {
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
            <RestaurantCard
                restaurant={item}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id, restaurantName: item.name })}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Navigation Header */}
            <View style={styles.topHeader}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={20} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Search for dishes & restaurants</Text>

                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <X size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Red Outlined Search Input Bar */}
            <View style={styles.searchBoxSection}>
                <View style={styles.redSearchContainer}>
                    <SearchIcon size={20} color="#FF4732" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Try Pizza"
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={true}
                    />
                    <View style={styles.verticalDivider} />
                    <TouchableOpacity activeOpacity={0.7}>
                        <Mic size={20} color="#FF4732" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Body */}
            {!query.trim() ? (
                <View style={styles.recentSection}>
                    <Text style={styles.sectionHeaderTitle}>RECENTLY SEARCHED RESTAURANTS</Text>
                    
                    <View style={styles.chipsRow}>
                        {RECENT_SEARCHES.map((term) => (
                            <TouchableOpacity 
                                key={term}
                                style={styles.recentChip}
                                onPress={() => handleRecentSearchPress(term)}
                                activeOpacity={0.8}
                            >
                                <RotateCcw size={14} color="#64748B" />
                                <Text style={styles.recentChipText}>{term}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : (
                <>
                    {/* Tab Navigation for Results */}
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

                    {loading ? (
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
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 12,
    },
    searchBoxSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    redSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FF4732',
        borderRadius: 18,
        paddingHorizontal: 14,
        height: 50,
        backgroundColor: '#FFFFFF',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '500',
    },
    verticalDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    recentSection: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    sectionHeaderTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.6,
        marginBottom: 14,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    recentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    recentChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
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
        paddingVertical: 12,
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
        padding: 16,
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
});
