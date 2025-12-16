// @shared
import { jsx } from "@app/html-jsx"
import FormPage from './pages/FormPage.vue'
import { tailwindScript, cssVariables, commonStyles } from './styles'
import { Debug } from './shared/debug'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  try {
    Debug.info(ctx, '[index] Рендер главной страницы формы грантов начат')
    Debug.info(ctx, `[index] URL: ${ctx.req.url}, user: ${ctx.user ? ctx.user.id : 'не авторизован'}`)
    
    Debug.info(ctx, '[index] Начинаем рендеринг HTML')
    
    const htmlResult = (
    <html lang="ru">
      <head>
        <title>Гранты на «Ключ.Академия»</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
        <meta name="description" content="Форма подачи заявки на грант программы «Ключ. Академия»" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* FontAwesome */}
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        
        {/* Tailwind CSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <script>{tailwindScript}</script>
        
        {/* CSS Variables */}
        <style type="text/css">{cssVariables}</style>
        
        {/* Common Styles */}
        <style type="text/css">{commonStyles}</style>
      </head>
      <body>
        <FormPage />
      </body>
    </html>
    )
    
    Debug.info(ctx, '[index] HTML успешно сгенерирован')
    return htmlResult
  } catch (error: any) {
    Debug.error(ctx, `[index] ОШИБКА при рендеринге страницы: ${error?.message || String(error)}`, 'E_RENDER')
    Debug.info(ctx, `[index] Стек ошибки: ${error?.stack || 'нет стека'}`)
    throw error
  }
})

export default indexPageRoute

