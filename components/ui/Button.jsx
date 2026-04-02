import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/**
 * Reusable Button Component
 * Mobile-optimized with proper touch targets
 * Renders <Link> if href is provided, otherwise <button>
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    href,
    type = 'button',
    className = '',
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variants = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
        ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-3 text-base min-h-touch', // 44px minimum touch target
        lg: 'px-6 py-4 text-lg min-h-[52px]',
    };

    const classes = cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
    );

    if (loading) {
        return (
            <button disabled className={classes} {...props}>
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </span>
            </button>
        );
    }

    if (href && !disabled) {
        return (
            <Link href={href} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={classes}
            {...props}
        >
            {children}
        </button>
    );
}
