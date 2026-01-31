// @shared
import { jsx } from '@app/html-jsx'
import HomePage from './pages/HomePage.vue'
import { baseHtmlStyles } from './styles'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Главная</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <style>{baseHtmlStyles}</style>
      </head>
      <body>
        <HomePage />
      </body>
    </html>
  )
})

export default indexPageRoute
