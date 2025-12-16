// @shared
import { jsx } from "@app/html-jsx"
import UnitTestsPage from './pages/UnitTestsPage.vue'

export const testsPageRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Unit Tests - Storage</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* TailwindCSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* FontAwesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        <style>{`
          :root {
            --primary: #3b82f6;
            --success: #10b981;
            --danger: #ef4444;
            --dark: #1f2937;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          
          .preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 1;
            transition: opacity 0.3s ease;
          }
          
          .preloader-hidden {
            opacity: 0;
            pointer-events: none;
          }
          
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>
        <div id="preloader" class="preloader">
          <div class="spinner"></div>
        </div>
        
        <UnitTestsPage />
        
        <script>{`
          window.addEventListener('load', () => {
            setTimeout(() => {
              document.getElementById('preloader').classList.add('preloader-hidden');
            }, 300);
          });
        `}</script>
      </body>
    </html>
  )
})

export default testsPageRoute

