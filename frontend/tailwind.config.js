/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050506",
        canvas: "#09090b",
        card: "#111215",
        overlay: "#18191f",
        subtle: "rgba(255, 255, 255, 0.05)",
        risk: {
          low: "#10b981",      // emerald
          medium: "#f59e0b",   // amber
          high: "#f97316",     // orange
          critical: "#f43f5e", // rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-safe': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-warning': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-danger': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
