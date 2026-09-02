import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, ScrollView, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { useFilters, Restaurant } from '../context/FilterContext';
import { useUserLocation, Address } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { MapPin, Search, Star, Clock, Heart, SlidersHorizontal, ChevronDown, Check, ShoppingBag, Navigation } from 'lucide-react-native';

const CATEGORIES = ['All', 'Biryani', 'Pizza', 'Burgers', 'North Indian', 'Chinese', 'South Indian', 'Desserts'];

export const HomeScreen = ({ navigation }: { navigation: any }) => {
    const { 
        searchQuery, setSearchQuery, 
        activeCategory, setActiveCategory,
        isVegOnly, setIsVegOnly,
        isVeganFriendly, setIsVeganFriendly,
        isJainOptions, setIsJainOptions,
        isOpenNow, setIsOpenNow,
        minRating, setMinRating,
        sortBy, setSortBy,
        filteredRestaurants, isLoading, refreshData 
    } = useFilters();

    const { selectedLocation, addresses, selectLocation, isLoadingGps, useDeviceLocation } = useUserLocation();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { showToast } = useToast();
    const { cartItems, cartTotal } = useCart();
    const isCartNotEmpty = cartItems.length > 0;

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        refreshData();
        setRefreshing(false);
    };

    const handleRestaurantPress = (restaurant: Restaurant) => {
        navigation.navigate('RestaurantMenu', { restaurantId: restaurant.id, restaurantName: restaurant.name });
    };

    const renderRestaurantCard = ({ item }: { item: Restaurant }) => {
        const isFav = isFavorite(item.id);
        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => handleRestaurantPress(item)}
                activeOpacity={0.9}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                    {item.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.favoriteBtn} 
                        onPress={() => toggleFavorite(item)}
                    >
                        <Heart size={20} color={isFav ? '#FF4732' : '#FFFFFF'} fill={isFav ? '#FF4732' : 'transparent'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>

                    <Text style={styles.cuisinesText} numberOfLines={1}>
                        {item.cuisines.join(', ')}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={14} color="#6B7280" />
                            <Text style={styles.footerText}>{item.deliveryTime}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.costForTwo}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.distance}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header Address Bar */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.locationContainer} 
                    onPress={() => setIsAddressModalOpen(true)}
                >
                    <MapPin size={22} color="#FF4732" />
                    <View style={styles.locationTextWrapper}>
                        <Text style={styles.locationLabel}>
                            Deliver to <ChevronDown size={12} color="#4B5563" />
                            <Text style={styles.radiusPillText}> • Under 5km</Text>
                        </Text>
                        <Text style={styles.locationAddress} numberOfLines={1}>
                            {isLoadingGps ? 'Detecting device location...' : (selectedLocation ? selectedLocation.addressLine : 'Select Address')}
                        </Text>
                    </View>
                </TouchableOpacity>

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

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Search & Filters */}
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#9CA3AF" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search restaurants, cuisines..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                {/* Horizontal Filters Strip */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterStrip}
                >
                    <TouchableOpacity 
                        style={[styles.filterPill, sortBy !== 'Relevance' && styles.filterPillActive]}
                        onPress={() => setIsSortModalOpen(true)}
                    >
                        <SlidersHorizontal size={12} color={sortBy !== 'Relevance' ? '#FF4732' : '#4B5563'} style={{ marginRight: 4 }} />
                        <Text style={[styles.filterPillText, sortBy !== 'Relevance' && styles.filterPillTextActive]}>
                            Sort: {sortBy}
                        </Text>
                        <ChevronDown size={12} color={sortBy !== 'Relevance' ? '#FF4732' : '#4B5563'} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterPill, minRating === 4 && styles.filterPillActive]}
                        onPress={() => setMinRating(minRating === 4 ? 0 : 4)}
                    >
                        <Text style={[styles.filterPillText, minRating === 4 && styles.filterPillTextActive]}>
                            Rating 4.0+
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterPill, isVegOnly && styles.filterPillActive]}
                        onPress={() => setIsVegOnly(!isVegOnly)}
                    >
                        <Text style={[styles.filterPillText, isVegOnly && styles.filterPillTextActive]}>
                            Pure Veg
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterPill, isJainOptions && styles.filterPillActive]}
                        onPress={() => setIsJainOptions(!isJainOptions)}
                    >
                        <Text style={[styles.filterPillText, isJainOptions && styles.filterPillTextActive]}>
                            Jain Food
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterPill, isVeganFriendly && styles.filterPillActive]}
                        onPress={() => setIsVeganFriendly(!isVeganFriendly)}
                    >
                        <Text style={[styles.filterPillText, isVeganFriendly && styles.filterPillTextActive]}>
                            Vegan
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterPill, isOpenNow && styles.filterPillActive]}
                        onPress={() => setIsOpenNow(!isOpenNow)}
                    >
                        <Text style={[styles.filterPillText, isOpenNow && styles.filterPillTextActive]}>
                            Open Now
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Categories Slider */}
                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>What's on your mind?</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity 
                                key={cat}
                                style={[
                                    styles.categoryBadge,
                                    activeCategory === cat && styles.categoryBadgeActive
                                ]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    activeCategory === cat && styles.categoryTextActive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Restaurants List */}
                <View style={styles.restaurantsSection}>
                    <View style={styles.restaurantHeaderRow}>
                        <Text style={styles.sectionTitle}>Restaurants (Under 5 km)</Text>
                        <View style={styles.distanceBadgePill}>
                            <Text style={styles.distanceBadgeText}>Max 5 km radius</Text>
                        </View>
                    </View>
                    
                    {isLoading || isLoadingGps ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#FF4732" />
                            <Text style={styles.infoMessage}>Finding restaurants near your location...</Text>
                        </View>
                    ) : filteredRestaurants.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.infoMessage}>No restaurants found within 5 km of your location.</Text>
                            <TouchableOpacity 
                                style={styles.useGpsBtn} 
                                onPress={useDeviceLocation}
                            >
                                <Navigation size={16} color="white" />
                                <Text style={styles.useGpsBtnText}>Use Device GPS Location</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList 
                            data={filteredRestaurants}
                            renderItem={renderRestaurantCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Address Selection Modal */}
            <Modal 
                visible={isAddressModalOpen} 
                transparent 
                animationType="slide"
                onRequestClose={() => setIsAddressModalOpen(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsAddressModalOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Delivery Address</Text>
                        
                        {/* Device Current Location Action */}
                        <TouchableOpacity 
                            style={styles.currentGpsOption}
                            onPress={async () => {
                                await useDeviceLocation();
                                setIsAddressModalOpen(false);
                            }}
                        >
                            <View style={styles.currentGpsIconWrapper}>
                                <Navigation size={20} color="#FF4732" />
                            </View>
                            <View style={styles.currentGpsTextWrapper}>
                                <Text style={styles.currentGpsTitle}>Use Current Device Location</Text>
                                <Text style={styles.currentGpsSubtitle}>Detect GPS coordinates • Within 5 km radius</Text>
                            </View>
                            {isLoadingGps && <ActivityIndicator size="small" color="#FF4732" />}
                        </TouchableOpacity>
                        
                        <View style={styles.modalDivider} />

                        {addresses.length === 0 ? (
                            <Text style={styles.noAddressText}>No saved addresses found. You can add one in your Profile.</Text>
                        ) : (
                            <ScrollView style={styles.addressList}>
                                {addresses.map((addr) => (
                                    <TouchableOpacity 
                                        key={addr.id}
                                        style={[
                                            styles.addressItem,
                                            selectedLocation?.id === addr.id && styles.addressItemActive
                                        ]}
                                        onPress={() => {
                                            selectLocation(addr);
                                            setIsAddressModalOpen(false);
                                        }}
                                    >
                                        <MapPin size={18} color={selectedLocation?.id === addr.id ? '#FF4732' : '#6B7280'} />
                                        <View style={styles.addressTextContainer}>
                                            <Text style={styles.addressLabelText}>{addr.label}</Text>
                                            <Text style={styles.addressDetailText} numberOfLines={1}>{addr.addressLine}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity 
                            style={styles.modalCloseBtn}
                            onPress={() => setIsAddressModalOpen(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Sort Modal */}
            <Modal 
                visible={isSortModalOpen} 
                transparent 
                animationType="slide"
                onRequestClose={() => setIsSortModalOpen(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsSortModalOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Sort by</Text>
                            <TouchableOpacity onPress={() => setIsSortModalOpen(false)}>
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {['Relevance', 'Fastest Delivery', 'Low to high', 'High to low'].map((option) => (
                            <TouchableOpacity 
                                key={option} 
                                style={styles.sortOptionRow}
                                onPress={() => {
                                    setSortBy(option);
                                    setIsSortModalOpen(false);
                                }}
                            >
                                <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                                    {option}
                                </Text>
                                {sortBy === option && <Check size={18} color="#FF4732" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
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
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    locationTextWrapper: {
        marginLeft: 10,
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationAddress: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 2,
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginVertical: 16,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1F2937',
    },
    filterButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 48,
    },
    filterButtonActive: {
        backgroundColor: '#FFF0EF',
        borderColor: '#FF4732',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterButtonTextActive: {
        color: '#FF4732',
    },
    categoriesSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    categoriesList: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryBadge: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryBadgeActive: {
        backgroundColor: '#FF4732',
        borderColor: '#FF4732',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    restaurantsSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        height: 160,
        width: '100%',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: '#FF4732',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 8,
        borderRadius: 50,
    },
    cardInfo: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4732',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    cuisinesText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    dot: {
        marginHorizontal: 6,
        color: '#D1D5DB',
    },
    centerContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    infoMessage: {
        fontSize: 14,
        color: '#6B7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    noAddressText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 20,
    },
    addressList: {
        marginBottom: 16,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    addressItemActive: {
        borderBottomColor: '#10B981',
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    addressDetailText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    modalCloseBtn: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalCloseBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterStrip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: '#FFFFFF',
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    filterPillActive: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF0EF',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterPillTextActive: {
        color: '#FF4732',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalCloseText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF4732',
    },
    sortOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sortOptionText: {
        fontSize: 15,
        color: '#4B5563',
    },
    sortOptionTextActive: {
        color: '#FF4732',
        fontWeight: 'bold',
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
    radiusPillText: {
        fontSize: 11,
        color: '#FF4732',
        fontWeight: 'bold',
    },
    restaurantHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    distanceBadgePill: {
        backgroundColor: '#FFF0EF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 20,
    },
    distanceBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF4732',
    },
    useGpsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4732',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 14,
        gap: 8,
    },
    useGpsBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    currentGpsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0EF',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFD4D0',
        marginBottom: 12,
    },
    currentGpsIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    currentGpsTextWrapper: {
        flex: 1,
    },
    currentGpsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    currentGpsSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
    },
});
