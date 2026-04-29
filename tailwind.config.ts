import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paw: {
          cream: "#FFF6E9",
          blush: "#FFE3DF",
          peach: "#FFC6A8",
          pink: "#F76589",
          rose: "#FF8BA7",
          lavender: "#A982DC",
          lilac: "#ECE2FF",
          butter: "#FFE8A3",
          mint: "#CFEFE4",
          ink: "#33272A",
          cocoa: "#7A513F"
        }
      },
      boxShadow: {
        paw: "0 20px 60px rgba(158, 103, 74, 0.18)",
        soft: "0 10px 30px rgba(247, 101, 137, 0.16)"
      },
      fontFamily: {
        display: ["Nunito", "Poppins", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["Nunito", "Poppins", "ui-rounded", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "paw-radial": "radial-gradient(circle at top left, #FFE3DF 0, transparent 34%), radial-gradient(circle at bottom right, #ECE2FF 0, transparent 32%)"
      }
    }
  },
  plugins: []
};

export default config;
