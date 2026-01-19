// @shared
import { jsx } from '@app/html-jsx'

export const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  code, pre {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace;
  }

  /* Современные переменные темы 2025 - яркая светлая тема */
  :root,
  [data-theme="light"] {
    /* Основные цвета - чистый белый */
    --bg-primary: #ffffff;
    --bg-secondary: #fefefe;
    --bg-tertiary: #fafafa;
    
    /* Текст - улучшенная контрастность */
    --text-primary: #111827;
    --text-secondary: #4b5563;
    --text-tertiary: #6b7280;
    
    /* Цвета ссылок для светлой темы */
    --link-primary: #2563eb;
    --link-secondary: #7c3aed;
    --link-hover: #1d4ed8;
    
    /* Границы и тени - для глубины и контраста */
    --border-primary: #f0f0f0;
    --border-secondary: #e5e5e5;
    --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
    --shadow-lg: 0 12px 32px 0 rgba(0, 0, 0, 0.16);
    --overlay-bg: rgba(0, 0, 0, 0.5);
    
    /* Glassmorphism - почти белый */
    --glass-bg: rgba(255, 255, 255, 0.95);
    --glass-border: rgba(240, 240, 240, 0.8);
    
    /* Компоненты */
    --code-bg: #f5f5f5;
    --code-text: #dc2626;
    --pre-bg: #f8f9fa;
    --pre-text: #1e293b;
    --table-header-bg: #fafafa;
    --table-hover-bg: #f8f8f8;
    --input-bg: #ffffff;
    --input-border: #e5e5e5;
    --input-focus-border: #2563eb;
    
    /* Статус цвета */
    --alert-error-bg: #fef2f2;
    --alert-error-text: #7f1d1d;
    --alert-error-border: #ef4444;
    --alert-success-bg: #f0fdf4;
    --alert-success-text: #15803d;
    --alert-success-border: #10b981;
    --alert-info-bg: #eff6ff;
    --alert-info-text: #1e40af;
    --alert-info-border: #3b82f6;
    --alert-warning-bg: #fffbeb;
    --alert-warning-text: #92400e;
    --alert-warning-border: #f59e0b;
  }

  [data-theme="dark"] {
    /* Основные цвета */
    --bg-primary: #1a1f2e;
    --bg-secondary: #0f1419;
    --bg-tertiary: #1f2937;
    
    /* Текст */
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-tertiary: #9ca3af;
    
    /* Цвета ссылок для тёмной темы */
    --link-primary: #60a5fa;
    --link-secondary: #a78bfa;
    --link-hover: #93c5fd;
    
    /* Границы и тени */
    --border-primary: #2d3748;
    --border-secondary: #374151;
    --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 12px 32px 0 rgba(0, 0, 0, 0.5);
    --overlay-bg: rgba(0, 0, 0, 0.8);
    
    /* Glassmorphism */
    --glass-bg: rgba(26, 31, 46, 0.85);
    --glass-border: rgba(255, 255, 255, 0.1);
    
    /* Компоненты - мягкие цвета для глаз */
    --code-bg: rgba(55, 65, 81, 0.5);
    --code-text: #d1d5db;
    --pre-bg: #0f1419;
    --pre-text: #e5e7eb;
    --table-header-bg: #1f2937;
    --table-hover-bg: #2d3748;
    --input-bg: #2d3748;
    --input-border: #374151;
    --input-focus-border: #60a5fa;
    
    /* Статус цвета */
    --alert-error-bg: #451a1a;
    --alert-error-text: #fecaca;
    --alert-error-border: #f87171;
    --alert-success-bg: #1b3a1b;
    --alert-success-text: #bbf7d0;
    --alert-success-border: #34d399;
    --alert-info-bg: #1a2942;
    --alert-info-text: #bfdbfe;
    --alert-info-border: #60a5fa;
    --alert-warning-bg: #3a3010;
    --alert-warning-text: #fcd34d;
    --alert-warning-border: #fbbf24;
  }

  /* === ОСНОВНЫЕ КОМПОНЕНТЫ === */

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* Кнопки - минималистичный дизайн 2025 (только 3 цвета) */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }

  .btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .btn:active::before {
    animation: ripple 0.4s ease-out;
  }

  @keyframes ripple {
    to {
      width: 300px;
      height: 300px;
    }
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  /* Синий (основной цвет) с едва заметным градиентом */
  .btn-primary {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .btn-primary:hover:not(:disabled) {
    box-shadow: var(--shadow-md);
    background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  }

  /* Серый (вторичный) - с едва заметным градиентом */
  .btn-secondary {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
    color: var(--text-primary);
    box-shadow: var(--shadow-xs);
  }

  .btn-secondary:hover:not(:disabled) {
    box-shadow: var(--shadow-sm);
    background: linear-gradient(135deg, var(--border-secondary) 0%, var(--bg-tertiary) 100%);
  }
  
  /* Более выраженный градиент для тёмной темы */
  [data-theme="dark"] .btn-secondary {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--border-secondary) 100%);
  }
  
  [data-theme="dark"] .btn-secondary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--border-secondary) 0%, var(--border-primary) 100%);
  }

  /* Красный (только для опасных действий) */
  .btn-danger {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .btn-danger:hover:not(:disabled) {
    box-shadow: var(--shadow-md);
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  }

  /* Прозрачная кнопка */
  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1.5px solid var(--border-secondary);
    transition: all 0.2s ease;
  }

  .btn-ghost:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
    color: var(--text-primary);
    border-color: var(--border-primary);
  }
  
  /* Более выраженный градиент для тёмной темы */
  [data-theme="dark"] .btn-ghost:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  }

  /* Инпуты - современный дизайн */
  .input,
  .textarea,
  select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1.5px solid var(--input-border);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 0.875rem;
    background-color: var(--input-bg);
    color: var(--text-primary);
    transition: all 0.2s ease;
  }

  .input::placeholder,
  .textarea::placeholder {
    color: var(--text-tertiary);
  }

  .input:focus,
  .textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: var(--input-bg);
  }

  .textarea {
    min-height: 150px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    resize: vertical;
    line-height: 1.6;
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M1 4l5 5 5-5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.5rem;
  }

  /* Карточки - с едва заметным градиентом для глубины */
  .card {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--border-primary);
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
  }

  .card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--border-secondary);
    /* Убрали движение - только тень */
  }
  
  /* Более видимая граница в светлой теме */
  [data-theme="light"] .card {
    border-color: #e5e5e5;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02);
  }
  
  [data-theme="light"] .card:hover {
    border-color: #d1d5db;
  }
  
  /* Более выраженный градиент для тёмной темы */
  [data-theme="dark"] .card {
    background: linear-gradient(135deg, var(--glass-bg) 0%, var(--bg-primary) 100%);
    border-color: var(--glass-border);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }

  /* Таблицы - с едва заметным градиентом для глубины */
  .table {
    width: 100%;
    border-collapse: collapse;
    background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .table thead {
    background: linear-gradient(135deg, var(--table-header-bg) 0%, var(--bg-tertiary) 100%);
    border-bottom: 2px solid var(--border-secondary);
  }
  
  /* Объёмная таблица для светлой темы */
  [data-theme="light"] .table {
    border: 1px solid #d1d5db;
    box-shadow: 
      0 4px 12px 0 rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  
  [data-theme="light"] .table thead {
    border-bottom-color: #9ca3af;
    background: linear-gradient(135deg, rgba(250, 250, 250, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%);
  }
  
  /* Объёмная таблица для тёмной темы */
  [data-theme="dark"] .table {
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.8) 0%, rgba(15, 20, 25, 0.6) 100%);
    box-shadow: 
      0 4px 12px 0 rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  [data-theme="dark"] .table thead {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(55, 65, 81, 0.4) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  [data-theme="dark"] .table td {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .table th {
    padding: 1rem;
    text-align: left;
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-secondary);
    color: var(--text-secondary);
  }

  .table tbody tr {
    background: transparent;
    transition: background-color 0.15s ease;
  }

  .table tbody tr:hover {
    background-color: var(--table-hover-bg);
  }

  /* Убираем чередование строк для минимализма */
  .table tbody tr:nth-child(even) {
    background: transparent;
  }

  .table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Более видимые границы в светлой теме */
  [data-theme="light"] .table td {
    border-bottom-color: #d1d5db;
  }

  .table a {
    color: var(--link-primary);
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  .table a::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--link-primary);
    opacity: 0.08;
    border-radius: 0.375rem;
    transition: opacity 0.2s ease;
    z-index: -1;
  }

  .table a:hover {
    color: var(--link-hover);
    transform: translateX(2px);
  }

  .table a:hover::before {
    opacity: 0.12;
  }

  /* Алерты - только 3 цвета с градиентами */
  .alert {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Красный - для ошибок с едва заметным градиентом */
  .alert-error {
    background: linear-gradient(135deg, var(--alert-error-bg) 0%, rgba(254, 242, 242, 0.95) 100%);
    color: var(--alert-error-text);
    border-left: 4px solid var(--alert-error-border);
  }

  /* Серый - для успеха и предупреждений с градиентом */
  .alert-success,
  .alert-warning {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
    color: var(--text-primary);
    border-left: 4px solid var(--border-secondary);
  }

  /* Синий - для информации с градиентом */
  .alert-info {
    background: linear-gradient(135deg, var(--alert-info-bg) 0%, rgba(219, 234, 254, 0.95) 100%);
    color: var(--alert-info-text);
    border-left: 4px solid var(--alert-info-border);
  }
  
  /* Более выраженные градиенты для тёмной темы */
  [data-theme="dark"] .alert-error {
    background: linear-gradient(135deg, var(--alert-error-bg) 0%, rgba(220, 38, 38, 0.05) 100%);
  }
  
  [data-theme="dark"] .alert-success,
  [data-theme="dark"] .alert-warning {
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  }
  
  [data-theme="dark"] .alert-info {
    background: linear-gradient(135deg, var(--alert-info-bg) 0%, rgba(37, 99, 235, 0.05) 100%);
  }

  /* Skeleton Loader */
  .skeleton {
    background: linear-gradient(90deg, var(--bg-tertiary) 0%, var(--border-secondary) 50%, var(--bg-tertiary) 100%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 0.5rem;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .skeleton-line {
    height: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
  }

  .skeleton-line:last-child {
    margin-bottom: 0;
  }

  /* Спиннер */
  .loading {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--border-primary);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .fa-spin {
    animation: fa-spin 1s linear infinite;
  }

  @keyframes fa-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Markdown Preview */
  .markdown-preview {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--text-primary);
  }

  .markdown-preview h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 2rem 0 1rem 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .markdown-preview h2 {
    font-size: 1.625rem;
    font-weight: 700;
    margin: 1.75rem 0 0.875rem 0;
    color: var(--text-primary);
    border-bottom: 2px solid var(--border-primary);
    padding-bottom: 0.5rem;
  }

  .markdown-preview h3 {
    font-size: 1.375rem;
    font-weight: 700;
    margin: 1.5rem 0 0.75rem 0;
    color: var(--text-primary);
  }

  .markdown-preview h4,
  .markdown-preview h5,
  .markdown-preview h6 {
    font-weight: 700;
    margin: 1.25rem 0 0.5rem 0;
    color: var(--text-primary);
  }

  .markdown-preview p {
    margin-bottom: 1rem;
  }

  .markdown-preview ul,
  .markdown-preview ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .markdown-preview li {
    margin-bottom: 0.5rem;
  }

  .markdown-preview code {
    background-color: var(--code-bg);
    color: var(--code-text);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875em;
    font-weight: 500;
  }

  .markdown-preview pre {
    background-color: var(--pre-bg);
    color: var(--pre-text);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-secondary);
  }

  /* Для светлой темы - светлый фон с границей */
  [data-theme="light"] .markdown-preview pre {
    background: linear-gradient(135deg, var(--pre-bg) 0%, #f0f3f6 100%);
    border-color: var(--border-primary);
  }

  /* Для тёмной темы - тёмный фон */
  [data-theme="dark"] .markdown-preview pre {
    background: var(--pre-bg);
    border-color: var(--border-secondary);
    box-shadow: var(--shadow-md);
  }

  .markdown-preview pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    font-size: 0.875rem;
  }

  .markdown-preview blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1rem;
    color: var(--text-secondary);
    font-style: italic;
    background-color: var(--bg-tertiary);
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
  }

  .markdown-preview table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
    border-radius: 0.5rem;
    overflow: hidden;
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  /* Восстанавливаем нормальное отображение thead, tbody, tr на десктопе */
  .markdown-preview table thead,
  .markdown-preview table tbody {
    display: table-row-group;
  }
  
  .markdown-preview table tr {
    display: table-row;
  }
  
  .markdown-preview table th,
  .markdown-preview table td {
    display: table-cell;
  }
  
  /* Таблицы в стиле code blocks - светлая тема */
  [data-theme="light"] .markdown-preview table {
    background-color: var(--pre-bg);
    border: 1px solid #d1d5db;
    box-shadow: var(--shadow-sm);
  }
  
  [data-theme="light"] .markdown-preview table th {
    background-color: rgba(0, 0, 0, 0.03);
  }
  
  /* Таблицы в стиле code blocks - тёмная тема */
  [data-theme="dark"] .markdown-preview table {
    background-color: var(--pre-bg);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: var(--shadow-md);
  }
  
  [data-theme="dark"] .markdown-preview table th {
    background-color: rgba(255, 255, 255, 0.03);
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
  
  [data-theme="dark"] .markdown-preview table th,
  [data-theme="dark"] .markdown-preview table td {
    border-color: rgba(255, 255, 255, 0.06);
  }
  
  [data-theme="dark"] .markdown-preview table tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }

  .markdown-preview table th,
  .markdown-preview table td {
    border: 1px solid var(--border-secondary);
    padding: 0.75rem;
    text-align: left;
    white-space: normal;
  }

  .markdown-preview table th {
    background: transparent;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 2px solid var(--text-tertiary);
  }
  
  /* Более видимые границы в светлой теме */
  [data-theme="light"] .markdown-preview table th,
  [data-theme="light"] .markdown-preview table td {
    border-color: #d1d5db;
  }
  
  [data-theme="light"] .markdown-preview table th {
    border-bottom-color: #9ca3af;
  }

  .markdown-preview table tbody tr {
    background: transparent;
    transition: background-color 0.15s ease;
  }

  .markdown-preview table tbody tr:hover {
    background-color: var(--table-hover-bg);
  }

  /* Убираем чередование строк - слишком много оттенков */
  .markdown-preview table tbody tr:nth-child(even) {
    background: transparent;
  }

  .markdown-preview a {
    color: var(--link-primary);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    padding: 0 0.25rem;
    border-bottom: 2px solid transparent;
  }

  .markdown-preview a:hover {
    color: var(--link-hover);
    border-bottom-color: var(--link-hover);
  }

  /* Горизонтальные линии в markdown */
  .markdown-preview hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--border-secondary) 50%, transparent 100%);
    margin: 2rem 0;
  }

  /* Менее контрастные hr для тёмной темы */
  [data-theme="dark"] .markdown-preview hr {
    background: linear-gradient(90deg, transparent 0%, var(--border-primary) 50%, transparent 100%);
    opacity: 0.5;
  }

  /* Модальные окна */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--overlay-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
    backdrop-filter: blur(4px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--border-primary);
    border-radius: 0.75rem;
    padding: 2rem;
    box-shadow: var(--shadow-lg);
    max-width: 500px;
    width: 90%;
    animation: slideUp 0.3s ease-out;
  }
  
  /* Более выраженный градиент и blur для тёмной темы */
  [data-theme="dark"] .modal-content {
    background: linear-gradient(135deg, var(--glass-bg) 0%, var(--bg-primary) 100%);
    border-color: var(--glass-border);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }

  .modal-body {
    margin-bottom: 1.5rem;
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  /* Формы */
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-hint {
    display: block;
    font-size: 0.8125rem;
    color: var(--text-tertiary);
    margin-top: 0.375rem;
  }

  /* Заголовки - с едва заметным градиентом для глубины */
  .header {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border-bottom: 1px solid var(--border-primary);
    padding: 1.5rem 0;
    margin-bottom: 2rem;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    position: sticky;
    top: 0;
    z-index: 100;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
  
  /* Более выраженный градиент и blur для тёмной темы */
  [data-theme="dark"] .header {
    background: linear-gradient(135deg, var(--glass-bg) 0%, var(--bg-primary) 100%);
    border-bottom-color: var(--glass-border);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .header h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .header-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .header h1 {
      font-size: 1.5rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      width: 100%;
      justify-content: center;
    }
  }

  /* Grid и Layout */
  .page-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .page-grid {
      grid-template-columns: 1fr;
    }
  }

  .editor-section,
  .preview-section {
    display: flex;
    flex-direction: column;
  }

  .editor-label,
  .preview-label {
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .editor-wrapper {
    position: relative;
    flex: 1;
    border: 1.5px solid var(--border-secondary);
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--input-bg);
    box-shadow: var(--shadow-sm);
  }

  .editor-wrapper textarea {
    width: 100%;
    height: 600px;
    border: none;
    padding: 1.5rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
    resize: none;
    background: var(--input-bg);
    color: var(--text-primary);
    line-height: 1.6;
  }

  .preview-wrapper {
    border: 1.5px solid var(--border-secondary);
    border-radius: 0.75rem;
    padding: 1.5rem;
    overflow-y: auto;
    height: 600px;
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }

  /* Drag and Drop */
  .drag-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    backdrop-filter: blur(4px);
  }

  .drag-content {
    text-align: center;
    pointer-events: none;
    animation: scaleIn 0.3s ease-out;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .drag-content h2 {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
  }

  .drag-content p {
    font-size: 1.125rem;
    opacity: 0.95;
    margin: 0.25rem 0;
  }

  /* Breadcrumbs */
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .breadcrumbs a {
    color: var(--link-primary);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    position: relative;
  }

  .breadcrumbs a::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--link-primary);
    opacity: 0;
    border-radius: 0.375rem;
    transition: opacity 0.2s ease;
    z-index: -1;
  }

  .breadcrumbs a:hover {
    color: var(--link-hover);
  }

  .breadcrumbs a:hover::before {
    opacity: 0.12;
  }

  .breadcrumbs span {
    color: var(--text-tertiary);
    margin: 0 0.25rem;
  }

  /* Утилиты */
  .text-center {
    text-align: center;
  }

  .flex {
    display: flex;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gap-1 { gap: 0.5rem; }
  .gap-2 { gap: 1rem; }
  .gap-3 { gap: 1.5rem; }

  .mb-1 { margin-bottom: 0.5rem; }
  .mb-2 { margin-bottom: 1rem; }
  .mb-3 { margin-bottom: 1.5rem; }
  .mb-4 { margin-bottom: 2rem; }

  .mt-1 { margin-top: 0.5rem; }
  .mt-2 { margin-top: 1rem; }
  .mt-3 { margin-top: 1.5rem; }
  .mt-4 { margin-top: 2rem; }

  /* Адаптивность для планшетов */
  @media (max-width: 1024px) {
    .page-grid {
      gap: 1.5rem;
    }

    .header h1 {
      font-size: 1.625rem;
    }

    .table {
      font-size: 0.875rem;
    }
  }

  /* Адаптивность для мобильных устройств */
  @media (max-width: 768px) {
    .editor-wrapper textarea,
    .preview-wrapper {
      height: 400px;
    }

    .page-grid {
      gap: 1rem;
    }

    .container {
      padding: 0 1rem;
    }

    .header {
      padding: 1rem 0;
      margin-bottom: 1.5rem;
    }

    .header h1 {
      font-size: 1.375rem;
    }

    .btn {
      padding: 0.5rem 0.875rem;
      font-size: 0.8125rem;
    }

    .table {
      font-size: 0.8125rem;
    }

    .table th,
    .table td {
      padding: 0.75rem;
    }
  }

  /* Адаптивность для маленьких мобильных */
  @media (max-width: 480px) {
    .header h1 {
      font-size: 1.25rem;
    }

    .btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .table {
      font-size: 0.75rem;
    }

    .table th,
    .table td {
      padding: 0.5rem;
    }

    .table a {
      padding: 0.25rem;
      font-size: 0.875rem;
    }
  }

  /* Поддержка prefers-reduced-motion для доступности */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Оптимизация для дисплеев с высоким DPI */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .card,
    .table {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  }
`
