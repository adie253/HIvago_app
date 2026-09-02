import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getOrderById, fetchDeliveryCodes, ApiOrder } from '../../data/api';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Clock, MapPin, CheckCircle2, ShoppingBag, ShieldCheck } from 'lucide-react-native';

const STATUS_STEPS = [
    { label: 'Confirmed', statusList: ['PENDING', 'PAID', 'Confirmed'] },
    { label: 'Preparing', statusList: ['PREPARING', 'Preparing'] },
    { label: 'Rider Assigned', statusList: ['READY', 'READY_FOR_PICKUP', 'ASSIGNED', 'ReadyForPickup'] },
    { label: 'Out for Delivery', statusList: ['PICKED_UP', 'PickedUp'] },
    { label: 'Delivered', statusList: ['DELIVERED', 'Delivered'] }
];

export const OrderTrackingScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { orderId } = route.params;
    const { lastStatusUpdate } = useNotifications();

    const [order, setOrder] = useState<ApiOrder | null>(null);
    const [codes, setCodes] = useState<{ pickupCode: string | null, dropCode: string | null } | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDetails = async () => {
        try {
            const data = await getOrderById(orderId);
            setOrder(data);

            const deliveryCodes = await fetchDeliveryCodes(orderId);
            setCodes(deliveryCodes);
        } catch (e) {
            console.error("Failed to load tracking details:", e);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and periodic polling fallback
    useEffect(() => {
        loadDetails();
        const interval = setInterval(loadDetails, 10000);
        return () => clearInterval(interval);
    }, [orderId]);

    // Live SignalR updates
    useEffect(() => {
        if (lastStatusUpdate && lastStatusUpdate.orderId === orderId) {
            loadDetails();
        }
    }, [lastStatusUpdate]);

    const getActiveStepIndex = () => {
        if (!order) return 0;
        const currentStatus = order.status;
        
        let activeIdx = 0;
        for (let i = 0; i < STATUS_STEPS.length; i++) {
            if (STATUS_STEPS[i].statusList.includes(currentStatus)) {
                activeIdx = i;
                break;
            }
        }
        return activeIdx;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4732" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Order not found</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>
        );
    }

    const activeStep = getActiveStepIndex();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.iconBtn}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Order #{order.orderNumber || order.id.substring(0, 8)}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Active Status Panel */}
                <View style={styles.statusPanel}>
                    <View style={styles.statusPanelHeader}>
                        <Clock size={24} color="#FF4732" />
                        <View style={styles.etaContainer}>
                            <Text style={styles.etaLabel}>Estimated Delivery</Text>
                            <Text style={styles.etaText}>{order.estimatedMinutes || '30-40'} mins</Text>
                        </View>
                    </View>
                    <Text style={styles.statusMessage}>
                        {order.status === 'DELIVERED' ? 'Order delivered. Enjoy your meal!' : 'Rider is making sure your package is hot.'}
                    </Text>
                </View>

                {/* Delivery Handoff Codes */}
                {codes && codes.dropCode && (
                    <View style={styles.codePanel}>
                        <ShieldCheck size={20} color="#FF4732" />
                        <View style={styles.codeTextContainer}>
                            <Text style={styles.codeLabel}>Delivery Verification Code</Text>
                            <Text style={styles.codeVal}>{codes.dropCode}</Text>
                            <Text style={styles.codeDesc}>Share this code with the delivery rider to receive your food.</Text>
                        </View>
                    </View>
                )}

                {/* Progress Timeline Tracker */}
                <View style={styles.timelineCard}>
                    <Text style={styles.cardTitle}>Order Timeline</Text>
                    <View style={styles.timelineList}>
                        {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx <= activeStep;
                            const isActive = idx === activeStep;
                            return (
                                <View key={step.label} style={styles.timelineStep}>
                                    <View style={styles.timelineIndicatorColumn}>
                                        <View style={[
                                            styles.stepCircle,
                                            isDone && styles.stepCircleCompleted,
                                            isActive && styles.stepCircleActive
                                        ]}>
                                            {isDone && <CheckCircle2 size={16} color="white" />}
                                        </View>
                                        {idx < STATUS_STEPS.length - 1 && (
                                            <View style={[
                                                styles.stepLine,
                                                idx < activeStep && styles.stepLineCompleted
                                            ]} />
                                        )}
                                    </View>
                                    <View style={styles.stepDetails}>
                                        <Text style={[
                                            styles.stepLabelText,
                                            isDone && styles.stepLabelTextDone,
                                            isActive && styles.stepLabelTextActive
                                        ]}>
                                            {step.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Order Summary details */}
                <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Bill Summary</Text>
                    <View style={styles.restaurantRow}>
                        <ShoppingBag size={18} color="#6B7280" />
                        <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                    </View>
                    <View style={styles.divider} />
                    {order.items.map((item, index) => (
                        <View key={`${item.menuItemId}-${index}`} style={styles.itemRow}>
                            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemPrice}>₹{item.unitPrice * item.quantity}</Text>
                        </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Paid Amount</Text>
                        <Text style={styles.totalVal}>₹{order.totalAmount || order.total}</Text>
                    </View>
                </View>
            </ScrollView>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconBtn: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 12,
    },
    scrollContent: {
        padding: 20,
        gap: 16,
        paddingBottom: 40,
    },
    statusPanel: {
        backgroundColor: '#FFF0EF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FFD6D2',
    },
    statusPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    etaContainer: {
        flex: 1,
    },
    etaLabel: {
        fontSize: 12,
        color: '#FF4732',
        fontWeight: '600',
    },
    etaText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#C22F20',
        marginTop: 2,
    },
    statusMessage: {
        fontSize: 13,
        color: '#C22F20',
        marginTop: 10,
        lineHeight: 18,
    },
    codePanel: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 12,
    },
    codeTextContainer: {
        flex: 1,
    },
    codeLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#374151',
    },
    codeVal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FF4732',
        letterSpacing: 2,
        marginVertical: 6,
    },
    codeDesc: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
    },
    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    timelineList: {
        paddingLeft: 8,
    },
    timelineStep: {
        flexDirection: 'row',
        minHeight: 56,
    },
    timelineIndicatorColumn: {
        alignItems: 'center',
        marginRight: 16,
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleCompleted: {
        backgroundColor: '#FF4732',
    },
    stepCircleActive: {
        backgroundColor: '#FF4732',
        borderWidth: 3,
        borderColor: '#FFF0EF',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    stepLineCompleted: {
        backgroundColor: '#FF4732',
    },
    stepDetails: {
        flex: 1,
        paddingTop: 2,
    },
    stepLabelText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    stepLabelTextDone: {
        color: '#4B5563',
    },
    stepLabelTextActive: {
        color: '#FF4732',
        fontWeight: 'bold',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemQuantity: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FF4732',
        width: 24,
    },
    itemName: {
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
        marginRight: 10,
    },
    itemPrice: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalVal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF4732',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 10,
    },
    backBtn: {
        marginTop: 20,
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
    },
});
