// Variants standardisées pour le design system - Momento 2.0
import { cva } from "class-variance-authority";

// =============================================================================
// BUTTON VARIANTS
// =============================================================================
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      state: {
        default: "",
        loading: "cursor-wait opacity-70",
        disabled: "cursor-not-allowed opacity-50",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

// =============================================================================
// CARD VARIANTS
// =============================================================================
export const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-md",
        outlined: "border-2",
        ghost: "border-transparent shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6", 
        lg: "p-8",
      },
      interactive: {
        false: "",
        true: "transition-all hover:shadow-md cursor-pointer",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false,
    },
  }
);

// =============================================================================
// INPUT VARIANTS  
// =============================================================================
export const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      }
    },
    defaultVariants: {
      variant: "default", 
      size: "default",
    },
  }
);

// =============================================================================
// BADGE VARIANTS
// =============================================================================
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs", 
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// =============================================================================
// ALERT VARIANTS
// =============================================================================
export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&>svg]:text-green-600",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&>svg]:text-yellow-600",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 [&>svg]:text-blue-600",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// =============================================================================
// SKELETON VARIANTS
// =============================================================================
export const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
      },
      speed: {
        slow: "animate-pulse",
        normal: "animate-pulse",
        fast: "animate-ping",
      }
    },
    defaultVariants: {
      variant: "default",
      speed: "normal",
    },
  }
);

// =============================================================================
// CONTAINER VARIANTS
// =============================================================================
export const containerVariants = cva(
  "mx-auto",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        default: "max-w-7xl",
        lg: "max-w-screen-2xl",
        full: "max-w-full",
      },
      padding: {
        none: "px-0",
        sm: "px-4",
        default: "px-6",
        lg: "px-8",
      }
    },
    defaultVariants: {
      size: "default",
      padding: "default",
    },
  }
);

// =============================================================================
// TYPOGRAPHY VARIANTS
// =============================================================================
export const typographyVariants = cva(
  "",
  {
    variants: {
      variant: {
        h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        p: "leading-7 [&:not(:first-child)]:mt-6",
        blockquote: "mt-6 border-l-2 pl-6 italic",
        code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        muted: "text-sm text-muted-foreground",
      }
    },
    defaultVariants: {
      variant: "p",
    },
  }
);

// =============================================================================
// STATUS VARIANTS
// =============================================================================
export const statusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
        active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        inactive: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      },
      withDot: {
        true: "[&>div]:w-1.5 [&>div]:h-1.5 [&>div]:rounded-full [&>div]:bg-current",
        false: "",
      }
    },
    defaultVariants: {
      status: "draft",
      withDot: false,
    },
  }
);

// =============================================================================
// NAVIGATION VARIANTS
// =============================================================================
export const navigationVariants = cva(
  "flex items-center space-x-1 rounded-md p-1 text-sm",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        pills: "space-x-2 bg-background",
        underline: "space-x-6 border-b bg-background",
      },
      size: {
        sm: "text-xs p-0.5",
        default: "text-sm p-1",
        lg: "text-base p-1.5",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Types pour TypeScript
export type ButtonVariant = Parameters<typeof buttonVariants>[0];
export type CardVariant = Parameters<typeof cardVariants>[0];
export type InputVariant = Parameters<typeof inputVariants>[0];
export type BadgeVariant = Parameters<typeof badgeVariants>[0];
export type AlertVariant = Parameters<typeof alertVariants>[0];
export type SkeletonVariant = Parameters<typeof skeletonVariants>[0];
export type ContainerVariant = Parameters<typeof containerVariants>[0];
export type TypographyVariant = Parameters<typeof typographyVariants>[0];
export type StatusVariant = Parameters<typeof statusVariants>[0];
export type NavigationVariant = Parameters<typeof navigationVariants>[0];