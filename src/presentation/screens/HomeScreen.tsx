import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, ScrollView, RefreshControl, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useFilters, Restaurant } from '../context/FilterContext';
import { useUserLocation, Address } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { MapPin, Search, Star, Clock, Heart, SlidersHorizontal, ChevronDown, Check, ShoppingBag, Navigation, Home, Menu, Mic, X, User, Package, LogOut, Smartphone, Truck, Linkedin, Instagram, Twitter, Youtube, Facebook, Mail, Phone, Fullscreen } from 'lucide-react-native';
import { FooterLogoSvg } from '../components/FooterLogoSvg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH;
const BANNER_ASPECT_RATIO = 252 / 372;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * BANNER_ASPECT_RATIO);
const BANNER_STEP = SCREEN_WIDTH;

const BANNERS = [
    { id: '1', image: require('../../assets/banners/banner1.png') },
    { id: '2', image: require('../../assets/banners/banner2.png') },
    { id: '3', image: require('../../assets/banners/banner1.png') },
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
                    x: nextIndex * BANNER_STEP,
                    animated: true,
                });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    const onBannerScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / BANNER_STEP);
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
        <View className="flex-1 bg-white">
            {/* Top Red Brand Header */}
            <View className="bg-[#A81C1C] pt-12 pb-3.5 px-4 flex-row justify-between items-center">
                <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
                    <FooterLogoSvg width={110} height={30} />
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center relative"
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <ShoppingBag size={22} color="#FFFFFF" />
                        {cartItems.length > 0 && (
                            <View className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-4.5 h-4.5 items-center justify-center">
                                <Text className="text-[#A81C1C] text-[10px] font-black">
                                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                        onPress={() => setIsMenuDrawerOpen(true)}
                    >
                        <Menu size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Your Location Sub-header Bar */}
            <View className="flex-row justify-between items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <TouchableOpacity
                    className="flex-row items-center gap-2.5 flex-1"
                    onPress={() => setIsAddressModalOpen(true)}
                    activeOpacity={0.7}
                >
                    <View className="w-8 h-8 rounded-full bg-[#FFF0EF] items-center justify-center">
                        <Home size={18} color="#A81C1C" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-gray-400">Your Location</Text>
                        <View className="flex-row items-center">
                            <Text className="text-xs font-bold text-gray-800" numberOfLines={1}>
                                {isLoadingGps
                                    ? 'Detecting location...'
                                    : (selectedLocation ? selectedLocation.label || 'Home' : 'Home')}
                            </Text>
                            <ChevronDown size={14} color="#4B5563" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </TouchableOpacity>

                <View className="bg-[#FFF0EF] px-2.5 py-1 rounded-full border border-[#FFD4D0]">
                    <Text className="text-[11px] font-bold text-[#A81C1C]">Under 5km</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Banner Slideshow Carousel */}
                <View className="my-3.5 w-full">
                    <ScrollView
                        ref={bannerScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={onBannerScroll}
                    >
                        {BANNERS.map((banner) => (
                            <TouchableOpacity
                                key={banner.id}
                                className="bg-[#F9F9F9] justify-center items-center overflow-hidden"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                                onPress={() => navigation.navigate('Restaurants')}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={banner.image}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Banner Pagination Dots */}
                    <View className="flex-row justify-center items-center mt-2.5 gap-1.5">
                        {BANNERS.map((_, idx) => (
                            <View
                                key={idx}
                                className={`h-2 rounded-full transition-all ${
                                    idx === activeBannerIndex ? 'w-5.5 bg-[#A81C1C]' : 'w-2 bg-gray-200'
                                }`}
                            />
                        ))}
                    </View>
                </View>

                {/* Search Bar + VEG Switch Row */}
                <View className="flex-row items-center px-4 mb-3 gap-3">
                    <View className="flex-1 flex-row items-center bg-gray-50 rounded-xl px-3.5 h-12 border border-gray-200">
                        <Search size={18} color="#A81C1C" style={{ marginRight: 8 }} />
                        <TextInput
                            className="flex-1 text-xs text-gray-800"
                            placeholder="Search for food, restaurants..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                        <View className="w-px h-5 bg-gray-200 mx-2.5" />
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                            <Mic size={18} color="#A81C1C" />
                        </TouchableOpacity>
                    </View>

                    {/* VEG Toggle Switch */}
                    <View className="items-center justify-center">
                        <Text className="text-[10px] font-bold text-gray-700 mb-0.5">VEG</Text>
                        <TouchableOpacity
                            className={`w-11 h-6 rounded-full p-0.5 justify-center ${
                                isVegOnly ? 'bg-emerald-500' : 'bg-gray-200'
                            }`}
                            onPress={() => setIsVegOnly(!isVegOnly)}
                            activeOpacity={0.8}
                        >
                            <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                                isVegOnly ? 'self-end' : 'self-start'
                            }`} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Pills Strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
                >
                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                            sortBy !== 'Relevance' ? 'border-[#A81C1C] bg-[#FFF0EF]' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setIsSortModalOpen(true)}
                    >
                        <SlidersHorizontal size={12} color={sortBy !== 'Relevance' ? '#A81C1C' : '#4B5563'} style={{ marginRight: 4 }} />
                        <Text className={`text-xs font-semibold ${sortBy !== 'Relevance' ? 'text-[#A81C1C]' : 'text-gray-600'}`}>
                            Sort: {sortBy}
                        </Text>
                        <ChevronDown size={12} color={sortBy !== 'Relevance' ? '#A81C1C' : '#4B5563'} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                            minRating === 4 ? 'border-[#A81C1C] bg-[#FFF0EF]' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setMinRating(minRating === 4 ? 0 : 4)}
                    >
                        <Text className={`text-xs font-semibold ${minRating === 4 ? 'text-[#A81C1C]' : 'text-gray-600'}`}>
                            Rating 4.0+
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                            isJainOptions ? 'border-[#A81C1C] bg-[#FFF0EF]' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setIsJainOptions(!isJainOptions)}
                    >
                        <Text className={`text-xs font-semibold ${isJainOptions ? 'text-[#A81C1C]' : 'text-gray-600'}`}>
                            Jain Food
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                            isVeganFriendly ? 'border-[#A81C1C] bg-[#FFF0EF]' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setIsVeganFriendly(!isVeganFriendly)}
                    >
                        <Text className={`text-xs font-semibold ${isVeganFriendly ? 'text-[#A81C1C]' : 'text-gray-600'}`}>
                            Vegan
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                            isOpenNow ? 'border-[#A81C1C] bg-[#FFF0EF]' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setIsOpenNow(!isOpenNow)}
                    >
                        <Text className={`text-xs font-semibold ${isOpenNow ? 'text-[#A81C1C]' : 'text-gray-600'}`}>
                            Open Now
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Categories Cards Row */}
                <View className="mb-5">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    >
                        {CATEGORIES_DATA.map((cat) => {
                            const isSelected = activeCategory === cat.name;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    className={`w-[78px] h-[86px] rounded-2xl justify-center items-center p-1.5 border ${
                                        isSelected
                                            ? 'border-[#A81C1C] bg-[#FFF0EF] border-[1.5px]'
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                    onPress={() => setActiveCategory(cat.name)}
                                    activeOpacity={0.8}
                                >
                                    <View className="w-11 h-11 rounded-full justify-center items-center mb-1">
                                        <Text className="text-2xl">{cat.icon}</Text>
                                    </View>
                                    <Text className={`text-[11px] font-semibold text-center ${
                                        isSelected ? 'text-[#A81C1C] font-bold' : 'text-gray-600'
                                    }`}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Loading / Empty States */}
                {isLoading || isLoadingGps ? (
                    <View className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#A81C1C" />
                        <Text className="text-sm text-gray-500 text-center mt-3">Finding restaurants near your location...</Text>
                    </View>
                ) : filteredRestaurants.length === 0 ? (
                    <View className="py-10 items-center justify-center px-4">
                        <Text className="text-sm text-gray-500 text-center">No restaurants found within 5 km of your location.</Text>
                        <TouchableOpacity
                            className="flex-row items-center bg-[#A81C1C] px-4 py-2.5 rounded-full mt-3.5 gap-2"
                            onPress={useDeviceLocation}
                        >
                            <Navigation size={16} color="white" />
                            <Text className="text-white text-xs font-bold">Use Device GPS Location</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Section 1: Popular Restaurants */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center px-4 mb-3">
                                <Text className="text-lg font-bold text-gray-900">Popular Restaurants</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text className="text-xs font-bold text-[#A81C1C]">View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={popularRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `pop-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
                            />
                        </View>

                        {/* Section 2: Nearby Restaurants */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center px-4 mb-3">
                                <Text className="text-lg font-bold text-gray-900">Nearby Restaurants</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text className="text-xs font-bold text-[#A81C1C]">View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={nearbyRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `near-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
                            />
                        </View>

                        {/* Section 3: Recommended for You */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center px-4 mb-3">
                                <Text className="text-lg font-bold text-gray-900">Recommended for You</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text className="text-xs font-bold text-[#A81C1C]">View All &gt;</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={recommendedRestaurants}
                                renderItem={renderHorizontalRestaurantCard}
                                keyExtractor={(item) => `rec-${item.id}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
                            />
                        </View>

                        {/* Delivery Feature & Info Section */}
                        <View className="mt-5 px-5 items-center">
                            {/* Circular Delivery Hero Illustration */}
                            <View className="w-full h-[300px] items-center justify-center my-2">
                                <Image
                                    source={require('../../assets/delivery_section/delivery_boy.png')}
                                    style={{ width: 300, height: 300 }}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Section Headline */}
                            <View className="items-start w-full my-3.5 px-1">
                                <Text className="text-2xl font-normal text-slate-900 leading-8 tracking-tight">Your order is delivered</Text>
                                <Text className="text-3xl font-bold text-[#FF5722] leading-9 mt-0.5">quickly</Text>
                                <Text className="text-sm text-slate-500 mt-2.5 leading-5 max-w-[90%]">
                                    Enjoy your food in a warm state will increase appetite
                                </Text>
                            </View>

                            {/* 3 Feature Cards List */}
                            <View className="w-full mt-3.5 gap-4">
                                {/* Card 1 */}
                                <View className="flex-row items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                    <View className="w-15 h-15 rounded-2xl bg-[#FFF0ED] items-center justify-center mr-4">
                                        <Smartphone size={24} color="#FF5722" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-slate-900 mb-1">Order from anywhere</Text>
                                        <Text className="text-xs text-slate-500 leading-4">Order food anywhere easily via smartphone</Text>
                                    </View>
                                </View>

                                {/* Card 2 */}
                                <View className="flex-row items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                    <View className="w-15 h-15 rounded-2xl bg-[#FFF0ED] items-center justify-center mr-4">
                                        <Truck size={24} color="#FF5722" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-slate-900 mb-1">Fast delivery</Text>
                                        <Text className="text-xs text-slate-500 leading-4">Delivered by professional courier and on time place</Text>
                                    </View>
                                </View>

                                {/* Card 3 */}
                                <View className="flex-row items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                    <View className="w-15 h-15 rounded-2xl bg-[#FFF0ED] items-center justify-center mr-4">
                                        <Clock size={24} color="#FF5722" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-slate-900 mb-1">Receive on time</Text>
                                        <Text className="text-xs text-slate-500 leading-4">Receive your food while it is still warm</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Full Red Hivago App Footer */}
                        <View className="bg-[#A81C1C] mt-9 px-5 pt-9 pb-10 w-full">
                            {/* Brand White Logo */}
                            <TouchableOpacity className="mb-7" onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
                                <FooterLogoSvg width={136} height={36} />
                            </TouchableOpacity>

                            {/* 2-Column Footer Grid */}
                            <View className="flex-row justify-between mb-7">
                                {/* Column 1 */}
                                <View className="flex-1">
                                    <Text className="text-xs font-black text-white tracking-widest mb-3">ABOUT HIVAGO</Text>
                                    <TouchableOpacity className="py-1" onPress={() => navigation.navigate('About')}>
                                        <Text className="text-xs text-white/90 font-medium">Who We Are</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="py-1" onPress={() => navigation.navigate('About')}>
                                        <Text className="text-xs text-white/90 font-medium">Contact Us</Text>
                                    </TouchableOpacity>

                                    <View className="h-6" />

                                    <Text className="text-xs font-black text-white tracking-widest mb-3">FOR RESTAURANTS</Text>
                                    <TouchableOpacity className="py-1" onPress={() => showToast("Partner With Us", "info")}>
                                        <Text className="text-xs text-white/90 font-medium">Partner With Us</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Column 2 */}
                                <View className="flex-1">
                                    <Text className="text-xs font-black text-white tracking-widest mb-3">HIVAGOVERSE</Text>
                                    <TouchableOpacity className="py-1" onPress={() => navigation.navigate('RestaurantsList')}>
                                        <Text className="text-xs text-white/90 font-medium">Explore All</Text>
                                    </TouchableOpacity>

                                    <View className="h-11" />

                                    <Text className="text-xs font-black text-white tracking-widest mb-3">LEARN MORE</Text>
                                    <TouchableOpacity className="py-1" onPress={() => navigation.navigate('Privacy')}>
                                        <Text className="text-xs text-white/90 font-medium">Privacy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="py-1" onPress={() => showToast("Refund Policy", "info")}>
                                        <Text className="text-xs text-white/90 font-medium">Refund Policy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="py-1" onPress={() => showToast("Terms", "info")}>
                                        <Text className="text-xs text-white/90 font-medium">Terms</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Social Links Section */}
                            <View className="mb-6">
                                <Text className="text-xs font-black text-white tracking-widest mb-3">SOCIAL LINKS</Text>
                                <View className="flex-row gap-3 mt-1">
                                    <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center" onPress={() => showToast("LinkedIn", "info")}>
                                        <Linkedin size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center" onPress={() => showToast("Instagram", "info")}>
                                        <Instagram size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center" onPress={() => showToast("Twitter", "info")}>
                                        <Twitter size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center" onPress={() => showToast("YouTube", "info")}>
                                        <Youtube size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="w-9 h-9 rounded-full bg-white/15 items-center justify-center" onPress={() => showToast("Facebook", "info")}>
                                        <Facebook size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Contact Details Section */}
                            <View className="mt-2 mb-6 gap-3">
                                <View className="flex-row items-center">
                                    <MapPin size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                                    <Text className="text-sm font-bold text-white">Airoli, Mumbai</Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Mail size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                                    <Text className="text-xs text-white/90">info@hivago.in</Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Phone size={18} color="#FFFFFF" style={{ marginRight: 10, marginTop: 2 }} />
                                    <View>
                                        <Text className="text-sm font-bold text-white">Help & Support</Text>
                                        <Text className="text-[11px] text-white/75 mt-0.5">+91 9082220155</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Divider Line */}
                            <View className="h-px bg-white/20 my-5" />

                            {/* Legal Disclaimer */}
                            <Text className="text-[11px] text-white/70 leading-4 mb-4">
                                By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. 2026 © Hivago™ Ltd. All rights reserved.
                            </Text>

                            {/* Version Tag */}
                            <Text className="text-[11px] text-white/50 font-semibold">v1.0.0</Text>
                        </View>
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
        height: BANNER_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    bannerImageFull: {
        width: '100%',
        height: '100%',
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
    footerContainer: {
        backgroundColor: '#A81C1C',
        marginTop: 36,
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 40,
        width: '100%',
    },
    footerLogoText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        fontStyle: 'italic',
        letterSpacing: 2,
        marginBottom: 28,
    },
    footerGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    footerColumn: {
        flex: 1,
    },
    footerSectionHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    footerLinkTouch: {
        paddingVertical: 5,
    },
    footerLinkText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
    },
    socialLinksSection: {
        marginBottom: 24,
    },
    socialIconsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    socialCircleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactBlock: {
        marginTop: 8,
        marginBottom: 24,
        gap: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactBoldText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    contactRegularText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    contactSubText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.75)',
        marginTop: 1,
    },
    footerDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginVertical: 20,
    },
    legalDisclaimerText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 16,
        marginBottom: 16,
    },
    versionTagText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
});
