'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocument, setDocument } from '@/lib/supabase/db';

const CartContext = createContext();

const CART_STORAGE_KEY = 'yellowstone_cart';

export function CartProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [shippingSettings, setShippingSettings] = useState({
        freeShippingThreshold: parseFloat(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999),
        standardShipping: 50
    });
    const [gstSettings, setGstSettings] = useState({
        enabled: false,
        tax_percentage: 0
    });

    // Ref to prevent infinite loops and track initial sync
    const isInitialSyncDone = useRef(false);

    // Load local cart and shipping settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await getDocument('settings', 'store');
                if (data) {
                    setShippingSettings({
                        freeShippingThreshold: !isNaN(Number(data.free_shipping_threshold)) ? Number(data.free_shipping_threshold) : 999,
                        standardShipping: !isNaN(Number(data.standard_shipping)) ? Number(data.standard_shipping) : 50
                    });
                }
            } catch (err) {
                console.error('Failed to load store settings:', err);
            }
            try {
                const { data: gstData } = await getDocument('settings', 'gst');
                if (gstData) {
                    setGstSettings({
                        enabled: !!gstData.enabled,
                        tax_percentage: Number(gstData.tax_percentage) || 0,
                        gstin: gstData.gstin,
                        state_code: gstData.state_code
                    });
                }
            } catch (err) {
                console.error('Failed to load gst settings:', err);
            }
        };

        const loadLocalCart = () => {
            try {
                const storedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (storedCart) {
                    setCart(JSON.parse(storedCart));
                }
            } catch (error) {
                console.error('Error loading cart from storage:', error);
            }
            setLoading(false);
        };

        if (!authLoading) {
            // Only load local if not waitin for auth, OR if auth is done and no user (guest)
            // If user exists, we wait for the sync logic below
            if (!user) {
                loadLocalCart();
            }
            fetchSettings();
        }
    }, [authLoading, user]);


    // Sync with Firestore when User Logs In
    useEffect(() => {
        const syncCartWithCloud = async () => {
            if (!user || isInitialSyncDone.current) return;

            setIsSyncing(true);
            try {
                // 1. Get Local Cart
                let localCart = [];
                const storedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (storedCart) localCart = JSON.parse(storedCart);

                // 2. Get Cloud Cart
                const { data: userData } = await getDocument('users', user.id);
                const cloudCart = userData?.cart || [];

                // 3. Merge Carts (Local takes precedence if conflict? Or sum? Let's sum quantities)
                const mergedCart = [...cloudCart];

                localCart.forEach(localItem => {
                    const existingIndex = mergedCart.findIndex(
                        cloudItem => cloudItem.id === localItem.id && JSON.stringify(cloudItem.variant) === JSON.stringify(localItem.variant)
                    );

                    if (existingIndex > -1) {
                        // Item exists in both, update quantity if local has changed? 
                        // Actually, simplified approach: If local has items, we assume the user was shopping as guest and wants to KEEP those.
                        // We will just add quantities if they match.
                        mergedCart[existingIndex].quantity = Math.max(mergedCart[existingIndex].quantity, localItem.quantity); // Keep max for safety? Or sum?
                        // Let's use logic: If I add 1 item as guest, and had 1 in cloud, I probably want 2.
                        // But if I just logged in on a new device, local is empty.
                        // So we iterate localCart.
                    } else {
                        mergedCart.push(localItem);
                    }
                });

                setCart(mergedCart);

                // 4. Update Cloud immediately with merged state
                if (localCart.length > 0) {
                    await setDocument('users', user.id, { cart: mergedCart });
                    // Clear local storage logic? No, keep it as cache/backup.
                }

            } catch (error) {
                console.error("Cart sync error:", error);
            } finally {
                isInitialSyncDone.current = true;
                setIsSyncing(false);
                setLoading(false);
            }
        };

        if (user && !authLoading) {
            syncCartWithCloud();
        }
    }, [user, authLoading]);


    // Persist Cart Changes (Debounced for Cloud)
    useEffect(() => {
        if (loading || (user && !isInitialSyncDone.current)) return;

        // 1. Save to Local Storage always
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

        // 2. Save to Cloud if User exists (Debounce this in real app, but for now simple await)
        if (user) {
            const saveToCloud = async () => {
                try {
                    await setDocument('users', user.id, { cart });
                } catch (err) {
                    console.error("Failed to save cart to cloud", err);
                }
            };
            // Small timeout to prevent super frequent writes during rapid clicks
            const timeoutId = setTimeout(saveToCloud, 500);
            return () => clearTimeout(timeoutId);
        }

    }, [cart, user, loading]);

    const addToCart = (product, quantity = 1, variant = null) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => item.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (existingItemIndex > -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += quantity;
                return updatedCart;
            } else {
                return [...prevCart, {
                    id: product.id,
                    name: product.name,
                    price: product.salePrice || product.price,
                    originalPrice: product.price,
                    image: product.images?.[0] || '',
                    quantity,
                    variant,
                    stock: product.stock,
                }];
            }
        });
    };

    const removeFromCart = (productId, variant = null) => {
        setCart(prevCart =>
            prevCart.filter(
                item => !(item.id === productId && JSON.stringify(item.variant) === JSON.stringify(variant))
            )
        );
    };

    const updateQuantity = (productId, quantity, variant = null) => {
        if (quantity <= 0) {
            removeFromCart(productId, variant);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const isInCart = (productId, variant = null) => {
        return cart.some(
            item => item.id === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
        );
    };

    const getItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getSavings = () => {
        return cart.reduce((total, item) => {
            const saving = (item.originalPrice - item.price) * item.quantity;
            return total + (saving > 0 ? saving : 0);
        }, 0);
    };

    const getShippingCost = () => {
        const subtotal = getSubtotal();
        return subtotal >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShipping;
    };

    const getTaxAmount = () => {
        if (!gstSettings.enabled) return 0;
        const subtotal = getSubtotal();
        // Standard formula: Subtotal * (Tax% / 100)
        return (subtotal * gstSettings.tax_percentage) / 100;
    };

    const getTotal = () => {
        return getSubtotal() + getShippingCost() + getTaxAmount();
    };

    return (
        <CartContext.Provider value={{
            cart,
            loading: loading || isSyncing,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isInCart,
            getItemCount,
            getSubtotal,
            getSavings,
            getShippingCost,
            getTaxAmount,
            getTotal,
            gstSettings,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCartContext() {
    return useContext(CartContext);
}
