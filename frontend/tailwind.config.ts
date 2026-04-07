import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 18px 60px rgba(15, 23, 42, 0.28)',
      },
      backgroundImage: {
        'mesh-light': 'radial-gradient(circle at top left, rgba(255, 211, 106, 0.28), transparent 30%), radial-gradient(circle at 80% 20%, rgba(100, 181, 246, 0.24), transparent 25%), linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,247,255,1))',
        'mesh-dark': 'radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.18), transparent 26%), linear-gradient(180deg, rgba(9, 11, 17, 0.95), rgba(10, 14, 25, 1))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
