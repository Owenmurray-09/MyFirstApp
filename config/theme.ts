export const theme = {
  colors: {
    // Deep blue - Primary (headers, buttons)
    primary: '#1E3A8A',
    primaryDark: '#1E40AF',
    primaryLight: '#3B82F6',

    // Bright teal - Accent/highlights
    accent: '#06B6D4',
    accentLight: '#67E8F9',
    accentDark: '#0891B2',

    // Warm orange - Secondary/call to action
    secondary: '#FB923C',
    secondaryLight: '#FDBA74',
    secondaryDark: '#EA580C',

    // Backgrounds
    background: '#FEFEFE', // Warm cream - almost white with subtle warmth
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',

    // Borders and dividers
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Text colors
    text: '#111827', // Dark for primary text
    textSecondary: '#6B7280', // Neutral gray
    textLight: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    textOnAccent: '#FFFFFF',

    // Status colors
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fontFamily: {
    // Titles and headings - Poppins Bold
    title: 'Poppins_700Bold',
    titleMedium: 'Poppins_600SemiBold',
    titleRegular: 'Poppins_500Medium',

    // Body text - Inter
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',

    // Alternative/accent text - Outfit
    accent: 'Outfit_400Regular',
    accentMedium: 'Outfit_500Medium',
    accentBold: 'Outfit_700Bold',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;