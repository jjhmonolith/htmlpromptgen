import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  className,
  children,
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};