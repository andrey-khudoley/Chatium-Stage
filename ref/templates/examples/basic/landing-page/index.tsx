// @shared
import { jsx } from "@app/html-jsx"
import LandingPageVue from './LandingPage.vue'

export const landingPageExampleRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Лендинг на Chatium</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/metric/clarity.js"></script>
        
        {/* TailwindCSS */}
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                  secondary: '#8b5cf6',
                  accent: '#10b981',
                }
              }
            }
          }
        `}</script>
        <style type="text/tailwindcss">{`
          body {
            --color-primary: #3b82f6;
            --color-secondary: #8b5cf6;
            --color-accent: #10b981;
          }
        `}</style>

        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style type="text/tailwindcss">{`
          --font-sans: Inter, sans-serif;
        `}</style>

        {/* FontAwesome Icons */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body>
        <LandingPageVue />
      </body>
    </html>
  )
})