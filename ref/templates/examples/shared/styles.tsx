// @shared
import { jsx } from "@app/html-jsx"

// Шрифты и стили для TailwindCSS
export function TailwindStyles() {
  return (
    <>
      <script src="https://cdn.tailwindcss.com/3.4.16"></script>
      <script>{`
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                accent: '#06b6d4',
                dark: '#1f2937',
                light: '#f9fafb',
              },
              spacing: {
                '18': '4.5rem',
                '88': '22rem',
              },
              animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
              }
            }
          }
        }
      `}</script>
      <style type="text/tailwindcss">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </>
  )
}

// Font Awesome иконки
export function FontAwesomeIcons() {
  return (
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
  )
}

// Google Fonts
export function GoogleFonts() {
  return (
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  )
}

// Мета-теги для мобильных устройств
export function MobileMeta() {
  return (
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  )
}

// Аналитика и метрики
export function Analytics() {
  return (
    <script src="/s/metric/clarity.js"></script>
  )
}

// Стандартная HTML структура страницы
export function AppShell({ title, children, description }: {
  title: string
  children: any
  description?: string
}) {
  return (
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        <GoogleFonts />
        <TailwindStyles />
        <FontAwesomeIcons />
        <Analytics />
      </head>
      <body class="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}