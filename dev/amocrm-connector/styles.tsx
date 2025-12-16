// @shared

export const tailwindScript = `
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e'
          }
        }
      }
    }
  }
`

export const cssVariables = `
  :root {
    --color-bg: #fafbfc;
    --color-bg-secondary: #ffffff;
    --color-text: #1e293b;
    --color-text-secondary: #64748b;
    --color-text-tertiary: #94a3b8;
    --color-border: #e2e8f0;
    --color-primary: #0ea5e9;
    --color-primary-hover: #0284c7;
    --color-primary-light: #e0f2fe;
    --color-success: #10b981;
    --color-success-light: #d1fae5;
    --color-warning: #f59e0b;
    --color-warning-dark: #d97706;
    --color-danger: #ef4444;
    --color-danger-light: #fee2e2;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
    --transition: all 0.2s ease;
  }
  
  .dark {
    --color-bg: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text: #f1f5f9;
    --color-text-secondary: #94a3b8;
    --color-text-tertiary: #64748b;
    --color-border: #334155;
    --color-primary: #38bdf8;
    --color-primary-hover: #0ea5e9;
    --color-primary-light: #1e3a5f;
    --color-success: #34d399;
    --color-success-light: #064e3b;
    --color-warning: #fbbf24;
    --color-warning-dark: #f59e0b;
    --color-danger: #f87171;
    --color-danger-light: #7f1d1d;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-bg);
    transition: var(--transition);
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
  
  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: var(--transition);
  }
  
  a:hover {
    color: var(--color-primary-hover);
  }
  
  button {
    cursor: pointer;
    font-family: inherit;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .card {
    background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
    border: 1.5px solid var(--color-border);
    border-radius: 1rem;
    padding: 1.5rem;
    transition: var(--transition);
    box-shadow: var(--shadow-sm);
  }
  
  .card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 0.625rem;
    font-weight: 600;
    transition: var(--transition);
    border: none;
    outline: none;
    box-shadow: var(--shadow-sm);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: white;
    border: 1px solid var(--color-primary-hover);
  }
  
  .btn-primary:hover {
    box-shadow: var(--shadow-md);
    opacity: 0.95;
  }
  
  .btn-primary:active {
    box-shadow: var(--shadow-sm);
  }
  
  .input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1.5px solid var(--color-border);
    border-radius: 0.625rem;
    background: var(--color-bg-secondary);
    color: var(--color-text);
    font-family: inherit;
    transition: var(--transition);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
  }
  
  .input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light), inset 0 1px 2px rgba(0, 0, 0, 0.03);
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table th,
  .table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  .table th {
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .table tr:hover {
    background: var(--color-bg-secondary);
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--color-primary-light);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  
  /* Warning карточка */
  .warning-card {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%) !important;
    color: #713f12 !important;
    border-color: #fde047 !important;
  }
  
  .warning-icon-box {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    background: rgba(234, 179, 8, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #ca8a04;
  }
  
  /* Danger карточка */
  .danger-card {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
    color: #7f1d1d !important;
    border-color: #fecaca !important;
  }
  
  .danger-icon-box {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    background: rgba(239, 68, 68, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #dc2626;
  }
`

export const commonStyles = `
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }
  
  .slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
  }
  
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Тёмная тема для warning/danger карточек */
  .dark .warning-card {
    background: linear-gradient(135deg, #422006 0%, #713f12 100%) !important;
    color: #fef3c7 !important;
    border-color: #92400e !important;
  }
  
  .dark .warning-icon-box {
    background: rgba(234, 179, 8, 0.15);
    color: #fbbf24;
  }
  
  .dark .danger-card {
    background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%) !important;
    color: #fee2e2 !important;
    border-color: #991b1b !important;
  }
  
  .dark .danger-icon-box {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }
`

// Критический CSS для прелоадера (встраивается в head до всего остального)
export const preloaderStyles = `
  /* Прелоадер - показывается до загрузки Vue */
  #app-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: loader-fade-in 0.3s ease-out;
  }
  
  #app-loader.loaded {
    display: none;
  }
  
  /* Плавное появление прелоадера */
  @keyframes loader-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .loader-content {
    text-align: center;
    animation: loader-content-entrance 0.5s ease-out 0.2s both;
  }
  
  /* Анимация появления контента */
  @keyframes loader-content-entrance {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .loader-logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(14, 165, 233, 0.3);
    animation: loader-logo-pulse 2s ease-in-out infinite;
    position: relative;
  }
  
  /* Пульсация логотипа с glow эффектом */
  @keyframes loader-logo-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 8px 32px rgba(14, 165, 233, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 8px 48px rgba(14, 165, 233, 0.5);
    }
  }
  
  .loader-logo i {
    font-size: 2rem;
    color: white;
  }
  
  .loader-spinner {
    width: 72px;
    height: 72px;
    margin: 0 auto 1.5rem;
    position: relative;
  }
  
  .loader-ring {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 40deg,
      var(--color-primary) 60deg,
      var(--color-primary-hover) 180deg,
      var(--color-primary) 300deg,
      transparent 320deg,
      transparent 360deg
    );
    animation: loader-spin 1.2s linear infinite;
    position: relative;
  }
  
  /* Внутренняя маска для создания кольца */
  .loader-ring::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    background: #0f172a;
    border-radius: 50%;
  }
  
  /* Дополнительный glow эффект */
  .loader-ring::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 40deg,
      rgba(14, 165, 233, 0.3) 60deg,
      rgba(2, 132, 199, 0.3) 180deg,
      rgba(14, 165, 233, 0.3) 300deg,
      transparent 320deg,
      transparent 360deg
    );
    border-radius: 50%;
    filter: blur(8px);
    z-index: -1;
  }
  
  @keyframes loader-spin {
    0% { 
      transform: rotate(0deg);
    }
    100% { 
      transform: rotate(360deg);
    }
  }
  
  .loader-text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: loader-text-pulse 2s ease-in-out infinite;
  }
  
  /* Пульсация текста */
  @keyframes loader-text-pulse {
    0%, 100% { 
      opacity: 0.7; 
    }
    50% { 
      opacity: 1; 
    }
  }
  
  /* Адаптивность для маленьких экранов */
  @media (max-width: 480px) {
    .loader-logo {
      width: 56px;
      height: 56px;
      margin-bottom: 1.25rem;
    }
    
    .loader-logo i {
      font-size: 1.75rem;
    }
    
    .loader-spinner {
      width: 64px;
      height: 64px;
      margin-bottom: 1.25rem;
    }
    
    .loader-text {
      font-size: 0.875rem;
    }
  }
`

export const loaderScript = `
  // Скрыть прелоадер после загрузки Vue приложения
  (function() {
    const loader = document.getElementById('app-loader');
    const content = document.getElementById('app-content');
    
    // Глобальная функция для скрытия прелоадера (вызывается из Vue)
    window.hideAppLoader = function() {
      if (loader && content) {
        // Плавное скрытие прелоадера с zoom-out эффектом
        loader.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        loader.style.opacity = '0';
        loader.style.transform = 'scale(0.95)';
        
        // Одновременно показываем контент
        content.style.transition = 'opacity 0.4s ease';
        content.style.opacity = '1';
        
        // Полное удаление прелоадера после анимации
        setTimeout(function() {
          loader.style.display = 'none';
          // Очистка из DOM для освобождения памяти
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 400);
      }
    };
    
    // Fallback: если Vue не вызвал hideAppLoader через 5 секунд, скрываем сами
    setTimeout(function() {
      if (loader && loader.style.display !== 'none') {
        console.warn('Vue не смонтировался за 5 секунд, скрываем прелоадер принудительно');
        window.hideAppLoader();
      }
    }, 5000);
  })();
`

