import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ticket, Tag, Check, X } from 'lucide-react-native';

interface CouponOverlayProps {
    visible: boolean;
    onClose: () => void;
    onApplyCoupon: (code: string, discountAmount: number) => void;
    currentCode?: string;
}

export const CouponOverlay: React.FC<CouponOverlayProps> = ({
    visible,
    onClose,
    onApplyCoupon,
    currentCode
}) => {
    const [inputCode, setInputCode] = useState('');
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(currentCode || null);

    const OFFERS = [
        { id: 'WELCOME50', title: '50% OFF up to ₹100', code: 'WELCOME50', discount: 100, desc: 'Valid on first 3 orders above ₹199' },
        { id: 'HIVAGO20', title: '20% OFF on all orders', code: 'HIVAGO20', discount: 60, desc: 'No minimum order required' },
        { id: 'PARTY150', title: '₹150 OFF on Large Orders', code: 'PARTY150', discount: 150, desc: 'Valid on orders above ₹600' },
        { id: 'FREEDEL', title: 'Free Delivery Voucher', code: 'FREEDEL', discount: 35, desc: 'Get ₹35 discount on delivery charges' },
    ];

    const handleApplyInput = () => {
        if (!inputCode.trim()) return;
        const matched = OFFERS.find(o => o.code.toUpperCase() === inputCode.trim().toUpperCase());
        if (matched) {
            onApplyCoupon(matched.code, matched.discount);
        } else {
            onApplyCoupon(inputCode.trim().toUpperCase(), 50); // fallback promo code
        }
        onClose();
    };

    const handleSelectOffer = (offer: typeof OFFERS[0]) => {
        if (selectedOfferId === offer.id) {
            setSelectedOfferId(null);
        } else {
            setSelectedOfferId(offer.id);
            onApplyCoupon(offer.code, offer.discount);
            onClose();
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.sheetContainer}>
                            {/* Drag handle */}
                            <View style={styles.dragHandleContainer}>
                                <View style={styles.dragHandle} />
                            </View>

                            <View style={styles.header}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Tag size={20} color="#FF4732" />
                                    <Text style={styles.headerTitle}>Apply Coupon</Text>
                                </View>
                                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                    <X size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {/* Code Input Box */}
                                <View style={styles.inputCard}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Promo Code"
                                        placeholderTextColor="#9CA3AF"
                                        value={inputCode}
                                        onChangeText={setInputCode}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity style={styles.applyInputBtn} onPress={handleApplyInput}>
                                        <Text style={styles.applyInputText}>APPLY</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.sectionTitle}>Available Coupons</Text>

                                {OFFERS.map((offer) => {
                                    const isSelected = selectedOfferId === offer.id || currentCode === offer.code;
                                    return (
                                        <TouchableOpacity
                                            key={offer.id}
                                            style={[styles.offerCard, isSelected && styles.offerCardSelected]}
                                            onPress={() => handleSelectOffer(offer)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.offerCardLeft}>
                                                <View style={styles.iconCircle}>
                                                    <Ticket size={20} color="#F7A626" />
                                                </View>
                                                <View style={styles.offerDetails}>
                                                    <Text style={styles.offerCode}>{offer.code}</Text>
                                                    <Text style={styles.offerTitle}>{offer.title}</Text>
                                                    <Text style={styles.offerDesc}>{offer.desc}</Text>
                                                </View>
                                            </View>

                                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        minHeight: '60%',
        paddingBottom: 20,
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    inputCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    applyInputBtn: {
        backgroundColor: '#FF4732',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    applyInputText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    offerCardSelected: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF5F4',
    },
    offerCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#FFF4E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    offerDetails: {
        flex: 1,
    },
    offerCode: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FF4732',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    offerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    offerDesc: {
        fontSize: 12,
        color: '#6B7280',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#FF4732',
        borderColor: '#FF4732',
    },
});
