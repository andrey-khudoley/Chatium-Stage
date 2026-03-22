// @shared

/** Единый viewport для всех HTML-страниц проекта (в т.ч. safe-area на iPhone). */
export const VIEWPORT_META_CONTENT = 'width=device-width, initial-scale=1, viewport-fit=cover'

/**
 * Safe-area (вырезы, home indicator), отступы для модалок и хедера/футера.
 * Подключать вместе с `customScrollbarStyles` в `<head>` у `index.tsx` и `web/*/index.tsx`.
 */
export const mobileSafeAreaStyles = `
  :root {
    --app-safe-top: env(safe-area-inset-top, 0px);
    --app-safe-right: env(safe-area-inset-right, 0px);
    --app-safe-bottom: env(safe-area-inset-bottom, 0px);
    --app-safe-left: env(safe-area-inset-left, 0px);
  }

  body {
    padding-left: var(--app-safe-left);
    padding-right: var(--app-safe-right);
  }

  .jn-modal-overlay,
  .logout-modal-overlay {
    padding-left: max(1rem, var(--app-safe-left));
    padding-right: max(1rem, var(--app-safe-right));
    padding-bottom: max(1rem, var(--app-safe-bottom));
    padding-top: max(1rem, var(--app-safe-top));
    box-sizing: border-box;
  }

  @media (max-width: 480px) {
    .jn-modal-overlay,
    .logout-modal-overlay {
      align-items: flex-start;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
`

export const baseHtmlStyles = `
  body {
    height: 100%;
    width: 100%;
    background-image: url(https://fs.cdn-chatium.io/thumbnail/image_bXkpfHZFGu.2393x2250.png/s/400x400);
    background-size: 196px;
    background-color: #f8f8f8;
  }
`

/** Переиспользуемые стили скроллбара (тёмная тема). .content-wrapper — основной скролл; body — если скроллится страница; .custom-scrollbar — блоки вроде логов. В Chrome 121+ стандартные scrollbar-width/scrollbar-color переопределяют ::-webkit-scrollbar, поэтому стандартные свойства задаём только для Firefox через @supports. */
export const customScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body,
    .content-wrapper,
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #444 #1a1a1a;
    }
  }
  body::-webkit-scrollbar,
  .content-wrapper::-webkit-scrollbar,
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .content-wrapper::-webkit-scrollbar-track,
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb,
  .content-wrapper::-webkit-scrollbar-thumb,
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .content-wrapper::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  body::-webkit-scrollbar-thumb:active,
  .content-wrapper::-webkit-scrollbar-thumb:active,
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: #666;
  }
`

/**
 * Единые стили полей: убирают жёлтый autofill Chrome, задают фокус в цветах темы,
 * Выпадающие списки в модалках задач — компонент `JnCrtSelect.vue` (не нативный select).
 * Подключается в head рядом с customScrollbarStyles.
 */
export const formControlStyles = `
  .jn-input,
  .jn-textarea {
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .jn-input:-webkit-autofill,
  .jn-textarea:-webkit-autofill,
  .settings-input:-webkit-autofill {
    -webkit-text-fill-color: #e8e8e8;
    caret-color: #e8e8e8;
    box-shadow: 0 0 0 1000px #0a0a0a inset;
    transition: background-color 5000s ease-in-out 0s;
  }

  .settings-input:-webkit-autofill {
    box-shadow: 0 0 0 1000px rgba(12, 12, 12, 0.98) inset;
  }

  .jn-input:-webkit-autofill:focus,
  .jn-textarea:-webkit-autofill:focus,
  .settings-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #e8e8e8;
    box-shadow:
      0 0 0 1000px #0a0a0a inset,
      0 0 0 1px rgba(211, 35, 75, 0.45);
  }

  .settings-input:-webkit-autofill:focus {
    box-shadow:
      0 0 0 1000px rgba(12, 12, 12, 0.98) inset,
      0 0 0 1px rgba(211, 35, 75, 0.4);
  }

  .jn-input:focus,
  .jn-textarea:focus,
  .jn-input:focus-visible,
  .jn-textarea:focus-visible {
    outline: none;
    border-color: #d3234b;
    box-shadow: 0 0 0 1px rgba(211, 35, 75, 0.35);
  }

  .settings-input:focus,
  .settings-input:focus-visible {
    outline: none;
    border-color: #d3234b;
    box-shadow: 0 0 0 1px rgba(211, 35, 75, 0.28);
  }
`
