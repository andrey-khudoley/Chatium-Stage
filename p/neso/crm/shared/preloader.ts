// @shared

const LOADER_COOKIE = 'crm_ui_loader_v1'

export function getPreloaderStyles() {
  return `
    #crm-boot-loader {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--crm-accent, #4da3ff) 28%, transparent) 0%, transparent 30%),
        radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--crm-info, #7dd3fc) 24%, transparent) 0%, transparent 28%),
        linear-gradient(180deg, color-mix(in srgb, var(--crm-bgAlt, #0e1321) 94%, black 6%) 0%, var(--crm-bg, #070a12) 100%);
      transition: opacity 0.35s ease, visibility 0.35s ease;
      opacity: 1;
      visibility: visible;
    }

    #crm-boot-loader.crm-loader-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    #crm-boot-loader.crm-loader-disabled {
      display: none;
    }

    .crm-loader-card {
      width: min(520px, calc(100vw - 2rem));
      border: 1px solid color-mix(in srgb, var(--crm-borderStrong, #3b4b71) 80%, transparent);
      border-radius: 16px;
      background: color-mix(in srgb, var(--crm-surfaceRaised, #1a233a) 88%, transparent);
      box-shadow:
        0 20px 40px color-mix(in srgb, var(--crm-shadow, rgba(2, 6, 23, 0.55)) 72%, transparent),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 1.2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .crm-loader-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-family: var(--crm-font-heading, 'Space Grotesk', sans-serif);
      color: var(--crm-text, #f2f6ff);
    }

    .crm-loader-title {
      font-size: 0.94rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .crm-loader-meta {
      font-family: var(--crm-font-tables, 'JetBrains Mono', monospace);
      color: var(--crm-textDim, #8e9abc);
      font-size: 0.74rem;
    }

    .crm-loader-progress {
      width: 100%;
      height: 0.62rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--crm-border, #2a3550) 70%, transparent);
      overflow: hidden;
      position: relative;
    }

    .crm-loader-progress-value {
      height: 100%;
      width: 10%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--crm-accentStrong, #1a7cff) 0%, var(--crm-accent, #4da3ff) 100%);
      box-shadow: 0 0 18px color-mix(in srgb, var(--crm-accent, #4da3ff) 45%, transparent);
      transition: width 0.26s ease;
    }

    .crm-loader-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      font-family: var(--crm-font-tables, 'JetBrains Mono', monospace);
      font-size: 0.74rem;
      color: var(--crm-textMuted, #c4cee5);
      max-height: 8rem;
      overflow: hidden;
    }

    .crm-loader-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.55rem;
      opacity: 0;
      transform: translateY(5px);
      animation: crm-loader-item-enter 0.25s ease forwards;
    }

    .crm-loader-item-index {
      color: var(--crm-textDim, #8e9abc);
      min-width: 1.2rem;
    }

    .crm-loader-item-dot {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 999px;
      background: var(--crm-accent, #4da3ff);
      box-shadow: 0 0 8px color-mix(in srgb, var(--crm-accent, #4da3ff) 55%, transparent);
    }

    .crm-loader-status {
      color: var(--crm-success, #36d399);
      font-size: 0.72rem;
    }

    @keyframes crm-loader-item-enter {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .crm-loader-card {
        border-radius: 12px;
      }

      .crm-loader-list {
        max-height: 7rem;
      }
    }
  `
}

export function getPreloaderScript() {
  return `
    (function () {
      var LOADER_COOKIE = '${LOADER_COOKIE}';
      var MAX_STEPS = 8;
      var steps = [
        'Boot sequence initialized',
        'Collecting runtime context',
        'Mounting shared design tokens',
        'Resolving active theme',
        'Resolving locale dictionary',
        'Wiring page components',
        'Hydrating realtime streams',
        'UI shell ready'
      ];

      function readCookie(name) {
        var escaped = name.replace(/[.*+?^()|[\\\\]\\\\]/g, '\\\\$&');
        var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
      }

      function createItem(index, message) {
        var item = document.createElement('li');
        item.className = 'crm-loader-item';
        item.innerHTML =
          '<span class="crm-loader-item-index">' + String(index + 1).padStart(2, '0') + '</span>' +
          '<span class="crm-inline"><span class="crm-loader-item-dot"></span><span>' + message + '</span></span>' +
          '<span class="crm-loader-status">OK</span>';
        return item;
      }

      function markComplete() {
        if (window.__crmBootDone) return;
        window.__crmBootDone = true;
        document.body.classList.add('boot-complete');
        window.bootLoaderComplete = true;
        window.dispatchEvent(new Event('bootloader-complete'));
      }

      function hideLoader() {
        var loader = document.getElementById('crm-boot-loader');
        if (!loader) {
          markComplete();
          return;
        }

        loader.classList.add('crm-loader-hidden');
        setTimeout(function () {
          loader.classList.add('crm-loader-disabled');
          markComplete();
        }, 360);
      }

      window.hideAppLoader = hideLoader;

      function runLoader() {
        var state = readCookie(LOADER_COOKIE);
        if (state === '0' || document.documentElement.dataset.crmLoader === 'off') {
          hideLoader();
          return;
        }

        var list = document.getElementById('crm-loader-list');
        var value = document.getElementById('crm-loader-progress-value');
        if (!list || !value) {
          hideLoader();
          return;
        }

        var timer = null;
        var index = 0;

        timer = setInterval(function () {
          if (index >= MAX_STEPS) {
            if (timer) clearInterval(timer);
            setTimeout(hideLoader, 180);
            return;
          }

          list.appendChild(createItem(index, steps[index] || 'Loading component'));
          value.style.width = String(Math.round(((index + 1) / MAX_STEPS) * 100)) + '%';
          index += 1;
        }, 120);

        setTimeout(function () {
          if (timer) clearInterval(timer);
          hideLoader();
        }, 2600);

        // Fallback: when all resources loaded, force-hide if loader still visible
        // (handles main-thread blocking during Vue hydration or heavy scripts)
        window.addEventListener('load', function forceHideOnLoad() {
          var loader = document.getElementById('crm-boot-loader');
          if (loader && !loader.classList.contains('crm-loader-hidden')) {
            hideLoader();
          }
        }, { once: true });

        // Extended safety: guarantee hide after 5s even if load event delayed
        setTimeout(function () {
          var loader = document.getElementById('crm-boot-loader');
          if (loader && !loader.classList.contains('crm-loader-hidden')) {
            hideLoader();
          }
        }, 5000);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runLoader, { once: true });
      } else {
        runLoader();
      }
    })();
  `
}

export function getPreloaderHTML() {
  return `
    <div id="crm-boot-loader" role="status" aria-live="polite">
      <div class="crm-loader-card">
        <div class="crm-loader-head">
          <span class="crm-loader-title">CRM Interface Engine</span>
          <span class="crm-loader-meta">v2 UI shell</span>
        </div>
        <div class="crm-loader-progress">
          <div id="crm-loader-progress-value" class="crm-loader-progress-value"></div>
        </div>
        <ul id="crm-loader-list" class="crm-loader-list"></ul>
      </div>
    </div>
  `
}
