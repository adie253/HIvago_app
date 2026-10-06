import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Dimensions, TextInput } from 'react-native';
import { fetchRestaurantById, fetchItemDetails, ApiItem, ApiOptionGroupOption } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Heart, Star, Clock, MapPin, Search, Mic, ShoppingBag, Bike, User } from 'lucide-react-native';
import { getFallbackImage } from '../../utils/imageUtils';

export const RestaurantMenuScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { restaurantId, restaurantName } = route.params;
    const { addToCart, cartItems, cartTotal } = useCart();
    const { showToast } = useToast();
    const { toggleFavorite, isFavorite } = useFavorites();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fulfillmentMode, setFulfillmentMode] = useState<'Delivery' | 'Pickup'>('Delivery');
    const [menuSearchQuery, setMenuSearchQuery] = useState('');
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

    // Customization State
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<ApiItem | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isVegOnly, setIsVegOnly] = useState(false);

    const isFav = isFavorite(restaurantId);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchRestaurantById(restaurantId);
                setRestaurant(data);
            } catch (e) {
                console.error("Failed to load restaurant:", e);
                showToast("Failed to load restaurant menu", "error");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [restaurantId]);

    const handleAddItemPress = async (item: any) => {
        setLoadingDetails(true);
        try {
            const details = await fetchItemDetails(item.id);
            if (details && details.optionGroups && details.optionGroups.length > 0) {
                setSelectedItemDetails(details);
                setSelectedAddons([]);
                setIsCustomModalOpen(true);
            } else {
                addToCart({
                    id: item.id,
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    isVeg: item.type === 'Veg',
                    isAddon: false,
                    selectedAddons: [],
                    description: item.description || ""
                }, restaurantId, restaurantName);
            }
        } catch (e) {
            addToCart({
                id: item.id,
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                isVeg: item.type === 'Veg',
                isAddon: false,
                selectedAddons: [],
                description: item.description || ""
            }, restaurantId, restaurantName);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleToggleAddon = (groupName: string, option: ApiOptionGroupOption) => {
        setSelectedAddons(prev => {
            const alreadySelected = prev.some(a => a.id === option.id);
            if (alreadySelected) {
                return prev.filter(a => a.id !== option.id);
            } else {
                return [...prev, {
                    id: option.id,
                    name: option.name,
                    price: option.additionalPrice,
                    groupName: groupName
                }];
            }
        });
    };

    const handleAddCustomizedToCart = () => {
        if (!selectedItemDetails) return;

        const basePrice = selectedItemDetails.basePrice;
        const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
        const totalPrice = basePrice + addonsPrice;

        const description = selectedAddons.map(a => `${a.groupName}: ${a.name}`).join(", ");
        const customizations = selectedAddons.map(a => a.name).join(", ");

        addToCart({
            id: `${selectedItemDetails.id}-${customizations.replace(/\s+/g, '')}`,
            menuItemId: selectedItemDetails.id,
            name: selectedItemDetails.name,
            price: totalPrice,
            isVeg: selectedItemDetails.isVegetarian,
            isAddon: false,
            selectedAddons: selectedAddons,
            description: description,
            customizations: customizations !== "" ? `Selected: ${customizations}` : undefined
        }, restaurantId, restaurantName);

        setIsCustomModalOpen(false);
        setSelectedItemDetails(null);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4732" />
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Restaurant not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>
        );
    }

    // Filter menu items by search query, category, and veg only
    const allMenuItems = restaurant.menu || [];
    const filteredItems = allMenuItems.filter((item: any) => {
        if (isVegOnly && item.type !== 'Veg') return false;
        if (menuSearchQuery.trim()) {
            const matchesName = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase());
            const matchesCat = (item.category || '').toLowerCase().includes(menuSearchQuery.toLowerCase());
            if (!matchesName && !matchesCat) return false;
        }
        if (selectedCategoryTab !== 'All') {
            const cat = item.category || 'General';
            if (cat.toLowerCase() !== selectedCategoryTab.toLowerCase()) return false;
        }
        return true;
    });

    // Group items by category for rendering
    const categories: Record<string, any[]> = {};
    filteredItems.forEach((item: any) => {
        const cat = item.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    const categoryNames: string[] = ['All', ...(Array.from(new Set(allMenuItems.map((i: any) => String(i.category || 'General')))) as string[])];
    const isCartNotEmpty = cartItems.length > 0;
    const ratingCountFormatted = Math.round((restaurant.rating || 4.4) * 1400).toLocaleString();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isCartNotEmpty ? 100 : 40 }}>
                
                {/* Hero Banner Section */}
                <View style={styles.heroBannerContainer}>
                    <Image source={{ uri: restaurant.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
                    
                    {/* Floating Back Button */}
                    <TouchableOpacity style={styles.floatingBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                        <ArrowLeft size={20} color="#1F2937" />
                    </TouchableOpacity>

                    {/* Floating Heart Favorite Button */}
                    <TouchableOpacity 
                        style={styles.floatingFavBtn} 
                        onPress={() => toggleFavorite(restaurant)} 
                        activeOpacity={0.85}
                    >
                        <Heart size={20} color={isFav ? '#A81C1C' : '#6B7280'} fill={isFav ? '#A81C1C' : 'transparent'} />
                    </TouchableOpacity>
                </View>

                {/* Overlapping Floating Restaurant Info Card */}
                <View style={styles.restaurantInfoCard}>
                    <Text style={styles.restaurantTitle}>{restaurant.name}</Text>
                    
                    {/* Dietary Badges Row */}
                    <View style={styles.dietaryRow}>
                        <View style={styles.pureVegBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.pureVegText}>100% PURE VEG</Text>
                        </View>

                        <View style={styles.jainOptionsBadge}>
                            <Text style={styles.jainIcon}>🌾</Text>
                            <Text style={styles.jainText}>JAIN OPTIONS</Text>
                        </View>
                    </View>

                    {/* Location Row */}
                    <View style={styles.locationRow}>
                        <MapPin size={14} color="#EF4444" />
                        <Text style={styles.locationText}>{restaurant.addressLine || 'gadital, hadapsar'}</Text>
                    </View>

                    {/* Metrics Row (Delivery Time, Distance, Rating) */}
                    <View style={styles.metricsRow}>
                        <Clock size={14} color="#FF4732" />
                        <Text style={styles.metricText}>{restaurant.deliveryTime}</Text>
                        <Text style={styles.metricDot}>•</Text>
                        <Text style={styles.metricText}>{restaurant.distance}</Text>
                        <Text style={styles.metricDot}>•</Text>
                        
                        <View style={styles.ratingBadgePill}>
                            <Star size={12} color="#D97706" fill="#D97706" />
                            <Text style={styles.ratingText}>{restaurant.rating} ({ratingCountFormatted})</Text>
                        </View>
                    </View>
                </View>

                {/* Fulfillment Mode Switcher (Delivery vs Pickup) */}
                <View style={styles.fulfillmentCard}>
                    <TouchableOpacity 
                        style={[styles.fulfillmentTab, fulfillmentMode === 'Delivery' && styles.fulfillmentTabActive]}
                        onPress={() => setFulfillmentMode('Delivery')}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.fulfillmentIconCircle, fulfillmentMode === 'Delivery' && styles.fulfillmentIconCircleActive]}>
                            <Bike size={22} color={fulfillmentMode === 'Delivery' ? '#FF4732' : '#9CA3AF'} />
                        </View>
                        {fulfillmentMode === 'Delivery' && (
                            <View style={styles.fulfillmentTextCol}>
                                <Text style={styles.fulfillmentTitleActive}>Delivery</Text>
                                <Text style={styles.fulfillmentSubActive}>{restaurant.deliveryTime}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.fulfillmentTab, fulfillmentMode === 'Pickup' && styles.fulfillmentTabActive]}
                        onPress={() => setFulfillmentMode('Pickup')}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.fulfillmentIconCircle, fulfillmentMode === 'Pickup' && styles.fulfillmentIconCircleActive]}>
                            <User size={20} color={fulfillmentMode === 'Pickup' ? '#FF4732' : '#9CA3AF'} />
                        </View>
                        {fulfillmentMode === 'Pickup' && (
                            <View style={styles.fulfillmentTextCol}>
                                <Text style={styles.fulfillmentTitleActive}>Pickup</Text>
                                <Text style={styles.fulfillmentSubActive}>Self service</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search for Dishes Input Bar */}
                <View style={styles.menuSearchContainer}>
                    <Search size={18} color="#FF4732" style={{ marginRight: 10 }} />
                    <TextInput 
                        style={styles.menuSearchInput}
                        placeholder="Search for dishes"
                        placeholderTextColor="#9CA3AF"
                        value={menuSearchQuery}
                        onChangeText={setMenuSearchQuery}
                    />
                    <Mic size={18} color="#FF4732" />
                </View>

                {/* Horizontal Category Navigation Tabs */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.categoryTabsScroll}
                >
                    {categoryNames.map((catName) => {
                        const isSelected = selectedCategoryTab === catName;
                        return (
                            <TouchableOpacity
                                key={catName}
                                style={[styles.catTabItem, isSelected && styles.catTabItemActive]}
                                onPress={() => setSelectedCategoryTab(catName)}
                            >
                                <Text style={[styles.catTabText, isSelected && styles.catTabTextActive]}>
                                    {catName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Menu Item Listings */}
                <View style={styles.menuSection}>
                    {Object.keys(categories).length === 0 ? (
                        <View style={styles.emptyMenuContainer}>
                            <Text style={styles.emptyMenuText}>No dishes match your search criteria.</Text>
                        </View>
                    ) : (
                        Object.keys(categories).map((catName) => (
                            <View key={catName} style={styles.categorySectionGroup}>
                                <Text style={styles.categorySectionHeader}>{catName.toUpperCase()}</Text>
                                
                                <View style={styles.dishesGrid}>
                                    {categories[catName].map((item) => (
                                        <View key={item.id} style={styles.dishGridCard}>
                                            <View style={styles.dishImageWrapper}>
                                                <Image source={{ uri: item.imageUrl || getFallbackImage(item.name, item.category) }} style={styles.dishCardImage} />
                                                
                                                {/* Veg Indicator Badge */}
                                                <View style={styles.vegIndicatorBadge}>
                                                    <View style={[styles.vegDotInside, { backgroundColor: item.type === 'Veg' ? '#10B981' : '#EF4444' }]} />
                                                </View>
                                            </View>

                                            <View style={styles.dishCardBody}>
                                                <Text style={styles.dishCardName} numberOfLines={1}>{item.name}</Text>
                                                
                                                <View style={styles.dishCardFooterRow}>
                                                    <Text style={styles.dishCardPrice}>₹{item.price}</Text>

                                                    <TouchableOpacity 
                                                        style={styles.dishAddBtn}
                                                        onPress={() => handleAddItemPress(item)}
                                                        disabled={loadingDetails}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Text style={styles.dishAddBtnText}>ADD</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Cart Footer Bar */}
            {isCartNotEmpty && (
                <TouchableOpacity 
                    style={styles.cartFooter}
                    onPress={() => navigation.navigate('Cart')}
                    activeOpacity={0.95}
                >
                    <View style={styles.cartFooterLeft}>
                        <ShoppingBag size={20} color="#FFFFFF" />
                        <Text style={styles.cartFooterItemsCount}>
                            {cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items
                        </Text>
                        <Text style={styles.cartFooterDivider}>|</Text>
                        <Text style={styles.cartFooterTotal}>₹{cartTotal}</Text>
                    </View>
                    <Text style={styles.cartFooterRight}>View Cart</Text>
                </TouchableOpacity>
            )}

            {/* Addons Customizations Modal */}
            <Modal visible={isCustomModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Customize your {selectedItemDetails?.name}</Text>
                        
                        <ScrollView style={styles.addonsList}>
                            {selectedItemDetails?.optionGroups?.map((group) => (
                                <View key={group.id} style={styles.addonGroup}>
                                    <Text style={styles.addonGroupTitle}>{group.groupName}</Text>
                                    {group.options.map((option) => {
                                        const isSelected = selectedAddons.some(a => a.id === option.id);
                                        return (
                                            <TouchableOpacity 
                                                key={option.id}
                                                style={[styles.addonItemRow, isSelected && styles.addonItemRowActive]}
                                                onPress={() => handleToggleAddon(group.groupName, option)}
                                            >
                                                <Text style={[styles.addonItemName, isSelected && styles.addonItemNameActive]}>
                                                    {option.name}
                                                </Text>
                                                <Text style={styles.addonItemPrice}>
                                                    +₹{option.additionalPrice}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalCancelBtn]} 
                                onPress={() => setIsCustomModalOpen(false)}
                            >
                                <Text style={styles.modalCancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalAddBtn]} 
                                onPress={handleAddCustomizedToCart}
                            >
                                <Text style={styles.modalAddBtnText}>Add to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    heroBannerContainer: {
        width: '100%',
        height: 220,
        position: 'relative',
        backgroundColor: '#A81C1C',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    floatingBackBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingFavBtn: {
        position: 'absolute',
        top: 48,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    restaurantInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: -55,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    restaurantTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.3,
    },
    dietaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    pureVegBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E6F4EA',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#059669',
    },
    pureVegText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#059669',
    },
    jainOptionsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    jainIcon: {
        fontSize: 12,
    },
    jainText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#D97706',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
    },
    metricText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    metricDot: {
        fontSize: 12,
        color: '#D1D5DB',
    },
    ratingBadgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
    },
    fulfillmentCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        padding: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    fulfillmentTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 30,
        gap: 10,
    },
    fulfillmentTabActive: {
        backgroundColor: '#FFFFFF',
    },
    fulfillmentIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fulfillmentIconCircleActive: {
        backgroundColor: '#FFF0EF',
        borderWidth: 1.5,
        borderColor: '#FF4732',
    },
    fulfillmentTextCol: {
        marginRight: 10,
    },
    fulfillmentTitleActive: {
        fontSize: 15,
        fontWeight: '800',
        color: '#A81C1C',
    },
    fulfillmentSubActive: {
        fontSize: 11,
        color: '#6B7280',
    },
    menuSearchContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
    },
    categoryTabsScroll: {
        paddingHorizontal: 16,
        gap: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 8,
        marginBottom: 16,
    },
    catTabItem: {
        paddingBottom: 6,
    },
    catTabItemActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#FF4732',
    },
    catTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    catTabTextActive: {
        color: '#FF4732',
        fontWeight: '800',
    },
    menuSection: {
        paddingHorizontal: 16,
    },
    categorySectionGroup: {
        marginBottom: 24,
    },
    categorySectionHeader: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1F2937',
        letterSpacing: 0.5,
        marginBottom: 14,
    },
    dishesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    dishGridCard: {
        width: (Dimensions.get('window').width - 46) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    dishImageWrapper: {
        width: '100%',
        height: 125,
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    dishCardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    vegIndicatorBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 14,
        height: 14,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#10B981',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vegDotInside: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dishCardBody: {
        padding: 12,
    },
    dishCardName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    dishCardFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    dishCardPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
    },
    dishAddBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FF4732',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    dishAddBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FF4732',
    },
    emptyMenuContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyMenuText: {
        fontSize: 14,
        color: '#6B7280',
    },
    cartFooter: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: '#FF4732',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    cartFooterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartFooterItemsCount: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 10,
    },
    cartFooterDivider: {
        color: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 8,
        fontSize: 16,
    },
    cartFooterTotal: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cartFooterRight: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    addonsList: {
        marginBottom: 20,
    },
    addonGroup: {
        marginBottom: 20,
    },
    addonGroupTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addonItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 8,
    },
    addonItemRowActive: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF0EF',
    },
    addonItemName: {
        fontSize: 14,
        color: '#4B5563',
    },
    addonItemNameActive: {
        color: '#FF4732',
        fontWeight: 'bold',
    },
    addonItemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelBtn: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalCancelBtnText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 15,
    },
    modalAddBtn: {
        backgroundColor: '#FF4732',
    },
    modalAddBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 10,
    },
});
