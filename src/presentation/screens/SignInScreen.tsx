import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { sendOtp, verifyOtp, updateCustomerProfile } from '../../data/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Phone, Lock, User, Mail } from 'lucide-react-native';

export const SignInScreen = ({ navigation }: { navigation: any }) => {
    const { refreshLoginStatus } = useCart();
    const { showToast } = useToast();

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    
    // Register fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (phone.length < 10) {
            showToast("Please enter a valid phone number", "warning");
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

            // Only prompt for registration if logging in for the first time
            const isFirstTime = Boolean(data.isNewCustomer || data.isNewUser || data.isNew || data.isFirstTime);
            if (isFirstTime) {
                setStep('register');
            } else {
                showToast(`Welcome back${data.name ? `, ${data.name}` : ''}!`, "success");
                navigation.navigate('MainTabs');
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
            navigation.navigate('MainTabs');
        } catch (e: any) {
            showToast(e.message || "Failed to register details", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                {step === 'otp' && (
                    <TouchableOpacity style={styles.backButton} onPress={() => setStep('phone')}>
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                )}

                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Hivago</Text>
                    <Text style={styles.subtitleText}>Delicious meals delivered to your doorstep</Text>
                </View>

                {step === 'phone' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Login or Sign Up</Text>
                        <Text style={styles.cardLabel}>Enter your phone number to proceed</Text>
                        
                        <View style={styles.inputWrapper}>
                            <Phone size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input}
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                                maxLength={12}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.primaryButton} 
                            onPress={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Send OTP</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'otp' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Verify OTP</Text>
                        <Text style={styles.cardLabel}>Sent to +91 {phone}</Text>
                        
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input}
                                placeholder="4-Digit OTP"
                                keyboardType="number-pad"
                                value={otp}
                                onChangeText={setOtp}
                                maxLength={6}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.primaryButton} 
                            onPress={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Verify & Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'register' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Create Profile</Text>
                        <Text style={styles.cardLabel}>Help us know you better</Text>
                        
                        <View style={styles.inputWrapper}>
                            <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input}
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input}
                                placeholder="Email Address"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.primaryButton} 
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Save & Continue</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 8,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FF4732',
        letterSpacing: -1,
    },
    subtitleText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    cardLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        color: '#111827',
        fontSize: 15,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#FF4732',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#FF4732',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
