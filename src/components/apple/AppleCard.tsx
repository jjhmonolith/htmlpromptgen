import React from 'react';
import { clsx } from 'clsx';

export interface AppleCardProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  variant?: 'default' | 'glass' | 'strong';
  image?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: 'lift' | 'scale' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const AppleCard: React.FC<AppleCardProps> = ({
  size = 'medium',
  variant = 'default',
  image,
  title,
  description,
  action,
  children,
  className,
  onClick,
  hover = 'lift',
  padding = 'lg',
  ...props
}) => {
  const cardClasses = clsx(
    // Base styles
    'relative overflow-hidden cursor-pointer',
    'transition-apple',
    
    // Size classes
    {
      'apple-card-small': size === 'small',
      'apple-card-medium': size === 'medium',
      'apple-card-large': size === 'large',
      'apple-card-hero': size === 'hero',
    },

    // Variant classes
    {
      'apple-card': variant === 'default',
      'glass-card': variant === 'glass',
      'glass-strong': variant === 'strong',
    },

    // Hover effects
    {
      'hover-lift': hover === 'lift',
      'hover-scale': hover === 'scale',
    },

    className
  );

  const contentClasses = clsx(
    'relative h-full flex flex-col',
    {
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md',
      'p-8': padding === 'lg',
    }
  );

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {/* Background Image */}
      {image && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={contentClasses}>
        {(title || description) && (
          <div className={clsx(
            'flex-1 flex flex-col justify-end',
            image ? 'text-white relative z-10' : 'text-gray-900'
          )}>
            {title && (
              <h3 className={clsx(
                'font-semibold mb-2',
                size === 'hero' ? 'text-display-medium' : 
                size === 'large' ? 'text-headline-large' : 'text-headline-medium'
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={clsx(
                'opacity-90',
                size === 'hero' ? 'text-body-large' : 'text-body'
              )}>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Children content */}
        {children}

        {/* Action buttons */}
        {action && (
          <div className="mt-auto pt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};