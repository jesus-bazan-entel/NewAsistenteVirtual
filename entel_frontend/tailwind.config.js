/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
    ],
    theme: {
        extend: {
            colors: {
                'entel-orange': '#ff6b35',
                'entel-amber': '#f7931e',
                'entel-dark': '#0a0a0f',
                'entel-card': 'rgba(255, 255, 255, 0.03)',
            },
            fontFamily: {
                'outfit': ['Outfit', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};
