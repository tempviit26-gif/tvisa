/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
        './providers/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#150f08',
                'primary-container': '#2b241c',
                'secondary': '#735b31',
                'on-primary': '#ffffff',
                'on-secondary': '#ffffff',
                'surface': '#fdf9f2',
                'surface-container-low': '#f7f3ec',
                'surface-container-high': '#ebe8e1',
                'on-surface': '#1c1c18',
                'on-surface-variant': '#4c463f',
                'outline': '#7e766e',
                'outline-variant': '#cfc5bc',
                'error': '#ba1a1a',
                'deep-rose': '#8B1D52',
                'rose-pink': '#C96B8A',
                'blush': '#F2C4D0',
                'petal': '#FAF0F3',
                'gold': '#C9A86C',
                'noir': '#1A0A10',
                'mid': '#6B3A4A',
            },
            spacing: {
                'stack-lg': '80px',
                'stack-md': '40px',
                'stack-sm': '16px',
                'margin-desktop': '64px',
                'margin-mobile': '20px',
                'gutter': '24px',
                'container-max': '1280px',
            },
            fontFamily: {
                display: ['Playfair Display', 'serif'],
                body: ['Inter', 'sans-serif'],
                cormorant: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
                jost: ['var(--font-jost)', 'Jost', 'sans-serif'],
            },
            animation: {
                'marquee': 'marquee 30s linear infinite',
                'fade-in': 'fadeIn 0.6s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
};

