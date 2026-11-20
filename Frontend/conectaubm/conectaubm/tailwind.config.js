import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Todas as cores vêm de variáveis CSS definidas em src/index.css:
        // :root traz o tema claro; .theme-dark troca para o tema escuro em qualquer trecho da tela.
        white: 'rgb(var(--fg) / <alpha-value>)', // cor de texto do contexto (escura no tema claro, branca no escuro)
        paper: '#ffffff', // branco fixo
        night: '#0f0d1d', // roxo-noite fixo da UBM
        sky: '#dbe6f9', // fundo fixo dos avatares
        sun: '#ffb000', // amarelo de destaque da barra lateral
        ink: {
          DEFAULT: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-600) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
        },
        fog: 'rgb(var(--fog) / <alpha-value>)', // texto secundário
        mist: 'rgb(var(--mist) / <alpha-value>)', // texto de apoio
        line: 'rgb(var(--fg) / var(--line-alpha))',
        like: 'rgb(var(--like) / <alpha-value>)',
        online: 'rgb(var(--online) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        squircle: '32%',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
        glow: '0 8px 24px -8px rgb(var(--brand-500) / 0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'page-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'menu-in': { from: { opacity: '0', transform: 'scale(0.96) translateY(-4px)' }, to: { opacity: '1', transform: 'none' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
        'msg-in': { from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' }, to: { opacity: '1', transform: 'none' } },
        heart: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.38)' },
          '55%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        burst: {
          '0%': { transform: 'scale(0.4)', opacity: '0.9' },
          '100%': { transform: 'scale(2.1)', opacity: '0' },
        },
        linked: {
          '0%': { boxShadow: '0 0 0 0 rgba(130,168,232,0.55)' },
          '100%': { boxShadow: '0 0 0 14px rgba(130,168,232,0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(var(--dx, 4px), var(--dy, -8px))' },
        },
        dash: { to: { strokeDashoffset: '-64' } },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
        'page-in': 'page-in 260ms cubic-bezier(0.2,0.7,0.2,1) both',
        'pop-in': 'pop-in 220ms cubic-bezier(0.2,0.8,0.2,1) both',
        'sheet-in': 'sheet-in 280ms cubic-bezier(0.2,0.8,0.2,1) both',
        'menu-in': 'menu-in 140ms ease-out both',
        'toast-in': 'toast-in 240ms cubic-bezier(0.2,0.8,0.2,1) both',
        'msg-in': 'msg-in 220ms cubic-bezier(0.2,0.8,0.2,1) both',
        heart: 'heart 420ms cubic-bezier(0.3,0.7,0.3,1)',
        burst: 'burst 480ms ease-out forwards',
        linked: 'linked 700ms ease-out',
        drift: 'drift 9s ease-in-out infinite',
        dash: 'dash 3.2s linear infinite',
        typing: 'typing 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [
    // Variante `sb:` = barra lateral expandida. Vale no próprio elemento com
    // data-sidebar="expanded" e em tudo o que estiver dentro dele (ver hooks/useSidebar.ts).
    plugin(({ addVariant }) => addVariant('sb', ['&[data-sidebar="expanded"]', '[data-sidebar="expanded"] &'])),
    // Variante `touch:` = aparelho de toque (celular e tablet), pela forma de interação e não pela largura da janela.
    // Um computador com a janela estreita continua com o visual de desktop.
    plugin(({ addVariant }) => addVariant('touch', '@media (hover: none) and (pointer: coarse)')),
  ],
};
