// @shared
import { jsx } from "@app/html-jsx";
import { requireAccountRole } from '@app/auth';
import UnitTestsPage from './pages/UnitTestsPage.vue';

export const testsPageRoute = app.html('/', async (ctx, req) => {
  // Защищаем страницу тестов авторизацией Admin
  requireAccountRole(ctx, 'Admin');

  return (
    <html>
      <head>
        <title>Unit Tests - Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <UnitTestsPage />
      </body>
    </html>
  );
});

export default testsPageRoute;

