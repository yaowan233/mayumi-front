import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-sans)"],
                mono: ["var(--font-mono)"],
            },
            colors: {
                'tier-iron-1': '#bab3ab',
                'tier-iron-2': '#bab3ab',
                'tier-bronze-1': '#b88f7a',
                'tier-bronze-2': '#855c47',
                'tier-silver-1': '#e0e0eb',
                'tier-silver-2': '#a3a3c2',
                'tier-gold-1': '#f0e4a8',
                'tier-gold-2': '#e0c952',
                'tier-platinum-1': '#a8f0ef',
                'tier-platinum-2': '#52e0df',
                'tier-rhodium-1': '#d9f8d3',
                'tier-rhodium-2': '#a0cf96',
                'tier-radiant-1': '#97dcff',
                'tier-radiant-2': '#ed82ff',
                'tier-lustrous-1': '#ffe600',
                'tier-lustrous-2': '#ed82ff',
            },
        },
    },
    darkMode: "class",
    plugins: [heroui()],
}

module.exports = config;