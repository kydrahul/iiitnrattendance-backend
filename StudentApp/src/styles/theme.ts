export const colors = {
  primary: '#1E3A8A', // Navy
  secondary: '#312E81', // Indigo
  accent: '#A3E635', // Lime
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  border: '#E5E7EB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
  }
};

export const typography = {
  sizes: {
    h1: 28,
    h2: 24,
    headline: 24,
    subheading: 18,
    body: 16,
    caption: 12,
  },
  weights: {
    bold: '700' as const,
    semibold: '600' as const,
    regular: '400' as const,
  },
  fontFamily: 'Inter',
};

export const spacing = {
  base: 8,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 40,
};

export const borderRadius = {
  button: 12,
  card: 16,
  modal: 20,
  full: 999,
};

export const elevation = {
  small: 2,
  medium: 4,
  large: 8,
};

export const animation = {
  duration: 300,
  easing: 'ease-in-out',
};