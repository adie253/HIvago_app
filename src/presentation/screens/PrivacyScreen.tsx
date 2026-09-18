import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react-native';

export const PrivacyScreen = ({ navigation }: { navigation: any }) => {
    const POLICIES = [
        {
            title: "Data Collection & Usage",
            icon: <FileText size={22} color="#FF4732" />,
            content: "We collect personal details such as phone numbers, delivery addresses, and order history strictly to fulfill your orders, ensure accurate delivery, and improve your overall dining experience."
        },
        {
            title: "Location Permissions",
            icon: <Shield size={22} color="#FF4732" />,
            content: "Your location data is used exclusively to show nearby partner restaurants, compute real-time delivery estimates, and enable precise live GPS tracking of your rider during active orders."
        },
        {
            title: "Payment Security",
            icon: <Lock size={22} color="#FF4732" />,
            content: "All online transactions are encrypted end-to-end via PCI-DSS compliant PayU payment gateways. Hivago never stores raw credit card, debit card, or banking credentials on our servers."
        },
        {
            title: "Account & Data Controls",
            icon: <CheckCircle2 size={22} color="#FF4732" />,
            content: "You retain full control over your stored addresses and account profile. You can update or request complete deletion of your data at any time through account settings or customer support."
        }
    ];

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Privacy Policy</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerBox}>
                    <Shield size={36} color="#FF4732" />
                    <Text style={styles.headerTitle}>Your Privacy Matters</Text>
                    <Text style={styles.headerDesc}>
                        At Hivago, we are committed to protecting your personal information and maintaining full transparency about how your data is handled.
                    </Text>
                    <Text style={styles.updatedBadge}>Last Updated: January 2026</Text>
                </View>

                <View style={styles.policyList}>
                    {POLICIES.map((p, index) => (
                        <View key={index} style={styles.policyCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>{p.icon}</View>
                                <Text style={styles.cardTitle}>{p.title}</Text>
                            </View>
                            <Text style={styles.cardContent}>{p.content}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Have questions about privacy?</Text>
                    <Text style={styles.contactDesc}>
                        Contact our Data Protection Officer at privacy@hivago.com or reach out via Customer Support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerBox: {
        backgroundColor: '#FFF5F4',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        marginTop: 12,
        marginBottom: 8,
    },
    headerDesc: {
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 12,
    },
    updatedBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF4732',
    },
    policyList: {
        gap: 16,
        marginBottom: 24,
    },
    policyCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF5F4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    cardContent: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    contactCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    contactDesc: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
});
