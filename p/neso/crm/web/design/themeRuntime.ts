export type ThemeName = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'neso_theme'
export const DEFAULT_THEME: ThemeName = 'dark'

export function getThemeInitScript(defaultTheme: ThemeName = DEFAULT_THEME): string {
  return `
(function(){
  var key = ${JSON.stringify(THEME_STORAGE_KEY)};
  var theme = (function(){
    try { return localStorage.getItem(key); } catch (e) { return null; }
  })() || ${JSON.stringify(defaultTheme)};

  function apply(next){
    theme = next;
    document.documentElement.dataset.theme = next;
    var styles = document.querySelectorAll('style[data-theme]');
    for (var i = 0; i < styles.length; i++) {
      var s = styles[i];
      var active = s.getAttribute('data-theme') === next;
      s.media = active ? 'all' : 'not all';
    }
  }

  window.__getTheme = function(){ return theme; };
  window.__setTheme = function(next){
    if (next !== 'dark' && next !== 'light') return;
    try { localStorage.setItem(key, next); } catch (e) {}
    apply(next);
  };

  apply(theme);
})();
  `.trim();
}

declare global {
  interface Window {
    __getTheme?: () => ThemeName
    __setTheme?: (theme: ThemeName) => void
  }
}
