import React from "react";
import { cn } from "./utils";
import { cva, type VariantProps } from "class-variance-authority";

// Animation variants using class-variance-authority
const animationVariants = cva(
  "transition-all duration-200 ease-out",
  {
    variants: {
      type: {
        "fade-in": "animate-in fade-in duration-300",
        "fade-out": "animate-out fade-out duration-200",
        "slide-in-from-left": "animate-in slide-in-from-left-2 duration-300",
        "slide-in-from-right": "animate-in slide-in-from-right-2 duration-300", 
        "slide-in-from-top": "animate-in slide-in-from-top-2 duration-300",
        "slide-in-from-bottom": "animate-in slide-in-from-bottom-2 duration-300",
        "zoom-in": "animate-in zoom-in-95 duration-300",
        "zoom-out": "animate-out zoom-out-105 duration-200",
        "bounce": "animate-bounce",
        "pulse": "animate-pulse",
        "spin": "animate-spin",
        "hover-scale": "hover:scale-105 transition-transform duration-200",
        "hover-lift": "hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
        "press-scale": "active:scale-95 transition-transform duration-75",
      }
    },
    defaultVariants: {
      type: "fade-in",
    },
  }
);

export interface AnimationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animationVariants> {}

// Composant d'animation générique
export function Animated({ className, type, ...props }: AnimationProps) {
  return (
    <div
      className={cn(animationVariants({ type }), className)}
      {...props}
    />
  );
}

// Composants d'animation spécifiques
export function FadeIn({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in fade-in duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function SlideInFromLeft({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in slide-in-from-left-2 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function SlideInFromRight({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in slide-in-from-right-2 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function SlideInFromBottom({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in slide-in-from-bottom-2 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function ZoomIn({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in zoom-in-95 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

// Animation de stagger (décalée) pour listes
export function StaggeredList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("", className)}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-in slide-in-from-left-2 duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Hook pour animation au scroll
export function useInViewAnimation() {
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

// Composant avec animation au scroll
export function ScrollTrigger({ 
  children, 
  className,
  animation = "fade-in" 
}: { 
  children: React.ReactNode; 
  className?: string;
  animation?: "fade-in" | "slide-in-from-bottom" | "zoom-in";
}) {
  const { ref, isInView } = useInViewAnimation();

  const animationClasses = {
    "fade-in": "opacity-0 animate-in fade-in duration-700",
    "slide-in-from-bottom": "opacity-0 translate-y-4 animate-in slide-in-from-bottom duration-700",
    "zoom-in": "opacity-0 scale-95 animate-in zoom-in duration-700"
  };

  return (
    <div 
      ref={ref} 
      className={cn(
        isInView ? animationClasses[animation] : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// Composants avec micro-interactions
export function HoverCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "transition-all duration-300 hover:-translate-y-1 cursor-pointer",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function PressableButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn(
        "transition-all duration-100 active:scale-95 hover:scale-105",
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}

// Loading spinner avec animation
export function Spinner({ size = "default", className }: { size?: "sm" | "default" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", sizeClasses[size], className)} />
  );
}

// Pulse animation pour highlighting
export function HighlightPulse({ children, className, active = true }: { 
  children: React.ReactNode; 
  className?: string;
  active?: boolean;
}) {
  return (
    <div className={cn(active ? "animate-pulse bg-primary/10 rounded-lg" : "", className)}>
      {children}
    </div>
  );
}