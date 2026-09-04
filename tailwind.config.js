/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seago: {
          bg: '#F2F6F6',
          surface: '#FFFFFF',
          surface2: '#E9F0F0',
          surface3: '#DDE8E8',
          ink: '#0F262A',
          ink2: '#4C666A',
          ink3: '#7A9296',
          line: '#D2E0E0',
          lineStrong: '#B6CBCB',
          accent: '#0B6E78',
          accentInk: '#FFFFFF',
          accentSoft: '#DBEDEE',
          good: '#0F7A55',
          warn: '#9A6410',
          warnSoft: '#F7EBD6',
          crit: '#A9382A',
          critSoft: '#F6E1DE',
          sMp: '#2F62B8',
          sLog: '#C4671C',
          sLuc: '#0F8A6E',
        }
      },
      fontFamily: {
        sans: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
