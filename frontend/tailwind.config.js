import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 45px -20px rgba(79,70,229,0.45)'
      },
      backgroundImage: {
        aurora: 'radial-gradient(circle at 20% 20%, rgba(129,140,248,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.2), transparent 50%), radial-gradient(circle at 0% 80%, rgba(251,191,36,0.2), transparent 40%)'
      }
    }
  },
  plugins: [forms]
};
