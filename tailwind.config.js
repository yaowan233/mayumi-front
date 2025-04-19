import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/components/(accordion|alert|autocomplete|avatar|badge|button|card|checkbox|chip|code|divider|dropdown|image|input|kbd|link|modal|navbar|progress|radio|select|snippet|toggle|table|tabs|ripple|spinner|form|listbox|popover|scroll-shadow|menu|spacer).js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
