// @shared

export type ThemeMode = 'dark' | 'light'
export type UiDensity = 'compact' | 'comfortable'
export type FontRole = 'heading' | 'body' | 'tables' | 'forms' | 'navigation'

export interface FontOption {
  id: string
  label: string
  family: string
  className: string
}

export interface ThemeTokens {
  bg: string
  bgAlt: string
  surface: string
  surfaceRaised: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  textDim: string
  accent: string
  accentStrong: string
  accentSoft: string
  success: string
  warning: string
  danger: string
  info: string
  shadow: string
}

export interface ThemePreset {
  id: string
  name: string
  mode: ThemeMode
  defaultDensity: UiDensity
  defaultFonts: Record<FontRole, string>
  tokens: ThemeTokens
}

export type ChartVisualMode = 'soft' | 'contrast'

export interface UiPreferences {
  themeId: string
  density: UiDensity
  radiusScale: number
  shadowScale: number
  elementScale: number
  tableDensity: UiDensity
  chartVisualMode: ChartVisualMode
  preloaderEnabled: boolean
  colorOverrides: Partial<ThemeTokens>
  fonts: Record<FontRole, string>
}

export const UI_PREFS_COOKIE_NAME = 'crm_ui_prefs_v1'
export const UI_LOCALE_COOKIE_NAME = 'crm_ui_lang_v1'
export const UI_LOADER_COOKIE_NAME = 'crm_ui_loader_v1'

export const FONT_OPTIONS: FontOption[] = [
  { id: 'manrope', label: 'Manrope (Default)', family: 'Manrope', className: "'Manrope', sans-serif" },
  { id: 'inter', label: 'Inter', family: 'Inter', className: "'Inter', sans-serif" },
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans', family: 'IBM Plex Sans', className: "'IBM Plex Sans', sans-serif" },
  { id: 'source-sans-3', label: 'Source Sans 3', family: 'Source Sans 3', className: "'Source Sans 3', sans-serif" },
  { id: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', className: "'Plus Jakarta Sans', sans-serif" },
  { id: 'nunito-sans', label: 'Nunito Sans', family: 'Nunito Sans', className: "'Nunito Sans', sans-serif" },
  { id: 'public-sans', label: 'Public Sans', family: 'Public Sans', className: "'Public Sans', sans-serif" },
  { id: 'archivo', label: 'Archivo', family: 'Archivo', className: "'Archivo', sans-serif" },
  { id: 'lato', label: 'Lato', family: 'Lato', className: "'Lato', sans-serif" },
  { id: 'rubik', label: 'Rubik', family: 'Rubik', className: "'Rubik', sans-serif" },
  { id: 'dm-sans', label: 'DM Sans', family: 'DM Sans', className: "'DM Sans', sans-serif" },
  { id: 'figtree', label: 'Figtree', family: 'Figtree', className: "'Figtree', sans-serif" },
  { id: 'space-grotesk', label: 'Space Grotesk', family: 'Space Grotesk', className: "'Space Grotesk', sans-serif" },
  { id: 'work-sans', label: 'Work Sans', family: 'Work Sans', className: "'Work Sans', sans-serif" },
  { id: 'karla', label: 'Karla', family: 'Karla', className: "'Karla', sans-serif" },
  { id: 'noto-sans', label: 'Noto Sans', family: 'Noto Sans', className: "'Noto Sans', sans-serif" },
  { id: 'montserrat', label: 'Montserrat', family: 'Montserrat', className: "'Montserrat', sans-serif" },
  { id: 'raleway', label: 'Raleway', family: 'Raleway', className: "'Raleway', sans-serif" },
  { id: 'exo-2', label: 'Exo 2', family: 'Exo 2', className: "'Exo 2', sans-serif" },
  { id: 'pt-sans', label: 'PT Sans', family: 'PT Sans', className: "'PT Sans', sans-serif" },
  { id: 'merriweather', label: 'Merriweather', family: 'Merriweather', className: "'Merriweather', serif" },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono', className: "'JetBrains Mono', monospace" }
]

const DEFAULT_FONT_ROLES: Record<FontRole, string> = {
  heading: 'space-grotesk',
  body: 'manrope',
  tables: 'jetbrains-mono',
  forms: 'manrope',
  navigation: 'inter'
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight-ops',
    name: 'Midnight Ops',
    mode: 'dark',
    defaultDensity: 'comfortable',
    defaultFonts: DEFAULT_FONT_ROLES,
    tokens: {
      bg: '#070a12',
      bgAlt: '#0e1321',
      surface: '#131a2b',
      surfaceRaised: '#1a233a',
      border: '#2a3550',
      borderStrong: '#3b4b71',
      text: '#f2f6ff',
      textMuted: '#c4cee5',
      textDim: '#8e9abc',
      accent: '#4da3ff',
      accentStrong: '#1a7cff',
      accentSoft: 'rgba(77, 163, 255, 0.2)',
      success: '#36d399',
      warning: '#f7b955',
      danger: '#ff6b7f',
      info: '#7dd3fc',
      shadow: 'rgba(2, 6, 23, 0.55)'
    }
  },
  {
    id: 'forest-grid',
    name: 'Forest Grid',
    mode: 'dark',
    defaultDensity: 'comfortable',
    defaultFonts: {
      heading: 'exo-2',
      body: 'public-sans',
      tables: 'jetbrains-mono',
      forms: 'public-sans',
      navigation: 'space-grotesk'
    },
    tokens: {
      bg: '#090f0d',
      bgAlt: '#121a17',
      surface: '#17231f',
      surfaceRaised: '#20312a',
      border: '#30433b',
      borderStrong: '#436055',
      text: '#e9f6ef',
      textMuted: '#bdd6c8',
      textDim: '#8aa697',
      accent: '#7ccf7e',
      accentStrong: '#4ea95a',
      accentSoft: 'rgba(124, 207, 126, 0.22)',
      success: '#5dd39e',
      warning: '#f1be70',
      danger: '#ff7a8e',
      info: '#6ad8ff',
      shadow: 'rgba(3, 12, 8, 0.62)'
    }
  },
  {
    id: 'graphite-amber',
    name: 'Graphite Amber',
    mode: 'dark',
    defaultDensity: 'compact',
    defaultFonts: {
      heading: 'montserrat',
      body: 'work-sans',
      tables: 'jetbrains-mono',
      forms: 'work-sans',
      navigation: 'montserrat'
    },
    tokens: {
      bg: '#121212',
      bgAlt: '#1a1a1a',
      surface: '#202124',
      surfaceRaised: '#292a2f',
      border: '#3a3c42',
      borderStrong: '#50535d',
      text: '#f9f8f2',
      textMuted: '#d7d3c3',
      textDim: '#a59f8a',
      accent: '#eab75c',
      accentStrong: '#cf9031',
      accentSoft: 'rgba(234, 183, 92, 0.22)',
      success: '#4fd1a6',
      warning: '#f8c45e',
      danger: '#f87171',
      info: '#7dd3fc',
      shadow: 'rgba(10, 10, 10, 0.72)'
    }
  },
  {
    id: 'violet-pulse',
    name: 'Violet Pulse',
    mode: 'dark',
    defaultDensity: 'comfortable',
    defaultFonts: {
      heading: 'plus-jakarta-sans',
      body: 'figtree',
      tables: 'jetbrains-mono',
      forms: 'figtree',
      navigation: 'plus-jakarta-sans'
    },
    tokens: {
      bg: '#0d0a18',
      bgAlt: '#151024',
      surface: '#1c1530',
      surfaceRaised: '#251d3d',
      border: '#3a2f59',
      borderStrong: '#51407b',
      text: '#f4f1ff',
      textMuted: '#d0c8eb',
      textDim: '#a79bbf',
      accent: '#9d79ff',
      accentStrong: '#7b4dff',
      accentSoft: 'rgba(157, 121, 255, 0.24)',
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#fb7185',
      info: '#60a5fa',
      shadow: 'rgba(9, 5, 22, 0.68)'
    }
  },
  {
    id: 'linen-pro',
    name: 'Linen Pro',
    mode: 'light',
    defaultDensity: 'comfortable',
    defaultFonts: {
      heading: 'space-grotesk',
      body: 'source-sans-3',
      tables: 'jetbrains-mono',
      forms: 'source-sans-3',
      navigation: 'inter'
    },
    tokens: {
      bg: '#f4f5f8',
      bgAlt: '#ebeef4',
      surface: '#ffffff',
      surfaceRaised: '#f8f9fd',
      border: '#d8dde9',
      borderStrong: '#bcc5d8',
      text: '#1f2838',
      textMuted: '#4f5d75',
      textDim: '#7a8599',
      accent: '#246bff',
      accentStrong: '#0b4bd3',
      accentSoft: 'rgba(36, 107, 255, 0.14)',
      success: '#139b73',
      warning: '#c67f19',
      danger: '#d54863',
      info: '#1974d2',
      shadow: 'rgba(39, 55, 94, 0.18)'
    }
  },
  {
    id: 'sand-contrast',
    name: 'Sand Contrast',
    mode: 'light',
    defaultDensity: 'compact',
    defaultFonts: {
      heading: 'raleway',
      body: 'karla',
      tables: 'jetbrains-mono',
      forms: 'karla',
      navigation: 'raleway'
    },
    tokens: {
      bg: '#f8f3ea',
      bgAlt: '#f1e8d8',
      surface: '#fffdf7',
      surfaceRaised: '#fff7e7',
      border: '#d7c8aa',
      borderStrong: '#bfa880',
      text: '#2e2618',
      textMuted: '#5b4b33',
      textDim: '#8f7754',
      accent: '#b76b1f',
      accentStrong: '#8f5116',
      accentSoft: 'rgba(183, 107, 31, 0.18)',
      success: '#1e9f73',
      warning: '#bb7a00',
      danger: '#cf4f45',
      info: '#2e74c5',
      shadow: 'rgba(85, 55, 28, 0.22)'
    }
  }
]

export const DEFAULT_THEME_ID = 'midnight-ops'

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  themeId: DEFAULT_THEME_ID,
  density: 'comfortable',
  radiusScale: 1,
  shadowScale: 1,
  elementScale: 1,
  tableDensity: 'comfortable',
  chartVisualMode: 'soft',
  preloaderEnabled: true,
  colorOverrides: {},
  fonts: DEFAULT_FONT_ROLES
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readRawCookie(name: string): string | null {
  if (!isBrowserEnvironment()) return null
  const escaped = name.replace(/[.*+?^()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function writeRawCookie(name: string, value: string, days = 365): void {
  if (!isBrowserEnvironment()) return
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60))
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getThemeById(themeId: string): ThemePreset {
  return THEME_PRESETS.find((theme) => theme.id === themeId) || THEME_PRESETS[0]
}

export function getFontById(fontId: string): FontOption {
  return FONT_OPTIONS.find((font) => font.id === fontId) || FONT_OPTIONS[0]
}

export function sanitizeUiPreferences(raw: unknown): UiPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_UI_PREFERENCES }

  const value = raw as Record<string, unknown>
  const theme = getThemeById(typeof value.themeId === 'string' ? value.themeId : DEFAULT_THEME_ID)

  const density = value.density === 'compact' || value.density === 'comfortable'
    ? value.density
    : theme.defaultDensity

  const tableDensity = value.tableDensity === 'compact' || value.tableDensity === 'comfortable'
    ? value.tableDensity
    : density

  const chartVisualMode = value.chartVisualMode === 'contrast' ? 'contrast' : 'soft'
  const preloaderEnabled = value.preloaderEnabled !== false

  const fontsFromRaw = typeof value.fonts === 'object' && value.fonts ? value.fonts as Record<string, unknown> : {}
  const themeFonts = theme.defaultFonts

  const fonts: Record<FontRole, string> = {
    heading: getFontById(typeof fontsFromRaw.heading === 'string' ? fontsFromRaw.heading : themeFonts.heading).id,
    body: getFontById(typeof fontsFromRaw.body === 'string' ? fontsFromRaw.body : themeFonts.body).id,
    tables: getFontById(typeof fontsFromRaw.tables === 'string' ? fontsFromRaw.tables : themeFonts.tables).id,
    forms: getFontById(typeof fontsFromRaw.forms === 'string' ? fontsFromRaw.forms : themeFonts.forms).id,
    navigation: getFontById(typeof fontsFromRaw.navigation === 'string' ? fontsFromRaw.navigation : themeFonts.navigation).id
  }

  const colorOverrides: Partial<ThemeTokens> = {}
  const rawOverrides = typeof value.colorOverrides === 'object' && value.colorOverrides
    ? value.colorOverrides as Record<string, unknown>
    : {}

  const tokenKeys = Object.keys(theme.tokens) as Array<keyof ThemeTokens>
  for (const key of tokenKeys) {
    const rawToken = rawOverrides[key]
    if (typeof rawToken === 'string' && rawToken.trim()) {
      colorOverrides[key] = rawToken.trim()
    }
  }

  return {
    themeId: theme.id,
    density,
    radiusScale: clampNumber(Number(value.radiusScale || DEFAULT_UI_PREFERENCES.radiusScale), 0.7, 1.4),
    shadowScale: clampNumber(Number(value.shadowScale || DEFAULT_UI_PREFERENCES.shadowScale), 0.5, 1.6),
    elementScale: clampNumber(Number(value.elementScale || DEFAULT_UI_PREFERENCES.elementScale), 0.85, 1.2),
    tableDensity,
    chartVisualMode,
    preloaderEnabled,
    colorOverrides,
    fonts
  }
}

export function getStoredUiPreferences(): UiPreferences {
  const raw = readRawCookie(UI_PREFS_COOKIE_NAME)
  if (!raw) return { ...DEFAULT_UI_PREFERENCES }

  try {
    return sanitizeUiPreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_UI_PREFERENCES }
  }
}

export function saveUiPreferences(preferences: UiPreferences): void {
  writeRawCookie(UI_PREFS_COOKIE_NAME, JSON.stringify(sanitizeUiPreferences(preferences)))
  writeRawCookie(UI_LOADER_COOKIE_NAME, preferences.preloaderEnabled ? '1' : '0')
}

export function getStoredLocale(fallback: 'ru' | 'en' = 'ru'): 'ru' | 'en' {
  const raw = readRawCookie(UI_LOCALE_COOKIE_NAME)
  if (raw === 'ru' || raw === 'en') return raw
  return fallback
}

export function saveLocale(locale: 'ru' | 'en'): void {
  writeRawCookie(UI_LOCALE_COOKIE_NAME, locale)
}

export function resolveTokens(preferences: UiPreferences): ThemeTokens {
  const theme = getThemeById(preferences.themeId)
  return {
    ...theme.tokens,
    ...preferences.colorOverrides
  }
}

export function resolveFontFamilies(preferences: UiPreferences): Record<FontRole, string> {
  return {
    heading: getFontById(preferences.fonts.heading).className,
    body: getFontById(preferences.fonts.body).className,
    tables: getFontById(preferences.fonts.tables).className,
    forms: getFontById(preferences.fonts.forms).className,
    navigation: getFontById(preferences.fonts.navigation).className
  }
}

export function getGoogleFontsHref(): string {
  const families = FONT_OPTIONS
    .map((font) => font.family)
    .filter((value, index, list) => list.indexOf(value) === index)
    .map((family) => family.replace(/ /g, '+') + ':wght@400;500;600;700')
    .join('&family=')

  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}

function setRootVariable(name: string, value: string): void {
  if (!isBrowserEnvironment()) return
  document.documentElement.style.setProperty(`--crm-${name}`, value)
}

export function applyUiPreferencesToDocument(preferences: UiPreferences): void {
  if (!isBrowserEnvironment()) return

  const theme = getThemeById(preferences.themeId)
  const tokens = resolveTokens(preferences)
  const fonts = resolveFontFamilies(preferences)

  const tokenKeys = Object.keys(tokens) as Array<keyof ThemeTokens>
  for (const key of tokenKeys) {
    setRootVariable(key, tokens[key])
  }

  setRootVariable('density-scale', preferences.density === 'compact' ? '0.92' : '1')
  setRootVariable('table-density-scale', preferences.tableDensity === 'compact' ? '0.88' : '1')
  setRootVariable('radius-scale', String(preferences.radiusScale))
  setRootVariable('shadow-scale', String(preferences.shadowScale))
  setRootVariable('element-scale', String(preferences.elementScale))

  setRootVariable('font-heading', fonts.heading)
  setRootVariable('font-body', fonts.body)
  setRootVariable('font-tables', fonts.tables)
  setRootVariable('font-forms', fonts.forms)
  setRootVariable('font-navigation', fonts.navigation)

  document.documentElement.dataset.crmTheme = theme.id
  document.documentElement.dataset.crmMode = theme.mode
  document.documentElement.dataset.crmDensity = preferences.density
}

export function getUiBootstrapScript(): string {
  const themes = THEME_PRESETS.reduce((acc, theme) => {
    acc[theme.id] = {
      id: theme.id,
      mode: theme.mode,
      defaultDensity: theme.defaultDensity,
      defaultFonts: theme.defaultFonts,
      tokens: theme.tokens
    }
    return acc
  }, {} as Record<string, unknown>)

  const fonts = FONT_OPTIONS.reduce((acc, font) => {
    acc[font.id] = font.className
    return acc
  }, {} as Record<string, string>)

  const defaults = DEFAULT_UI_PREFERENCES

  return `
    (function () {
      var COOKIE_NAME = '${UI_PREFS_COOKIE_NAME}';
      var LOADER_COOKIE = '${UI_LOADER_COOKIE_NAME}';
      var themes = ${JSON.stringify(themes)};
      var fonts = ${JSON.stringify(fonts)};
      var defaults = ${JSON.stringify(defaults)};

      function readCookie(name) {
        var escaped = name.replace(/[.*+?^()|[\\\\]\\\\]/g, '\\\\$&');
        var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
      }

      function parsePrefs() {
        var raw = readCookie(COOKIE_NAME);
        if (!raw) return defaults;
        try {
          var parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' ? parsed : defaults;
        } catch (_) {
          return defaults;
        }
      }

      function setVar(name, value) {
        document.documentElement.style.setProperty('--crm-' + name, value);
      }

      var prefs = parsePrefs();
      var theme = themes[prefs.themeId] || themes[defaults.themeId];
      var colors = Object.assign({}, theme.tokens, prefs.colorOverrides || {});

      Object.keys(colors).forEach(function (tokenKey) {
        setVar(tokenKey, colors[tokenKey]);
      });

      var density = prefs.density === 'compact' ? 'compact' : (theme.defaultDensity || 'comfortable');
      var tableDensity = prefs.tableDensity === 'compact' ? 'compact' : density;

      setVar('density-scale', density === 'compact' ? '0.92' : '1');
      setVar('table-density-scale', tableDensity === 'compact' ? '0.88' : '1');
      setVar('radius-scale', String(Number(prefs.radiusScale) || 1));
      setVar('shadow-scale', String(Number(prefs.shadowScale) || 1));
      setVar('element-scale', String(Number(prefs.elementScale) || 1));

      var fontRoles = prefs.fonts || {};
      setVar('font-heading', fonts[fontRoles.heading] || fonts[theme.defaultFonts.heading] || fonts[defaults.fonts.heading]);
      setVar('font-body', fonts[fontRoles.body] || fonts[theme.defaultFonts.body] || fonts[defaults.fonts.body]);
      setVar('font-tables', fonts[fontRoles.tables] || fonts[theme.defaultFonts.tables] || fonts[defaults.fonts.tables]);
      setVar('font-forms', fonts[fontRoles.forms] || fonts[theme.defaultFonts.forms] || fonts[defaults.fonts.forms]);
      setVar('font-navigation', fonts[fontRoles.navigation] || fonts[theme.defaultFonts.navigation] || fonts[defaults.fonts.navigation]);

      document.documentElement.dataset.crmTheme = theme.id;
      document.documentElement.dataset.crmMode = theme.mode;
      document.documentElement.dataset.crmDensity = density;

      var loaderState = readCookie(LOADER_COOKIE);
      if (loaderState === '0') {
        document.documentElement.dataset.crmLoader = 'off';
      } else {
        document.documentElement.dataset.crmLoader = 'on';
      }
    })();
  `
}
