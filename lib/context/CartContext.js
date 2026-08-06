'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocument } from '@/lib/supabase/db';

const CartContext = createContext();

const CART_STORAGE_KEY = 'yellowstone_cart';

export function CartProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
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
                    const parsed = JSON.parse(storedCart);
                    if (Array.isArray(parsed)) {
                        setCart(parsed);
                    }
                }
            } catch (error) {
                console.error('Error loading cart from storage:', error);
            } finally {
                isInitialSyncDone.current = true;
                setLoading(false);
            }
        };

        loadLocalCart();
        fetchSettings();
    }, []);

    // Persist Cart Changes to localStorage
    useEffect(() => {
        if (!isInitialSyncDone.current) return;
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (err) {
            console.error('Error saving cart to storage:', err);
        }
    }, [cart]);

    const addToCart = (product, quantity = 1, variant = null) => {
        if (!product || !product.id) return;

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => item.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (existingItemIndex > -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += quantity;
                return updatedCart;
            } else {
                // Safely extract price
                const price = Number(product.price || product.salePrice || product.sale_price || 0);
                const originalPrice = Number(product.original_price || product.originalPrice || price);

                // Safely extract image URL
                let image = '/placeholder-product.jpg';
                if (Array.isArray(product.images) && product.images.length > 0) {
                    image = product.images[0];
                } else if (typeof product.images === 'string' && product.images.length > 0) {
                    try {
                        const parsed = JSON.parse(product.images);
                        if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
                        else if (typeof parsed === 'string' && parsed.startsWith('http')) image = parsed;
                    } catch (e) {
                        if (product.images.startsWith('http')) image = product.images;
                    }
                } else if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
                    image = product.image;
                } else if (product.image_url && typeof product.image_url === 'string' && product.image_url.startsWith('http')) {
                    image = product.image_url;
                }

                return [...prevCart, {
                    id: product.id,
                    name: product.name || 'Product',
                    price: price,
                    originalPrice: originalPrice,
                    image: image || '/placeholder-product.jpg',
                    quantity: Number(quantity) || 1,
                    variant: variant || null,
                    stock: product.stock !== undefined ? product.stock : 99,
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
            loading: loading,
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
