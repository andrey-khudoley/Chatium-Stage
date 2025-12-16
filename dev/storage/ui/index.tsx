// @shared
import { jsx } from "@app/html-jsx"
import UIPage from '../pages/UIPage.vue'

export const storageUIRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Storage - Управление скриптами и стилями</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          .code-editor {
            font-family: 'Courier New', monospace;
            font-size: 13px;
          }
          
          .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </head>
      <body>
        <UIPage />
      </body>
    </html>
  )
})

export default storageUIRoute

