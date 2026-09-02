import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import DIContainer from '../../di/container';
import { CartItem } from '../../core/entities/CartItem';
import { syncCart, isTokenValid, getCart, refreshToken, clearServerCart } from '../../data/api';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface CartContextType {
    cartItems: CartItem[];
    restaurantId?: string;
    restaurantName?: string;
    addToCart: (item: Omit<CartItem, 'quantity'>, rId?: string, rName?: string, silent?: boolean) => void;
    removeFromCart: (itemId: string, silent?: boolean) => void;
    clearCart: () => void;
    refreshCartFromServer: () => Promise<void>;
    cartTotal: number;
    refreshLoginStatus: () => void;
    deliveryQuote: any | null;
    setDeliveryQuote: (quote: any | null) => void;
    deliveryStatus: 'success' | 'error' | 'warning' | null;
    setDeliveryStatus: (status: 'success' | 'error' | 'warning' | null) => void;
    deliveryError: string | null;
    setDeliveryError: (error: string | null) => void;
    isCheckingDelivery: boolean;
    setIsCheckingDelivery: (isChecking: boolean) => void;
    reorder: (items: CartItem[], restaurantId: string, restaurantName: string) => Promise<void>;
    isLoggedIn: boolean;
    fulfillmentType: 'Delivery' | 'Pickup';
    setFulfillmentType: (type: 'Delivery' | 'Pickup') => void;
    includeCutlery: boolean;
    setIncludeCutlery: (include: boolean) => void;
    updateItemAddon: (itemId: string, addonId: string, action: 'add' | 'remove') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | undefined>(undefined);
    const [restaurantName, setRestaurantName] = useState<string | undefined>(undefined);
    const [isLoggedIn, setIsLoggedIn] = useState(isTokenValid());
    const [deliveryQuote, setDeliveryQuote] = useState<any | null>(null);
    const [deliveryStatus, setDeliveryStatus] = useState<'success' | 'error' | 'warning' | null>(null);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    const [isCheckingDelivery, setIsCheckingDelivery] = useState<boolean>(false);
    const [fulfillmentType, setFulfillmentTypeState] = useState<'Delivery' | 'Pickup'>('Delivery');

    const setFulfillmentType = (type: 'Delivery' | 'Pickup') => {
        setFulfillmentTypeState(type);
        showToast(`Switched to ${type} mode`, "success");
    };
    const [includeCutlery, setIncludeCutlery] = useState<boolean>(false);

    const hasSyncedAfterLogin = useRef(false);
    const sessionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Session Warning States
    const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    const [expiresInSeconds, setExpiresInSeconds] = useState(0);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    // Conflict State
    const [conflictInfo, setConflictInfo] = useState<{ name: string, id: string, type: 'reconcile' | 'add' } | null>(null);
    const [pendingItem, setPendingItem] = useState<{ item: Omit<CartItem, 'quantity'>, rId: string, rName: string } | null>(null);

    // RECONCILE CARTS
    const reconcileCarts = useCallback(async (localCart: any) => {
        if (!isLoggedIn || hasSyncedAfterLogin.current) return;

        try {
            const remoteCart = await getCart();
            const hasLocalItems = localCart?.items?.length > 0;
            const hasRemoteItems = remoteCart?.items?.length > 0;

            DIContainer.getClearCartUseCase().execute();

            if (hasLocalItems && hasRemoteItems && localCart.restaurantId !== remoteCart.restaurantId) {
                setConflictInfo({
                    name: remoteCart.restaurantName || "another restaurant",
                    id: remoteCart.restaurantId,
                    type: 'reconcile'
                });
                return;
            }

            let finalItems: CartItem[] = [];
            let finalRestaurantId = localCart.restaurantId || remoteCart?.restaurantId;
            let finalRestaurantName = localCart.restaurantName || remoteCart?.restaurantName;

            if (hasLocalItems && hasRemoteItems) {
                finalItems = performFrontendMerge(localCart.items, remoteCart.items);
            } else if (hasLocalItems) {
                finalItems = localCart.items;
            } else if (hasRemoteItems) {
                finalItems = convertServerItems(remoteCart.items);
                finalRestaurantId = remoteCart.restaurantId;
                finalRestaurantName = remoteCart.restaurantName;
            }

            setCartItems(finalItems);
            setRestaurantId(finalRestaurantId);
            setRestaurantName(finalRestaurantName);

            if (hasLocalItems && finalItems.length > 0) {
                const itemsPayload = finalItems.map(item => {
                    const p: any = {
                        menuItemId: item.menuItemId || item.id,
                        name: item.name,
                        unitPrice: item.price,
                        quantity: item.quantity,
                    };
                    if (item.selectedAddons && item.selectedAddons.length > 0) {
                        p.options = item.selectedAddons.map(addon => `${addon.groupName || 'Addon'}:${addon.name}`).join(",");
                    }
                    if (item.customizations && item.customizations !== "") p.specialInstructions = item.customizations;
                    return p;
                });

                await syncCart({
                    restaurantId: finalRestaurantId!,
                    restaurantName: finalRestaurantName || 'Restaurant',
                    items: itemsPayload
                }, true);
            }

        } catch (e) {
            console.error('Cart reconciliation failed:', e);
        } finally {
            hasSyncedAfterLogin.current = true;
        }
    }, [isLoggedIn]);

    const convertServerItems = (remoteItems: any[]): CartItem[] => {
        return remoteItems.map((rItem: any) => {
            const selectedAddons = Array.isArray(rItem.options)
                ? rItem.options.map((o: any) => ({
                    id: o.value || "",
                    name: o.value || "",
                    price: 0,
                    groupName: o.name || ""
                }))
                : [];

            return {
                id: rItem.id || (rItem.specialInstructions ? `${rItem.menuItemId}-${rItem.specialInstructions.substring(0, 8)}` : rItem.menuItemId),
                menuItemId: rItem.menuItemId,
                name: rItem.name,
                price: rItem.unitPrice,
                quantity: rItem.quantity,
                isVeg: true,
                isAddon: false,
                customizations: rItem.specialInstructions || undefined,
                selectedAddons: selectedAddons,
                description: Array.isArray(rItem.options)
                    ? rItem.options.map((o: any) => `${o.name}: ${o.value}`).join(", ")
                    : (typeof rItem.options === 'string' ? rItem.options : "")
            };
        });
    };

    const updateStateWithFinalCart = (items: CartItem[], rId: string, rName: string) => {
        setCartItems(items);
        setRestaurantId(rId);
        setRestaurantName(rName);

        if (!isLoggedIn) {
            DIContainer.getCartRepository().saveCart({
                restaurantId: rId,
                restaurantName: rName,
                items: items
            });
        }
    };

    const performFrontendMerge = (local: CartItem[], remote: any[]): CartItem[] => {
        const mergedMap = new Map<string, CartItem>();

        const remoteItems = convertServerItems(remote);
        remoteItems.forEach(item => {
            const key = `${item.menuItemId}-${item.customizations || ''}`;
            mergedMap.set(key, { ...item });
        });

        local.forEach(lItem => {
            const key = `${lItem.menuItemId}-${lItem.customizations || ''}`;
            if (mergedMap.has(key)) {
                const existing = mergedMap.get(key)!;
                existing.quantity += lItem.quantity;
            } else {
                mergedMap.set(key, { ...lItem });
            }
        });

        return Array.from(mergedMap.values());
    };

    // INIT CART
    useEffect(() => {
        const init = async () => {
            if (isLoggedIn) {
                const alreadySynced = sessionStorage.getItem('cart_reconciled') === 'true';

                if (alreadySynced) {
                    try {
                        const remoteCart = await getCart();
                        if (remoteCart?.items?.length > 0) {
                            const items = convertServerItems(remoteCart.items);
                            setCartItems(items);
                            setRestaurantId(remoteCart.restaurantId);
                            setRestaurantName(remoteCart.restaurantName);
                        }
                    } catch (e) {
                        console.error('Failed to load cart on reload:', e);
                    }
                } else {
                    const localCartData = DIContainer.getGetCartUseCase().execute();
                    await reconcileCarts(localCartData);
                    sessionStorage.setItem('cart_reconciled', 'true');
                }
            } else {
                const localCartData = DIContainer.getGetCartUseCase().execute();
                setCartItems(localCartData.items || []);
                setRestaurantId(localCartData.restaurantId);
                setRestaurantName(localCartData.restaurantName);
                hasSyncedAfterLogin.current = false;
            }
        };

        init();
    }, [isLoggedIn, reconcileCarts]);

    // Batched Sync to Server
    const debouncedPushToServer = useCallback((cartData: { restaurantId: string; restaurantName: string; items: CartItem[] }) => {
        if (!isLoggedIn) return;
        if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
        syncDebounceRef.current = setTimeout(async () => {
            try {
                const itemsPayload = cartData.items.map(i => {
                    const payload: any = {
                        menuItemId: i.menuItemId || i.id,
                        name: i.name,
                        unitPrice: i.price,
                        quantity: i.quantity,
                    };
                    if (i.selectedAddons && i.selectedAddons.length > 0) {
                        payload.options = i.selectedAddons.map(addon => `${addon.groupName || 'Addon'}:${addon.name}`).join(",");
                    }
                    if (i.customizations && i.customizations !== "") payload.specialInstructions = i.customizations;
                    return payload;
                });

                await clearServerCart();
                await syncCart({
                    restaurantId: cartData.restaurantId,
                    restaurantName: cartData.restaurantName || 'Restaurant',
                    items: itemsPayload
                }, true);
            } catch (err) {
                console.error("Failed to push cart to server:", err);
            }
        }, 800);
    }, [isLoggedIn]);

    // ADD TO CART
    const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, rId?: string, rName?: string, silent: boolean = false) => {
        let isExisting = false;
        let conflictDetected = false;
        setCartItems(existingItems => {
            const currentRestaurantId = existingItems.length > 0 ? restaurantId : undefined;

            if (currentRestaurantId && rId && currentRestaurantId !== rId) {
                conflictDetected = true;
                setConflictInfo({ id: rId, name: rName || 'Restaurant', type: 'add' });
                setPendingItem({ item, rId, rName: rName || 'Restaurant' });
                return existingItems;
            }

            const key = `${item.menuItemId || item.id}-${item.customizations || ''}`;
            const existingIndex = existingItems.findIndex(
                i => `${i.menuItemId || i.id}-${i.customizations || ''}` === key
            );

            isExisting = existingIndex >= 0;
            let updatedItems: CartItem[];
            if (isExisting) {
                updatedItems = existingItems.map((i, idx) =>
                    idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                updatedItems = [...existingItems, { ...item, quantity: 1 } as CartItem];
            }

            if (isLoggedIn) {
                debouncedPushToServer({
                    restaurantId: rId || currentRestaurantId!,
                    restaurantName: rName || restaurantName || 'Restaurant',
                    items: updatedItems
                });
            } else {
                DIContainer.getAddToCartUseCase().execute(item, rId || currentRestaurantId!, rName || restaurantName!);
            }

            setRestaurantId(rId || currentRestaurantId);
            setRestaurantName(rName || restaurantName);
            return updatedItems;
        });

        if (!silent && !conflictDetected) {
            if (isExisting) {
                showToast(`Updated ${item.name} quantity`, "success");
            } else {
                showToast(`Added ${item.name} to cart`, "success");
            }
        }
    }, [restaurantId, restaurantName, isLoggedIn, debouncedPushToServer, showToast]);

    // REORDER
    const reorder = useCallback(async (items: CartItem[], rId: string, rName: string) => {
        setCartItems(items);
        setRestaurantId(rId);
        setRestaurantName(rName);

        if (isLoggedIn) {
            try {
                const itemsPayload = items.map(i => ({
                    menuItemId: i.menuItemId || i.id,
                    name: i.name,
                    unitPrice: i.price,
                    quantity: i.quantity,
                    options: i.selectedAddons && i.selectedAddons.length > 0
                        ? i.selectedAddons.map(addon => `${addon.groupName || 'Addon'}:${addon.name}`).join(",")
                        : undefined,
                    specialInstructions: i.customizations
                }));

                await clearServerCart();
                await syncCart({
                    restaurantId: rId,
                    restaurantName: rName,
                    items: itemsPayload
                }, true);
            } catch (err) {
                console.error("Reorder sync failed:", err);
                showToast("Failed to reorder items", "error");
            }
        } else {
            DIContainer.getCartRepository().saveCart({
                restaurantId: rId,
                restaurantName: rName,
                items: items
            });
        }
        showToast(`Reordered items from ${rName}`, "success");
    }, [isLoggedIn, showToast]);

    // REMOVE
    const removeFromCart = useCallback((itemId: string, silent: boolean = false) => {
        if (isLoggedIn) {
            setCartItems(prev => {
                const updatedItems = prev
                    .map(i => i.id === itemId || i.menuItemId === itemId
                        ? { ...i, quantity: i.quantity - 1 }
                        : i
                    )
                    .filter(i => i.quantity > 0);

                const currentRestaurantId = updatedItems.length > 0 ? restaurantId : undefined;
                const currentRestaurantName = updatedItems.length > 0 ? restaurantName : undefined;

                setRestaurantId(currentRestaurantId);
                setRestaurantName(currentRestaurantName);

                if (updatedItems.length === 0) {
                    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
                    clearServerCart().catch(err => console.error("Failed to clear server cart:", err));
                } else if (currentRestaurantId) {
                    debouncedPushToServer({
                        restaurantId: currentRestaurantId,
                        restaurantName: currentRestaurantName || 'Restaurant',
                        items: updatedItems
                    });
                }
                return updatedItems;
            });
            
            if (!silent) {
                showToast("Removed from cart", "success");
            }
        } else {
            const updatedCartData = DIContainer.getRemoveFromCartUseCase().execute(itemId);
            setCartItems([...updatedCartData.items]);
            setRestaurantId(updatedCartData.restaurantId);
            setRestaurantName(updatedCartData.restaurantName);
            if (!silent) {
                showToast("Removed from cart", "success");
            }
        }
    }, [isLoggedIn, restaurantId, restaurantName, debouncedPushToServer, showToast]);
    
    // UPDATE ADDON
    const updateItemAddon = useCallback((itemId: string, addonId: string, action: 'add' | 'remove') => {
        setCartItems(prev => {
            const updatedItems = prev.map(item => {
                if (item.id !== itemId) return item;
                if (!item.selectedAddons) return item;

                let newAddons = [...item.selectedAddons];
                let priceAdjustment = 0;

                if (action === 'remove') {
                    const addonToRemove = newAddons.find(a => a.id === addonId);
                    if (addonToRemove) {
                        priceAdjustment = -addonToRemove.price;
                        newAddons = newAddons.filter(a => a.id !== addonId);
                    }
                }

                const newCustomizations = newAddons.map(a => a.name).join(", ");
                const finalCustomizations = item.customizations?.includes('|') 
                    ? `${newCustomizations} | ${item.customizations.split('|')[1].trim()}`
                    : `Selected: ${newCustomizations}`;

                return {
                    ...item,
                    price: item.price + priceAdjustment,
                    selectedAddons: newAddons,
                    customizations: newAddons.length > 0 ? finalCustomizations : (item.customizations?.split('|')[1]?.trim() || undefined)
                };
            });

            if (isLoggedIn && restaurantId) {
                debouncedPushToServer({
                    restaurantId,
                    restaurantName: restaurantName || 'Restaurant',
                    items: updatedItems
                });
            } else {
                DIContainer.getCartRepository().saveCart({
                    restaurantId,
                    restaurantName,
                    items: updatedItems
                });
            }

            return updatedItems;
        });
    }, [isLoggedIn, restaurantId, restaurantName, debouncedPushToServer]);

    // CLEAR
    const clearCart = useCallback(() => {
        DIContainer.getClearCartUseCase().execute();
        setCartItems([]);
        setRestaurantId(undefined);
        setRestaurantName(undefined);
        
        if (isLoggedIn) {
            clearServerCart().catch(err => console.error("Failed to clear server cart:", err));
        }
        showToast("Cart cleared", "success");
    }, [isLoggedIn, showToast]);

    const forceReplaceCart = async () => {
        if (!conflictInfo) return;
        const localCartData = DIContainer.getGetCartUseCase().execute();

        try {
            const syncResponse = await syncCart({
                restaurantId: localCartData.restaurantId!,
                restaurantName: localCartData.restaurantName || 'Restaurant',
                items: localCartData.items.map(item => ({
                    menuItemId: item.menuItemId || item.id,
                    name: item.name,
                    unitPrice: item.price,
                    quantity: item.quantity,
                    options: item.selectedAddons && item.selectedAddons.length > 0
                        ? item.selectedAddons.map(addon => `${addon.groupName || 'Addon'}:${addon.name}`).join(",")
                        : undefined,
                    specialInstructions: item.customizations || ""
                }))
            }, true);

            if (syncResponse && syncResponse.items) {
                const mergedItems = syncResponse.items.map((rItem: any) => ({
                    id: rItem.id || rItem.menuItemId,
                    menuItemId: rItem.menuItemId,
                    name: rItem.name,
                    price: rItem.unitPrice,
                    quantity: rItem.quantity,
                    isVeg: true,
                    isAddon: false,
                    customizations: rItem.specialInstructions || undefined,
                    description: Array.isArray(rItem.options)
                        ? rItem.options.map((o: any) => `${o.name}: ${o.value}`).join(", ")
                        : (typeof rItem.options === 'string' ? rItem.options : "")
                }));

                setCartItems(mergedItems);
                setRestaurantId(syncResponse.restaurantId);
                setRestaurantName(syncResponse.restaurantName);
                DIContainer.getCartRepository().saveCart({
                    restaurantId: syncResponse.restaurantId,
                    restaurantName: syncResponse.restaurantName,
                    items: mergedItems
                });
            }
        } catch (e) {
            console.error("Force replace failed:", e);
        } finally {
            setConflictInfo(null);
        }
    };

    const handleStartFresh = async () => {
        if (!conflictInfo) return;

        if (conflictInfo.type === 'reconcile') {
            await forceReplaceCart();
        } else {
            if (pendingItem) {
                try {
                    if (isLoggedIn) {
                        await clearServerCart();
                    }
                } catch (e) {
                    console.error("Failed to clear server cart:", e);
                }

                DIContainer.getClearCartUseCase().execute();

                const newItem = { ...pendingItem.item, quantity: 1 } as CartItem;
                setCartItems([newItem]);
                setRestaurantId(pendingItem.rId);
                setRestaurantName(pendingItem.rName);

                if (isLoggedIn) {
                    debouncedPushToServer({
                        restaurantId: pendingItem.rId,
                        restaurantName: pendingItem.rName,
                        items: [newItem]
                    });
                } else {
                    DIContainer.getAddToCartUseCase().execute(pendingItem.item, pendingItem.rId, pendingItem.rName);
                }

                showToast(`Added ${pendingItem.item.name} to fresh cart`, "success");
            }
            setConflictInfo(null);
            setPendingItem(null);
        }
    };

    const refreshCartFromServer = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const remoteCart = await getCart();
            if (remoteCart && remoteCart.items) {
                const convertedItems = convertServerItems(remoteCart.items);
                updateStateWithFinalCart(convertedItems, remoteCart.restaurantId, remoteCart.restaurantName);
            } else {
                updateStateWithFinalCart([], "", "");
                DIContainer.getClearCartUseCase().execute();
            }
        } catch (e) {
            console.error("Failed to refresh cart from server:", e);
        }
    }, [isLoggedIn]);

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const refreshLoginStatus = () => {
        setIsLoggedIn(isTokenValid());
        hasSyncedAfterLogin.current = false;
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_refresh_token');
        localStorage.removeItem('customer_token_expires_at');
        localStorage.removeItem('customer_id');
        localStorage.removeItem('customer_phone');
        localStorage.removeItem('customer_name');
        localStorage.removeItem('hivago_cart_v2');

        DIContainer.getClearCartUseCase().execute();
        setCartItems([]);
        setRestaurantId(undefined);
        setRestaurantName(undefined);
        sessionStorage.removeItem('cart_reconciled');
        hasSyncedAfterLogin.current = false;

        setIsLoggedIn(false);
        setIsSessionWarningOpen(false);
    }, []);

    const handleStayLoggedIn = async () => {
        setIsRefreshingToken(true);
        setRefreshError(null);
        const result = await refreshToken();
        setIsRefreshingToken(false);
        if (result) {
            setIsSessionWarningOpen(false);
            refreshLoginStatus();
        } else {
            setRefreshError("Could not extend session. Please log in again.");
            setTimeout(() => {
                handleLogout();
            }, 2500);
        }
    };

    // SESSION MONITORING
    useEffect(() => {
        const checkSession = () => {
            const expiresAt = localStorage.getItem('customer_token_expires_at');
            if (expiresAt && isLoggedIn) {
                const expiryTime = new Date(expiresAt).getTime();
                const now = Date.now();
                const timeLeft = expiryTime - now;
                const timeLeftSeconds = Math.max(0, Math.floor(timeLeft / 1000));

                setExpiresInSeconds(timeLeftSeconds);

                if (timeLeft <= 0) {
                    handleLogout();
                } else if (timeLeft < 5 * 60 * 1000) {
                    setIsSessionWarningOpen(true);
                } else {
                    setIsSessionWarningOpen(false);
                }
            } else {
                setIsSessionWarningOpen(false);
            }
        };

        if (isLoggedIn) {
            sessionCheckIntervalRef.current = setInterval(checkSession, 1000);
            checkSession();
        } else {
            if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
            setIsSessionWarningOpen(false);
        }

        return () => {
            if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
        };
    }, [isLoggedIn, handleLogout]);

    return (
        <CartContext.Provider value={{
            cartItems,
            restaurantId,
            restaurantName,
            addToCart,
            removeFromCart,
            clearCart,
            refreshCartFromServer,
            cartTotal,
            refreshLoginStatus,
            deliveryQuote,
            setDeliveryQuote,
            deliveryStatus,
            setDeliveryStatus,
            deliveryError,
            setDeliveryError,
            isCheckingDelivery,
            setIsCheckingDelivery,
            reorder,
            isLoggedIn,
            fulfillmentType,
            setFulfillmentType,
            includeCutlery,
            setIncludeCutlery,
            updateItemAddon
        }}>
            {children}

            {/* Session Expiry Warning Modal */}
            <Modal visible={isSessionWarningOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Session Expiring</Text>
                        <Text style={styles.modalDescription}>
                            Your session will expire in {Math.floor(expiresInSeconds / 60)}m {expiresInSeconds % 60}s. Would you like to stay logged in?
                        </Text>
                        {refreshError && <Text style={styles.errorText}>{refreshError}</Text>}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.buttonSecondary} onPress={handleLogout}>
                                <Text style={styles.buttonSecondaryText}>Logout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonPrimary} onPress={handleStayLoggedIn} disabled={isRefreshingToken}>
                                <Text style={styles.buttonPrimaryText}>
                                    {isRefreshingToken ? "Extending..." : "Stay Logged In"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Conflict Resolution Modal */}
            <Modal visible={conflictInfo !== null} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Restaurant Conflict</Text>
                        {conflictInfo && (
                            <Text style={styles.modalDescription}>
                                {conflictInfo.type === 'reconcile' ? (
                                    `Your existing remote cart has items from "${conflictInfo.name}". Would you like to clear it and start fresh with your guest items?`
                                ) : (
                                    `Your existing cart has items from "${restaurantName || 'another restaurant'}". Would you like to clear it and start fresh with items from "${conflictInfo.name}"?`
                                )}
                            </Text>
                        )}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={styles.buttonSecondary} 
                                onPress={() => {
                                    if (conflictInfo?.type === 'reconcile') {
                                        getCart().then(remoteCart => {
                                            if (remoteCart?.items) {
                                                const convertedItems = convertServerItems(remoteCart.items);
                                                setCartItems(convertedItems);
                                                setRestaurantId(remoteCart.restaurantId);
                                                setRestaurantName(remoteCart.restaurantName);
                                            }
                                        });
                                    }
                                    setConflictInfo(null);
                                    setPendingItem(null);
                                }}
                            >
                                <Text style={styles.buttonSecondaryText}>Keep Existing</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: '#FF4732' }]} onPress={handleStartFresh}>
                                <Text style={styles.buttonPrimaryText}>Start Fresh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: width - 40,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonPrimary: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonPrimaryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    buttonSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonSecondaryText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 15,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
});
