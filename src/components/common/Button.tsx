import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className,
  children,
  ...props 
}) => {
  return (
    <button
      className={clsx(
        'font-medium rounded-lg transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100': variant === 'secondary',
          'bg-green-600 text-white hover:bg-green-700': variant === 'success',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        'disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};