import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, ChefHat, Truck, Heart, Award, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react-native';

export const AboutScreen = ({ navigation }: { navigation: any }) => {
    const VALUES = [
        {
            icon: <ChefHat size={28} color="#FF4732" />,
            title: "Expert Curation",
            description: "We partner with the finest local restaurants to bring you a hand-picked selection of culinary delights."
        },
        {
            icon: <Truck size={28} color="#FF4732" />,
            title: "Lightning Fast",
            description: "Our dedicated delivery fleet ensures your food arrives hot and fresh, right at your doorstep."
        },
        {
            icon: <Heart size={28} color="#FF4732" />,
            title: "Customer First",
            description: "Your satisfaction is our obsession. We go above and beyond to make every meal a special occasion."
        },
        {
            icon: <ShieldCheck size={28} color="#FF4732" />,
            title: "Hygiene Guaranteed",
            description: "Strict safety protocols and temperature-controlled packaging for zero-compromise freshness."
        }
    ];

    const HIGHLIGHTS = [
        "100% Verified Local Kitchens & Fine Dining",
        "Live GPS Order & Delivery Tracking",
        "Dedicated Customer Support Team",
        "Seamless Cash-on-Delivery & PayU Online Payments"
    ];

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>About Hivago</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Header */}
                <View style={styles.heroSection}>
                    <View style={styles.badge}>
                        <Award size={14} color="#FF4732" />
                        <Text style={styles.badgeText}>REDEFINING FOOD DELIVERY</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        Bringing the best of{'\n'}
                        <Text style={styles.highlightText}>local flavors</Text> to you.
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Hivago started with a simple mission: to make great local food accessible to everyone, anywhere. Today, we are proud to be the heart of your neighborhood dining experience.
                    </Text>

                    <TouchableOpacity 
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.ctaText}>Explore Restaurants</Text>
                        <ArrowRight size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Values Cards */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Why Choose Hivago?</Text>
                    <View style={styles.valuesGrid}>
                        {VALUES.map((item, idx) => (
                            <View key={idx} style={styles.valueCard}>
                                <View style={styles.iconCircle}>{item.icon}</View>
                                <Text style={styles.valueTitle}>{item.title}</Text>
                                <Text style={styles.valueDesc}>{item.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Highlights List */}
                <View style={styles.highlightsCard}>
                    <Text style={styles.highlightsTitle}>The Hivago Promise</Text>
                    {HIGHLIGHTS.map((h, i) => (
                        <View key={i} style={styles.highlightRow}>
                            <CheckCircle size={18} color="#16A34A" />
                            <Text style={styles.highlightTextItem}>{h}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footerNote}>
                    <Text style={styles.footerNoteText}>Made with ❤️ for food lovers everywhere</Text>
                    <Text style={styles.versionText}>Hivago Mobile v1.0.0</Text>
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
        paddingBottom: 40,
    },
    heroSection: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFF5F4',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFE5E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FF4732',
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 12,
    },
    highlightText: {
        color: '#FF4732',
        fontStyle: 'italic',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FF4732',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionContainer: {
        padding: 20,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    valuesGrid: {
        gap: 16,
    },
    valueCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FFF5F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    valueTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    valueDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    highlightsCard: {
        marginHorizontal: 20,
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
        gap: 12,
    },
    highlightsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#166534',
        marginBottom: 4,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    highlightTextItem: {
        fontSize: 14,
        fontWeight: '600',
        color: '#15803D',
        flex: 1,
    },
    footerNote: {
        marginTop: 32,
        alignItems: 'center',
        gap: 4,
    },
    footerNoteText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
