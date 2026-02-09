// @shared
import { computed, readonly, ref } from 'vue'
import {
  applyUiPreferencesToDocument,
  DEFAULT_UI_PREFERENCES,
  FONT_OPTIONS,
  getStoredUiPreferences,
  getThemeById,
  resolveFontFamilies,
  resolveTokens,
  sanitizeUiPreferences,
  saveUiPreferences,
  THEME_PRESETS,
  type ChartVisualMode,
  type FontRole,
  type ThemeTokens,
  type UiDensity,
  type UiPreferences
} from './system'

const sharedPrefs = ref<UiPreferences>({ ...DEFAULT_UI_PREFERENCES })
let initialized = false

function initPreferences(initialThemeId?: string): void {
  if (initialized) return

  const stored = getStoredUiPreferences()
  const next = sanitizeUiPreferences({
    ...stored,
    themeId: initialThemeId || stored.themeId
  })

  sharedPrefs.value = next
  applyUiPreferencesToDocument(next)
  initialized = true
}

function commit(next: UiPreferences): void {
  const safe = sanitizeUiPreferences(next)
  sharedPrefs.value = safe
  saveUiPreferences(safe)
  applyUiPreferencesToDocument(safe)
}

export function useDesignSystem(initialThemeId?: string) {
  initPreferences(initialThemeId)

  const theme = computed(() => getThemeById(sharedPrefs.value.themeId))
  const tokens = computed(() => resolveTokens(sharedPrefs.value))
  const fonts = computed(() => resolveFontFamilies(sharedPrefs.value))

  function setTheme(themeId: string): void {
    const preset = getThemeById(themeId)
    commit({
      ...sharedPrefs.value,
      themeId: preset.id,
      density: sharedPrefs.value.density || preset.defaultDensity,
      fonts: {
        ...sharedPrefs.value.fonts,
        ...preset.defaultFonts
      }
    })
  }

  function setDensity(density: UiDensity): void {
    commit({
      ...sharedPrefs.value,
      density
    })
  }

  function setTableDensity(density: UiDensity): void {
    commit({
      ...sharedPrefs.value,
      tableDensity: density
    })
  }

  function setChartVisualMode(mode: ChartVisualMode): void {
    commit({
      ...sharedPrefs.value,
      chartVisualMode: mode
    })
  }

  function setFontRole(role: FontRole, fontId: string): void {
    commit({
      ...sharedPrefs.value,
      fonts: {
        ...sharedPrefs.value.fonts,
        [role]: fontId
      }
    })
  }

  function setNumericScale(kind: 'radiusScale' | 'shadowScale' | 'elementScale', value: number): void {
    commit({
      ...sharedPrefs.value,
      [kind]: value
    })
  }

  function setColorOverride(token: keyof ThemeTokens, value: string): void {
    commit({
      ...sharedPrefs.value,
      colorOverrides: {
        ...sharedPrefs.value.colorOverrides,
        [token]: value
      }
    })
  }

  function resetColorOverrides(): void {
    commit({
      ...sharedPrefs.value,
      colorOverrides: {}
    })
  }

  function setPreloaderEnabled(enabled: boolean): void {
    commit({
      ...sharedPrefs.value,
      preloaderEnabled: enabled
    })
  }

  function resetToThemeDefaults(): void {
    const preset = getThemeById(sharedPrefs.value.themeId)
    commit({
      ...sharedPrefs.value,
      density: preset.defaultDensity,
      colorOverrides: {},
      fonts: { ...preset.defaultFonts },
      radiusScale: DEFAULT_UI_PREFERENCES.radiusScale,
      shadowScale: DEFAULT_UI_PREFERENCES.shadowScale,
      elementScale: DEFAULT_UI_PREFERENCES.elementScale,
      tableDensity: preset.defaultDensity,
      chartVisualMode: DEFAULT_UI_PREFERENCES.chartVisualMode
    })
  }

  return {
    preferences: readonly(sharedPrefs),
    theme,
    tokens,
    fonts,
    themes: THEME_PRESETS,
    fontOptions: FONT_OPTIONS,
    setTheme,
    setDensity,
    setTableDensity,
    setChartVisualMode,
    setFontRole,
    setNumericScale,
    setColorOverride,
    resetColorOverrides,
    setPreloaderEnabled,
    resetToThemeDefaults
  }
}
