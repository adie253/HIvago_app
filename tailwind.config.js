/** @type {import('tailwindcss').Config} */
module.exports = {
  // Include paths to all component & screen files
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
