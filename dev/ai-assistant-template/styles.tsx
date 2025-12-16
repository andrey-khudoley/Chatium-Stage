// Общие стили проекта AI ассистента

export const tailwindScript = `
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          dark: '#1F2937',
          light: '#F9FAFB',
          border: '#E5E7EB'
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif']
        }
      }
    }
  }
`

export const cssVariables = `
  :root {
    --color-primary: #3B82F6;
    --color-secondary: #8B5CF6;
    --color-accent: #10B981;
    --color-dark: #1F2937;
    --color-light: #F9FAFB;
    --color-border: #E5E7EB;
    --color-error: #EF4444;
    --color-success: #10B981;
  }
`

export const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
    color: #1F2937;
    background-color: #F9FAFB;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    margin-bottom: 1rem;
    color: #111827;
  }
  
  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.5rem; }
  
  button {
    cursor: pointer;
    font-family: inherit;
  }
  
  a {
    color: var(--color-primary);
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
`

// Стили для прелоадера
export const preloaderStyles = `
  .preloader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 0.3s ease-out;
  }
  
  .preloader.fade-out {
    opacity: 0;
    pointer-events: none;
  }
  
  .preloader-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #E5E7EB;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .preloader-text {
    margin-top: 1rem;
    font-size: 1rem;
    color: #6B7280;
    font-weight: 500;
  }
`

