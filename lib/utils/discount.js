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
        // Get discount from Firestore
        const { getAllDocuments } = await import('@/lib/firebase/firestore');
        const { data: discounts } = await getAllDocuments('coupons');

        const discount = discounts?.find(d =>
            d.code.toLowerCase() === code.toLowerCase().trim() && d.active
        );

        if (!discount) {
            return { valid: false, error: 'Invalid discount code' };
        }

        // Check if expired
        if (discount.expiryDate) {
            const expiryDate = new Date(discount.expiryDate);
            if (expiryDate < new Date()) {
                return { valid: false, error: 'This discount code has expired' };
            }
        }

        // Check minimum order value
        if (discount.minOrderValue && cartTotal < discount.minOrderValue) {
            return {
                valid: false,
                error: `Minimum order value of ₹${discount.minOrderValue} required`
            };
        }

        // Check usage limit
        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
            return { valid: false, error: 'This discount code has reached its usage limit' };
        }

        // Check per-user limit
        if (discount.maxUsesPerUser && userId) {
            const userUsageCount = discount.usedBy?.[userId] || 0;
            if (userUsageCount >= discount.maxUsesPerUser) {
                return { valid: false, error: 'You have already used this discount code' };
            }
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (cartTotal * discount.value) / 100;
            if (discount.maxDiscount) {
                discountAmount = Math.min(discountAmount, discount.maxDiscount);
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
        const { getDocument, updateDocument } = await import('@/lib/firebase/firestore');

        const { data: discount } = await getDocument('coupons', discountId);

        if (!discount) return;

        const updates = {
            usedCount: (discount.usedCount || 0) + 1,
        };

        if (userId) {
            updates.usedBy = {
                ...(discount.usedBy || {}),
                [userId]: ((discount.usedBy?.[userId] || 0) + 1),
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
        return `${discount.value}% OFF${discount.maxDiscount ? ` (up to ₹${discount.maxDiscount})` : ''}`;
    }
    return `₹${discount.value} OFF`;
}
