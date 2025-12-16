import { jsx } from "@app/html-jsx";
import SettingsPage from './pages/SettingsPage.vue'

export const settingsRoute = app.html("/settings", async (ctx) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Настройки - Telegram Webhooks</title>
        
        <script src="/s/metric/clarity.js"></script>
        
        {/* TailwindCSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                  secondary: '#8b5cf6',
                  accent: '#10b981'
                }
              }
            }
          }
        `}</script>
        
        {/* FontAwesome */}
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        <style>{`
          body {
            height: 100%;
            width: 100%;
            background-color: #111827;
            color: #f3f4f6;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
          
          /* Кастомный скроллбар */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        `}</style>
      </head>
      <body>
        <SettingsPage />
      </body>
    </html>
  );
});

