export interface WidgetCustomization {
  primaryColor?: string;
  backgroundColor?: string;
  secondaryColor?: string;
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  borderColor?: string;
  
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoBorderRadius?: number;
  
  headerTitle?: string;
  headerSubtitle?: string;
  inputPlaceholder?: string;
}

export const DEFAULT_WIDGET_COLORS = {
  primaryColor: "#171717",
  backgroundColor: "#ffffff",
  secondaryColor: "#f5f5f5",
  textPrimaryColor: "#0a0a0a",
  textSecondaryColor: "#fafafa",
  borderColor: "#e5e5e5",
} as const;

export const DEFAULT_WIDGET_TEXTS = {
  headerTitle: "Chat Support",
  headerSubtitle: "We reply instantly",
  inputPlaceholder: "What would you like to know?",
} as const;

export const DEFAULT_WIDGET_LOGO = {
  logoUrl: "",
  logoWidth: 40,
  logoHeight: 40,
  logoBorderRadius: 0,
} as const;

export const DEFAULT_WIDGET_CONFIG: Required<WidgetCustomization> = {
  ...DEFAULT_WIDGET_COLORS,
  ...DEFAULT_WIDGET_TEXTS,
  ...DEFAULT_WIDGET_LOGO,
} as const;
