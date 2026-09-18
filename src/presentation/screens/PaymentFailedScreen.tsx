import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { XCircle, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react-native';

export const PaymentFailedScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    const errorMsg = route?.params?.errorMessage || 'Payment transaction failed or was cancelled.';

    const handleRetry = () => {
        navigation.navigate('Cart');
    };

    const handleBackHome = () => {
        navigation.navigate('MainTabs', { screen: 'Home' });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Image 
                        source={require('../../assets/checkout/preparing.png')}
                        style={{ width: 100, height: 100, marginBottom: 16 }}
                        resizeMode="contain"
                    />
                    <View style={styles.iconCircle}>
                        <XCircle size={36} color="#DC2626" strokeWidth={2} />
                    </View>

                    <Text style={styles.title}>Payment Failed</Text>
                    <Text style={styles.subtitle}>
                        We could not complete your payment transaction. No money was deducted from your account.
                    </Text>

                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.9}>
                            <RefreshCw size={18} color="#FFFFFF" />
                            <Text style={styles.retryBtnText}>Try Again / Change Payment</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.homeBtn} onPress={handleBackHome} activeOpacity={0.8}>
                            <Text style={styles.homeBtnText}>Return to Home</Text>
                        </TouchableOpacity>
                    </View>
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
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    errorBox: {
        width: '100%',
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        marginBottom: 24,
    },
    errorText: {
        fontSize: 13,
        color: '#991B1B',
        textAlign: 'center',
        fontWeight: '600',
    },
    actionsContainer: {
        width: '100%',
        gap: 12,
    },
    retryBtn: {
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
    retryBtnText: {
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
