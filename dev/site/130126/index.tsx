// @shared
import { jsx } from "@app/html-jsx"
import RitualPage from './pages/RitualPage.vue'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  return (
    <html lang="ru">
      <head>
        <title>Ритуал "Наказание врагов" — Восстановление справедливости</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="description" content="Ритуал восстановления справедливости через Высшие Силы. Без злости, без разрушающей энергии мести." />
        
        {/* Google Fonts - Elegant typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600&display=swap" rel="stylesheet" />
        
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  'cormorant': ['"Cormorant Garamond"', 'Georgia', 'serif'],
                  'raleway': ['Raleway', 'sans-serif'],
                },
                colors: {
                  'paper': '#F5F0E8',
                  'paper-dark': '#E8E0D0',
                  'ink': '#2C2416',
                  'ink-light': '#5C4F3A',
                  'gold': '#B8860B',
                  'gold-light': '#DAA520',
                  'burgundy': '#722F37',
                  'burgundy-light': '#8B3A42',
                  'sage': '#87906F',
                  'binder': '#9A8B7A',
                  'binder-dark': '#7A6B5A',
                },
                animation: {
                  'fade-in': 'fadeIn 0.8s ease-out forwards',
                  'slide-up': 'slideUp 0.6s ease-out forwards',
                  'float': 'float 6s ease-in-out infinite',
                  'paper-rustle': 'paperRustle 0.4s ease-out',
                  'tab-hover': 'tabHover 0.3s ease-out forwards',
                },
                keyframes: {
                  fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                  },
                  slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                  },
                  float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                  },
                  paperRustle: {
                    '0%': { transform: 'rotateY(0deg)' },
                    '50%': { transform: 'rotateY(2deg)' },
                    '100%': { transform: 'rotateY(0deg)' },
                  },
                  tabHover: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(8px)' },
                  },
                }
              }
            }
          }
        `}} />
      </head>
      <body class="bg-binder min-h-screen">
        <RitualPage />
      </body>
    </html>
  )
})
