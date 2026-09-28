import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: 'var(--color-navy-900)',
          700: 'var(--color-navy-700)',
          100: 'var(--color-navy-100)',
        },
        saffron: {
          DEFAULT: 'var(--color-saffron)',
          dark: 'var(--color-saffron-dark)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        devanagari: ['var(--font-noto-devanagari)', 'sans-serif'],
        olchiki: ['var(--font-noto-olchiki)', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.5' }],
        xs: ['0.875rem', { lineHeight: '1.5' }],
        sm: ['1rem', { lineHeight: '1.5' }],
        md: ['1.125rem', { lineHeight: '1.5' }],
        lg: ['1.25rem', { lineHeight: '1.4' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['1.875rem', { lineHeight: '1.3' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
        '4xl': ['3rem', { lineHeight: '1.1' }],
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(15,30,74,0.08), 0 1px 2px 0 rgba(15,30,74,0.04)',
        'card-hover':
          '0 8px 24px 0 rgba(15,30,74,0.12), 0 2px 8px 0 rgba(15,30,74,0.06)',
        nav: '0 1px 3px 0 rgba(15,30,74,0.10)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        marquee: 'marquee 30s linear infinite',
        'marquee-paused': 'marquee 30s linear infinite paused',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
