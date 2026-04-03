/**
 * Discount Code Validation and Application
 */

/**
 * Validate a discount code
 */
export async function validateDiscountCode(code, cartTotal, userId = null) {
    if (!code || code.trim() === '') {
        return { valid: false, error: 'Please enter a discount code' };
    }

    try {
        // Get discount from Supabase
        const { getAllDocuments } = await import('@/lib/supabase/db');
        const { data: discounts } = await getAllDocuments('coupons');

        const discount = discounts?.find(d =>
            d.code.toLowerCase() === code.toLowerCase().trim() && d.active
        );

        if (!discount) {
            return { valid: false, error: 'Invalid discount code' };
        }

        // Check if expired
        if (discount.expiry_date) {
            const expiryDate = new Date(discount.expiry_date);
            if (expiryDate < new Date()) {
                return { valid: false, error: 'This discount code has expired' };
            }
        }

        // Check minimum order value
        if (discount.min_order_value && cartTotal < discount.min_order_value) {
            return {
                valid: false,
                error: `Minimum order value of ₹${discount.min_order_value} required`
            };
        }

        // Check usage limit
        if (discount.max_uses && discount.used_count >= discount.max_uses) {
            return { valid: false, error: 'This discount code has reached its usage limit' };
        }

        // Check per-user limit
        if (discount.max_uses_per_user && userId) {
            const userUsageCount = discount.used_by?.[userId] || 0;
            if (userUsageCount >= discount.max_uses_per_user) {
                return { valid: false, error: 'You have already used this discount code' };
            }
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (cartTotal * discount.value) / 100;
            if (discount.max_discount) {
                discountAmount = Math.min(discountAmount, discount.max_discount);
            }
        } else {
            discountAmount = discount.value;
        }

        return {
            valid: true,
            discount: {
                id: discount.id,
                code: discount.code,
                type: discount.type,
                value: discount.value,
                amount: discountAmount,
                description: discount.description,
            },
        };
    } catch (error) {
        console.error('Discount validation error:', error);
        return { valid: false, error: 'Failed to validate discount code' };
    }
}

/**
 * Apply discount to cart
 */
export function applyDiscount(cartTotal, discount) {
    if (!discount || !discount.amount) {
        return {
            subtotal: cartTotal,
            discount: 0,
            total: cartTotal,
        };
    }

    const discountAmount = Math.min(discount.amount, cartTotal);

    return {
        subtotal: cartTotal,
        discount: discountAmount,
        total: cartTotal - discountAmount,
        appliedCode: discount.code,
    };
}

/**
 * Record discount usage
 */
export async function recordDiscountUsage(discountId, userId = null) {
    try {
        const { getDocument, updateDocument } = await import('@/lib/supabase/db');

        const { data: discount } = await getDocument('coupons', discountId);

        if (!discount) return;

        const updates = {
            used_count: (discount.used_count || 0) + 1,
        };

        if (userId) {
            updates.used_by = {
                ...(discount.used_by || {}),
                [userId]: ((discount.used_by?.[userId] || 0) + 1),
            };
        }

        await updateDocument('coupons', discountId, updates);
    } catch (error) {
        console.error('Failed to record discount usage:', error);
    }
}

/**
 * Format discount for display
 */
export function formatDiscount(discount) {
    if (discount.type === 'percentage') {
        return `${discount.value}% OFF${discount.max_discount ? ` (up to ₹${discount.max_discount})` : ''}`;
    }
    return `₹${discount.value} OFF`;
}
