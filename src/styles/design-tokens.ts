// Design System - Tokens centralisés pour Momento 2.0

export const designTokens = {
  // Couleurs principales
  colors: {
    // Palette de marque
    primary: {
      50: 'hsl(221.2, 83.2%, 95%)',
      100: 'hsl(221.2, 83.2%, 90%)', 
      200: 'hsl(221.2, 83.2%, 80%)',
      300: 'hsl(221.2, 83.2%, 70%)',
      400: 'hsl(221.2, 83.2%, 60%)',
      500: 'hsl(221.2, 83.2%, 53.3%)', // Couleur principale
      600: 'hsl(221.2, 83.2%, 45%)',
      700: 'hsl(221.2, 83.2%, 35%)',
      800: 'hsl(221.2, 83.2%, 25%)',
      900: 'hsl(221.2, 83.2%, 15%)',
    },
    // Couleurs sémantiques
    semantic: {
      success: {
        light: 'hsl(142, 76%, 90%)',
        DEFAULT: 'hsl(142, 76%, 36%)',
        dark: 'hsl(142, 76%, 25%)',
      },
      warning: {
        light: 'hsl(38, 92%, 90%)',
        DEFAULT: 'hsl(38, 92%, 50%)',
        dark: 'hsl(38, 92%, 35%)',
      },
      error: {
        light: 'hsl(0, 84%, 90%)',
        DEFAULT: 'hsl(0, 84%, 60%)',
        dark: 'hsl(0, 84%, 45%)',
      },
      info: {
        light: 'hsl(199, 89%, 90%)',
        DEFAULT: 'hsl(199, 89%, 48%)',
        dark: 'hsl(199, 89%, 35%)',
      },
    },
    // Couleurs neutres
    neutral: {
      0: 'hsl(0, 0%, 100%)',
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      200: 'hsl(214, 32%, 91%)',
      300: 'hsl(213, 27%, 84%)',
      400: 'hsl(215, 20%, 65%)',
      500: 'hsl(215, 16%, 47%)',
      600: 'hsl(215, 19%, 35%)',
      700: 'hsl(215, 25%, 27%)',
      800: 'hsl(217, 33%, 17%)',
      900: 'hsl(222, 84%, 5%)',
    }
  },

  // Typographie
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    }
  },

  // Espacement
  spacing: {
    0: '0px',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
  },

  // Rayons de bordure
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Ombres
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Transitions et animations
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)', 
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  // Points de rupture (breakpoints)
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  }
} as const;

// Types pour TypeScript
export type DesignTokens = typeof designTokens;
export type ColorScale = keyof typeof designTokens.colors.primary;
export type SemanticColor = keyof typeof designTokens.colors.semantic;
export type NeutralColor = keyof typeof designTokens.colors.neutral;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type FontWeight = keyof typeof designTokens.typography.fontWeight;
export type Spacing = keyof typeof designTokens.spacing;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type BoxShadow = keyof typeof designTokens.boxShadow;
export type AnimationDuration = keyof typeof designTokens.animation.duration;
export type Breakpoint = keyof typeof designTokens.breakpoints;
export type ZIndex = keyof typeof designTokens.zIndex;

// Utilitaires d'aide
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || path;
};

export const getSpacing = (size: Spacing): string => {
  return designTokens.spacing[size];
};

export const getFontSize = (size: FontSize): [string, { lineHeight: string }] => {
  return designTokens.typography.fontSize[size];
};

export const getBreakpoint = (bp: Breakpoint): string => {
  return designTokens.breakpoints[bp];
};