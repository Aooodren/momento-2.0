import React from 'react';
import { cn } from './utils';
import { PressableButton } from './animations';
import { Sparkles, Zap } from 'lucide-react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// Composant bouton premium avec design noir élégant
export function PremiumButton({ 
  variant = 'primary',
  size = 'default',
  showIcon = true,
  icon,
  className,
  children,
  ...props 
}: PremiumButtonProps) {
  
  const variants = {
    primary: cn(
      "bg-gray-900 text-white border border-gray-700",
      "hover:bg-gray-800 hover:border-gray-600 hover:shadow-xl",
      "active:bg-gray-950 active:scale-[0.98]",
      "shadow-lg shadow-gray-900/20",
      "transition-all duration-200 ease-out",
      "font-medium",
      // Gradient subtil pour plus de style
      "bg-gradient-to-r from-gray-900 to-gray-800",
      "hover:from-gray-800 hover:to-gray-700"
    ),
    outline: cn(
      "border-2 border-gray-900 text-gray-900 bg-white",
      "hover:bg-gray-900 hover:text-white hover:shadow-lg",
      "active:bg-gray-950 active:scale-[0.98]",
      "transition-all duration-200 ease-out",
      "font-medium",
      "shadow-sm hover:shadow-md"
    )
  };

  const sizes = {
    sm: "h-9 px-3 text-sm gap-1.5",
    default: "h-10 px-4 text-sm gap-2", 
    lg: "h-11 px-6 text-base gap-2.5"
  };

  const defaultIcon = variant === 'primary' ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />;

  return (
    <PressableButton
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {showIcon && (icon || defaultIcon)}
      {children}
    </PressableButton>
  );
}

// Composant bouton d'action principal (CTA)
export function CTAButton({ 
  className,
  children,
  icon,
  size = "default",
  ...props 
}: PremiumButtonProps) {
  return (
    <PremiumButton
      variant="primary"
      size={size}
      icon={icon}
      className={cn(
        "relative overflow-hidden",
        // Effet de brillance au survol
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        className
      )}
      {...props}
    >
      {children}
    </PremiumButton>
  );
}

// Composant bouton de navigation principal
export function NavButton({
  className,
  children, 
  ...props
}: PremiumButtonProps) {
  return (
    <PremiumButton
      variant="outline"
      size="sm"
      showIcon={false}
      className={cn(
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </PremiumButton>
  );
}

// Composant bouton gradient pour les actions secondaires attirantes
export function GradientButton({
  className,
  children,
  icon,
  size = "default",
  ...props
}: PremiumButtonProps) {
  return (
    <PressableButton
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium",
        "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
        "hover:from-blue-700 hover:to-purple-700",
        "active:scale-[0.98] transition-all duration-200",
        "shadow-lg hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm gap-1.5",
        size === "default" && "h-10 px-4 text-sm gap-2",
        size === "lg" && "h-11 px-6 text-base gap-2.5",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </PressableButton>
  );
}