import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { X, Star, Plus, Minus } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { getFallbackImage } from '../../utils/imageUtils';

interface ItemDetailOverlayProps {
    visible: boolean;
    item: any | null;
    onClose: () => void;
    onAddToCart: (item: any) => void;
}

export const ItemDetailOverlay: React.FC<ItemDetailOverlayProps> = ({
    visible,
    item,
    onClose,
    onAddToCart
}) => {
    const { cartItems, removeFromCart } = useCart();

    if (!visible || !item) return null;

    const cartItemsOfThisType = cartItems.filter(i => (i.menuItemId || i.id) === item.id);
    const quantity = cartItemsOfThisType.reduce((acc, i) => acc + i.quantity, 0);

    const handleRemove = () => {
        if (cartItemsOfThisType.length > 0) {
            removeFromCart(cartItemsOfThisType[cartItemsOfThisType.length - 1].id);
        }
    };

    const isVeg = item.type === 'Veg' || item.isVeg === true;

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
                        <View style={styles.cardContainer}>
                            {/* Dish Header Image */}
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: item.imageUrl || getFallbackImage(item.name) }}
                                    style={styles.image}
                                />
                                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                    <X size={20} color="#1F2937" />
                                </TouchableOpacity>

                                {item.bestseller && (
                                    <View style={styles.bestsellerBadge}>
                                        <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                                        <Text style={styles.bestsellerText}>BESTSELLER</Text>
                                    </View>
                                )}
                            </View>

                            {/* Details Content */}
                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                <View style={styles.titleRow}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.vegBadgeRow}>
                                            <View style={[styles.vegOuter, { borderColor: isVeg ? '#16A34A' : '#DC2626' }]}>
                                                <View style={[styles.vegInner, { backgroundColor: isVeg ? '#16A34A' : '#DC2626' }]} />
                                            </View>
                                            <Text style={[styles.vegText, { color: isVeg ? '#16A34A' : '#DC2626' }]}>
                                                {isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                            </Text>
                                        </View>
                                        <Text style={styles.dishName}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.dishPrice}>₹{item.price}</Text>
                                </View>

                                <Text style={styles.description}>
                                    {item.description || "A delicious freshly prepared dish packed with rich flavors, cooked to order with high-quality ingredients."}
                                </Text>
                            </ScrollView>

                            {/* Bottom Action Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerLabel}>
                                    {quantity > 0 ? `${quantity} in cart` : 'Customizable dish'}
                                </Text>

                                {quantity === 0 ? (
                                    <TouchableOpacity
                                        style={styles.addBtn}
                                        onPress={() => {
                                            onAddToCart(item);
                                            onClose();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.addBtnText}>ADD TO CART</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.counterRow}>
                                        <TouchableOpacity style={styles.counterBtn} onPress={handleRemove}>
                                            <Minus size={18} color="#FF4732" strokeWidth={2.5} />
                                        </TouchableOpacity>
                                        <Text style={styles.counterCount}>{quantity}</Text>
                                        <TouchableOpacity style={styles.counterBtn} onPress={() => onAddToCart(item)}>
                                            <Plus size={18} color="#FF4732" strokeWidth={2.5} />
                                        </TouchableOpacity>
                                    </View>
                                )}
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    imageContainer: {
        width: '100%',
        height: 220,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    bestsellerBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#16A34A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bestsellerText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    content: {
        padding: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    vegBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    vegOuter: {
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vegInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    vegText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dishName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 26,
    },
    dishPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    footerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    addBtn: {
        backgroundColor: '#FF4732',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE0DC',
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    counterBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterCount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        paddingHorizontal: 12,
    },
});
