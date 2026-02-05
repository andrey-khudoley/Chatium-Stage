// @shared
// Премиальная лендинг-страница: выбор темы дизайна (Modern Nature Minimal)
import { jsx } from '@app/html-jsx'
import { getFullUrl, ROUTES } from './config/routes'
import { DEFAULT_PROJECT_TITLE } from './config/project'

const pageStyles = `
  * { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }
  
  :root {
    --bg-dark: #070b0d;
    --bg-light: #f5f8f0;
    --accent: #92a447;
    --accent-dark: #4a5a24;
    --text-light: #f0f2ed;
    --text-dark: #1a2518;
    --glass-dark: rgba(20, 35, 30, 0.5);
    --glass-light: rgba(255, 255, 255, 0.6);
  }
  
  body {
    min-height: 100vh;
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark) 50%, var(--bg-light) 50%, var(--bg-light) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
    position: relative;
  }
  
  /* Animated background orbs */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    pointer-events: none;
    animation: float 20s ease-in-out infinite;
  }
  
  .orb-1 {
    width: 40vw;
    height: 40vw;
    background: radial-gradient(circle, rgba(146, 164, 71, 0.3), transparent 70%);
    top: -10%;
    left: -10%;
    animation-delay: 0s;
  }
  
  .orb-2 {
    width: 35vw;
    height: 35vw;
    background: radial-gradient(circle, rgba(74, 90, 36, 0.25), transparent 70%);
    bottom: -10%;
    right: -10%;
    animation-delay: -10s;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -20px) scale(1.02); }
    66% { transform: translate(-15px, 15px) scale(0.98); }
  }
  
  .container {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 800px;
  }
  
  .logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
    box-shadow: 
      0 8px 32px rgba(146, 164, 71, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .logo i {
    font-size: 2.5rem;
    color: white;
  }
  
  h1 {
    font-family: 'Old Standard TT', serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    margin-bottom: 0.75rem;
    background: linear-gradient(90deg, var(--text-light) 0%, var(--text-light) 50%, var(--text-dark) 50%, var(--text-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .subtitle {
    font-size: 1.1rem;
    margin-bottom: 3rem;
    background: linear-gradient(90deg, rgba(240,242,237,0.7) 0%, rgba(240,242,237,0.7) 50%, rgba(61,74,53,1) 50%, rgba(61,74,53,1) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .theme-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    width: 100%;
  }
  
  .theme-card {
    position: relative;
    padding: 2.5rem 2rem;
    border-radius: 24px;
    text-decoration: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  
  .theme-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(146, 164, 71, 0.3), transparent 50%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  
  .theme-card.dark {
    background: var(--glass-dark);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    color: var(--text-light);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .theme-card.light {
    background: var(--glass-light);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    color: var(--text-dark);
    box-shadow: 
      0 8px 32px rgba(74, 90, 36, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  
  .theme-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
  
  .theme-card.dark:hover {
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(146, 164, 71, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  
  .theme-card.light:hover {
    box-shadow: 
      0 16px 48px rgba(74, 90, 36, 0.2),
      0 0 40px rgba(255, 252, 240, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  
  .theme-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 1.5rem;
  }
  
  .theme-card.dark .theme-icon {
    background: rgba(146, 164, 71, 0.2);
    color: var(--accent);
  }
  
  .theme-card.light .theme-icon {
    background: rgba(74, 90, 36, 0.1);
    color: var(--accent-dark);
  }
  
  .theme-name {
    font-family: 'Old Standard TT', serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .theme-desc {
    font-size: 0.95rem;
    opacity: 0.75;
    line-height: 1.5;
  }
  
  .theme-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 1.25rem;
  }
  
  .theme-card.dark .theme-badge {
    background: rgba(146, 164, 71, 0.15);
    color: var(--accent);
  }
  
  .theme-card.light .theme-badge {
    background: rgba(74, 90, 36, 0.1);
    color: var(--accent-dark);
  }
  
  .footer {
    position: relative;
    z-index: 10;
    margin-top: 3rem;
    font-size: 0.85rem;
    background: linear-gradient(90deg, rgba(240,242,237,0.5) 0%, rgba(240,242,237,0.5) 50%, rgba(61,74,53,0.6) 50%, rgba(61,74,53,0.6) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  @media (max-width: 700px) {
    body {
      background: linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-dark) 50%, var(--bg-light) 50%, var(--bg-light) 100%);
    }
    
    h1, .subtitle, .footer {
      background: linear-gradient(180deg, var(--text-light) 0%, var(--text-light) 50%, var(--text-dark) 50%, var(--text-dark) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      background: linear-gradient(180deg, rgba(240,242,237,0.7) 0%, rgba(240,242,237,0.7) 50%, rgba(61,74,53,1) 50%, rgba(61,74,53,1) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .theme-cards {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
`

export const indexPageRoute = app.html('/', async (ctx) => {
  const designDemoUrl = getFullUrl(ROUTES.designDemo)
  const designDemoLightUrl = getFullUrl(ROUTES.designDemoLight)

  return (
    <html>
      <head>
        <title>{`Дизайн-система — ${DEFAULT_PROJECT_TITLE}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#070b0d" />
        <style>{pageStyles}</style>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&family=Old+Standard+TT:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        
        <div class="container">
          <div class="logo">
            <i class="fas fa-leaf"></i>
          </div>
          
          <h1>Modern Nature Minimal</h1>
          <p class="subtitle">Премиальная дизайн-система вдохновлённая природой</p>
          
          <div class="theme-cards">
            <a href={designDemoUrl} class="theme-card dark">
              <div class="theme-icon">
                <i class="fas fa-moon"></i>
              </div>
              <div class="theme-name">Ночной лес</div>
              <p class="theme-desc">Глубокие тона с биолюминесцентным свечением и мягким glassmorphism</p>
              <span class="theme-badge">
                <i class="fas fa-sparkles"></i>
                Dark Theme
              </span>
            </a>
            
            <a href={designDemoLightUrl} class="theme-card light">
              <div class="theme-icon">
                <i class="fas fa-sun"></i>
              </div>
              <div class="theme-name">Солнечное утро</div>
              <p class="theme-desc">Тёплые кремовые тона с солнечными лучами и свежей зеленью</p>
              <span class="theme-badge">
                <i class="fas fa-sparkles"></i>
                Light Theme
              </span>
            </a>
          </div>
        </div>
        
        <p class="footer">NeSo Academy • Design System v2.0</p>
      </body>
    </html>
  )
})

export default indexPageRoute
