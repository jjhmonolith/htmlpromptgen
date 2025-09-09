import React from 'react';
import { clsx } from 'clsx';

export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const buttonClasses = clsx(
    // Base styles
    'inline-flex items-center justify-center font-medium rounded-apple-md',
    'transition-apple focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',

    // Size variants
    {
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-2.5 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
      'px-8 py-4 text-xl': size === 'xl',
    },

    // Color variants
    {
      // Primary
      'bg-apple-blue text-white hover:bg-apple-blue/90 focus:ring-apple-blue/50': 
        variant === 'primary',
      
      // Secondary
      'bg-apple-gray-2 text-apple-gray-9 hover:bg-apple-gray-3 focus:ring-apple-gray-4': 
        variant === 'secondary',
      
      // Ghost
      'text-apple-blue hover:bg-apple-blue/10 focus:ring-apple-blue/50': 
        variant === 'ghost',
      
      // Glass
      'glass-button-primary': variant === 'glass',
    },

    // Full width
    {
      'w-full': fullWidth,
    },

    className
  );

  const iconClasses = clsx(
    'flex-shrink-0',
    {
      'w-4 h-4': size === 'sm',
      'w-5 h-5': size === 'md',
      'w-6 h-6': size === 'lg',
      'w-7 h-7': size === 'xl',
    }
  );

  const content = (
    <>
      {loading && (
        <div className={clsx(iconClasses, 'animate-spin mr-2')}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            />
          </svg>
        </div>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <div className={clsx(iconClasses, 'mr-2')}>
          {icon}
        </div>
      )}
      
      <span>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <div className={clsx(iconClasses, 'ml-2')}>
          {icon}
        </div>
      )}
    </>
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
};