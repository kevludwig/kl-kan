import type { Config } from "tailwindcss";

/**
 * KL corporate identity (kevinludwig.com): Paper/Ink with the signal yellow
 * as the only accent. Maps Kan's neutral light/dark scales onto the CI palette.
 */
export default {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bricolage)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        "light-50": "#f7f8f5",
        "light-100": "#f3f4f1",
        "light-200": "#eceee9",
        "light-300": "#e4e6e1",
        "light-400": "#dfe2dc",
        "light-500": "#d6d9d3",
        "light-600": "#d0d4cd",
        "light-700": "#b4b9b1",
        "light-800": "#858b84",
        "light-900": "#676e79",
        "light-950": "#596170",
        "light-1000": "#0e1a2b",
        "dark-50": "#0a1320",
        "dark-100": "#0e1a2b",
        "dark-200": "#132136",
        "dark-300": "#1a2740",
        "dark-400": "#202e47",
        "dark-500": "#243349",
        "dark-600": "#2f3f58",
        "dark-700": "#45566f",
        "dark-800": "#6b7a90",
        "dark-900": "#8592a5",
        "dark-950": "#c3c9d2",
        "dark-1000": "#f3f4f1",
        signal: { DEFAULT: "#ffc933", soft: "#fff1c2" },
      },
    },
  },
} satisfies Config;
