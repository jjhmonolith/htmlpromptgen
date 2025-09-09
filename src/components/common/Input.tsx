import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  className,
  error,
  ...props 
}) => {
  return (
    <input
      className={clsx(
        'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
        {
          'border-gray-300 focus:ring-blue-500 focus:border-blue-500': !error,
          'border-red-500 focus:ring-red-500 focus:border-red-500': error,
        },
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
};