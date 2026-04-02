/**
 * Utility functions for formatting
 */

/**
 * Format price in Indian Rupees
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted price (e.g., "₹1,299")
 */
export const formatPrice = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice
 * @param {number} salePrice
 * @returns {number} Discount percentage
 */
export const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Format date to readable string
 * @param {string|Date} date
 * @returns {string} Formatted date (e.g., "Dec 28, 2025")
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format date with time
 * @param {string|Date} date
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Generate slug from string
 * @param {string} text
 * @returns {string} URL-friendly slug
 */
export const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
};

/**
 * Truncate text to specified length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Format phone number for WhatsApp
 * @param {string} number - Phone number with country code
 * @returns {string} WhatsApp formatted number
 */
export const formatWhatsAppNumber = (number) => {
    // Remove all non-numeric characters
    return number.replace(/\D/g, '');
};

/**
 * Create WhatsApp link
 * @param {string} number - Phone number
 * @param {string} message - Pre-filled message
 * @returns {string} WhatsApp URL
 */
export const createWhatsAppLink = (number, message = '') => {
    const formattedNumber = formatWhatsAppNumber(number);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedNumber}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate Indian phone number
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate Indian pincode
 * @param {string} pincode
 * @returns {boolean}
 */
export const isValidPincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

/**
 * Get order status color
 * @param {string} status
 * @returns {string} Tailwind color class
 */
export const getOrderStatusColor = (status) => {
    const statusColors = {
        'new': 'bg-blue-100 text-blue-800',
        'confirmed': 'bg-purple-100 text-purple-800',
        'packed': 'bg-yellow-100 text-yellow-800',
        'shipped': 'bg-orange-100 text-orange-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Get payment status color
 * @param {string} status
 * @returns {string} Tailwind color class
 */
export const getPaymentStatusColor = (status) => {
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'success': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800',
        'refunded': 'bg-purple-100 text-purple-800',
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};
