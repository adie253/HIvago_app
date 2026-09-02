import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, ScrollView, RefreshControl, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useFilters, Restaurant } from '../context/FilterContext';
import { useUserLocation, Address } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { MapPin, Search, Star, Clock, Heart, SlidersHorizontal, ChevronDown, Check, ShoppingBag, Navigation, Home, Menu, Mic, X, User, Package, LogOut, Smartphone, Truck } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const BANNERS = [
    {
        id: '1',
        titleHighlight: 'Fast',
        titleRest: 'Food\nDelivery',
        subtitle: 'Order from the best local restaurants with easy on-demand delivery',
        image: require('../../assets/banners/banner1.png'),
        badgeText: 'FAST FOOD',
        bgColor: '#FFF5F4'
    },
    {
        id: '2',
        titleHighlight: 'Up to 50%',
        titleRest: 'OFF',
        subtitle: 'Special offers & discounts on top rated local dishes',
        image: require('../../assets/banners/banner2.png'),
        badgeText: 'HOT DEAL',
        bgColor: '#FFFBEB'
    },
    {
        id: '3',
        titleHighlight: 'Super Fast',
        titleRest: 'Delivery',
        subtitle: 'Hot & fresh meals delivered right to your doorstep under 30 mins',
        image: require('../../assets/banners/banner3.png'),
        badgeText: 'EXPRESS',
        bgColor: '#F0FDF4'
    }
];

const CATEGORIES_DATA = [
    { id: 'All', name: 'All', icon: '🍽️' },
    { id: 'Burgers', name: 'Burgers', icon: '🍔' },
    { id: 'Pizza', name: 'Pizza', icon: '🍕' },
    { id: 'Sushi', name: 'Sushi', icon: '🍣' },
    { id: 'Tacos', name: 'Tacos', icon: '🌮' },
    { id: 'North Indian', name: 'North Indian', icon: '🍲' },
    { id: 'Chinese', name: 'Chinese', icon: '🍜' },
    { id: 'Desserts', name: 'Desserts', icon: '🍦' },
];

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
    const { cartItems, cartTotal, isLoggedIn, refreshLoginStatus } = useCart();

    const handleLogout = () => {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('customer_token');
            localStorage.removeItem('customer_refresh_token');
            localStorage.removeItem('customer_token_expires_at');
            localStorage.removeItem('customer_phone');
            localStorage.removeItem('customer_id');
            localStorage.removeItem('customer_name');
        }
        refreshLoginStatus();
    };

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Banner Slideshow state & auto-advance timer
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const bannerScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % BANNERS.length;
                bannerScrollRef.current?.scrollTo({
                    x: nextIndex * BANNER_WIDTH,
                    animated: true,
                });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    const onBannerScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / BANNER_WIDTH);
        if (index >= 0 && index < BANNERS.length && index !== activeBannerIndex) {
            setActiveBannerIndex(index);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        refreshData();
        setRefreshing(false);
    };

    const handleRestaurantPress = (restaurant: Restaurant) => {
        navigation.navigate('RestaurantMenu', { restaurantId: restaurant.id, restaurantName: restaurant.name });
    };

    // 1. Popular Restaurants (sorted by rating descending)
    const popularRestaurants = useMemo(() => {
        return [...filteredRestaurants].sort((a, b) => b.rating - a.rating);
    }, [filteredRestaurants]);

    // 2. Nearby Restaurants (sorted by distance ascending)
    const nearbyRestaurants = useMemo(() => {
        return [...filteredRestaurants].sort((a, b) => {
            const distA = parseFloat(a.distance) || 99;
            const distB = parseFloat(b.distance) || 99;
            return distA - distB;
        });
    }, [filteredRestaurants]);

    // 3. Recommended Restaurants (promoted, high ratings, or custom fallback order)
    const recommendedRestaurants = useMemo(() => {
        const discounted = filteredRestaurants.filter(r => r.discount || r.promoted);
        const nonDiscounted = filteredRestaurants.filter(r => !r.discount && !r.promoted);
        return [...discounted, ...nonDiscounted];
    }, [filteredRestaurants]);

    // Card Renderer for Horizontally Scrollable Restaurant Lists
    const renderHorizontalRestaurantCard = ({ item }: { item: Restaurant }) => {
        const isFav = isFavorite(item.id);
        return (
            <TouchableOpacity 
                style={styles.horizontalCard} 
                onPress={() => handleRestaurantPress(item)}
                activeOpacity={0.9}
            >
                <View style={styles.horizontalImageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                    {item.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                    )}
                    {item.acceptsPickup && (
                        <View style={styles.pickupBadge}>
                            <Text style={styles.pickupBadgeText}>PICKUP</Text>
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.favoriteBtn} 
                        onPress={() => toggleFavorite(item)}
                    >
                        <Heart size={16} color={isFav ? '#A81C1C' : '#6B7280'} fill={isFav ? '#A81C1C' : 'transparent'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.horizontalCardInfo}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>

                    <Text style={styles.cuisinesText} numberOfLines={1}>
                        {item.cuisines.join(', ')}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.footerText}>{item.deliveryTime}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.distance}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.costForTwo}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Red Brand Header */}
            <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>HIVAGO</Text>
                
                <View style={styles.brandHeaderRight}>
                    <TouchableOpacity 
                        style={styles.headerIconButton}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <ShoppingBag size={22} color="#FFFFFF" />
                        {cartItems.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.headerIconButton}
                        onPress={() => setIsMenuDrawerOpen(true)}
                    >
                        <Menu size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Your Location Sub-header Bar */}
            <View style={styles.locationSubHeader}>
                <TouchableOpacity 
                    style={styles.locationSubContainer} 
                    onPress={() => setIsAddressModalOpen(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.homeIconContainer}>
                        <Home size={18} color="#A81C1C" />
                    </View>
                    <View style={styles.locationTextColumn}>
                        <Text style={styles.yourLocationLabel}>Your Location</Text>
                        <View style={styles.locationNameRow}>
                            <Text style={styles.locationNameText} numberOfLines={1}>
                                {isLoadingGps 
                                    ? 'Detecting location...' 
                                    : (selectedLocation ? selectedLocation.label || 'Home' : 'Home')}
                            </Text>
                            <ChevronDown size={14} color="#4B5563" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.under5kmTag}>
                    <Text style={styles.under5kmText}>Under 5km</Text>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Banner Slideshow Carousel */}
                <View style={styles.bannerContainer}>
                    <ScrollView
                        ref={bannerScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={onBannerScroll}
                        contentContainerStyle={styles.bannerScrollContent}
                    >
                        {BANNERS.map((banner) => (
                            <View key={banner.id} style={[styles.bannerCard, { backgroundColor: banner.bgColor }]}>
                                <View style={styles.bannerTextSection}>
                                    <Text style={styles.bannerTitle}>
                                        <Text style={styles.bannerTitleHighlight}>{banner.titleHighlight} </Text>
                                        <Text style={styles.bannerTitleRest}>{banner.titleRest}</Text>
                                    </Text>
                                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                </View>
                                <View style={styles.bannerImageSection}>
                                    <Image source={banner.image} style={styles.bannerImage} resizeMode="contain" />
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Banner Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        {BANNERS.map((_, idx) => (
                            <View 
                                key={idx} 
                                style={[
                                    styles.paginationDot, 
                                    idx === activeBannerIndex && styles.paginationDotActive
                                ]} 
                            />
                        ))}
                    </View>
                </View>

                {/* Search Bar + VEG Switch Row */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Search size={18} color="#A81C1C" style={{ marginRight: 8 }} />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search for food, restaurants..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                        <View style={styles.searchDivider} />
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                            <Mic size={18} color="#A81C1C" />
                        </TouchableOpacity>
                    </View>

                    {/* VEG Toggle Switch */}
                    <View style={styles.vegContainer}>
                        <Text style={styles.vegLabel}>VEG</Text>
                        <TouchableOpacity 
                            style={[styles.vegSwitchTrack, isVegOnly && styles.vegSwitchTrackActive]}
                            onPress={() => setIsVegOnly(!isVegOnly)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.vegSwitchThumb, isVegOnly && styles.vegSwitchThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Pills Strip */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterStrip}
                >
                    <TouchableOpacity 
                        style={[styles.filterPill, sortBy !== 'Relevance' && styles.filterPillActive]}
                        onPress={() => setIsSortModalOpen(true)}
                    >
                        <SlidersHorizontal size={12} color={sortBy !== 'Relevance' ? '#A81C1C' : '#4B5563'} style={{ marginRight: 4 }} />
                        <Text style={[styles.filterPillText, sortBy !== 'Relevance' && styles.filterPillTextActive]}>
                            Sort: {sortBy}
                        </Text>
                        <ChevronDown size={12} color={sortBy !== 'Relevance' ? '#A81C1C' : '#4B5563'} style={{ marginLeft: 2 }} />
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

                {/* Categories Cards Row */}
                <View style={styles.categoriesSection}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    >
                        {CATEGORIES_DATA.map((cat) => {
                            const isSelected = activeCategory === cat.name;
                            return (
                                <TouchableOpacity 
                                    key={cat.id}
                                    style={[
                                        styles.categoryCard,
                                        isSelected && styles.categoryCardActive
                                    ]}
                                    onPress={() => setActiveCategory(cat.name)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleActive]}>
                                        <Text style={styles.categoryIconEmoji}>{cat.icon}</Text>
                                    </View>
                                    <Text style={[
                                        styles.categoryText,
                                        isSelected && styles.categoryTextActive
                                    ]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Loading / Empty States */}
                {isLoading || isLoadingGps ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#A81C1C" />
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
                    <>
                        {/* Section 1: Popular Restaurants */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>🔥 Popular Restaurants</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text style={styles.viewAllText}>View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList 
                                data={popularRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `pop-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalListContent}
                            />
                        </View>

                        {/* Section 2: Nearby Restaurants */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>📍 Nearby Restaurants</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text style={styles.viewAllText}>View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList 
                                data={nearbyRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `near-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalListContent}
                            />
                        </View>

                        {/* Section 3: Recommended for You */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>⭐ Recommended for You</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text style={styles.viewAllText}>View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList 
                                data={recommendedRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `rec-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalListContent}
                            />
                        </View>

                        {/* Delivery Feature & Info Section */}
                        <View style={styles.deliveryFeatureSection}>
                            {/* Circular Delivery Hero Illustration */}
                            <View style={styles.heroImageWrapper}>
                                <Image 
                                    source={require('../../assets/delivery_hero.png')} 
                                    style={styles.deliveryHeroImg}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Section Headline */}
                            <View style={styles.featureHeadlineWrapper}>
                                <Text style={styles.featureTitleDark}>Your order is delivered</Text>
                                <Text style={styles.featureTitleAccent}>quickly</Text>
                                <Text style={styles.featureSubtitle}>
                                    Enjoy your food in a warm state will increase appetite
                                </Text>
                            </View>

                            {/* 3 Feature Cards List */}
                            <View style={styles.featureCardsContainer}>
                                {/* Card 1 */}
                                <View style={styles.featureCard}>
                                    <View style={styles.featureIconBox}>
                                        <Smartphone size={24} color="#FF5722" />
                                    </View>
                                    <View style={styles.featureCardTextCol}>
                                        <Text style={styles.featureCardTitle}>Order from anywhere</Text>
                                        <Text style={styles.featureCardDesc}>Order food anywhere easily via smartphone</Text>
                                    </View>
                                </View>

                                {/* Card 2 */}
                                <View style={styles.featureCard}>
                                    <View style={styles.featureIconBox}>
                                        <Truck size={24} color="#FF5722" />
                                    </View>
                                    <View style={styles.featureCardTextCol}>
                                        <Text style={styles.featureCardTitle}>Fast delivery</Text>
                                        <Text style={styles.featureCardDesc}>Delivered by professional courier and on time place</Text>
                                    </View>
                                </View>

                                {/* Card 3 */}
                                <View style={styles.featureCard}>
                                    <View style={styles.featureIconBox}>
                                        <Clock size={24} color="#FF5722" />
                                    </View>
                                    <View style={styles.featureCardTextCol}>
                                        <Text style={styles.featureCardTitle}>Receive on time</Text>
                                        <Text style={styles.featureCardDesc}>Receive your food while it is still warm</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Red Footer Strip */}
                        <View style={styles.bottomBrandFooter} />
                    </>
                )}
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
                                <Navigation size={20} color="#A81C1C" />
                            </View>
                            <View style={styles.currentGpsTextWrapper}>
                                <Text style={styles.currentGpsTitle}>Use Current Device Location</Text>
                                <Text style={styles.currentGpsSubtitle}>Detect GPS coordinates • Within 5 km radius</Text>
                            </View>
                            {isLoadingGps && <ActivityIndicator size="small" color="#A81C1C" />}
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
                                        <MapPin size={18} color={selectedLocation?.id === addr.id ? '#A81C1C' : '#6B7280'} />
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
                                {sortBy === option && <Check size={18} color="#A81C1C" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Side Drawer Menu Modal */}
            <Modal
                visible={isMenuDrawerOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMenuDrawerOpen(false)}
            >
                <TouchableOpacity 
                    style={styles.drawerOverlay}
                    activeOpacity={1}
                    onPress={() => setIsMenuDrawerOpen(false)}
                >
                    <View style={styles.drawerContent}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerBrandTitle}>HIVAGO</Text>
                            <TouchableOpacity onPress={() => setIsMenuDrawerOpen(false)}>
                                <X size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.drawerList}>
                            <TouchableOpacity 
                                style={styles.drawerItem}
                                onPress={() => {
                                    setIsMenuDrawerOpen(false);
                                    navigation.navigate('Profile');
                                }}
                            >
                                <User size={20} color="#4B5563" />
                                <Text style={styles.drawerItemText}>My Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.drawerItem}
                                onPress={() => {
                                    setIsMenuDrawerOpen(false);
                                    navigation.navigate('OrdersList');
                                }}
                            >
                                <Package size={20} color="#4B5563" />
                                <Text style={styles.drawerItemText}>My Orders</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.drawerItem}
                                onPress={() => {
                                    setIsMenuDrawerOpen(false);
                                    navigation.navigate('Cart');
                                }}
                            >
                                <ShoppingBag size={20} color="#4B5563" />
                                <Text style={styles.drawerItemText}>Cart</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.drawerItem}
                                onPress={() => {
                                    setIsMenuDrawerOpen(false);
                                    setIsAddressModalOpen(true);
                                }}
                            >
                                <MapPin size={20} color="#4B5563" />
                                <Text style={styles.drawerItemText}>Saved Addresses</Text>
                            </TouchableOpacity>

                            {isLoggedIn ? (
                                <TouchableOpacity 
                                    style={[styles.drawerItem, { marginTop: 20 }]}
                                    onPress={() => {
                                        setIsMenuDrawerOpen(false);
                                        handleLogout();
                                        showToast("Logged out", "success");
                                    }}
                                >
                                    <LogOut size={20} color="#EF4444" />
                                    <Text style={[styles.drawerItemText, { color: '#EF4444', fontWeight: 'bold' }]}>Logout</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.drawerItem, { marginTop: 20 }]}
                                    onPress={() => {
                                        setIsMenuDrawerOpen(false);
                                        navigation.navigate('SignIn');
                                    }}
                                >
                                    <User size={20} color="#A81C1C" />
                                    <Text style={[styles.drawerItemText, { color: '#A81C1C', fontWeight: 'bold' }]}>Log In / Sign Up</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    brandHeader: {
        backgroundColor: '#A81C1C',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 46,
        paddingBottom: 14,
        paddingHorizontal: 20,
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    brandHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIconButton: {
        position: 'relative',
        padding: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -4,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#A81C1C',
        fontSize: 10,
        fontWeight: 'bold',
    },
    locationSubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    locationSubContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    homeIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFF0EF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    locationTextColumn: {
        flex: 1,
    },
    yourLocationLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    locationNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 1,
    },
    locationNameText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    under5kmTag: {
        backgroundColor: '#FFF0EF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD4D0',
    },
    under5kmText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#A81C1C',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bannerContainer: {
        marginVertical: 14,
        paddingHorizontal: 16,
    },
    bannerScrollContent: {
        gap: 16,
    },
    bannerCard: {
        width: BANNER_WIDTH,
        height: 160,
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    bannerTextSection: {
        flex: 1,
        paddingRight: 12,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 26,
    },
    bannerTitleHighlight: {
        color: '#FF5722',
    },
    bannerTitleRest: {
        color: '#1F2937',
    },
    bannerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        lineHeight: 16,
    },
    bannerImageSection: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    paginationDotActive: {
        width: 22,
        backgroundColor: '#A81C1C',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#1F2937',
    },
    searchDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 10,
    },
    vegContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    vegLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 3,
    },
    vegSwitchTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        padding: 2,
        justifyContent: 'center',
    },
    vegSwitchTrackActive: {
        backgroundColor: '#10B981',
    },
    vegSwitchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    vegSwitchThumbActive: {
        alignSelf: 'flex-end',
    },
    filterStrip: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    filterPillActive: {
        borderColor: '#A81C1C',
        backgroundColor: '#FFF0EF',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterPillTextActive: {
        color: '#A81C1C',
    },
    categoriesSection: {
        marginBottom: 20,
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    categoryCard: {
        width: 78,
        height: 86,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    categoryCardActive: {
        borderColor: '#A81C1C',
        backgroundColor: '#FFF0EF',
        borderWidth: 1.5,
    },
    categoryIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryIconCircleActive: {
        backgroundColor: 'transparent',
    },
    categoryIconEmoji: {
        fontSize: 24,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
    },
    categoryTextActive: {
        color: '#A81C1C',
        fontWeight: 'bold',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#A81C1C',
    },
    horizontalListContent: {
        paddingHorizontal: 16,
        gap: 14,
    },
    horizontalCard: {
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    horizontalImageContainer: {
        height: 135,
        width: '100%',
        position: 'relative',
        backgroundColor: '#A81C1C',
    },
    horizontalCardInfo: {
        padding: 14,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: '#A81C1C',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pickupBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    pickupBadgeText: {
        color: '#A81C1C',
        fontSize: 9,
        fontWeight: '900',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        padding: 7,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restaurantName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 6,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 2,
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    cuisinesText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    footerText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    dot: {
        marginHorizontal: 4,
        color: '#D1D5DB',
    },
    centerContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    infoMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    useGpsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A81C1C',
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
        maxHeight: '65%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
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
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalCloseText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A81C1C',
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
        color: '#A81C1C',
        fontWeight: 'bold',
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    drawerContent: {
        width: '80%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        padding: 24,
        paddingTop: 50,
        alignSelf: 'flex-start',
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
    },
    drawerBrandTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#A81C1C',
        fontStyle: 'italic',
    },
    drawerList: {
        flex: 1,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        gap: 14,
    },
    drawerItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    deliveryFeatureSection: {
        marginTop: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    heroImageWrapper: {
        width: 270,
        height: 270,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    deliveryHeroImg: {
        width: '100%',
        height: '100%',
    },
    featureHeadlineWrapper: {
        alignItems: 'flex-start',
        width: '100%',
        marginVertical: 14,
        paddingHorizontal: 4,
    },
    featureTitleDark: {
        fontSize: 28,
        fontWeight: '400',
        color: '#0F172A',
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    featureTitleAccent: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF5722',
        lineHeight: 38,
        marginTop: 2,
    },
    featureSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 10,
        lineHeight: 20,
        maxWidth: '90%',
    },
    featureCardsContainer: {
        width: '100%',
        marginTop: 14,
        gap: 16,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    featureIconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#FFF0ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureCardTextCol: {
        flex: 1,
    },
    featureCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    featureCardDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 17,
    },
    bottomBrandFooter: {
        height: 50,
        backgroundColor: '#A81C1C',
        marginTop: 36,
        width: '100%',
    },
});
