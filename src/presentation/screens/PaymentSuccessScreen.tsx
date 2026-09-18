import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Check, Package, MapPin, ArrowRight } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

export const PaymentSuccessScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    const { clearCart } = useCart();
    const orderId = route?.params?.orderId || 'HIV-' + Math.floor(100000 + Math.random() * 900000);
    const amount = route?.params?.amount || null;

    useEffect(() => {
        clearCart();
    }, []);

    const handleTrackOrder = () => {
        navigation.navigate('OrderTracking', { orderId });
    };

    const handleBackHome = () => {
        navigation.navigate('MainTabs', { screen: 'Home' });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Celebration Circle */}
                <View style={styles.celebrationCard}>
                    <Image 
                        source={require('../../assets/checkout/delivered.png')} 
                        style={{ width: 120, height: 120, marginBottom: 16 }}
                        resizeMode="contain"
                    />
                    <View style={styles.checkCircle}>
                        <Check size={36} color="#FFFFFF" strokeWidth={3.5} />
                    </View>

                    <Text style={styles.successTitle}>Order Confirmed!</Text>
                    <Text style={styles.successSubtitle}>
                        Your payment was successful and the restaurant has received your order.
                    </Text>

                    <View style={styles.orderIdBadge}>
                        <Text style={styles.orderIdLabel}>Order ID: </Text>
                        <Text style={styles.orderIdValue}>{orderId}</Text>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.iconCircle}>
                            <Package size={20} color="#FF4732" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Estimated Delivery</Text>
                            <Text style={styles.infoDesc}>25 - 35 mins</Text>
                        </View>
                    </View>

                    {amount && (
                        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }]}>
                            <Text style={styles.totalLabel}>Amount Paid</Text>
                            <Text style={styles.totalValue}>₹{amount}</Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.trackBtn} onPress={handleTrackOrder} activeOpacity={0.9}>
                        <Text style={styles.trackBtnText}>Track Order Live</Text>
                        <ArrowRight size={18} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.homeBtn} onPress={handleBackHome} activeOpacity={0.8}>
                        <Text style={styles.homeBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 64,
        alignItems: 'center',
    },
    celebrationCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    checkCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#16A34A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    orderIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    orderIdLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    orderIdValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF5F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    infoDesc: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 2,
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16A34A',
    },
    actionsContainer: {
        width: '100%',
        gap: 12,
    },
    trackBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FF4732',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    trackBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    homeBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    homeBtnText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '700',
    },
});
