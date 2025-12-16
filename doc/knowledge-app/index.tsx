// @shared
import { jsx } from '@app/html-jsx'
import { requireAccountRole } from '@app/auth'
import DocsListPage from './pages/DocsListPage.vue'
import DocViewPage from './pages/DocViewPage.vue'
import DocEditPage from './pages/DocEditPage.vue'
import TKnowledgeAppSettings7Fk from './tables/settings.table'
import { commonStyles } from './styles'
import { renderMarkdownToHtml } from './shared/markdownRenderer'
import { getDocRoute } from './api/docs'

const getHeadContent = (title: string = 'Knowledge Base Admin') => (
  <>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta charset="UTF-8" />
    <title>{title}</title>
    <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
    <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js"></script>
    
    {/* CSS переменные для тем - ОБЫЧНЫЙ STYLE, не tailwindcss! */}
    <style>{`
      /* Светлая тема (по умолчанию) - яркая и чистая */
      :root,
      [data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #fefefe;
        --bg-tertiary: #fafafa;
        --text-primary: #111827;
        --text-secondary: #4b5563;
        --text-tertiary: #6b7280;
        
        /* Цвета ссылок для светлой темы */
        --link-primary: #2563eb;
        --link-secondary: #7c3aed;
        --link-hover: #1d4ed8;
        
        --border-primary: #f0f0f0;
        --border-secondary: #e5e5e5;
        --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
        --shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
        --shadow-lg: 0 12px 32px 0 rgba(0, 0, 0, 0.16);
        --overlay-bg: rgba(0, 0, 0, 0.5);
        
        --code-bg: #f5f5f5;
        --code-text: #dc2626;
        --pre-bg: #f8f9fa;
        --pre-text: #1e293b;
        --table-header-bg: #fafafa;
        --table-hover-bg: #f8f8f8;
        --input-bg: #ffffff;
        --input-border: #e5e5e5;
        --input-focus-border: #2563eb;
        --alert-error-bg: #fee2e2;
        --alert-error-text: #991b1b;
        --alert-error-border: #ef4444;
        --alert-success-bg: #dcfce7;
        --alert-success-text: #166534;
        --alert-success-border: #10b981;
        --alert-info-bg: #dbeafe;
        --alert-info-text: #1e40af;
        --alert-info-border: #3b82f6;
      }

      /* Тёмная тема */
      [data-theme="dark"] {
        --bg-primary: #1f2937;
        --bg-secondary: #111827;
        --bg-tertiary: #374151;
        --text-primary: #f9fafb;
        --text-secondary: #d1d5db;
        --text-tertiary: #9ca3af;
        
        /* Цвета ссылок для тёмной темы */
        --link-primary: #60a5fa;
        --link-secondary: #a78bfa;
        --link-hover: #93c5fd;
        
        --border-primary: #374151;
        --border-secondary: #4b5563;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        --overlay-bg: rgba(0, 0, 0, 0.7);
        
        --code-bg: rgba(55, 65, 81, 0.5);
        --code-text: #d1d5db;
        --pre-bg: #0f1419;
        --pre-text: #e5e7eb;
        --table-header-bg: #374151;
        --table-hover-bg: #2d3748;
        --input-bg: #374151;
        --input-border: #4b5563;
        --input-focus-border: #60a5fa;
        --alert-error-bg: #7f1d1d;
        --alert-error-text: #fecaca;
        --alert-error-border: #dc2626;
        --alert-success-bg: #14532d;
        --alert-success-text: #bbf7d0;
        --alert-success-border: #22c55e;
        --alert-info-bg: #1e3a8a;
        --alert-info-text: #bfdbfe;
        --alert-info-border: #60a5fa;
      }
    `}</style>
    
    <script>{`
      // Theme initialization - применяем немедленно к HTML
      (function() {
        const THEME_STORAGE_KEY = 'knowledge-app-theme';
        const DEFAULT_THEME = window.__DEFAULT_THEME__ || 'light';
        
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        const theme = (stored === 'light' || stored === 'dark') ? stored : DEFAULT_THEME;
        
        // Применяем атрибут к HTML немедленно
        document.documentElement.setAttribute('data-theme', theme);
        
        // Сохраняем тему если её не было
        if (!stored) {
          localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
        
        // Применяем класс к body когда он будет доступен
        if (document.body) {
          document.body.classList.add('theme-' + theme);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('theme-' + theme);
          });
        }
      })();
      
      // Marked initialization
      window.markedReady = false;
      const waitForMarked = setInterval(() => {
        if (window.marked && typeof window.marked.parse === 'function') {
          window.markedReady = true;
          clearInterval(waitForMarked);
        }
      }, 50);
      
      // Tailwind config
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#3b82f6',
              secondary: '#8b5cf6',
              success: '#10B981',
              danger: '#EF4444',
              warning: '#F59E0B',
              info: '#3B82F6',
              dark: '#1F2937',
              light: '#F3F4F6',
            },
            fontFamily: {
              sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
              mono: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
            }
          }
        }
      }
    `}</script>
    <style>{commonStyles}</style>
  </>
)

async function getDefaultTheme(ctx: any): Promise<'light' | 'dark'> {
  try {
    const setting = await TKnowledgeAppSettings7Fk.findOneBy(ctx, { key: 'defaultTheme' })
    if (setting && (setting.value === 'light' || setting.value === 'dark')) {
      return setting.value as 'light' | 'dark'
    }
  } catch (e) {
    // Use default if error
  }
  return 'light'
}

export const indexPageRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const defaultTheme = await getDefaultTheme(ctx)
  
  return (
    <html>
      <head>{getHeadContent()}</head>
      <body>
        <script>{`window.__DEFAULT_THEME__ = '${defaultTheme}';`}</script>
        <DocsListPage />
      </body>
    </html>
  )
})

export const docViewRoute = app.get('/view', async (ctx, req) => {
  // Публичный доступ для краулеров и всех пользователей
  const filename = req.query.filename as string
  if (!filename) {
    return ctx.resp.redirect(indexPageRoute.url())
  }
  const defaultTheme = await getDefaultTheme(ctx)
  
  // SSR: Загружаем контент на сервере для краулеров
  let ssrMarkdown = ''
  let ssrHtml = ''
  let ssrError = ''
  
  try {
    const result = await getDocRoute.query({ filename }).run(ctx)
    if (result.success && result.data) {
      ssrMarkdown = result.data
      // Рендерим markdown в HTML на сервере через marked.js из CDN
      ssrHtml = await renderMarkdownToHtml(ssrMarkdown)
    } else {
      ssrError = result.error === 'NotFound' 
        ? 'Документ не найден' 
        : `Ошибка: ${result.error || 'Неизвестная ошибка'}`
    }
  } catch (e) {
    ssrError = 'Ошибка загрузки: ' + String(e)
  }
  
  return (
    <html>
      <head>
        {getHeadContent(filename)}
        <meta name="description" content={`Документация: ${filename}`} />
        <style>{`
          /* Прелоадер - показывается до загрузки Vue */
          #app-loader {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          #app-loader.loaded {
            display: none;
          }
          
          .loader-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--border-primary);
            border-top-color: var(--link-primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* SSR контент для краулеров */
          #ssr-content {
            display: block;
          }
          
          #ssr-content.hidden {
            display: none;
          }
        `}</style>
      </head>
      <body>
        <script>{`
          window.__DEFAULT_THEME__ = '${defaultTheme}';
          window.__SSR_MARKDOWN__ = ${JSON.stringify(ssrMarkdown)};
          window.__SSR_HTML__ = ${JSON.stringify(ssrHtml)};
          window.__SSR_ERROR__ = ${JSON.stringify(ssrError)};
        `}</script>
        
        {/* Прелоадер - показывается сразу */}
        <div id="app-loader">
          <div class="loader-spinner"></div>
        </div>
        
        {/* SSR контент для краулеров (невидим за прелоадером для пользователей) */}
        {ssrHtml && (
          <div id="ssr-content">
            <div class="doc-view-page">
              <div class="header">
                <div class="header-content container">
                  <div class="header-title-section">
                    <h1>
                      <i class="fas fa-book-open-reader"></i>
                      {' '}{filename}
                    </h1>
                    <p class="header-subtitle">Просмотр документации</p>
                  </div>
                </div>
              </div>
              <div class="container">
                <div class="doc-content card markdown-preview" innerHTML={ssrHtml}></div>
              </div>
            </div>
          </div>
        )}
        
        {ssrError && !ssrHtml && (
          <div id="ssr-content" style="display: block;">
            <div class="doc-view-page">
              <div class="header">
                <div class="header-content container">
                  <div class="header-title-section">
                    <h1>
                      <i class="fas fa-book-open-reader"></i>
                      {' '}{filename}
                    </h1>
                    <p class="header-subtitle">Просмотр документации</p>
                  </div>
                </div>
              </div>
              <div class="container">
                <div class="alert alert-error" style="margin-bottom: 1.5rem;">
                  <i class="fas fa-circle-exclamation" style="flex-shrink: 0;"></i>
                  <div>
                    <strong>Ошибка загрузки</strong>
                    <p style="margin-top: 0.25rem;">{ssrError}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Vue компонент */}
        <DocViewPage 
          documentFilename={filename} 
          ssrContent={ssrMarkdown}
          ssrHtml={ssrHtml}
          ssrError={ssrError}
        />
        
        {/* Скрываем прелоадер после загрузки Vue */}
        <script>{`
          (function() {
            const loader = document.getElementById('app-loader');
            const ssrContent = document.getElementById('ssr-content');
            
            function hideLoader() {
              if (loader) {
                loader.classList.add('loaded');
              }
              // Скрываем SSR контент после загрузки
              if (ssrContent) {
                ssrContent.classList.add('hidden');
              }
            }
            
            // Скрываем прелоадер когда Vue готов
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(hideLoader, 100);
              });
            } else {
              setTimeout(hideLoader, 100);
            }
          })();
        `}</script>
      </body>
    </html>
  )
})

export const docEditRoute = app.get('/edit', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const filename = req.query.filename as string
  if (!filename) {
    return ctx.resp.redirect(indexPageRoute.url())
  }
  const defaultTheme = await getDefaultTheme(ctx)
  
  return (
    <html>
      <head>{getHeadContent()}</head>
      <body>
        <script>{`window.__DEFAULT_THEME__ = '${defaultTheme}';`}</script>
        <DocEditPage documentFilename={filename} />
      </body>
    </html>
  )
})

export const docCreateRoute = app.get('/create', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const defaultTheme = await getDefaultTheme(ctx)
  
  return (
    <html>
      <head>{getHeadContent()}</head>
      <body>
        <script>{`window.__DEFAULT_THEME__ = '${defaultTheme}';`}</script>
        <DocEditPage />
      </body>
    </html>
  )
})
