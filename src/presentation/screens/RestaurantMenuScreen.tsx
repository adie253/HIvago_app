import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Dimensions } from 'react-native';
import { fetchRestaurantById, fetchItemDetails, ApiItem, ApiOptionGroupOption } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Star, Clock, ShoppingBag } from 'lucide-react-native';

export const RestaurantMenuScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { restaurantId, restaurantName } = route.params;
    const { addToCart, cartItems, cartTotal } = useCart();
    const { showToast } = useToast();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Customization State
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<ApiItem | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isVegOnly, setIsVegOnly] = useState(false);

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
                // Add item straight to cart
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
            // Fallback: Add directly if details fetch fails
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

    // Group items by category
    const categories: Record<string, any[]> = {};
    restaurant.menu.forEach((item: any) => {
        if (isVegOnly && item.type !== 'Veg') return;
        const cat = item.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    const isCartNotEmpty = cartItems.length > 0;

    return (
        <View style={styles.container}>
            {/* Header banner */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isCartNotEmpty ? 90 : 30 }}>
                {/* Image Banner */}
                <Image source={{ uri: restaurant.imageUrl }} style={styles.bannerImage} />

                {/* Details Section */}
                <View style={styles.detailsCard}>
                    <Text style={styles.restaurantNameText}>{restaurant.name}</Text>
                    <Text style={styles.cuisinesText}>{restaurant.cuisines.join(', ')}</Text>
                    <Text style={styles.addressText}>{restaurant.addressLine}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                            <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.metaBadgeText}>{restaurant.rating}</Text>
                        </View>
                        <View style={[styles.metaBadge, { backgroundColor: '#F3F4F6' }]}>
                            <Clock size={14} color="#6B7280" />
                            <Text style={[styles.metaBadgeText, { color: '#4B5563' }]}>{restaurant.deliveryTime}</Text>
                        </View>
                        <Text style={styles.costText}>{restaurant.costForTwo}</Text>
                    </View>
                </View>

                {/* Veg Only Toggle row */}
                <View style={styles.menuHeaderRow}>
                    <Text style={styles.menuSectionTitle}>Menu</Text>
                    <View style={styles.vegToggleContainer}>
                        <Text style={styles.vegToggleLabel}>Veg Only</Text>
                        <TouchableOpacity 
                            style={[styles.vegSwitch, isVegOnly ? styles.vegSwitchActive : styles.vegSwitchInactive]}
                            onPress={() => setIsVegOnly(!isVegOnly)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.vegSwitchDot, isVegOnly ? styles.vegSwitchDotActive : styles.vegSwitchDotInactive]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Menu Listings */}
                <View style={styles.menuSection}>
                    {Object.keys(categories).map((catName) => {
                        if (categories[catName].length === 0) return null;
                        return (
                            <View key={catName} style={styles.categoryContainer}>
                                <Text style={styles.categoryNameTitle}>{catName}</Text>
                                {categories[catName].map((item) => (
                                    <View key={item.id} style={styles.menuItemRow}>
                                        <View style={styles.menuItemInfo}>
                                            <View style={styles.typeBadgeContainer}>
                                                <View style={[styles.dotIndicator, { backgroundColor: item.type === 'Veg' ? '#10B981' : '#EF4444' }]} />
                                                <Text style={styles.typeText}>{item.type}</Text>
                                                {item.price > 180 ? (
                                                    <View style={[styles.dishBadge, styles.bestsellerBadge]}>
                                                        <Text style={styles.bestsellerBadgeText}>★ BESTSELLER</Text>
                                                    </View>
                                                ) : item.price > 120 ? (
                                                    <View style={[styles.dishBadge, styles.mustTryBadge]}>
                                                        <Text style={styles.mustTryBadgeText}>MUST TRY</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <Text style={styles.menuItemName}>{item.name}</Text>
                                            <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                                            <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                                        </View>
                                    
                                    <View style={styles.menuItemAction}>
                                        <Image source={{ uri: item.imageUrl }} style={styles.menuItemImage} />
                                        <TouchableOpacity 
                                            style={styles.addBtn}
                                            onPress={() => handleAddItemPress(item)}
                                            disabled={loadingDetails}
                                        >
                                            <Text style={styles.addBtnText}>ADD</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    );
                })}
                </View>
            </ScrollView>

            {/* Floating Cart Footer */}
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

            {/* Customizations Modal */}
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 12,
        flex: 1,
    },
    bannerImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 20,
        marginTop: -30,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    restaurantNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cuisinesText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    addressText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        gap: 12,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4732',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    metaBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    costText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
    },
    menuSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    categoryContainer: {
        marginBottom: 28,
    },
    categoryNameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 6,
    },
    menuItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemInfo: {
        flex: 1,
        marginRight: 16,
    },
    typeBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    menuItemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 4,
    },
    menuItemDesc: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 6,
        lineHeight: 16,
    },
    menuItemAction: {
        width: 100,
        height: 100,
        position: 'relative',
        alignItems: 'center',
    },
    menuItemImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    addBtn: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: '#FFFFFF',
        width: 80,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF4732',
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF4732',
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
    menuHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    vegToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    vegToggleLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    vegSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
    },
    vegSwitchActive: {
        backgroundColor: '#10B981',
    },
    vegSwitchInactive: {
        backgroundColor: '#E5E7EB',
    },
    vegSwitchDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    vegSwitchDotActive: {
        alignSelf: 'flex-end',
    },
    vegSwitchDotInactive: {
        alignSelf: 'flex-start',
    },
    dishBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 6,
    },
    bestsellerBadge: {
        backgroundColor: '#FFFBEB',
        borderWidth: 0.5,
        borderColor: '#F59E0B',
    },
    bestsellerBadgeText: {
        color: '#D97706',
        fontSize: 9,
        fontWeight: 'bold',
    },
    mustTryBadge: {
        backgroundColor: '#FFF0EF',
        borderWidth: 0.5,
        borderColor: '#FF4732',
    },
    mustTryBadgeText: {
        color: '#FF4732',
        fontSize: 9,
        fontWeight: 'bold',
    },
});
