// @shared
import { jsx } from "@app/html-jsx"
import { apiRunAllTestsRoute } from './api/run-tests'

export const testsAiPageRoute = app.html('/', async (ctx, req) => {
  // Вызываем универсальный API который выполнит все тесты и вернёт JSON
  const result = await apiRunAllTestsRoute.run(ctx)
  
  // Возвращаем JSON как HTML (для отображения в браузере)
  return (
    <html>
      <head>
        <title>Unit-AI Tests - AI Ассистент</title>
        <meta charset="UTF-8" />
        <style>{`
          body {
            font-family: 'Courier New', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            margin: 0;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.5;
          }
        `}</style>
      </head>
      <body>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </body>
    </html>
  )
})

export default testsAiPageRoute

