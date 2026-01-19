// @shared
import { jsx } from "@app/html-jsx"

export function HeadStyles() {
  return (
    <>
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Raleway:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Font Awesome */}
      <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
      
      {/* Tailwind CSS */}
      <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
      
      {/* Tailwind Config */}
      <script dangerouslySetInnerHTML={{ __html: `
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                'notebook-cover': '#5A1F29',
                'notebook-spine': '#4A1721',
                'page-cream': '#F8F4E8',
                'page-shadow': '#E8E0D0',
                'text-dark': '#2C2416',
                'text-light': '#5C4F3A',
                'gold-accent': '#B8860B',
                'burgundy': '#722F37',
                'ring-metal': '#9A8B7A',
              },
              fontFamily: {
                cormorant: ['Cormorant Garamond', 'serif'],
                raleway: ['Raleway', 'sans-serif'],
                caveat: ['Caveat', 'cursive'],
              },
              animation: {
                'cover-open': 'coverOpen 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'content-reveal': 'contentReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1s forwards',
                'photo-appear': 'photoAppear 0.6s ease-out 1.4s forwards',
                'page-in': 'pageIn 0.5s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
              },
              keyframes: {
                coverOpen: {
                  '0%': { transform: 'translateX(0) rotateY(0deg)', transformOrigin: 'left center' },
                  '100%': { transform: 'translateX(100%) rotateY(-15deg)', transformOrigin: 'left center', opacity: '0' }
                },
                contentReveal: {
                  '0%': { opacity: '0', transform: 'scale(0.95)' },
                  '100%': { opacity: '1', transform: 'scale(1)' }
                },
                photoAppear: {
                  '0%': { opacity: '0', transform: 'translateY(-20px) rotate(-2deg)' },
                  '100%': { opacity: '1', transform: 'translateY(0) rotate(-2deg)' }
                },
                pageIn: {
                  '0%': { opacity: '0', transform: 'translateY(20px)' },
                  '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' }
                }
              }
            }
          }
        }
      `}} />

      {/* Custom Styles */}
      <style type="text/css" dangerouslySetInnerHTML={{ __html: `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }

        /* Paper texture */
        .paper-texture {
          background: 
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(135deg, #F8F4E8 0%, #F5F0E5 50%, #F8F4E8 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
        }

        /* Ring shadow effect */
        .ring-shadow {
          box-shadow: 
            inset 0 2px 4px rgba(0,0,0,0.3),
            inset 0 -2px 4px rgba(255,255,255,0.2),
            0 4px 8px rgba(0,0,0,0.2);
        }

        /* Paper clip effect */
        .paper-clip {
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }

        /* Smooth transitions */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Tab hover glow */
        .tab-glow:hover {
          filter: brightness(1.1);
        }

        /* Loading spinner */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}} />

      {/* Analytics */}
      <script src="/s/metric/clarity.js"></script>
    </>
  )
}
