// @shared
/**
 * Пример главной страницы с проверкой настройки GetCourse MCP Client
 * Если не настроен - показывает форму установки
 * Если настроен - показывает приложение
 */

import { jsx } from "@app/html-jsx"
import { requireAccountRole } from '@app/auth'
import { integrationIsEnabled } from '@gc-mcp-server/sdk'
import { installPluginRoute } from './getcourse-mcp-client'

/**
 * Главная страница с проверкой настройки
 */
export const setupPageExampleRoute = app.html('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  // Проверяем, настроен ли GetCourse MCP Client
  const isConfigured = await integrationIsEnabled(ctx)
  
  return (
    <html>
      <head>
        <title>{isConfigured ? 'GetCourse Аналитика' : 'Настройка GetCourse'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* TailwindCSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        
        {/* FontAwesome */}
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        <style>{`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </head>
      <body>
        {isConfigured ? (
          // Приложение (когда GetCourse настроен)
          <div>
            <header style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h1 style={{ margin: 0, fontSize: '32px' }}>
                <i class="fas fa-chart-line" style={{ marginRight: '10px' }}></i>
                GetCourse Аналитика
              </h1>
              <p style={{ margin: '10px 0 0', opacity: 0.9 }}>
                Данные из вашего настроенного GetCourse аккаунта
              </p>
            </header>
            
            <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {/* Карточка статистики */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    color: '#667eea', 
                    fontSize: '40px', 
                    marginBottom: '16px' 
                  }}>
                    <i class="fas fa-shopping-cart"></i>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
                    Заказы
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Статистика заказов и конверсия
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    color: '#10b981', 
                    fontSize: '40px', 
                    marginBottom: '16px' 
                  }}>
                    <i class="fas fa-users"></i>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
                    Пользователи
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Регистрации и активность
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    color: '#f59e0b', 
                    fontSize: '40px', 
                    marginBottom: '16px' 
                  }}>
                    <i class="fas fa-eye"></i>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
                    Трафик
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Просмотры и взаимодействия
                  </p>
                </div>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <i class="fas fa-check-circle" style={{ 
                    color: '#10b981', 
                    fontSize: '24px' 
                  }}></i>
                  <div>
                    <strong style={{ color: '#065f46' }}>
                      GetCourse MCP Client настроен
                    </strong>
                    <p style={{ 
                      margin: '4px 0 0', 
                      fontSize: '14px', 
                      color: '#047857' 
                    }}>
                      Вы работаете с данными вашего GetCourse аккаунта
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        ) : (
          // Форма настройки (когда GetCourse не настроен)
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '48px 32px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%'
            }}>
              <div style={{
                fontSize: '64px',
                color: '#667eea',
                marginBottom: '24px'
              }}>
                <i class="fas fa-plug"></i>
              </div>
              
              <h1 style={{
                margin: '0 0 16px 0',
                color: '#2d3748',
                fontSize: '28px',
                fontWeight: '700'
              }}>
                Соединение с GetCourse не настроено
              </h1>
              
              <p style={{
                color: '#718096',
                fontSize: '16px',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                Для работы с аналитикой необходимо установить и настроить 
                подключение к GetCourse MCP Server. После установки вы сможете 
                указать адрес сервера и API ключ вашего GetCourse аккаунта.
              </p>
              
              <button onclick={`
                this.disabled = true;
                this.textContent = 'Устанавливаю...';
                this.style.opacity = '0.7';
                
                fetch('${installPluginRoute.url()}', { method: 'POST' })
                  .then(response => response.json())
                  .then(result => {
                    if (result.success) {
                      // Перенаправляем на страницу настроек GetCourse
                      const backUrl = encodeURIComponent(window.location.pathname);
                      const backText = encodeURIComponent('Вернуться к аналитике');
                      window.location.href = '${ctx.account.url('/app/gc-mcp-server')}?backUrl=' + backUrl + '&backText=' + backText;
                    } else {
                      alert('Ошибка установки: ' + (result.error || 'Неизвестная ошибка'));
                      this.disabled = false;
                      this.textContent = 'Настроить GetCourse';
                      this.style.opacity = '1';
                    }
                  })
                  .catch(error => {
                    alert('Ошибка установки: ' + error.message);
                    this.disabled = false;
                    this.textContent = 'Настроить GetCourse';
                    this.style.opacity = '1';
                  });
              `} style={{
                display: 'inline-block',
                backgroundColor: '#667eea',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
              }}
              onmouseover="this.style.backgroundColor='#5a67d8'; this.style.transform='translateY(-2px)'"
              onmouseout="this.style.backgroundColor='#667eea'; this.style.transform='translateY(0)'">
                <i class="fas fa-cog" style={{ marginRight: '8px' }}></i>
                Настроить GetCourse
              </button>
              
              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  color: '#4a5568',
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  Что будет после установки:
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  textAlign: 'left',
                  color: '#718096',
                  fontSize: '14px'
                }}>
                  <li style={{ marginBottom: '8px' }}>
                    <i class="fas fa-check text-green-500" style={{ marginRight: '8px' }}></i>
                    Настройте адрес вашего GetCourse сервера
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <i class="fas fa-check text-green-500" style={{ marginRight: '8px' }}></i>
                    Введите API ключ вашего аккаунта
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <i class="fas fa-check text-green-500" style={{ marginRight: '8px' }}></i>
                    Получите доступ к аналитике вашего GetCourse
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  )
})

export default setupPageExampleRoute

