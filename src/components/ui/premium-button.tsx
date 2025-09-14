import React from 'react';
import { cn } from './utils';
import { Button } from './button';

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

// Composant bouton simple avec fond noir pour les actions importantes
export function SimpleButton({ 
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props 
}: SimpleButtonProps) {
  
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
    outline: "border-2 border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white",
    ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
  };

  return (
    <Button
      className={cn(
        variants[variant],
        className
      )}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
}

// Alias pour simplicité - bouton noir pour les actions principales
export const CTAButton = SimpleButton;