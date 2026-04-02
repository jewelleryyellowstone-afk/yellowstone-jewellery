import { cn } from '@/lib/utils/cn';

/**
 * Reusable Card Component
 */
export default function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div
            className={cn(
                'bg-white rounded-lg overflow-hidden',
                'shadow-card',
                hover && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Card Sub-components
 */
export function CardImage({ src, alt, className = '' }) {
    return (
        <div className={cn('relative w-full aspect-square bg-neutral-100', className)}>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
                loading="lazy"
            />
        </div>
    );
}

export function CardContent({ children, className = '' }) {
    return (
        <div className={cn('p-4', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={cn('font-medium text-neutral-900 line-clamp-2', className)}>
            {children}
        </h3>
    );
}

export function CardPrice({ price, originalPrice, className = '' }) {
    const hasDiscount = originalPrice && originalPrice > price;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span className="text-lg font-bold text-neutral-900">
                ₹{price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-sm text-neutral-500 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                        {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                    </span>
                </>
            )}
        </div>
    );
}
