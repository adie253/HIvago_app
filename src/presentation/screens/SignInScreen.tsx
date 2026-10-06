import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { sendOtp, verifyOtp, updateCustomerProfile } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useUserLocation } from '../context/LocationContext';
import { FooterLogoSvg } from '../components/FooterLogoSvg';
import { ArrowLeft, ShoppingBag, Menu, Home, ChevronDown, Check, Lock, User, Mail } from 'lucide-react-native';

export const SignInScreen = ({ navigation }: { navigation: any }) => {
    const { refreshLoginStatus, cartItems } = useCart();
    const { showToast } = useToast();
    const { selectedLocation } = useUserLocation();

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    const [isStaySignedIn, setIsStaySignedIn] = useState(true);

    // Register fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const isPhoneValid = phone.trim().length === 10;

    const handleSendOtp = async () => {
        if (!isPhoneValid) {
            showToast("Please enter a 10 digit phone number", "warning");
            return;
        }
        setLoading(true);
        try {
            await sendOtp(phone);
            setStep('otp');
            showToast("OTP sent successfully", "success");
        } catch (e: any) {
            showToast(e.message || "Failed to send OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 4) {
            showToast("Please enter a valid OTP", "warning");
            return;
        }
        setLoading(true);
        try {
            const data = await verifyOtp(phone, otp);

            // Save authentication details
            localStorage.setItem('customer_token', data.token || data.accessToken);
            localStorage.setItem('customer_token_expires_at', data.tokenExpiresAt || data.accessTokenExpiresAt || '');
            if (data.refreshToken) {
                localStorage.setItem('customer_refresh_token', data.refreshToken);
            }
            localStorage.setItem('customer_phone', phone);

            if (data.customerId) localStorage.setItem('customer_id', data.customerId);
            if (data.name) localStorage.setItem('customer_name', data.name);

            refreshLoginStatus();

            const isFirstTime = Boolean(data.isNewCustomer || data.isNewUser || data.isNew || data.isFirstTime);
            if (isFirstTime) {
                setStep('register');
            } else {
                showToast(`Welcome back${data.name ? `, ${data.name}` : ''}!`, "success");
                navigation.navigate('Home');
            }
        } catch (e: any) {
            showToast(e.message || "Invalid OTP. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim() || !email.trim()) {
            showToast("Name and email are required", "warning");
            return;
        }
        setLoading(true);
        try {
            const updated = await updateCustomerProfile({ name, email });
            localStorage.setItem('customer_name', updated.name);
            showToast("Registration completed!", "success");

            refreshLoginStatus();
            navigation.navigate('Home');
        } catch (e: any) {
            showToast(e.message || "Failed to register details", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Red Brand Header */}
            <View style={styles.brandHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
                    <FooterLogoSvg width={110} height={30} />
                </TouchableOpacity>

                <View style={styles.brandHeaderRight}>
                    <TouchableOpacity
                        style={styles.cartIconButton}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <ShoppingBag size={22} color="#FFFFFF" />
                        {cartItems.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Menu size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Your Location Sub-header Bar */}
            <View style={styles.locationSubHeader}>
                <View style={styles.homeIconContainer}>
                    <Home size={18} color="#A81C1C" />
                </View>
                <View style={styles.locationTextColumn}>
                    <Text style={styles.yourLocationLabel}>Your Location</Text>
                    <View style={styles.locationNameRow}>
                        <Text style={styles.locationNameText} numberOfLines={1}>
                            {selectedLocation ? selectedLocation.label || 'Home' : 'Home'}
                        </Text>
                        <ChevronDown size={14} color="#4B5563" style={{ marginLeft: 4 }} />
                    </View>
                </View>
            </View>

            {/* Main Form Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    
                    {step === 'phone' && (
                        <View style={styles.cardContent}>
                            <Text style={styles.welcomeTitle}>Welcome Back</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Enter your phone number to continue your culinary journey with Hivago.
                            </Text>

                            <Text style={styles.phoneLabel}>PHONE NUMBER</Text>

                            <View style={styles.phoneRow}>
                                <View style={styles.countryCodeBox}>
                                    <Text style={styles.countryCodeText}>+91</Text>
                                </View>

                                <View style={styles.phoneInputWrapper}>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Enter 10 digit number"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                        maxLength={10}
                                    />
                                </View>
                            </View>

                            {/* Stay Signed In Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsStaySignedIn(!isStaySignedIn)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, isStaySignedIn && styles.checkboxActive]}>
                                    {isStaySignedIn && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <Text style={styles.checkboxLabel}>Stay signed in</Text>
                            </TouchableOpacity>

                            {/* Get OTP Button */}
                            <TouchableOpacity
                                style={[styles.primaryBtn, isPhoneValid ? styles.primaryBtnActive : styles.primaryBtnDisabled]}
                                onPress={handleSendOtp}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Get OTP Code</Text>
                                )}
                            </TouchableOpacity>

                            {/* Legal Terms Disclaimer */}
                            <View style={styles.termsContainer}>
                                <Text style={styles.termsText}>
                                    By continuing, you agree to our{' '}
                                    <Text style={styles.linkText} onPress={() => navigation.navigate('Privacy')}>
                                        Terms of Service
                                    </Text>{' '}
                                    and{' '}
                                    <Text style={styles.linkText} onPress={() => navigation.navigate('Privacy')}>
                                        Privacy Policy
                                    </Text>
                                    .
                                </Text>
                            </View>
                        </View>
                    )}

                    {step === 'otp' && (
                        <View style={styles.cardContent}>
                            <TouchableOpacity style={styles.stepBackBtn} onPress={() => setStep('phone')}>
                                <ArrowLeft size={20} color="#1F2937" />
                            </TouchableOpacity>

                            <Text style={styles.welcomeTitle}>Verify OTP</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Enter the 6-digit OTP sent to +91 {phone}
                            </Text>

                            <View style={styles.otpInputWrapper}>
                                <Lock size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.otpInput}
                                    placeholder="Enter 6-digit OTP"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    value={otp}
                                    onChangeText={setOtp}
                                    maxLength={6}
                                    autoFocus={true}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryBtn, otp.length >= 4 ? styles.primaryBtnActive : styles.primaryBtnDisabled]}
                                onPress={handleVerifyOtp}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'register' && (
                        <View style={styles.cardContent}>
                            <Text style={styles.welcomeTitle}>Complete Profile</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Enter your name and email to set up your Hivago account.
                            </Text>

                            <View style={styles.profileInputWrapper}>
                                <User size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.profileInput}
                                    placeholder="Full Name"
                                    placeholderTextColor="#9CA3AF"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.profileInputWrapper}>
                                <Mail size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.profileInput}
                                    placeholder="Email Address"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryBtn, name.trim() && email.trim() ? styles.primaryBtnActive : styles.primaryBtnDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Save & Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    brandHeader: {
        backgroundColor: '#A81C1C',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 14,
        paddingHorizontal: 16,
    },
    brandHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
    },
    cartBadge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#FACC15',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#A81C1C',
        zIndex: 10,
    },
    cartBadgeText: {
        color: '#A81C1C',
        fontSize: 10,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 13,
        includeFontPadding: false,
    },
    menuIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    homeIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF0EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    locationTextColumn: {
        flex: 1,
    },
    yourLocationLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    locationNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
    },
    formContainer: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 40,
    },
    cardContent: {
        width: '100%',
    },
    stepBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#475569',
        marginTop: 8,
        lineHeight: 20,
    },
    phoneLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.6,
        marginTop: 32,
        marginBottom: 10,
    },
    phoneRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    countryCodeBox: {
        width: 70,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    phoneInputWrapper: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    phoneInput: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 18,
        marginBottom: 28,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#FF4732',
        borderColor: '#FF4732',
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    primaryBtn: {
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    primaryBtnActive: {
        backgroundColor: '#FF4732',
    },
    primaryBtnDisabled: {
        backgroundColor: '#FCA5A5',
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    termsContainer: {
        marginTop: 20,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    termsText: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 16,
    },
    linkText: {
        fontWeight: '700',
        color: '#1E293B',
        textDecorationLine: 'underline',
    },
    otpInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 24,
    },
    otpInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 2,
    },
    profileInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        marginTop: 16,
    },
    profileInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
});
