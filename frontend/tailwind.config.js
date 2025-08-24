// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
    // Ajoutez tous vos dossiers où vous utilisez NativeWind
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      borderWidth: {
        2.5: "2.5px",
      },
    },
  },
  plugins: [],
};
