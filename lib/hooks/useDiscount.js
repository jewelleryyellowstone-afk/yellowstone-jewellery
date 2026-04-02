/**
 * Custom hook for discount code management in checkout
 */

import { useState } from 'react';
import { validateDiscountCode, applyDiscount } from '@/lib/utils/discount';

export function useDiscount() {
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');
    const [validating, setValidating] = useState(false);

    const applyDiscountCode = async (code, cartTotal, userId = null) => {
        if (!code || code.trim() === '') {
            setDiscountError('Please enter a discount code');
            return;
        }

        setValidating(true);
        setDiscountError('');

        const result = await validateDiscountCode(code, cartTotal, userId);

        setValidating(false);

        if (result.valid) {
            setAppliedDiscount(result.discount);
            setDiscountCode(code);
            setDiscountError('');
            return result.discount;
        } else {
            setDiscountError(result.error);
            setAppliedDiscount(null);
            return null;
        }
    };

    const removeDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

    const calculateTotal = (cartTotal) => {
        return applyDiscount(cartTotal, appliedDiscount);
    };

    return {
        discountCode,
        setDiscountCode,
        appliedDiscount,
        discountError,
        validating,
        applyDiscountCode,
        removeDiscount,
        calculateTotal,
    };
}
