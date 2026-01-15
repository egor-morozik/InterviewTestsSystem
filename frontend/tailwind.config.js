/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#496ea4',
                'primary-light': '#e6efff',
                secondary: '#343940',
                'secondary-light': '#9f9f9f',
                border: '#dee1e6',
                background: '#f5f7fa',
                'bg-light': '#f8f8f9',
            },
            boxShadow: {
                'card': '0px 2px 10px rgba(0, 0, 0, 0.1)',
            },
            fontFamily: {
                'sans': ['Inter', 'Helvetica', 'sans-serif'],
            },
        },
    },
    plugins: [],
}