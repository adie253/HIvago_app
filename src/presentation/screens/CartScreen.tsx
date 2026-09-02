import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { useCart } from '../context/CartContext';
import { useUserLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { placeOrder, startPayment, getDeliveryQuote, reverseGeocode, fetchRestaurantById } from '../../data/api';
import { getFallbackImage } from '../../utils/imageUtils';
import { ArrowLeft, Trash2, MapPin, Truck, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

export const CartScreen = ({ navigation }: { navigation: any }) => {
    const { 
        cartItems, cartTotal, clearCart, restaurantId, restaurantName,
        addToCart, removeFromCart,
        fulfillmentType, setFulfillmentType,
        deliveryQuote, setDeliveryQuote,
        deliveryStatus, setDeliveryStatus,
        deliveryError, setDeliveryError,
        isCheckingDelivery, setIsCheckingDelivery,
        includeCutlery, setIncludeCutlery
    } = useCart();

    const { selectedLocation, addresses } = useUserLocation();
    const { showToast } = useToast();

    const [instructions, setInstructions] = useState('');
    const [tipAmount, setTipAmount] = useState(0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const [restaurantCoords, setRestaurantCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [restaurantPhone, setRestaurantPhone] = useState<string>("0000000000");
    const [restaurantAddress, setRestaurantAddress] = useState<string>("Restaurant Address");
    const [showDeliveryAreaModal, setShowDeliveryAreaModal] = useState(false);

    // Fetch restaurant details dynamically to resolve its exact coordinates
    useEffect(() => {
        const loadRestaurantDetails = async () => {
            if (!restaurantId) {
                setRestaurantCoords(null);
                setRestaurantPhone("0000000000");
                setRestaurantAddress("Restaurant Address");
                return;
            }
            try {
                const resDetails = await fetchRestaurantById(restaurantId);
                if (resDetails) {
                    if (resDetails.latitude != null && resDetails.longitude != null) {
                        setRestaurantCoords({
                            latitude: resDetails.latitude,
                            longitude: resDetails.longitude
                        });
                    }
                    if (resDetails.phone) {
                        setRestaurantPhone(resDetails.phone);
                    }
                    if (resDetails.addressLine) {
                        setRestaurantAddress(resDetails.addressLine);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch restaurant details:", e);
            }
        };
        loadRestaurantDetails();
    }, [restaurantId]);

    // Pricing calculations
    const deliveryFee = fulfillmentType === 'Pickup' ? 0 : (deliveryQuote?.deliveryFee || 0);
    const platformFee = cartItems.length > 0 ? 5 : 0;
    const gst = cartItems.length > 0 ? Math.round(cartTotal * 0.05) : 0;
    const grandTotal = cartTotal + deliveryFee + platformFee + gst + tipAmount;

    // Fetch delivery quote when location or items change
    useEffect(() => {
        const fetchQuote = async () => {
            if (fulfillmentType === 'Pickup' || !restaurantId || !selectedLocation) {
                setDeliveryQuote(null);
                setDeliveryStatus(null);
                return;
            }

            setIsCheckingDelivery(true);
            try {
                const pickupLat = restaurantCoords?.latitude ?? 18.5204;
                const pickupLng = restaurantCoords?.longitude ?? 73.8567;

                const quote = await getDeliveryQuote({
                    restaurantId,
                    pickupLatitude: pickupLat,
                    pickupLongitude: pickupLng,
                    dropLatitude: selectedLocation.latitude,
                    dropLongitude: selectedLocation.longitude,
                    orderAmount: cartTotal
                });

                if (quote) {
                    setDeliveryQuote(quote);
                    setDeliveryStatus('success');
                    setDeliveryError(null);
                } else {
                    setDeliveryStatus('error');
                    setDeliveryError("Delivery unavailable for this distance.");
                }
            } catch (err: any) {
                setDeliveryStatus('error');
                // Format the error nicely if it is a JSON string from backend
                let errorMsg = err.message || "Could not fetch delivery details.";
                if (errorMsg.includes('{')) {
                    try {
                        const parsed = JSON.parse(errorMsg.substring(errorMsg.indexOf('{')));
                        errorMsg = parsed.message || parsed.error || errorMsg;
                    } catch (_) {}
                }
                setDeliveryError(errorMsg);
            } finally {
                setIsCheckingDelivery(false);
            }
        };

        fetchQuote();
    }, [selectedLocation, restaurantId, cartTotal, fulfillmentType, restaurantCoords]);

    const handlePlaceOrder = async () => {
        if (!restaurantId) {
            showToast("Restaurant details are missing", "error");
            return;
        }

        if (fulfillmentType === 'Delivery' && !selectedLocation) {
            showToast("Please choose a delivery address", "warning");
            return;
        }

        if (!agreedToTerms) {
            showToast("Please agree to the terms to proceed", "warning");
            return;
        }

        setIsPlacingOrder(true);
        try {
            const customerPhone = localStorage.getItem('customer_phone') || "0000000000";

            // Resolve postal codes and cities via reverseGeocode
            let pickupPincode = '411001';
            let dropCity = 'Pune';
            let dropPincode = '411001';

            try {
                const dropGeo = selectedLocation?.latitude 
                    ? await reverseGeocode(selectedLocation.latitude, selectedLocation.longitude)
                    : null;
                if (dropGeo) {
                    dropCity = dropGeo.city || dropCity;
                    dropPincode = dropGeo.pincode || dropPincode;
                }
            } catch (_) {}

            const payload = {
                paymentId: selectedPaymentMethod,
                paymentTransactionId: "",
                deliveryQuoteId: deliveryQuote?.id || "",
                fulfillmentType: fulfillmentType,
                restaurantId: restaurantId,
                restaurantName: restaurantName || "Restaurant",
                restaurantPhone: restaurantPhone,
                pickupLatitude: restaurantCoords?.latitude ?? 18.5204,
                pickupLongitude: restaurantCoords?.longitude ?? 73.8567,
                pickupPincode: pickupPincode,
                pickupAddress: restaurantAddress,
                deliveryAddress: {
                    street: selectedLocation?.addressLine || "",
                    city: dropCity,
                    pincode: dropPincode,
                    latitude: selectedLocation?.latitude || 0,
                    longitude: selectedLocation?.longitude || 0,
                    landmark: selectedLocation?.landmark || null,
                    buildingName: "",
                    floor: "",
                    contactPhone: customerPhone,
                    instructions: instructions
                },
                items: cartItems.map(item => ({
                    menuItemId: item.menuItemId || item.id,
                    itemName: item.name,
                    itemDescription: item.description || "Description",
                    imageUrl: item.imageUrl || getFallbackImage(item.name),
                    unitPrice: item.price,
                    quantity: item.quantity,
                    specialInstructions: item.customizations || ""
                })),
                pricing: {
                    subTotal: cartTotal,
                    deliveryFee: deliveryFee,
                    tax: gst,
                    discount: 0,
                    packagingFee: 0,
                    serviceFee: platformFee,
                    tip: tipAmount,
                    discountCode: "",
                    discountDescription: ""
                },
                specialInstructions: includeCutlery ? `Include Cutlery. ${instructions}` : instructions
            };

            const order = await placeOrder(payload);

            if (selectedPaymentMethod === 'CASH') {
                showToast("Order placed successfully!", "success");
                clearCart();
                navigation.navigate('OrderTracking', { orderId: order.id });
            } else {
                const params = await startPayment(order.id);
                navigation.navigate('PaymentWebView', { 
                    paymentParams: params,
                    orderId: order.id
                });
            }

        } catch (e: any) {
            console.error("Order placement failed:", e);
            let errMsg = e.message || "Failed to place order. Please try again.";
            if (errMsg.includes('{')) {
                try {
                    const parsed = JSON.parse(errMsg.substring(errMsg.indexOf('{')));
                    errMsg = parsed.message || parsed.error || errMsg;
                } catch (_) {}
            }
            
            if (errMsg.includes("OutsideDeliveryArea") || errMsg.includes("outside restaurant's delivery area")) {
                setShowDeliveryAreaModal(true);
            } else {
                showToast(errMsg, "error");
            }
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ShoppingBag size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Add some items from your favorite restaurants</Text>
                <TouchableOpacity 
                    style={styles.exploreBtn}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Review Order</Text>
                <TouchableOpacity onPress={clearCart}>
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Restaurant Detail Banner */}
                <View style={styles.restaurantBanner}>
                    <Text style={styles.restaurantLabel}>Ordering from</Text>
                    <Text style={styles.restaurantNameVal}>{restaurantName}</Text>
                </View>

                {/* Fulfillment Picker */}
                <View style={styles.fulfillmentRow}>
                    <TouchableOpacity 
                        style={[styles.fulfillmentBtn, fulfillmentType === 'Delivery' && styles.fulfillmentBtnActive]}
                        onPress={() => setFulfillmentType('Delivery')}
                    >
                        <Text style={[styles.fulfillmentText, fulfillmentType === 'Delivery' && styles.fulfillmentTextActive]}>
                            Delivery
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.fulfillmentBtn, fulfillmentType === 'Pickup' && styles.fulfillmentBtnActive]}
                        onPress={() => setFulfillmentType('Pickup')}
                    >
                        <Text style={[styles.fulfillmentText, fulfillmentType === 'Pickup' && styles.fulfillmentTextActive]}>
                            Self Pickup
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Address Selector */}
                {fulfillmentType === 'Delivery' && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <MapPin size={18} color="#10B981" />
                            <Text style={styles.sectionTitle}>Delivery Address</Text>
                        </View>
                        {selectedLocation ? (
                            <View style={styles.addressSummary}>
                                <Text style={styles.addressLabel}>{selectedLocation.label}</Text>
                                <Text style={styles.addressText} numberOfLines={2}>{selectedLocation.addressLine}</Text>
                            </View>
                        ) : (
                            <Text style={styles.noAddressText}>No address selected. Tap to change.</Text>
                        )}
                        
                        {deliveryStatus === 'error' && (
                            <View style={styles.deliveryErrorContainer}>
                                <Text style={styles.deliveryErrorText}>
                                    ⚠️ {deliveryError || "Outside delivery area / delivery unavailable."}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.changeAddressBtn}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Text style={styles.changeAddressBtnText}>Select or Manage Addresses</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Cart Items List */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Selected Items</Text>
                    {cartItems.map((item) => (
                        <View key={item.id} style={styles.cartItemRow}>
                            <View style={styles.cartItemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {item.customizations && (
                                    <Text style={styles.itemCustomizations} numberOfLines={1}>{item.customizations}</Text>
                                )}
                                <Text style={styles.itemPrice}>₹{item.price}</Text>
                            </View>

                            <View style={styles.quantityContainer}>
                                <TouchableOpacity 
                                    style={styles.qtyBtn} 
                                    onPress={() => removeFromCart(item.id, true)}
                                >
                                    <Text style={styles.qtyBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity 
                                    style={styles.qtyBtn} 
                                    onPress={() => addToCart(item, restaurantId, restaurantName, true)}
                                >
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Delivery Tip Picker */}
                {fulfillmentType === 'Delivery' && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Tip your Delivery Partner</Text>
                        <Text style={styles.tipDesc}>100% of the tip goes directly to the delivery rider.</Text>
                        <View style={styles.tipRow}>
                            {[0, 20, 30, 50].map((amount) => (
                                <TouchableOpacity 
                                    key={amount}
                                    style={[styles.tipBtn, tipAmount === amount && styles.tipBtnActive]}
                                    onPress={() => setTipAmount(amount)}
                                >
                                    <Text style={[styles.tipBtnText, tipAmount === amount && styles.tipBtnTextActive]}>
                                        {amount === 0 ? 'No Tip' : `₹${amount}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Payment Option Selection */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <TouchableOpacity 
                        style={[styles.paymentSelectRow, selectedPaymentMethod === 'CASH' && styles.paymentSelectRowActive]}
                        onPress={() => setSelectedPaymentMethod('CASH')}
                    >
                        <View style={styles.paymentRadioOuter}>
                            {selectedPaymentMethod === 'CASH' && <View style={styles.paymentRadioInner} />}
                        </View>
                        <View style={styles.paymentSelectText}>
                            <Text style={styles.paymentSelectTitle}>Cash on Delivery</Text>
                            <Text style={styles.paymentSelectDesc}>Pay with cash or UPI at your door</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.paymentSelectRow, selectedPaymentMethod === 'ONLINE' && styles.paymentSelectRowActive]}
                        onPress={() => setSelectedPaymentMethod('ONLINE')}
                    >
                        <View style={styles.paymentRadioOuter}>
                            {selectedPaymentMethod === 'ONLINE' && <View style={styles.paymentRadioInner} />}
                        </View>
                        <View style={styles.paymentSelectText}>
                            <Text style={styles.paymentSelectTitle}>Online Payment (PayU)</Text>
                            <Text style={styles.paymentSelectDesc}>Pay securely via Cards, Netbanking, or UPI</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Order Summary breakdown */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemText}>Item Total</Text>
                        <Text style={styles.summaryItemVal}>₹{cartTotal}</Text>
                    </View>

                    {fulfillmentType === 'Delivery' && (
                        <>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryItemText}>Delivery Partner Fee</Text>
                                <Text style={styles.summaryItemVal}>
                                    {isCheckingDelivery ? '...' : deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}
                                </Text>
                            </View>
                            {tipAmount > 0 && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryItemText}>Delivery Tip</Text>
                                    <Text style={styles.summaryItemVal}>₹{tipAmount}</Text>
                                </View>
                            )}
                        </>
                    )}

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemText}>GST and Platform Charges</Text>
                        <Text style={styles.summaryItemVal}>₹{gst + platformFee}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalItem}>
                        <Text style={styles.totalText}>Grand Total</Text>
                        <Text style={styles.totalVal}>₹{grandTotal}</Text>
                    </View>
                </View>

                {/* Terms checkbox */}
                <TouchableOpacity 
                    style={styles.termsRow}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.8}
                >
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                        {agreedToTerms && <CheckCircle2 size={16} color="white" fill="#10B981" />}
                    </View>
                    <Text style={styles.termsText}>
                        I agree to all order guidelines and cancellation policies.
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Checkout Action */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[
                        styles.checkoutBtn, 
                        (!agreedToTerms || isPlacingOrder || (fulfillmentType === 'Delivery' && (!selectedLocation || deliveryStatus === 'error'))) && styles.checkoutBtnDisabled
                    ]}
                    onPress={handlePlaceOrder}
                    disabled={!agreedToTerms || isPlacingOrder || (fulfillmentType === 'Delivery' && (!selectedLocation || deliveryStatus === 'error'))}
                >
                    {isPlacingOrder ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.checkoutBtnText}>
                            {fulfillmentType === 'Delivery' && deliveryStatus === 'error' 
                                ? 'Delivery Unavailable' 
                                : `Place Order • ₹${grandTotal}`
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Delivery Area Warning Modal */}
            <Modal
                visible={showDeliveryAreaModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeliveryAreaModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.warningIconBadge}>
                                <MapPin size={32} color="#EF4444" />
                            </View>
                            <Text style={styles.modalTitle}>Outside Delivery Area</Text>
                            <Text style={styles.modalMessage}>
                                The delivery address is outside the restaurant's delivery range. Please choose a different delivery address or select self pickup.
                            </Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.primaryModalBtn}
                                onPress={() => {
                                    setShowDeliveryAreaModal(false);
                                    navigation.navigate('Profile');
                                }}
                            >
                                <Text style={styles.primaryModalBtnText}>Manage Addresses</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.secondaryModalBtn}
                                onPress={() => {
                                    setShowDeliveryAreaModal(false);
                                    setFulfillmentType('Pickup');
                                }}
                            >
                                <Text style={styles.secondaryModalBtnText}>Switch to Self Pickup</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelModalBtn}
                                onPress={() => setShowDeliveryAreaModal(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFFFFF',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    exploreBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 24,
    },
    exploreBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    scrollContent: {
        padding: 20,
        gap: 16,
        paddingBottom: 100,
    },
    restaurantBanner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    restaurantLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    restaurantNameVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 4,
    },
    fulfillmentRow: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
    },
    fulfillmentBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    fulfillmentBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fulfillmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    fulfillmentTextActive: {
        color: '#10B981',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    addressSummary: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    addressLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#374151',
    },
    addressText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    noAddressText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 12,
    },
    deliveryErrorContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    deliveryErrorText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
        lineHeight: 18,
    },
    changeAddressBtn: {
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
    },
    changeAddressBtnText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
    },
    cartItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    cartItemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    itemCustomizations: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
        marginTop: 4,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
    },
    qtyBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    qtyBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    qtyText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
        paddingHorizontal: 10,
    },
    tipDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
    },
    tipRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tipBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    tipBtnActive: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF0EF',
    },
    tipBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    tipBtnTextActive: {
        color: '#FF4732',
        fontWeight: 'bold',
    },
    paymentSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        marginBottom: 10,
        gap: 12,
    },
    paymentSelectRowActive: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF0EF',
    },
    paymentRadioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#9CA3AF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF4732',
    },
    paymentSelectText: {
        flex: 1,
    },
    paymentSelectTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    paymentSelectDesc: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryItemText: {
        fontSize: 13,
        color: '#6B7280',
    },
    summaryItemVal: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    totalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF4732',
    },
    termsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 4,
        marginBottom: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: '#FF4732',
    },
    termsText: {
        flex: 1,
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    checkoutBtn: {
        backgroundColor: '#FF4732',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutBtnDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    checkoutBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    warningIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    primaryModalBtn: {
        backgroundColor: '#FF4732',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        width: '100%',
    },
    primaryModalBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    secondaryModalBtn: {
        backgroundColor: '#FFF5F4',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#FFE3E0',
    },
    secondaryModalBtnText: {
        color: '#FF4732',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cancelModalBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
    },
    cancelModalBtnText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: 14,
    },
});
