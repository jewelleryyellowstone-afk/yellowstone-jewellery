'use client';

import { useCartContext } from '@/lib/context/CartContext';

/**
 * Custom hook for shopping cart management
 * Now just a wrapper around the CartContext
 */
export const useCart = () => {
    return useCartContext();
};
