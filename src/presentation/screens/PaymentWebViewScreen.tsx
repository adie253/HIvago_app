import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { verifyPayment } from '../../data/api';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft } from 'lucide-react-native';

export const PaymentWebViewScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { paymentParams, orderId } = route.params;
    const { showToast } = useToast();
    const { clearCart } = useCart();
    const [loading, setLoading] = useState(true);

    // Support camelCase, lowercase, and aliases for PayU parameters
    const payUBaseUrl = paymentParams?.payUBaseUrl || paymentParams?.payuBaseUrl || paymentParams?.baseUrl || paymentParams?.payUri || paymentParams?.payuUri || paymentParams?.action || paymentParams?.paymentUrl || paymentParams?.payUrl || '';
    const key = paymentParams?.key || '';
    const txnId = paymentParams?.txnId || paymentParams?.txnid || paymentParams?.transactionId || '';
    const amount = paymentParams?.amount || '';
    const productInfo = paymentParams?.productInfo || paymentParams?.productinfo || '';
    const firstName = paymentParams?.firstName || paymentParams?.firstname || '';
    const email = paymentParams?.email || '';
    const phone = paymentParams?.phone || '';
    const surl = paymentParams?.surl || '';
    const furl = paymentParams?.furl || '';
    const hash = paymentParams?.hash || '';

    // Determine current app origin so PayU returns directly to the active app instance
    const currentOrigin = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin
        : '';

    const effectiveSurl = (currentOrigin && !currentOrigin.startsWith('file:'))
        ? `${currentOrigin}/payment_success?orderId=${orderId}`
        : (surl || `https://hivago.vercel.app/payment_success?orderId=${orderId}`);

    const effectiveFurl = (currentOrigin && !currentOrigin.startsWith('file:'))
        ? `${currentOrigin}/payment_failed?orderId=${orderId}`
        : (furl || `https://hivago.vercel.app/payment_failed?orderId=${orderId}`);

    // Automatically submit form on web to prevent iframe X-Frame-Options blocking
    useEffect(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            const timer = setTimeout(() => {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = payUBaseUrl;
                
                const params: Record<string, string> = {
                    key,
                    txnid: txnId,
                    amount: String(amount),
                    productinfo: productInfo,
                    firstname: firstName,
                    email,
                    phone,
                    surl: effectiveSurl,
                    furl: effectiveFurl,
                    hash
                };

                Object.keys(params).forEach(k => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = k;
                    input.value = params[k] || '';
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [payUBaseUrl, key, txnId, amount, productInfo, firstName, email, phone, effectiveSurl, effectiveFurl, hash]);

    const selfSubmittingFormHtml = `
      <html>
        <head>
          <title>Redirecting to Payment Gateway...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #F9FAFB;
              color: #4B5563;
            }
            .loader {
              border: 4px solid #F3F4F6;
              border-top: 4px solid #FF4732;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin-bottom: 16px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body onload="document.forms[0].submit()">
          <div class="loader"></div>
          <div>Connecting to PayU Secure Payment...</div>
          <form method="POST" action="${payUBaseUrl}">
            <input type="hidden" name="key" value="${key}" />
            <input type="hidden" name="txnid" value="${txnId}" />
            <input type="hidden" name="amount" value="${amount}" />
            <input type="hidden" name="productinfo" value="${productInfo}" />
            <input type="hidden" name="firstname" value="${firstName}" />
            <input type="hidden" name="email" value="${email}" />
            <input type="hidden" name="phone" value="${phone}" />
            <input type="hidden" name="surl" value="${effectiveSurl}" />
            <input type="hidden" name="furl" value="${effectiveFurl}" />
            <input type="hidden" name="hash" value="${hash}" />
          </form>
        </body>
      </html>
    `;

    const handleNavigationStateChange = async (navState: any) => {
        const url = navState.url;
        
        // Check if redirected to Success or Failure URL
        const isSuccess = url.includes(effectiveSurl) || url.includes('payment_success') || url.includes('payment/success') || url.includes('/payments/success');
        const isFailure = url.includes(effectiveFurl) || url.includes('payment_failed') || url.includes('payment/failure') || url.includes('/payments/failure') || url.includes('payment/cancel');

        if (isSuccess) {
            setLoading(true);
            try {
                const response = await verifyPayment(txnId);
                if (response && (response.status === 'success' || response.status === 'SUCCESS')) {
                    showToast("Payment verified successfully!", "success");
                    clearCart();
                    navigation.navigate('OrderTracking', { orderId });
                } else {
                    showToast("Payment verification failed", "error");
                    navigation.goBack();
                }
            } catch (err) {
                console.error("Payment verification failed:", err);
                showToast("Could not verify payment", "error");
                navigation.goBack();
            }
        } else if (isFailure) {
            showToast("Payment cancelled or failed", "error");
            navigation.navigate('PaymentFailed', { orderId });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Secure Checkout</Text>
            </View>

            {Platform.OS === 'web' ? (
                <View style={styles.webContainer}>
                    <ActivityIndicator size="large" color="#FF4732" />
                    <Text style={styles.loadingText}>Redirecting to PayU Secure Payment Gateway...</Text>
                </View>
            ) : (
                <WebView 
                    source={{ html: selfSubmittingFormHtml }}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    style={styles.webview}
                />
            )}

            {Platform.OS !== 'web' && loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FF4732" />
                    <Text style={styles.loadingText}>Connecting to PayU Payment Gateway...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 12,
    },
    webContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 40,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
});
