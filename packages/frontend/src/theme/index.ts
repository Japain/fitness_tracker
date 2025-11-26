import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Design tokens from mockups/DESIGN-DOCUMENTATION.md
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  // Primary Brand Color
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // --primary-brand
    600: '#2563EB',  // --primary-hover
    700: '#1D4ED8',  // --primary-active
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutral Scale (7-step)
  neutral: {
    50: '#F8FAFC',   // --neutral-50: Page background
    100: '#F1F5F9',  // --neutral-100: Backgrounds, secondary buttons
    200: '#E2E8F0',  // --neutral-200: Dividers, card borders
    300: '#CBD5E1',  // --neutral-300: Input borders
    400: '#94A3B8',  // --neutral-400: Disabled text, borders
    500: '#64748B',  // --neutral-500: Placeholder text, icons
    600: '#475569',  // --neutral-600: Muted text, secondary labels
    700: '#334155',  // --neutral-700: Body text, labels
    800: '#1E293B',  // --neutral-800: Secondary text
    900: '#0F172A',  // --neutral-900: Headings, primary text
  },

  // Semantic Colors
  success: {
    50: '#D1FAE5',   // --success-bg
    500: '#10B981',  // --success: Completed sets, active workout
    600: '#059669',
    700: '#047857',
  },

  error: {
    50: '#FEE2E2',   // --error-bg
    500: '#EF4444',  // --error: Delete actions, errors
    600: '#DC2626',
    700: '#B91C1C',
  },

  warning: {
    50: '#FEF3C7',
    500: '#F59E0B',  // --warning: Warnings
    600: '#D97706',
    700: '#B45309',
  },

  info: {
    50: '#DBEAFE',
    500: '#3B82F6',  // --info: Informational
    600: '#2563EB',
    700: '#1D4ED8',
  },
};

const fonts = {
  // --font-family: System font stack
  heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
};

const fontSizes = {
  // Type Scale from design documentation
  xs: '12px',      // --font-size-caption: Labels, tags
  sm: '14px',      // --font-size-body-small: Secondary text (timestamps, metadata)
  md: '16px',      // --font-size-body: Default body text (all content)
  lg: '18px',      // --font-size-body-large: Prominent body text (CTA button labels)
  xl: '20px',      // --font-size-h3: Subsection titles
  '2xl': '24px',   // --font-size-h2: Section titles
  '3xl': '28px',   // --font-size-h1: Page titles
};

const fontWeights = {
  normal: 400,     // --font-weight-regular: Body text
  medium: 500,     // --font-weight-medium: Input labels
  semibold: 600,   // --font-weight-semibold: Buttons, exercise names
  bold: 700,       // --font-weight-bold: Headings, page titles
};

const lineHeights = {
  tight: 1.2,      // --line-height-tight: Headings
  normal: 1.5,     // --line-height-normal: Body text (default)
  relaxed: 1.7,    // --line-height-relaxed: Long-form content
};

const space = {
  // Spacing System - Base Unit: 8px (all spacing uses multiples)
  xs: '4px',       // --spacing-xs: Tight spacing (pill padding, icon gaps)
  sm: '8px',       // --spacing-sm: Small gaps (form label to input)
  md: '12px',      // --spacing-md: Medium gaps (button icon gap)
  lg: '16px',      // --spacing-lg: Standard padding (card padding, section gaps)
  xl: '24px',      // --spacing-xl: Large gaps (section margins)
  '2xl': '32px',   // --spacing-2xl: Extra large gaps (major section breaks)
  '3xl': '48px',   // --spacing-3xl: Hero spacing (auth screen padding)
};

const radii = {
  sm: '6px',       // --radius-sm: Inputs, small buttons
  md: '12px',      // --radius-md: Cards, primary buttons, modals
  lg: '16px',      // --radius-lg: Large cards
  full: '9999px',  // --radius-full: Pills, avatars, circular elements
};

const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',        // --shadow-sm: Subtle card elevation
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',      // --shadow-md: Button hover, modal
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',    // --shadow-lg: Elevated modals
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    sizes: {
      md: {
        h: '44px',  // Minimum touch target for mobile
        minW: '44px',
        fontSize: 'lg',
        px: 'lg',
      },
    },
    variants: {
      solid: {
        bg: 'primary.500',
        color: 'white',
        _hover: {
          bg: 'primary.600',
          _disabled: {
            bg: 'primary.500',
          },
        },
        _active: {
          bg: 'primary.700',
        },
      },
      outline: {
        borderColor: 'neutral.300',
        color: 'neutral.700',
        _hover: {
          bg: 'neutral.50',
        },
      },
      ghost: {
        color: 'neutral.700',
        _hover: {
          bg: 'neutral.100',
        },
      },
    },
    defaultProps: {
      size: 'md',
      variant: 'solid',
    },
  },

  Input: {
    sizes: {
      md: {
        field: {
          fontSize: 'md',  // 16px minimum to prevent iOS zoom
          h: '44px',
          borderRadius: 'sm',
        },
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'neutral.300',
          _hover: {
            borderColor: 'neutral.400',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
          },
        },
      },
    },
    defaultProps: {
      size: 'md',
      variant: 'outline',
    },
  },

  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      lineHeight: 'tight',
      color: 'neutral.900',
    },
    sizes: {
      lg: {
        fontSize: '3xl',  // h1: 28px
      },
      md: {
        fontSize: '2xl',  // h2: 24px
      },
      sm: {
        fontSize: 'xl',   // h3: 20px
      },
    },
  },

  Text: {
    baseStyle: {
      lineHeight: 'normal',
      color: 'neutral.700',
    },
    variants: {
      secondary: {
        color: 'neutral.600',
        fontSize: 'sm',
      },
      caption: {
        color: 'neutral.500',
        fontSize: 'xs',
      },
    },
  },

  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: 'md',
        boxShadow: 'sm',
        p: 'lg',
      },
    },
  },
};

const styles = {
  global: {
    body: {
      bg: 'neutral.50',
      color: 'neutral.700',
      fontSize: 'md',
      lineHeight: 'normal',
    },
    // Ensure minimum touch targets on mobile
    'button, a': {
      minHeight: '44px',
      minWidth: '44px',
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  space,
  radii,
  shadows,
  components,
  styles,
});

export default theme;
