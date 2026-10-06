import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getMyOrders, getOrderById, ApiOrder } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, RotateCcw, Truck, Navigation, ArrowLeft } from 'lucide-react-native';

export const OrdersListScreen = ({ navigation }: { navigation: any }) => {
    const { reorder, isLoggedIn } = useCart();
    const { showToast } = useToast();

    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');

    const isOrderActive = (order: ApiOrder) => {
        const status = (order.status || '').toUpperCase();
        const inactiveStatuses = ['DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED', 'COMPLETED', 'REFUNDED'];
        return !inactiveStatuses.includes(status);
    };

    const loadOrders = async () => {
        if (!isLoggedIn) {
            setOrders([]);
            setLoading(false);
            return;
        }
        try {
            const data = await getMyOrders();
            const loaded = Array.isArray(data) ? data : [];
            setOrders(loaded);
            
            const hasActive = loaded.some(isOrderActive);
            setActiveTab(hasActive ? 'ACTIVE' : 'PAST');
        } catch (e) {
            console.error("Failed to load orders history:", e);
            showToast("Failed to fetch order history", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [isLoggedIn]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const activeOrders = orders.filter(isOrderActive);
    const pastOrders = orders.filter(order => !isOrderActive(order));

    const handleReorder = async (order: ApiOrder) => {
        try {
            let fullOrder = order;

            // Fetch full order details if items list is empty or missing
            if (!fullOrder.items || !Array.isArray(fullOrder.items) || fullOrder.items.length === 0 || !fullOrder.restaurantId) {
                try {
                    const fetched = await getOrderById(order.id);
                    if (fetched) {
                        fullOrder = fetched;
                    }
                } catch (e) {
                    console.error("Failed to fetch full order details for reorder:", e);
                }
            }

            const rawItems = fullOrder.items || (fullOrder as any).orderItems || (fullOrder as any).items || [];
            
            if (!rawItems || rawItems.length === 0) {
                showToast("No items found in this order to reorder", "warning");
                return;
            }

            const targetRestaurantId = fullOrder.restaurantId || (fullOrder as any).restaurant?.id || (fullOrder as any).merchantId || "";
            const targetRestaurantName = fullOrder.restaurantName || (fullOrder as any).restaurant?.name || "Restaurant";

            const cartItems: any[] = rawItems.map((item: any) => {
                const menuItemId = item.menuItemId || item.itemId || item.id || item.menuItem?.id || "";
                const name = item.name || item.itemName || item.menuItemName || item.title || item.menuItem?.name || "Item";
                const price = typeof item.unitPrice === 'number' ? item.unitPrice : typeof item.price === 'number' ? item.price : typeof item.unitPriceAmount === 'number' ? item.unitPriceAmount : 0;
                const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

                let selectedAddons = [];
                if (Array.isArray(item.selectedAddons)) {
                    selectedAddons = item.selectedAddons;
                } else if (Array.isArray(item.options)) {
                    selectedAddons = item.options;
                }

                return {
                    id: menuItemId,
                    menuItemId: menuItemId,
                    name: name,
                    price: price,
                    quantity: quantity,
                    isVeg: item.isVeg ?? item.isVegetarian ?? true,
                    isAddon: false,
                    selectedAddons: selectedAddons,
                    description: typeof item.options === 'string' ? item.options : item.specialInstructions || ""
                };
            }).filter((i: any) => Boolean(i.menuItemId));

            if (cartItems.length === 0) {
                showToast("Could not find valid item details to reorder", "error");
                return;
            }

            await reorder(cartItems, targetRestaurantId, targetRestaurantName);
            navigation.navigate('Cart');
        } catch (e) {
            console.error("Reorder failed:", e);
            showToast("Could not reorder. Please try adding items manually.", "error");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
            }) + ', ' + date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toLowerCase();
        } catch (_) {
            return dateString;
        }
    };

    const getItemCount = (order: ApiOrder) => {
        if (order.totalItems) return order.totalItems;
        if (order.items && order.items.length > 0) {
            return order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
        return 1;
    };

    const getStatusStyle = (status: string) => {
        const upper = (status || '').toUpperCase();
        switch (upper) {
            case 'DELIVERED':
                return { bg: '#E8F5E9', text: '#10B981', label: 'Delivered' };
            case 'CANCELLED':
            case 'REJECTED':
            case 'FAILED':
                return { bg: '#FEF2F2', text: '#EF4444', label: upper === 'CANCELLED' ? 'Cancelled' : 'Failed' };
            case 'PREPARING':
                return { bg: '#FFF7ED', text: '#F97316', label: 'Preparing' };
            case 'OUT_FOR_DELIVERY':
            case 'PICKED_UP':
            case 'IN_TRANSIT':
                return { bg: '#EFF6FF', text: '#3B82F6', label: 'Out for Delivery' };
            default:
                return { bg: '#FFF7ED', text: '#F97316', label: status || 'Placed' };
        }
    };

    const renderActiveOrderCard = ({ item }: { item: ApiOrder }) => {
        const statusColors = getStatusStyle(item.status);
        const itemCount = getItemCount(item);

        return (
            <View style={styles.activeCard}>
                <View style={styles.activeHeaderBanner}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.activeHeaderText}>LIVE ORDER TRACKING</Text>
                </View>

                <View style={styles.cardHeader}>
                    <View style={styles.activeIconCircle}>
                        <Truck size={22} color="#FF4732" />
                    </View>
                    <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurantName}</Text>
                        <Text style={styles.itemMeta}>{itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{item.totalAmount || item.total}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>{statusColors.label}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.itemsSummary}>
                    {(item.items || []).map((orderItem, idx) => (
                        <Text key={idx} style={styles.itemText} numberOfLines={1}>
                            {orderItem.quantity}x {orderItem.name}
                        </Text>
                    ))}
                </View>

                <View style={styles.activeCardFooter}>
                    <TouchableOpacity 
                        style={styles.primaryTrackBtn}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                    >
                        <Navigation size={15} color="#FFFFFF" />
                        <Text style={styles.primaryTrackBtnText}>Track Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.secondaryReorderBtn}
                        onPress={() => handleReorder(item)}
                    >
                        <RotateCcw size={14} color="#6B7280" />
                        <Text style={styles.secondaryReorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderPastOrderCard = ({ item }: { item: ApiOrder }) => {
        const statusColors = getStatusStyle(item.status);
        const itemCount = getItemCount(item);

        return (
            <View style={styles.pastCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.pastIconCircle}>
                        <Truck size={20} color="#D97706" />
                    </View>
                    <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurantName}</Text>
                        <Text style={styles.itemMeta}>{itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{item.totalAmount || item.total}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>{statusColors.label}</Text>
                    </View>
                </View>

                <View style={styles.pastCardFooter}>
                    <TouchableOpacity 
                        style={styles.viewDetailsBtn}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                    >
                        <Text style={styles.viewDetailsBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.pastReorderBtn}
                        onPress={() => handleReorder(item)}
                    >
                        <Text style={styles.pastReorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (!isLoggedIn) {
        return (
            <View style={styles.centerContainer}>
                <ShoppingBag size={48} color="#D1D5DB" />
                <Text style={styles.loginPromptTitle}>Access Order History</Text>
                <Text style={styles.loginPromptDesc}>Log in with your phone number to view your past and active orders</Text>
                <TouchableOpacity 
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate('SignIn')}
                >
                    <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4732" />
            </View>
        );
    }

    const currentList = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

    return (
        <View style={styles.container}>
            {/* Header Title */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <ArrowLeft size={22} color="#111827" />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.headerTitle}>My Orders</Text>
                </View>
            </View>

            {/* Tab Bar: Active (N) | Past (M) */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
                    onPress={() => setActiveTab('ACTIVE')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
                        Active ({activeOrders.length})
                    </Text>
                    {activeTab === 'ACTIVE' && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'PAST' && styles.tabItemActive]}
                    onPress={() => setActiveTab('PAST')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>
                        Past ({pastOrders.length})
                    </Text>
                    {activeTab === 'PAST' && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
            </View>

            {/* Orders List */}
            {currentList.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ShoppingBag size={56} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'ACTIVE' ? 'No active orders' : 'No past orders'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {activeTab === 'ACTIVE' 
                            ? "Any order you place will appear here while it is being prepared and delivered." 
                            : "Your order history will show up here once you complete an order."
                        }
                    </Text>
                    <TouchableOpacity 
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList 
                    data={currentList}
                    renderItem={activeTab === 'ACTIVE' ? renderActiveOrderCard : renderPastOrderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF4732']} />}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingHorizontal: 20,
    },
    tabItem: {
        paddingVertical: 12,
        marginRight: 28,
        position: 'relative',
    },
    tabItemActive: {},
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    tabTextActive: {
        color: '#FF4732',
        fontWeight: 'bold',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#FF4732',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    /* Active Order Card */
    activeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#FFD3CD',
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    activeHeaderBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#FFF0EF',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    livePulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4732',
    },
    activeHeaderText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FF4732',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF0EF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pastIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    restaurantInfo: {
        flex: 1,
        marginRight: 8,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    itemMeta: {
        fontSize: 13,
        color: '#4B5563',
        marginTop: 2,
    },
    orderDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    itemsSummary: {
        gap: 4,
    },
    itemText: {
        fontSize: 13,
        color: '#4B5563',
    },
    activeCardFooter: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 10,
    },
    primaryTrackBtn: {
        flex: 1,
        backgroundColor: '#FF4732',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    primaryTrackBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    secondaryReorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    secondaryReorderBtnText: {
        color: '#4B5563',
        fontSize: 13,
        fontWeight: 'bold',
    },
    /* Past Order Card */
    pastCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    pastCardFooter: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 10,
    },
    viewDetailsBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    viewDetailsBtnText: {
        color: '#1F2937',
        fontSize: 13,
        fontWeight: 'bold',
    },
    pastReorderBtn: {
        flex: 1,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    pastReorderBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    /* Empty & Login states */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    exploreBtn: {
        backgroundColor: '#FF4732',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loginPromptTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
    },
    loginPromptDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        marginBottom: 24,
    },
    loginBtn: {
        backgroundColor: '#FF4732',
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 14,
    },
    loginBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
