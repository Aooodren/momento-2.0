// Utilitaires pour le design system - Momento 2.0
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { designTokens } from "../styles/design-tokens";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Combine et merge les classes CSS avec Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Génère des classes de transition standardisées
 */
export function transition(properties: string[] = ["all"], duration: keyof typeof designTokens.animation.duration = "normal") {
  const props = properties.join(", ");
  const dur = designTokens.animation.duration[duration];
  const easing = designTokens.animation.easing.DEFAULT;
  
  return {
    transition: `${props} ${dur} ${easing}`
  };
}

/**
 * Génère des classes d'animation standardisées
 */
export function animate(type: "fadeIn" | "slideIn" | "scaleIn" | "bounce" = "fadeIn", duration: keyof typeof designTokens.animation.duration = "normal") {
  const dur = designTokens.animation.duration[duration];
  
  const animations = {
    fadeIn: `animate-in fade-in duration-[${dur}]`,
    slideIn: `animate-in slide-in-from-bottom-2 duration-[${dur}]`,
    scaleIn: `animate-in zoom-in-95 duration-[${dur}]`,
    bounce: `animate-bounce duration-[${dur}]`,
  };
  
  return animations[type];
}

/**
 * Focus ring standardisé pour l'accessibilité
 */
export function focusRing(color: "primary" | "destructive" | "success" = "primary") {
  const colors = {
    primary: "focus-visible:ring-ring",
    destructive: "focus-visible:ring-destructive", 
    success: "focus-visible:ring-green-500",
  };
  
  return cn(
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    colors[color]
  );
}

/**
 * Classes d'interaction standardisées (hover, active, etc.)
 */
export function interactionStates(type: "button" | "card" | "input" = "button") {
  const states = {
    button: "hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
    card: "hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5 transition-all cursor-pointer",
    input: "hover:border-input/80 focus:border-primary transition-colors",
  };
  
  return states[type];
}

/**
 * États de chargement standardisés
 */
export function loadingState(isLoading: boolean = false) {
  return cn(
    "transition-opacity duration-200",
    isLoading && "opacity-50 pointer-events-none cursor-wait"
  );
}

/**
 * Classes responsive standardisées  
 */
export function responsive(config: {
  base?: string;
  sm?: string; 
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
}) {
  return cn(
    config.base,
    config.sm && `sm:${config.sm}`,
    config.md && `md:${config.md}`,
    config.lg && `lg:${config.lg}`,
    config.xl && `xl:${config.xl}`,
    config["2xl"] && `2xl:${config["2xl"]}`
  );
}

/**
 * Classes de grille standardisées
 */
export function gridLayout(
  columns: number | "auto" | "fill" = 1,
  minWidth: string = "250px",
  gap: keyof typeof designTokens.spacing = "4"
) {
  if (columns === "auto") {
    return `grid grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))] gap-${gap}`;
  }
  if (columns === "fill") {
    return `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))] gap-${gap}`;
  }
  
  return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 3)} xl:grid-cols-${columns} gap-${gap}`;
}

/**
 * Truncate text avec nombre de lignes
 */
export function truncateText(lines: number = 1) {
  if (lines === 1) {
    return "truncate";
  }
  return `line-clamp-${lines}`;
}

/**
 * Classes d'espacement standardisées
 */
export function spacing(config: {
  p?: keyof typeof designTokens.spacing;
  px?: keyof typeof designTokens.spacing;
  py?: keyof typeof designTokens.spacing;
  pt?: keyof typeof designTokens.spacing;
  pr?: keyof typeof designTokens.spacing;
  pb?: keyof typeof designTokens.spacing;
  pl?: keyof typeof designTokens.spacing;
  m?: keyof typeof designTokens.spacing;
  mx?: keyof typeof designTokens.spacing;
  my?: keyof typeof designTokens.spacing;
  mt?: keyof typeof designTokens.spacing;
  mr?: keyof typeof designTokens.spacing;
  mb?: keyof typeof designTokens.spacing;
  ml?: keyof typeof designTokens.spacing;
}) {
  return cn(
    config.p && `p-${config.p}`,
    config.px && `px-${config.px}`,
    config.py && `py-${config.py}`,
    config.pt && `pt-${config.pt}`,
    config.pr && `pr-${config.pr}`,
    config.pb && `pb-${config.pb}`,
    config.pl && `pl-${config.pl}`,
    config.m && `m-${config.m}`,
    config.mx && `mx-${config.mx}`,
    config.my && `my-${config.my}`,
    config.mt && `mt-${config.mt}`,
    config.mr && `mr-${config.mr}`,
    config.mb && `mb-${config.mb}`,
    config.ml && `ml-${config.ml}`
  );
}

/**
 * Classes de bordures standardisées
 */
export function borders(config: {
  width?: "none" | "thin" | "thick";
  color?: "default" | "muted" | "primary" | "destructive";
  radius?: keyof typeof designTokens.borderRadius;
  sides?: ("top" | "right" | "bottom" | "left")[];
}) {
  const widthMap = {
    none: "border-0",
    thin: "border",
    thick: "border-2"
  };
  
  const colorMap = {
    default: "border-border",
    muted: "border-muted",
    primary: "border-primary",
    destructive: "border-destructive"
  };
  
  return cn(
    config.width && widthMap[config.width],
    config.color && colorMap[config.color],
    config.radius && `rounded-${config.radius}`,
    config.sides?.map(side => `border-${side}`).join(" ")
  );
}

/**
 * Classes d'ombres standardisées avec variations
 */
export function shadows(size: keyof typeof designTokens.boxShadow = "DEFAULT", color?: "default" | "primary" | "destructive") {
  const baseClass = `shadow-${size === "DEFAULT" ? "" : size}`;
  
  if (color === "primary") {
    return cn(baseClass, "shadow-primary/10");
  }
  if (color === "destructive") {
    return cn(baseClass, "shadow-destructive/10");
  }
  
  return baseClass;
}

/**
 * Classes de positionnement standardisées
 */
export function position(
  type: "relative" | "absolute" | "fixed" | "sticky",
  config?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    inset?: string;
    zIndex?: keyof typeof designTokens.zIndex;
  }
) {
  return cn(
    type,
    config?.top && `top-${config.top}`,
    config?.right && `right-${config.right}`,
    config?.bottom && `bottom-${config.bottom}`,
    config?.left && `left-${config.left}`,
    config?.inset && `inset-${config.inset}`,
    config?.zIndex && `z-${config.zIndex}`
  );
}

// =============================================================================
// VALIDATION & TYPE HELPERS
// =============================================================================

/**
 * Valide si une valeur est une taille valide
 */
export function isValidSize(size: string): boolean {
  const validSizes = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
  return validSizes.includes(size);
}

/**
 * Valide si une couleur est valide dans le design system
 */
export function isValidColor(color: string): boolean {
  const validColors = Object.keys(designTokens.colors.primary).concat(
    Object.keys(designTokens.colors.semantic),
    Object.keys(designTokens.colors.neutral)
  );
  return validColors.includes(color);
}

/**
 * Génère des classes CSS personnalisées à partir des tokens
 */
export function generateCustomCSS(config: {
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  spacing?: string;
  borderRadius?: string;
}) {
  const styles: Record<string, string> = {};
  
  if (config.color) {
    styles.color = config.color;
  }
  if (config.fontSize) {
    styles.fontSize = config.fontSize;
  }
  if (config.fontWeight) {
    styles.fontWeight = config.fontWeight;
  }
  if (config.spacing) {
    styles.padding = config.spacing;
  }
  if (config.borderRadius) {
    styles.borderRadius = config.borderRadius;
  }
  
  return styles;
}

// Export des tokens pour utilisation directe
export { designTokens };