// @shared

/**
 * Конфигурация TailwindCSS с поддержкой темной темы
 */
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

/**
 * CSS переменные для светлой и темной темы
 */
export const cssVariables = `
  :root {
    /* Background */
    --color-bg: #fafbfc;
    --color-bg-secondary: #ffffff;
    --color-bg-card: #ffffff;
    
    /* Text */
    --color-text: #1e293b;
    --color-text-primary: #0f172a;
    --color-text-secondary: #64748b;
    --color-text-tertiary: #94a3b8;
    
    /* Border */
    --color-border: #e2e8f0;
    
    /* Primary */
    --color-primary: #0ea5e9;
    --color-primary-hover: #0284c7;
    --color-primary-light: #e0f2fe;
    
    /* Success */
    --color-success: #10b981;
    --color-success-light: #d1fae5;
    
    /* Warning */
    --color-warning: #f59e0b;
    --color-warning-light: #fef3c7;
    
    /* Danger */
    --color-danger: #ef4444;
    --color-danger-light: #fee2e2;
    
    /* Transition */
    --transition: all 0.2s ease;
  }
  
  .dark {
    /* Background */
    --color-bg: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-card: #1e293b;
    
    /* Text */
    --color-text: #f1f5f9;
    --color-text-primary: #f8fafc;
    --color-text-secondary: #94a3b8;
    --color-text-tertiary: #64748b;
    
    /* Border */
    --color-border: #334155;
    
    /* Primary */
    --color-primary: #38bdf8;
    --color-primary-hover: #0ea5e9;
    --color-primary-light: #1e3a5f;
    
    /* Success */
    --color-success: #34d399;
    --color-success-light: #064e3b;
    
    /* Warning */
    --color-warning: #fbbf24;
    --color-warning-light: #78350f;
    
    /* Danger */
    --color-danger: #f87171;
    --color-danger-light: #7f1d1d;
  }
`

/**
 * Общие стили компонентов
 */
export const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Helvetica Neue', Arial, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
    transition: var(--transition);
  }
  
  /* Inputs */
  .input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1.5px solid var(--color-border);
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: var(--transition);
    background: var(--color-bg-secondary);
    color: var(--color-text);
  }
  
  .input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
  }
  
  .input:disabled {
    background: var(--color-bg);
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  /* Buttons */
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    transition: var(--transition);
    cursor: pointer;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-primary {
    background: var(--color-primary);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Login container */
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    padding: 2rem;
  }
  
  .login-card {
    background: var(--color-bg-secondary);
    border-radius: 1.5rem;
    padding: 2.5rem;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  /* Theme toggle */
  .theme-toggle {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: var(--transition);
    z-index: 1000;
    color: white;
    cursor: pointer;
  }
  
  .theme-toggle:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`

