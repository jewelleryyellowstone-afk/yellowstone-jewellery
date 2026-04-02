import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Reusable Input Component
 * Mobile-optimized with proper touch targets
 */
const Input = forwardRef(({
    label,
    error,
    helperText,
    fullWidth = true,
    className = '',
    type = 'text',
    ...props
}, ref) => {
    return (
        <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
            {label && (
                <label className="text-sm font-medium text-neutral-700">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                ref={ref}
                type={type}
                className={cn(
                    'px-4 py-3 min-h-touch rounded-lg border bg-white',
                    'text-base text-neutral-900 placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:bg-neutral-100 disabled:cursor-not-allowed',
                    'transition-all duration-200',
                    error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300',
                    className
                )}
                {...props}
            />

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {helperText && !error && (
                <p className="text-sm text-neutral-500">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
