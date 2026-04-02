/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}
