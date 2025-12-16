// @shared
import { jsx } from "@app/html-jsx"
import { requireAccountRole } from '@app/auth'
import TrafficReports from './pages/TrafficReports.vue'
import { integrationIsEnabled } from '@gc-mcp-server/sdk'
import { installPluginRoute } from './api/install-plugin'

// Use export to access index route in components and other modules
export const indexPageRoute = app.get("/", async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  const isConfigured = await integrationIsEnabled(ctx)
  
  

  return (
    <html>
      <head>
        <title>{isConfigured ? 'Отчеты по трафику сайта' : 'Настройка системы'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/metric/clarity.js"></script>
        {isConfigured && <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>}
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: ${isConfigured ? '#f7fafc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        {isConfigured ? <TrafficReports /> : <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
          <div style={{
            backgroundColor: 'white',
            padding: '48px 32px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            textAlign: 'center',
            maxWidth: '600px',
            width: '90%'
          }}>
            <h1 style={{margin: '0 0 16px 0', color: '#2d3748', fontSize: '24px', fontWeight: '600'}}>Соединение с GetCourse не настроено</h1>
            <button onclick={`
              this.disabled = true;
              this.textContent = 'Устанавливаю...';
              fetch('${installPluginRoute.url()}', { method: 'POST' })
                .then(response => response.json())
                .then(result => {
                  if (result.success) {
                    window.location.href = '${ctx.account.url('/app/gc-mcp-server') + `?backUrl=${encodeURIComponent(indexPageRoute.url())}&backText=${encodeURIComponent('Вернуться к отчету')}`}';
                  } else {
                    alert('Ошибка установки: ' + (result.error || 'Неизвестная ошибка'));
                    this.disabled = false;
                    this.textContent = 'Настроить';
                  }
                })
                .catch(error => {
                  alert('Ошибка установки: ' + error.message);
                  this.disabled = false;
                  this.textContent = 'Настроить';
                });
            `} style={{
              display: 'inline-block',
              backgroundColor: '#667eea',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '16px'
            }}>Настроить</button>
          </div>
        </div>}
      </body>
    </html>
  )
})