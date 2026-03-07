/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Primary orange palette
        "primary": "#F97316",
        "primary-light": "#FB923C",
        "primary-dark": "#EA580C",
        // Cream and warm tones
        "cream": "#FEF7ED",
        "cream-dark": "#FED7AA",
        "warm-white": "#FFFBF5",
        // Background colors
        "background-light": "#FFFBF5",
        "background-dark": "#1C1917",
        "surface-dark": "#292524",
        // Border colors
        "border-light": "#FED7AA",
        "border-dark": "#44403C",
        "input-border": "#D6D3D1",
        // Text colors
        "text-secondary": "#78716C",
        "text-warm": "#A8A29E"
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

