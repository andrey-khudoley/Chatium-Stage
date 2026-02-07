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
    --bg-dark: #05080a;
    --bg-light: #f8f6eb;
    --accent: #afc45f;
    --accent-dark: #4f6f2f;
    --text-light: #f0f2ed;
    --text-dark: #1a2518;
    --glass-dark: rgba(20, 35, 30, 0.68);
    --glass-light: rgba(255, 255, 255, 0.74);
  }

  body {
    min-height: 100vh;
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    background:
      radial-gradient(circle at 24% 16%, rgba(175, 196, 95, 0.1), transparent 34%),
      radial-gradient(circle at 78% 74%, rgba(79, 111, 47, 0.08), transparent 36%),
      linear-gradient(90deg, var(--bg-dark) 0%, var(--bg-dark) 50%, var(--bg-light) 50%, var(--bg-light) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
    position: relative;
    isolation: isolate;
  }

  body::before,
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  body::before {
    background:
      linear-gradient(115deg, rgba(255, 255, 255, 0.05), transparent 32%, transparent 68%, rgba(255, 255, 255, 0.06));
    mix-blend-mode: soft-light;
    opacity: 0.8;
  }

  body::after {
    background:
      radial-gradient(circle at center, transparent 42%, rgba(0, 0, 0, 0.24) 100%);
    opacity: 0.7;
  }

  .orb {
    position: fixed;
    --r: 0deg;
    border-radius: 999px;
    width: clamp(170px, 22vw, 290px);
    height: min(70vh, 560px);
    background: linear-gradient(
      180deg,
      rgba(175, 196, 95, 0.24) 0%,
      rgba(175, 196, 95, 0.1) 38%,
      rgba(79, 111, 47, 0.03) 70%,
      transparent 100%
    );
    opacity: 0.26;
    pointer-events: none;
    animation: float 30s ease-in-out infinite;
    mix-blend-mode: screen;
    z-index: 2;
  }

  .orb-1 {
    --r: 14deg;
    top: -14%;
    left: 8%;
    animation-delay: 0s;
  }

  .orb-2 {
    --r: -16deg;
    width: clamp(150px, 19vw, 250px);
    height: min(62vh, 500px);
    bottom: -12%;
    right: 7%;
    opacity: 0.2;
    animation-delay: -12s;
  }

  @keyframes float {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--r)); opacity: 0.18; }
    50% { transform: translate3d(14px, -12px, 0) rotate(calc(var(--r) + 2deg)); opacity: 0.3; }
  }

  .container {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 820px;
    animation: intro 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes intro {
    from { opacity: 0; transform: translateY(16px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
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
      0 16px 36px rgba(79, 111, 47, 0.26),
      0 8px 20px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transform: translateZ(0);
  }

  .logo i {
    font-size: 2.5rem;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
  }

  h1 {
    font-family: 'Old Standard TT', serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    margin-bottom: 0.75rem;
    letter-spacing: 0.01em;
    background: linear-gradient(90deg, var(--text-light) 0%, var(--text-light) 50%, var(--text-dark) 50%, var(--text-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.1rem;
    margin-bottom: 3rem;
    background: linear-gradient(90deg, rgba(240,242,237,0.76) 0%, rgba(240,242,237,0.76) 50%, rgba(61,74,53,0.95) 50%, rgba(61,74,53,0.95) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .index-section {
    width: 100%;
    margin-bottom: 2.5rem;
  }
  .index-section:last-of-type { margin-bottom: 0; }
  .index-section-title {
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin-bottom: 1rem;
    background: linear-gradient(90deg, rgba(240,242,237,0.7) 0%, rgba(240,242,237,0.7) 50%, rgba(61,74,53,0.9) 50%, rgba(61,74,53,0.9) 100%);
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
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease, border-color 0.3s ease;
    overflow: hidden;
    isolation: isolate;
    border: 1px solid transparent;
  }

  .theme-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(145deg, rgba(175, 196, 95, 0.46), transparent 45%, rgba(255, 255, 255, 0.12));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .theme-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 28%);
    pointer-events: none;
    opacity: 0.7;
  }

  .theme-card.dark {
    background: linear-gradient(170deg, rgba(20, 35, 30, 0.78), rgba(14, 24, 21, 0.65));
    backdrop-filter: blur(28px) saturate(150%);
    -webkit-backdrop-filter: blur(28px) saturate(150%);
    color: var(--text-light);
    box-shadow:
      0 22px 44px rgba(0, 0, 0, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    border-color: rgba(175, 196, 95, 0.2);
  }

  .theme-card.light {
    background: linear-gradient(170deg, rgba(255, 255, 255, 0.8), rgba(248, 246, 235, 0.7));
    backdrop-filter: blur(28px) saturate(145%);
    -webkit-backdrop-filter: blur(28px) saturate(145%);
    color: var(--text-dark);
    box-shadow:
      0 22px 44px rgba(79, 111, 47, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
    border-color: rgba(79, 111, 47, 0.18);
  }

  .theme-card:hover {
    transform: translateY(-10px) scale(1.02);
  }

  .theme-card.dark:hover {
    box-shadow:
      0 30px 52px rgba(0, 0, 0, 0.44),
      0 0 36px rgba(175, 196, 95, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    border-color: rgba(175, 196, 95, 0.35);
  }

  .theme-card.light:hover {
    box-shadow:
      0 30px 52px rgba(79, 111, 47, 0.2),
      0 0 30px rgba(255, 243, 202, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 1);
    border-color: rgba(79, 111, 47, 0.28);
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
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .theme-card.dark .theme-icon {
    background: rgba(175, 196, 95, 0.2);
    color: var(--accent);
  }

  .theme-card.light .theme-icon {
    background: rgba(79, 111, 47, 0.12);
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
    opacity: 0.78;
    line-height: 1.55;
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
    background: rgba(175, 196, 95, 0.18);
    color: var(--accent);
    border: 1px solid rgba(175, 196, 95, 0.22);
  }

  .theme-card.light .theme-badge {
    background: rgba(79, 111, 47, 0.1);
    color: var(--accent-dark);
    border: 1px solid rgba(79, 111, 47, 0.15);
  }

  .footer {
    position: relative;
    z-index: 10;
    margin-top: 3rem;
    font-size: 0.85rem;
    background: linear-gradient(90deg, rgba(240,242,237,0.55) 0%, rgba(240,242,237,0.55) 50%, rgba(61,74,53,0.66) 50%, rgba(61,74,53,0.66) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 700px) {
    body {
      background:
        radial-gradient(circle at 18% 18%, rgba(175, 196, 95, 0.1), transparent 34%),
        radial-gradient(circle at 80% 72%, rgba(79, 111, 47, 0.08), transparent 36%),
        linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-dark) 50%, var(--bg-light) 50%, var(--bg-light) 100%);
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

    .orb-1 {
      width: clamp(130px, 30vw, 220px);
      height: min(56vh, 360px);
    }

    .orb-2 {
      width: clamp(120px, 24vw, 180px);
      height: min(48vh, 300px);
    }

    .theme-cards {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    .index-section-title {
      background: linear-gradient(180deg, rgba(240,242,237,0.8) 0%, rgba(240,242,237,0.8) 50%, rgba(61,74,53,0.95) 50%, rgba(61,74,53,0.95) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orb,
    .container {
      animation: none !important;
    }

    .theme-card {
      transition: none;
    }
  }
`

export const indexPageRoute = app.html('/', async (ctx) => {
  const componentsDarkUrl = getFullUrl(ROUTES.componentsDark)
  const componentsLightUrl = getFullUrl(ROUTES.componentsLight)
  const pageDarkUrl = getFullUrl(ROUTES.pageDark)
  const pageLightUrl = getFullUrl(ROUTES.pageLight)

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
          
          <h1>CRM Design System</h1>
          <p class="subtitle">Библиотека компонентов и пример страницы в тёмной и светлой теме</p>
          
          <section class="index-section">
            <h2 class="index-section-title">Библиотека компонентов</h2>
            <div class="theme-cards">
              <a href={componentsDarkUrl} class="theme-card dark">
                <div class="theme-icon">
                  <i class="fas fa-palette"></i>
                </div>
                <div class="theme-name">Ночной лес</div>
                <p class="theme-desc">Каталог кнопок, форм, таблиц, уведомлений в тёмной теме.</p>
                <span class="theme-badge">
                  <i class="fas fa-moon"></i>
                  Компоненты · Dark
                </span>
              </a>
              <a href={componentsLightUrl} class="theme-card light">
                <div class="theme-icon">
                  <i class="fas fa-palette"></i>
                </div>
                <div class="theme-name">Солнечная листва</div>
                <p class="theme-desc">Каталог кнопок, форм, таблиц, уведомлений в светлой теме.</p>
                <span class="theme-badge">
                  <i class="fas fa-sun"></i>
                  Компоненты · Light
                </span>
              </a>
            </div>
          </section>

          <section class="index-section">
            <h2 class="index-section-title">Пример страницы на дизайне</h2>
            <div class="theme-cards">
              <a href={pageDarkUrl} class="theme-card dark">
                <div class="theme-icon">
                  <i class="fas fa-th-large"></i>
                </div>
                <div class="theme-name">Ночной лес</div>
                <p class="theme-desc">Dashboard с сайдбаром, карточками и сценариями. Тёмная тема.</p>
                <span class="theme-badge">
                  <i class="fas fa-moon"></i>
                  Пример · Dark
                </span>
              </a>
              <a href={pageLightUrl} class="theme-card light">
                <div class="theme-icon">
                  <i class="fas fa-th-large"></i>
                </div>
                <div class="theme-name">Солнечная листва</div>
                <p class="theme-desc">Dashboard с сайдбаром, карточками и сценариями. Светлая тема.</p>
                <span class="theme-badge">
                  <i class="fas fa-sun"></i>
                  Пример · Light
                </span>
              </a>
            </div>
          </section>
        </div>
        
        <p class="footer">A/Ley Services • CRM Design System v2</p>
      </body>
    </html>
  )
})

export default indexPageRoute
