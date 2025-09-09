import React from 'react';
import { clsx } from 'clsx';

export interface AppleGridProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'container' | 'full' | 'screen';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppleGrid: React.FC<AppleGridProps> = ({
  children,
  className,
  maxWidth = 'container',
  spacing = 'lg',
  ...props
}) => {
  const gridClasses = clsx(
    'apple-grid',
    {
      'max-w-apple-container': maxWidth === 'container',
      'max-w-full': maxWidth === 'full',
      'max-w-screen-2xl': maxWidth === 'screen',
    },
    {
      'gap-apple-sm': spacing === 'sm',
      'gap-apple-md': spacing === 'md',
      'gap-apple-lg': spacing === 'lg',
      'gap-apple-xl': spacing === 'xl',
    },
    className
  );

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

// Grid item component for explicit column spanning
export interface AppleGridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
}

export const AppleGridItem: React.FC<AppleGridItemProps> = ({
  children,
  span = 1,
  start,
  className,
  ...props
}) => {
  const itemClasses = clsx(
    {
      'col-span-1': span === 1,
      'col-span-2': span === 2,
      'col-span-3': span === 3,
      'col-span-4': span === 4,
      'col-span-5': span === 5,
      'col-span-6': span === 6,
      'col-span-7': span === 7,
      'col-span-8': span === 8,
      'col-span-9': span === 9,
      'col-span-10': span === 10,
      'col-span-11': span === 11,
      'col-span-12': span === 12,
      'col-span-full': span === 'full',
    },
    {
      'col-start-1': start === 1,
      'col-start-2': start === 2,
      'col-start-3': start === 3,
      'col-start-4': start === 4,
      'col-start-5': start === 5,
      'col-start-6': start === 6,
      'col-start-7': start === 7,
      'col-start-8': start === 8,
      'col-start-9': start === 9,
      'col-start-10': start === 10,
      'col-start-11': start === 11,
      'col-start-12': start === 12,
    },
    className
  );

  return (
    <div className={itemClasses} {...props}>
      {children}
    </div>
  );
};