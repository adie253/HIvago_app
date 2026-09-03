import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useUserLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getCustomerProfile, updateCustomerProfile, addAddress, deleteAddress, reverseGeocode } from '../../data/api';
import { User, MapPin, Plus, Trash2, Check, LogOut, Mail, Phone, Edit2, ChevronRight, Bell, HelpCircle, Package } from 'lucide-react-native';
import { CustomMapView } from '../components/CustomMapView';
import { getCurrentPositionWithFallback } from '../../utils/geolocation';

export const ProfileScreen = ({ navigation }: { navigation: any }) => {
    const { isLoggedIn } = useCart();
    const { addresses, selectLocation, selectedLocation, refreshAddresses } = useUserLocation();
    const { showToast } = useToast();

    // Customer details
    const [profile, setProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Edit profile state
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Add Address State
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [addressLabel, setAddressLabel] = useState('Home');
    const [addressLine, setAddressLine] = useState('');
    const [landmark, setLandmark] = useState('');
    const [latitude, setLatitude] = useState(18.5204);
    const [longitude, setLongitude] = useState(73.8567);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);

    const loadProfile = async () => {
        if (!isLoggedIn) {
            setProfile(null);
            setLoadingProfile(false);
            return;
        }
        try {
            const data = await getCustomerProfile();
            setProfile({
                name: data.name || '',
                email: data.email || '',
                phone: data.phoneNumber || data.phone || ''
            });
            setName(data.name || '');
            setEmail(data.email || '');
        } catch (e) {
            console.error("Failed to load profile:", e);
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [isLoggedIn]);

    const handleUpdateProfile = async () => {
        if (!name.trim() || !email.trim()) {
            showToast("Name and email are required", "warning");
            return;
        }
        setUpdatingProfile(true);
        try {
            await updateCustomerProfile({ name, email });
            setProfile(prev => prev ? { ...prev, name, email } : null);
            localStorage.setItem('customer_name', name);
            showToast("Profile updated successfully", "success");
            setIsEditProfileOpen(false);
        } catch (e) {
            showToast("Failed to update profile", "error");
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleAddAddress = async () => {
        if (!addressLine.trim()) {
            showToast("Address details are required", "warning");
            return;
        }
        setSavingAddress(true);
        try {
            await addAddress({
                label: addressLabel,
                addressLine: addressLine,
                landmark: landmark || undefined,
                latitude: latitude,
                longitude: longitude
            });
            await refreshAddresses();
            showToast("Address saved!", "success");
            setIsAddAddressOpen(false);
            setAddressLine('');
            setLandmark('');
        } catch (e) {
            showToast("Failed to save address", "error");
        } finally {
            setSavingAddress(false);
        }
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
            console.warn("Failed to reverse geocode location:", err);
        }
    };

    useEffect(() => {
        if (isAddAddressOpen) {
            setIsDetectingLocation(true);
            getCurrentPositionWithFallback(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLatitude(lat);
                    setLongitude(lng);
                    setIsDetectingLocation(false);
                    handleLocationChange(lat, lng);
                },
                (err, msg) => {
                    console.warn("Failed to get GPS in ProfileScreen modal:", err);
                    setIsDetectingLocation(false);
                }
            );
        }
    }, [isAddAddressOpen]);

    const handleDeleteAddress = async (id: string) => {
        try {
            await deleteAddress(id);
            await refreshAddresses();
            showToast("Address removed", "success");
        } catch (e) {
            showToast("Failed to delete address", "error");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_refresh_token');
        localStorage.removeItem('customer_token_expires_at');
        localStorage.removeItem('customer_id');
        localStorage.removeItem('customer_phone');
        localStorage.removeItem('customer_name');
        localStorage.removeItem('hivago_cart_v2');

        showToast("Logged out successfully", "success");
        navigation.navigate('SignIn');
    };

    if (!isLoggedIn) {
        return (
            <View style={styles.centerContainer}>
                <User size={48} color="#D1D5DB" />
                <Text style={styles.loginTitle}>Manage your Profile</Text>
                <Text style={styles.loginDesc}>Log in to manage your addresses and account settings</Text>
                <TouchableOpacity 
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate('SignIn')}
                >
                    <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loadingProfile) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4732" />
            </View>
        );
    }

    const sortedAddresses = useMemo(() => {
        return [...addresses].sort((a, b) => {
            const isADefault = selectedLocation?.id === a.id;
            const isBDefault = selectedLocation?.id === b.id;
            if (isADefault && !isBDefault) return -1;
            if (!isADefault && isBDefault) return 1;
            return 0;
        });
    }, [addresses, selectedLocation]);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Header User Info */}
                <View style={styles.userInfoCard}>
                    <View style={styles.avatarContainer}>
                        <User size={32} color="#F59E0B" />
                    </View>
                    <Text style={styles.userName}>{profile?.name || 'Guest User'}</Text>
                    <Text style={styles.userPhone}>{profile?.phone ? ` ${profile.phone}` : ''}</Text>
                    <Text style={styles.userEmail}>{profile?.email || ''}</Text>
                    
                    {/* Default Address Banner in Profile Header */}
                    {selectedLocation && (
                        <View style={styles.headerDefaultAddressBanner}>
                            <MapPin size={14} color="#A81C1C" style={{ marginRight: 6 }} />
                            <Text style={styles.headerDefaultAddressText} numberOfLines={1}>
                                <Text style={{ fontWeight: 'bold', color: '#A81C1C' }}>Default: </Text>
                                {selectedLocation.label ? `${selectedLocation.label} - ` : ''}{selectedLocation.addressLine}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditProfileOpen(true)}>
                        <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                        <View style={styles.statHeader}>
                            <Package size={14} color="#F59E0B" />
                            <Text style={[styles.statTitle, { color: '#F59E0B' }]}>TOTAL ORDERS</Text>
                        </View>
                        <Text style={styles.statValue}>1</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                        <View style={styles.statHeader}>
                            <MapPin size={14} color="#10B981" />
                            <Text style={[styles.statTitle, { color: '#10B981' }]}>SAVED ADDR</Text>
                        </View>
                        <Text style={styles.statValue}>{addresses.length}</Text>
                    </View>
                </View>

                {/* Saved Addresses Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Saved Addresses</Text>
                            <Text style={styles.sectionSubtitle}>Manage your delivery locations</Text>
                        </View>
                        <TouchableOpacity style={styles.addNewBtn} onPress={() => setIsAddAddressOpen(true)}>
                            <Plus size={14} color="white" />
                            <Text style={styles.addNewBtnText}>Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {sortedAddresses.length === 0 ? (
                        <Text style={styles.noAddressText}>No addresses saved yet.</Text>
                    ) : (
                        sortedAddresses.map((addr) => {
                            const isDefault = selectedLocation?.id === addr.id;
                            const isHome = addr.label.toLowerCase() === 'home';
                            const labelColor = isHome ? '#F59E0B' : '#10B981';
                            const labelBg = isHome ? '#FEF3C7' : '#D1FAE5';

                            return (
                                <View key={addr.id} style={[styles.addressCard, isDefault && styles.addressCardDefault]}>
                                    <View style={styles.addressCardTop}>
                                        <View style={[styles.addressLabelPill, { backgroundColor: labelBg }]}>
                                            {isHome ? <User size={10} color={labelColor} /> : <MapPin size={10} color={labelColor} />}
                                            <Text style={[styles.addressLabelText, { color: labelColor }]}>{addr.label.toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.addressActions}>
                                            <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteAddress(addr.id)}>
                                                <Trash2 size={14} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={styles.addressName}>{addr.addressLine.split(',')[0] || addr.label}</Text>
                                    <Text style={styles.addressFull} numberOfLines={1}>{addr.addressLine}</Text>
                                    
                                    <View style={styles.addressCardBottom}>
                                        <Text style={styles.setDefaultText}>{isDefault ? 'Default Address' : 'Set as Default'}</Text>
                                        <TouchableOpacity onPress={() => selectLocation(addr)} style={styles.radioWrapper}>
                                            <View style={[styles.radioCircle, isDefault && styles.radioCircleActive]}>
                                                {isDefault && <Check size={10} color="white" />}
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Settings Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Settings</Text>
                            <Text style={styles.sectionSubtitle}>Preferences & support options</Text>
                        </View>
                    </View>
                    <View style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingsRow}>
                            <View style={styles.settingsRowLeft}>
                                <Bell size={18} color="#6B7280" />
                                <Text style={styles.settingsRowText}>Notifications</Text>
                            </View>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingsRow}>
                            <View style={styles.settingsRowLeft}>
                                <HelpCircle size={18} color="#6B7280" />
                                <Text style={styles.settingsRowText}>Help & Support</Text>
                            </View>
                            <ChevronRight size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
                            <Text style={styles.sectionSubtitle}>Sensitive account operations</Text>
                        </View>
                    </View>
                    <View style={styles.settingsCard}>
                        <Text style={styles.logoutDesc}>Sign out of your active Hivago account on this device.</Text>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <LogOut size={16} color="#EF4444" />
                            <Text style={styles.logoutBtnText}>Logout Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Edit Profile Modal Form */}
            <Modal visible={isEditProfileOpen} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.input}
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setIsEditProfileOpen(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleUpdateProfile} disabled={updatingProfile}>
                                    {updatingProfile ? <ActivityIndicator color="white" /> : <Text style={styles.modalSaveText}>Save Changes</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Address Modal Form */}
            <Modal visible={isAddAddressOpen} transparent animationType="slide">
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Save New Address</Text>

                            {/* Map Selector */}
                            <View style={styles.mapContainer}>
                                <CustomMapView
                                    style={styles.map}
                                    latitude={latitude}
                                    longitude={longitude}
                                    onLocationChange={handleLocationChange}
                                />
                                <View style={styles.mapMarkerOverlay}>
                                    <Text style={styles.mapLabel}>Drag map or marker to pin your exact location</Text>
                                    {isDetectingLocation && <ActivityIndicator color="#FF4732" style={{ marginTop: 4 }} />}
                                </View>
                            </View>
                            
                            <Text style={styles.inputLabel}>Label</Text>
                            <View style={styles.labelPickerRow}>
                                {['Home', 'Work', 'Other'].map((lbl) => (
                                    <TouchableOpacity 
                                        key={lbl}
                                        style={[styles.labelBtn, addressLabel === lbl && styles.labelBtnActive]}
                                        onPress={() => setAddressLabel(lbl)}
                                    >
                                        <Text style={[styles.labelBtnText, addressLabel === lbl && styles.labelBtnTextActive]}>
                                            {lbl}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Street / Building Name</Text>
                            <TextInput 
                                style={styles.textArea}
                                placeholder="Flat/House no., Street name, Area"
                                multiline
                                numberOfLines={3}
                                value={addressLine}
                                onChangeText={setAddressLine}
                                placeholderTextColor="#9CA3AF"
                            />

                            <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                            <TextInput 
                                style={styles.textInput}
                                placeholder="e.g. Near Big Bazaar"
                                value={landmark}
                                onChangeText={setLandmark}
                                placeholderTextColor="#9CA3AF"
                            />

                            <View style={styles.modalFooter}>
                                <TouchableOpacity 
                                    style={[styles.modalBtn, styles.modalCancelBtn]}
                                    onPress={() => setIsAddAddressOpen(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalBtn, styles.modalSaveBtn]}
                                    onPress={handleAddAddress}
                                    disabled={savingAddress}
                                >
                                    {savingAddress ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.modalSaveText}>Save Address</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        gap: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    userInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 18,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FEF3C7',
        borderWidth: 2,
        borderColor: '#FDE68A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },
    headerDefaultAddressBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0EF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD4D0',
        marginBottom: 16,
        maxWidth: '100%',
    },
    headerDefaultAddressText: {
        fontSize: 12,
        color: '#374151',
        flex: 1,
    },
    editProfileBtn: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
    },
    editProfileBtnText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    statTitle: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionContainer: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4732',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    addNewBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    addressCardDefault: {
        borderColor: '#10B981',
        borderWidth: 1.5,
    },
    addressCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addressLabelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    addressLabelText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    addressActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionIcon: {
        padding: 4,
    },
    addressName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    addressFull: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
    },
    addressCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    setDefaultText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    radioWrapper: {
        padding: 4,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: '#10B981',
        backgroundColor: '#10B981',
    },
    settingsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsRowText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    logoutDesc: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    logoutBtnText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 14,
    },
    noAddressText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginVertical: 12,
    },
    loginTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
    },
    loginDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        marginBottom: 24,
    },
    loginBtn: {
        backgroundColor: '#FF4732',
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 14,
    },
    loginBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    mapContainer: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapMarkerOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    mapLabel: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginTop: 12,
    },
    labelPickerRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    labelBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    labelBtnActive: {
        borderColor: '#FF4732',
        backgroundColor: '#FFF0EF',
    },
    labelBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    labelBtnTextActive: {
        color: '#FF4732',
        fontWeight: 'bold',
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        color: '#1F2937',
        fontSize: 14,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#1F2937',
        fontSize: 14,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 16,
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelBtn: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalCancelText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    modalSaveBtn: {
        backgroundColor: '#FF4732',
    },
    modalSaveText: {
        color: 'white',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        color: '#1F2937',
        fontSize: 14,
    },
});
