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
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    outline: "border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white",
    ghost: "hover:bg-gray-100"
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