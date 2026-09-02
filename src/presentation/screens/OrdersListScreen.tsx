import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getMyOrders, ApiOrder } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, ChevronRight, RotateCcw } from 'lucide-react-native';

export const OrdersListScreen = ({ navigation }: { navigation: any }) => {
    const { reorder, isLoggedIn } = useCart();
    const { showToast } = useToast();

    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadOrders = async () => {
        if (!isLoggedIn) {
            setOrders([]);
            setLoading(false);
            return;
        }
        try {
            const data = await getMyOrders();
            setOrders(Array.isArray(data) ? data : []);
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

    const handleReorder = async (order: ApiOrder) => {
        try {
            // Map ApiOrderItem back to local CartItem structure
            const cartItems = (order.items || []).map(item => {
                const selectedAddons = Array.isArray((item as any).options)
                    ? (item as any).options
                    : [];

                return {
                    id: item.menuItemId,
                    menuItemId: item.menuItemId,
                    name: item.name,
                    price: item.unitPrice,
                    quantity: item.quantity,
                    isVeg: true,
                    isAddon: false,
                    selectedAddons: selectedAddons,
                    description: item.options || ""
                };
            });

            await reorder(cartItems, order.restaurantId, order.restaurantName);
            navigation.navigate('Cart');
        } catch (e) {
            console.error("Reorder failed:", e);
            showToast("Could not reorder. Please add manually.", "error");
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (_) {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED':
                return { bg: '#FFF0EF', text: '#FF4732' };
            case 'CANCELLED':
            case 'REJECTED':
                return { bg: '#FFF0EF', text: '#EF4444' };
            default:
                return { bg: '#FFF7ED', text: '#F97316' }; // Orange for active
        }
    };

    const renderOrderCard = ({ item }: { item: ApiOrder }) => {
        const statusColors = getStatusColor(item.status);
        const isActive = !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurantName}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>{item.status}</Text>
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

                <View style={styles.cardFooter}>
                    <Text style={styles.totalText}>
                        Total: <Text style={styles.totalVal}>₹{item.totalAmount || item.total}</Text>
                    </Text>

                    <View style={styles.actionRow}>
                        {isActive && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.trackBtn]}
                                onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                            >
                                <Text style={styles.trackBtnText}>Track Order</Text>
                                <ChevronRight size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.reorderBtn]}
                            onPress={() => handleReorder(item)}
                        >
                            <RotateCcw size={14} color="#FF4732" />
                            <Text style={styles.reorderBtnText}>Reorder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (!isLoggedIn) {
        return (
            <View style={styles.centerContainer}>
                <ShoppingBag size={48} color="#D1D5DB" />
                <Text style={styles.loginPromptTitle}>Access Order History</Text>
                <Text style={styles.loginPromptDesc}>Log in with your phone number to view your past orders</Text>
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Orders</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ShoppingBag size={48} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySubtitle}>You haven't ordered anything yet. Give it a try!</Text>
                </View>
            ) : (
                <FlatList 
                    data={orders}
                    renderItem={renderOrderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    card: {
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    restaurantInfo: {
        flex: 1,
        marginRight: 12,
    },
    restaurantName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    orderDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
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
        color: '#6B7280',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB',
    },
    totalText: {
        fontSize: 13,
        color: '#4B5563',
    },
    totalVal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    trackBtn: {
        backgroundColor: '#FF4732',
    },
    trackBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    reorderBtn: {
        borderWidth: 1,
        borderColor: '#FF4732',
        backgroundColor: 'transparent',
    },
    reorderBtnText: {
        color: '#FF4732',
        fontSize: 12,
        fontWeight: 'bold',
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
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
});
