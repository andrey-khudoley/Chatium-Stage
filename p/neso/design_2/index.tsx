// @shared
import { jsx } from '@app/html-jsx'
import { getFullUrl, ROUTES } from './config/routes'
import { DEFAULT_PROJECT_TITLE } from './config/project'

const pageStyles = `
  * {
    box-sizing: border-box;
  }

  :root {
    --ink: #1a2a1f;
    --ink-soft: rgba(26, 42, 31, 0.72);
    --paper: #ece3cf;
    --paper-2: #e1d6bf;
    --night: #061015;
    --night-2: #0f1d24;
    --accent-night: #9cd5c4;
    --accent-day: #58753b;
  }

  body {
    margin: 0;
    min-height: 100vh;
    color: var(--ink);
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    background:
      radial-gradient(circle at 9% 8%, rgba(156, 213, 196, 0.16), transparent 34%),
      radial-gradient(circle at 88% 86%, rgba(88, 117, 59, 0.16), transparent 36%),
      linear-gradient(145deg, var(--paper) 0%, var(--paper-2) 52%, #d8cfb9 100%);
    display: grid;
    place-items: center;
    padding: 28px 16px;
  }

  .shell {
    width: min(1120px, 100%);
    border-radius: 28px;
    border: 1px solid rgba(88, 117, 59, 0.22);
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.32) 52%, rgba(88, 117, 59, 0.08) 100%),
      rgba(247, 242, 229, 0.84);
    box-shadow:
      0 34px 60px rgba(55, 74, 41, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.82);
    padding: clamp(16px, 3vw, 30px);
  }

  .kicker {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  h1 {
    margin: 10px 0 8px;
    font-family: 'Old Standard TT', serif;
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    line-height: 1.1;
    color: var(--ink);
  }

  .subtitle {
    margin: 0;
    max-width: 760px;
    font-size: 0.95rem;
    color: var(--ink-soft);
    line-height: 1.55;
  }

  .grid {
    margin-top: 20px;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    border-radius: 18px;
    border: 1px solid transparent;
    padding: 14px;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .card h2 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.2;
  }

  .card p {
    margin: 8px 0 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.76);
  }

  .card .chip-row {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    height: 22px;
    border-radius: 999px;
    padding: 0 8px;
    font-size: 0.64rem;
    display: inline-flex;
    align-items: center;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .card.dark {
    color: #e8f6ef;
    border-color: rgba(156, 213, 196, 0.28);
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(0, 0, 0, 0.26) 100%),
      linear-gradient(144deg, var(--night) 0%, var(--night-2) 100%);
    box-shadow: 0 20px 36px rgba(6, 16, 21, 0.34);
  }

  .card.dark .chip {
    border: 1px solid rgba(156, 213, 196, 0.26);
    background: rgba(156, 213, 196, 0.14);
    color: var(--accent-night);
  }

  .card.light {
    color: #243120;
    border-color: rgba(88, 117, 59, 0.24);
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.34) 54%, rgba(88, 117, 59, 0.1) 100%),
      linear-gradient(145deg, #f4ebd6 0%, #e7ddc6 100%);
    box-shadow: 0 20px 36px rgba(88, 117, 59, 0.18);
  }

  .card.light p {
    color: rgba(36, 49, 32, 0.72);
  }

  .card.light .chip {
    border: 1px solid rgba(88, 117, 59, 0.24);
    background: rgba(88, 117, 59, 0.12);
    color: var(--accent-day);
  }

  .card.utility {
    color: var(--ink);
    border-color: rgba(88, 117, 59, 0.24);
    background: rgba(247, 242, 229, 0.88);
  }

  .card.utility p {
    color: var(--ink-soft);
  }

  .card.utility .chip {
    border: 1px solid rgba(88, 117, 59, 0.24);
    background: rgba(88, 117, 59, 0.1);
    color: var(--accent-day);
  }

  .card:hover {
    transform: translateY(-2px);
  }

  .card.dark:hover {
    box-shadow: 0 24px 42px rgba(6, 16, 21, 0.42);
    border-color: rgba(156, 213, 196, 0.38);
  }

  .card.light:hover,
  .card.utility:hover {
    box-shadow: 0 22px 40px rgba(88, 117, 59, 0.24);
    border-color: rgba(88, 117, 59, 0.34);
  }

  .footer {
    margin-top: 14px;
    font-size: 0.72rem;
    color: var(--ink-soft);
  }

  @media (max-width: 860px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`

export const indexPageRoute = app.html('/', async () => {
  const componentsDarkUrl = getFullUrl(ROUTES.componentsDark)
  const componentsLightUrl = getFullUrl(ROUTES.componentsLight)
  const pageDarkUrl = getFullUrl(ROUTES.pageDark)
  const pageLightUrl = getFullUrl(ROUTES.pageLight)

  return (
    <html>
      <head>
        <title>BPM-first Design System - {DEFAULT_PROJECT_TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#ece3cf" />
        <style>{pageStyles}</style>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&family=Old+Standard+TT:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <main class="shell">
          <p class="kicker">BPM-first redesign</p>
          <h1>Unified process control workspace</h1>
          <p class="subtitle">
            Dense and data-first interface for workflow instances, stage transitions, rules, automation and process analytics.
            Each workspace includes preset switching with shared token architecture.
          </p>

          <section class="grid">
            <a href={pageDarkUrl} class="card dark">
              <h2><i class="fas fa-moon"></i> Dark workspace</h2>
              <p>Night forest atmosphere, compact operations layout, process-heavy dashboards.</p>
              <div class="chip-row">
                <span class="chip">forest-night</span>
                <span class="chip">midnight-pine</span>
                <span class="chip">BPM</span>
              </div>
            </a>

            <a href={pageLightUrl} class="card light">
              <h2><i class="fas fa-sun"></i> Light workspace</h2>
              <p>Morning light atmosphere, high readability and dense process control views.</p>
              <div class="chip-row">
                <span class="chip">sunrise-leaf</span>
                <span class="chip">misty-daybreak</span>
                <span class="chip">BPM</span>
              </div>
            </a>

            <a href={componentsDarkUrl} class="card utility">
              <h2><i class="fas fa-palette"></i> Dark components</h2>
              <p>Reusable BPM sections and shell primitives in dark mode.</p>
              <div class="chip-row">
                <span class="chip">components</span>
                <span class="chip">dark</span>
              </div>
            </a>

            <a href={componentsLightUrl} class="card utility">
              <h2><i class="fas fa-palette"></i> Light components</h2>
              <p>Reusable BPM sections and shell primitives in light mode.</p>
              <div class="chip-row">
                <span class="chip">components</span>
                <span class="chip">light</span>
              </div>
            </a>
          </section>

          <p class="footer">{DEFAULT_PROJECT_TITLE} · Tokenized theming · BPM-first UI</p>
        </main>
      </body>
    </html>
  )
})

export default indexPageRoute
