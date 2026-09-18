import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Trash2 } from 'lucide-react-native';

interface ClearCartConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    restaurantName?: string;
}

export const ClearCartConfirmModal: React.FC<ClearCartConfirmModalProps> = ({
    visible,
    onClose,
    onConfirm,
    restaurantName
}) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.card}>
                            <View style={styles.iconCircle}>
                                <Trash2 size={28} color="#FF4732" />
                            </View>

                            <Text style={styles.title}>Items from another restaurant</Text>
                            <Text style={styles.subtitle}>
                                Your cart contains items from another restaurant. Would you like to reset your cart to add items from {restaurantName || 'this restaurant'}?
                            </Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.confirmBtn} 
                                    onPress={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.confirmText}>Reset Cart</Text>
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF5F4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FF4732',
        alignItems: 'center',
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
