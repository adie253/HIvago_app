import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { ArrowLeft, Search, Navigation, Plus, Home, Briefcase, MapPin, Check, X } from 'lucide-react-native';
import { useUserLocation, Address } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { addAddress, reverseGeocode, isTokenValid } from '../../data/api';
import { CustomMapView } from './CustomMapView';
import { getCurrentPositionWithFallback } from '../../utils/geolocation';

interface LocationSelectorOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    navigation?: any;
}

export const LocationSelectorOverlay: React.FC<LocationSelectorOverlayProps> = ({ isOpen, onClose, navigation }) => {
    const { addresses, selectedLocation, isLoadingAddresses, selectLocation, refreshAddresses, useDeviceLocation } = useUserLocation();
    const { isLoggedIn } = useCart();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [isDetectingGps, setIsDetectingGps] = useState(false);

    // Add Address Form Modal state
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [addressLabel, setAddressLabel] = useState('Home');
    const [addressLine, setAddressLine] = useState('');
    const [landmark, setLandmark] = useState('');
    const [latitude, setLatitude] = useState(18.5204);
    const [longitude, setLongitude] = useState(73.8567);
    const [isDetectingMapGps, setIsDetectingMapGps] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Refresh addresses whenever the overlay opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            refreshAddresses();
        }
    }, [isOpen, refreshAddresses]);

    if (!isOpen) return null;

    // Filter addresses based on search query
    const filteredAddresses = addresses.filter((addr) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            (addr.label && addr.label.toLowerCase().includes(q)) ||
            (addr.addressLine && addr.addressLine.toLowerCase().includes(q)) ||
            (addr.landmark && addr.landmark.toLowerCase().includes(q))
        );
    });

    const handleUseCurrentLocation = async () => {
        setIsDetectingGps(true);
        try {
            await useDeviceLocation();
            onClose();
        } catch (err) {
            console.warn("GPS location error:", err);
            showToast("Failed to detect location", "error");
        } finally {
            setIsDetectingGps(false);
        }
    };

    const handleOpenAddAddress = () => {
        if (!isLoggedIn && !isTokenValid()) {
            showToast("Please log in to add a new address", "info");
            onClose();
            if (navigation) {
                navigation.navigate('SignIn');
            }
            return;
        }
        setIsAddAddressOpen(true);
    };

    const handleLocationChange = async (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        try {
            const res = await reverseGeocode(lat, lng);
            if (res && res.addressLine) {
                setAddressLine(res.addressLine);
            }
        } catch (err) {
            console.warn("Failed to reverse geocode:", err);
        }
    };

    const detectCurrentGpsForForm = () => {
        setIsDetectingMapGps(true);
        getCurrentPositionWithFallback(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLatitude(lat);
                setLongitude(lng);
                setIsDetectingMapGps(false);
                handleLocationChange(lat, lng);
            },
            () => {
                setIsDetectingMapGps(false);
                showToast("Could not detect GPS location", "warning");
            }
        );
    };

    const handleSaveAddress = async () => {
        if (!addressLine.trim()) {
            showToast("Please enter street/building name", "warning");
            return;
        }

        setIsSavingAddress(true);
        try {
            const res = await addAddress({
                label: addressLabel,
                addressLine: addressLine.trim(),
                landmark: landmark.trim() || undefined,
                latitude,
                longitude,
            });

            await refreshAddresses();
            showToast("Address saved successfully!", "success");

            if (res && res.id) {
                selectLocation({
                    id: res.id,
                    label: addressLabel,
                    addressLine: addressLine.trim(),
                    landmark: landmark.trim() || null,
                    isDefault: true,
                    latitude,
                    longitude
                });
            }

            setIsAddAddressOpen(false);
            setAddressLine('');
            setLandmark('');
            setAddressLabel('Home');
            onClose();
        } catch (err) {
            console.error("Save address error:", err);
            showToast("Failed to save address", "error");
        } finally {
            setIsSavingAddress(false);
        }
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header Bar */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.backButton}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={22} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Select your location</Text>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchBar}>
                            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search from saved addresses"
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <X size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={handleUseCurrentLocation}
                            disabled={isDetectingGps}
                            activeOpacity={0.8}
                        >
                            <View style={styles.actionIconBox}>
                                {isDetectingGps ? (
                                    <ActivityIndicator size="small" color="#A81C1C" />
                                ) : (
                                    <Navigation size={18} color="#A81C1C" />
                                )}
                            </View>
                            <View>
                                <Text style={styles.actionTitle}>Use Current</Text>
                                <Text style={styles.actionTitle}>Location</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={handleOpenAddAddress}
                            activeOpacity={0.8}
                        >
                            <View style={styles.actionIconBox}>
                                <Plus size={20} color="#A81C1C" />
                            </View>
                            <View>
                                <Text style={styles.actionTitle}>Add New</Text>
                                <Text style={styles.actionTitle}>Address</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Saved Addresses List */}
                    <View style={styles.listContainer}>
                        {isLoadingAddresses ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color="#A81C1C" />
                                <Text style={styles.loadingText}>Fetching your addresses...</Text>
                            </View>
                        ) : filteredAddresses.length === 0 ? (
                            <View style={styles.emptyBox}>
                                {!isLoggedIn && !isTokenValid() ? (
                                    <>
                                        <View style={styles.emptyIconCircle}>
                                            <MapPin size={28} color="#9CA3AF" />
                                        </View>
                                        <Text style={styles.emptyTitle}>Sign in to view saved addresses</Text>
                                        <Text style={styles.emptySubtitle}>Log in to manage your addresses and speed up checkout</Text>
                                        <TouchableOpacity
                                            style={styles.signInBtn}
                                            onPress={() => {
                                                onClose();
                                                if (navigation) navigation.navigate('SignIn');
                                            }}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.signInBtnText}>Sign In</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.emptyIconCircle}>
                                            <MapPin size={28} color="#9CA3AF" />
                                        </View>
                                        <Text style={styles.emptyTitle}>
                                            {searchQuery ? "No matching addresses found" : "No saved addresses yet"}
                                        </Text>
                                        <Text style={styles.emptySubtitle}>
                                            {searchQuery
                                                ? "Try searching for a different keyword"
                                                : "Tap 'Add New Address' above to add your first delivery location"}
                                        </Text>
                                    </>
                                )}
                            </View>
                        ) : (
                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={styles.scrollListContent}
                            >
                                {filteredAddresses.map((addr, index) => {
                                    const isSelected = selectedLocation?.id === addr.id;
                                    const labelLower = (addr.label || '').toLowerCase();
                                    const isHome = labelLower === 'home';
                                    const isWork = labelLower === 'work';

                                    // Display title: street / building / landmark / first part of address
                                    const displayTitle = addr.addressLine
                                        ? addr.addressLine.split(',')[0].trim() || addr.addressLine
                                        : addr.landmark || addr.label || 'Saved Location';

                                    const categoryLabel = (addr.label || 'OTHER').toUpperCase();

                                    return (
                                        <View key={addr.id || `addr-${index}`}>
                                            <TouchableOpacity
                                                style={styles.addressItemRow}
                                                onPress={() => {
                                                    selectLocation(addr);
                                                    onClose();
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                {/* Type Icon */}
                                                <View style={styles.addressIconWrapper}>
                                                    {isHome ? (
                                                        <Home size={18} color="#A81C1C" />
                                                    ) : isWork ? (
                                                        <Briefcase size={18} color="#A81C1C" />
                                                    ) : (
                                                        <MapPin size={18} color="#A81C1C" />
                                                    )}
                                                </View>

                                                {/* Address Info */}
                                                <View style={styles.addressInfoWrapper}>
                                                    <View style={styles.addressTitleRow}>
                                                        <Text style={styles.addressTitleText} numberOfLines={1}>
                                                            {displayTitle}
                                                        </Text>
                                                        {isSelected && (
                                                            <View style={styles.selectedBadge}>
                                                                <Text style={styles.selectedBadgeText}>SELECTED</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.addressCategoryText}>{categoryLabel}</Text>
                                                </View>

                                                {/* Checkmark icon */}
                                                {isSelected && (
                                                    <View style={styles.checkWrapper}>
                                                        <Check size={20} color="#10B981" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>

                                            {/* Item Divider */}
                                            {index < filteredAddresses.length - 1 && (
                                                <View style={styles.itemDivider} />
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>

                {/* Add Address Form Modal */}
                <Modal visible={isAddAddressOpen} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.formModalOverlay}>
                            <View style={styles.formModalContent}>
                                <View style={styles.formHeader}>
                                    <Text style={styles.formTitle}>Add New Address</Text>
                                    <TouchableOpacity
                                        onPress={() => setIsAddAddressOpen(false)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <X size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Map Container */}
                                    <View style={styles.mapBox}>
                                        <CustomMapView
                                            style={styles.mapView}
                                            latitude={latitude}
                                            longitude={longitude}
                                            onLocationChange={handleLocationChange}
                                        />
                                        <TouchableOpacity
                                            style={styles.detectGpsBtn}
                                            onPress={detectCurrentGpsForForm}
                                            disabled={isDetectingMapGps}
                                        >
                                            {isDetectingMapGps ? (
                                                <ActivityIndicator size="small" color="#A81C1C" />
                                            ) : (
                                                <Navigation size={14} color="#A81C1C" />
                                            )}
                                            <Text style={styles.detectGpsBtnText}>Detect GPS</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Label Selector */}
                                    <Text style={styles.formInputLabel}>Address Type</Text>
                                    <View style={styles.labelButtonRow}>
                                        {['Home', 'Work', 'Other'].map((lbl) => (
                                            <TouchableOpacity
                                                key={lbl}
                                                style={[
                                                    styles.labelOptionBtn,
                                                    addressLabel === lbl && styles.labelOptionBtnActive
                                                ]}
                                                onPress={() => setAddressLabel(lbl)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.labelOptionText,
                                                        addressLabel === lbl && styles.labelOptionTextActive
                                                    ]}
                                                >
                                                    {lbl}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Street / Building Name */}
                                    <Text style={styles.formInputLabel}>Street / Building Name *</Text>
                                    <TextInput
                                        style={styles.formTextArea}
                                        placeholder="Flat/House no., Building, Street name, Area"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={3}
                                        value={addressLine}
                                        onChangeText={setAddressLine}
                                    />

                                    {/* Landmark */}
                                    <Text style={styles.formInputLabel}>Landmark (Optional)</Text>
                                    <TextInput
                                        style={styles.formTextInput}
                                        placeholder="e.g. Near City Center, Opposite Bank"
                                        placeholderTextColor="#9CA3AF"
                                        value={landmark}
                                        onChangeText={setLandmark}
                                    />
                                </ScrollView>

                                <View style={styles.formActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setIsAddAddressOpen(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveBtn}
                                        onPress={handleSaveAddress}
                                        disabled={isSavingAddress}
                                    >
                                        {isSavingAddress ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={styles.saveBtnText}>Save Address</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 16 : 8,
        paddingBottom: 14,
    },
    backButton: {
        padding: 4,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    searchWrapper: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        paddingVertical: 0,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 18,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 18,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    actionIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF0EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 18,
    },
    listContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F8FAFC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    scrollListContent: {
        paddingVertical: 4,
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    emptyBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 240,
    },
    signInBtn: {
        marginTop: 18,
        backgroundColor: '#A81C1C',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
    signInBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    addressItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    addressIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF0EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    addressInfoWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    addressTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressTitleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        flexShrink: 1,
    },
    selectedBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    selectedBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.4,
    },
    addressCategoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    checkWrapper: {
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 68,
        marginRight: 16,
    },
    // Form Modal styles
    formModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },
    formModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
    },
    mapBox: {
        height: 140,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    mapView: {
        flex: 1,
    },
    detectGpsBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD4D0',
        gap: 4,
    },
    detectGpsBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#A81C1C',
    },
    formInputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    labelButtonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    labelOptionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    labelOptionBtnActive: {
        backgroundColor: '#FFF0EF',
        borderColor: '#A81C1C',
    },
    labelOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    labelOptionTextActive: {
        color: '#A81C1C',
        fontWeight: '700',
    },
    formTextArea: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1E293B',
        minHeight: 64,
        textAlignVertical: 'top',
        marginBottom: 14,
    },
    formTextInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1E293B',
        marginBottom: 16,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#A81C1C',
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
