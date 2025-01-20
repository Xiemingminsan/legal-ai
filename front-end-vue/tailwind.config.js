/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // Enables toggling dark mode by adding 'dark' class to the <html> element
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6', // Blue for buttons in light mode
          dark: '#60A5FA', // Softer blue for dark mode
        },
        background: {
          light: '#FFFFFF', // Main white background for light mode
          dark: '#1E293B', // Dark gray background for dark mode
        },
        surface: {
          light: '#F3F4F6', // Slightly off-white for card backgrounds in light mode
          dark: '#334155', // Dark slate gray for card backgrounds in dark mode
        },
        text: {
          light: '#111827', // Dark text for light backgrounds
          dark: '#F9FAFB', // Light text for dark backgrounds
        },
        inputBg: {
          light: '#F3F4F6',
          dark: '#374151',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
