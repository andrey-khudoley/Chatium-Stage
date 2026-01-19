// @shared
import { jsx } from "@app/html-jsx"
import RitualPage from './pages/RitualPage.vue'
import { HeadStyles } from './styles'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  return (
    <html lang="ru">
      <head>
        <title>Ритуал "Наказание врагов" — Восстановление справедливости</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="description" content="Ритуал восстановления справедливости через Высшие Силы. Без злости, без разрушающей энергии мести." />
        <meta property="og:title" content="Ритуал Наказание врагов — Восстановление справедливости" />
        <meta property="og:description" content="Передайте ситуацию Высшим Силам для справедливого восстановления баланса. Без мести, без разрушения себя." />
        <meta property="og:type" content="website" />
        
        <HeadStyles />
      </head>
      <body>
        <RitualPage />
      </body>
    </html>
  )
})
