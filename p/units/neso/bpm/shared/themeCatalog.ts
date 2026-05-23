// @shared
export type ThemeMode = 'dark' | 'light'

export interface ThemePreset {
  id: string
  mode: ThemeMode
  name: string
  description: string
  themeColor: string
  tokens: Record<string, string>
}

const SHARED_TOKENS: Record<string, string> = {
  '--font-sans': "'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  '--font-display': "'Old Standard TT', 'Times New Roman', serif",
  '--font-mono': "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  '--radius-xs': '4px',
  '--radius-sm': '8px',
  '--radius-md': '12px',
  '--radius-lg': '16px',
  '--radius-xl': '20px',
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '20px',
  '--space-6': '24px',
  '--space-8': '32px',
  '--space-10': '40px',
  '--sidebar-width': '260px',
  '--sidebar-collapsed-width': '84px',
  '--content-max-width': '1560px',
  '--header-height': '68px',
  '--control-height': '34px',
  '--row-height': '38px',
  '--density-scale': '0.96'
}

function withSharedTokens(tokens: Record<string, string>): Record<string, string> {
  return { ...SHARED_TOKENS, ...tokens }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'forest-night',
    mode: 'dark',
    name: 'Night Forest',
    description: 'Base dark preset with cool depth and restrained glow.',
    themeColor: '#05090b',
    tokens: withSharedTokens({
      '--bg-primary': '#05090b',
      '--bg-secondary': '#0d1517',
      '--bg-tertiary': '#122022',
      '--surface-1': 'rgba(13, 22, 24, 0.72)',
      '--surface-2': 'rgba(16, 28, 31, 0.82)',
      '--surface-3': 'rgba(20, 35, 38, 0.9)',
      '--surface-glass': 'rgba(18, 30, 33, 0.58)',
      '--surface-strong': 'rgba(20, 34, 37, 0.95)',
      '--surface-overlay': 'rgba(3, 6, 7, 0.64)',
      '--border-soft': 'rgba(180, 202, 131, 0.14)',
      '--border-strong': 'rgba(180, 202, 131, 0.28)',
      '--border-accent': 'rgba(188, 215, 125, 0.42)',
      '--text-primary': '#ebf3e5',
      '--text-secondary': 'rgba(235, 243, 229, 0.8)',
      '--text-tertiary': 'rgba(235, 243, 229, 0.56)',
      '--accent': '#b5cc6d',
      '--accent-strong': '#d4e891',
      '--accent-soft': 'rgba(181, 204, 109, 0.2)',
      '--accent-contrast': '#091008',
      '--status-success': '#6fd18f',
      '--status-warning': '#e8bf68',
      '--status-danger': '#e97f81',
      '--status-info': '#7ab8ea',
      '--focus-ring': '0 0 0 2px rgba(181, 204, 109, 0.35)',
      '--shadow-xs': '0 1px 2px rgba(2, 4, 5, 0.32)',
      '--shadow-sm': '0 8px 20px rgba(0, 0, 0, 0.28)',
      '--shadow-md': '0 18px 38px rgba(0, 0, 0, 0.34)',
      '--shadow-lg': '0 28px 56px rgba(0, 0, 0, 0.42)',
      '--glow-accent': '0 0 28px rgba(181, 204, 109, 0.24)',
      '--gradient-app': 'linear-gradient(148deg, #05090b 0%, #0d1517 54%, #122022 100%)',
      '--gradient-ambient-top': 'radial-gradient(72% 54% at 88% 0%, rgba(181, 204, 109, 0.14), transparent 72%)',
      '--gradient-ambient-bottom': 'radial-gradient(66% 58% at 10% 100%, rgba(110, 128, 72, 0.2), transparent 76%)',
      '--gradient-glass': 'linear-gradient(158deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 48%, rgba(0, 0, 0, 0.2) 100%)',
      '--grid-color': 'rgba(207, 224, 168, 0.05)',
      '--noise-opacity': '0.05',
      '--kanban-backlog': 'rgba(122, 184, 234, 0.16)',
      '--kanban-active': 'rgba(181, 204, 109, 0.2)',
      '--kanban-review': 'rgba(232, 191, 104, 0.2)',
      '--kanban-done': 'rgba(111, 209, 143, 0.18)',
      '--timeline-line': 'rgba(181, 204, 109, 0.28)',
      '--chart-1': '#b5cc6d',
      '--chart-2': '#89b8f0',
      '--chart-3': '#e8bf68',
      '--chart-4': '#77d9a4'
    })
  },
  {
    id: 'sunrise-leaf',
    mode: 'light',
    name: 'Sunrise Leaf',
    description: 'Base light preset with morning haze and warm clean surfaces.',
    themeColor: '#f1e9d5',
    tokens: withSharedTokens({
      '--bg-primary': '#f1e9d5',
      '--bg-secondary': '#e7ddc4',
      '--bg-tertiary': '#ddd3bb',
      '--surface-1': 'rgba(248, 243, 230, 0.82)',
      '--surface-2': 'rgba(252, 248, 238, 0.88)',
      '--surface-3': 'rgba(255, 252, 244, 0.94)',
      '--surface-glass': 'rgba(255, 252, 244, 0.62)',
      '--surface-strong': 'rgba(249, 244, 232, 0.96)',
      '--surface-overlay': 'rgba(36, 52, 28, 0.18)',
      '--border-soft': 'rgba(88, 114, 54, 0.2)',
      '--border-strong': 'rgba(88, 114, 54, 0.32)',
      '--border-accent': 'rgba(88, 114, 54, 0.48)',
      '--text-primary': '#1f2d1a',
      '--text-secondary': 'rgba(31, 45, 26, 0.78)',
      '--text-tertiary': 'rgba(31, 45, 26, 0.58)',
      '--accent': '#567337',
      '--accent-strong': '#3f5826',
      '--accent-soft': 'rgba(86, 115, 55, 0.2)',
      '--accent-contrast': '#f8f4e8',
      '--status-success': '#347a4f',
      '--status-warning': '#af7a20',
      '--status-danger': '#b14f4f',
      '--status-info': '#2f618f',
      '--focus-ring': '0 0 0 2px rgba(86, 115, 55, 0.34)',
      '--shadow-xs': '0 1px 2px rgba(64, 74, 44, 0.14)',
      '--shadow-sm': '0 10px 22px rgba(84, 105, 59, 0.16)',
      '--shadow-md': '0 18px 36px rgba(82, 99, 57, 0.2)',
      '--shadow-lg': '0 26px 50px rgba(76, 91, 50, 0.24)',
      '--glow-accent': '0 0 24px rgba(86, 115, 55, 0.18)',
      '--gradient-app': 'linear-gradient(152deg, #f1e9d5 0%, #e7ddc4 55%, #ddd3bb 100%)',
      '--gradient-ambient-top': 'radial-gradient(74% 56% at 90% 0%, rgba(86, 115, 55, 0.16), transparent 72%)',
      '--gradient-ambient-bottom': 'radial-gradient(66% 58% at 8% 100%, rgba(142, 171, 89, 0.2), transparent 76%)',
      '--gradient-glass': 'linear-gradient(160deg, rgba(255, 255, 255, 0.64) 0%, rgba(255, 255, 255, 0.22) 54%, rgba(86, 115, 55, 0.08) 100%)',
      '--grid-color': 'rgba(86, 115, 55, 0.07)',
      '--noise-opacity': '0.055',
      '--kanban-backlog': 'rgba(47, 97, 143, 0.14)',
      '--kanban-active': 'rgba(86, 115, 55, 0.16)',
      '--kanban-review': 'rgba(175, 122, 32, 0.16)',
      '--kanban-done': 'rgba(52, 122, 79, 0.14)',
      '--timeline-line': 'rgba(86, 115, 55, 0.28)',
      '--chart-1': '#567337',
      '--chart-2': '#2f618f',
      '--chart-3': '#af7a20',
      '--chart-4': '#347a4f'
    })
  },
  {
    id: 'midnight-pine',
    mode: 'dark',
    name: 'Midnight Pine',
    description: 'Alternative dark preset with colder pine accents.',
    themeColor: '#081016',
    tokens: withSharedTokens({
      '--bg-primary': '#081016',
      '--bg-secondary': '#101923',
      '--bg-tertiary': '#162532',
      '--surface-1': 'rgba(17, 28, 37, 0.74)',
      '--surface-2': 'rgba(21, 35, 47, 0.82)',
      '--surface-3': 'rgba(27, 44, 60, 0.9)',
      '--surface-glass': 'rgba(20, 34, 46, 0.58)',
      '--surface-strong': 'rgba(22, 36, 50, 0.95)',
      '--surface-overlay': 'rgba(4, 8, 10, 0.68)',
      '--border-soft': 'rgba(145, 210, 190, 0.16)',
      '--border-strong': 'rgba(145, 210, 190, 0.3)',
      '--border-accent': 'rgba(145, 210, 190, 0.44)',
      '--text-primary': '#e8f5f1',
      '--text-secondary': 'rgba(232, 245, 241, 0.8)',
      '--text-tertiary': 'rgba(232, 245, 241, 0.56)',
      '--accent': '#8ed1bf',
      '--accent-strong': '#b8efe0',
      '--accent-soft': 'rgba(142, 209, 191, 0.22)',
      '--accent-contrast': '#07100f',
      '--status-success': '#69ca8d',
      '--status-warning': '#e3ba6b',
      '--status-danger': '#de848d',
      '--status-info': '#80bde9',
      '--focus-ring': '0 0 0 2px rgba(142, 209, 191, 0.34)',
      '--shadow-xs': '0 1px 2px rgba(3, 6, 8, 0.34)',
      '--shadow-sm': '0 8px 20px rgba(2, 4, 6, 0.3)',
      '--shadow-md': '0 18px 38px rgba(2, 4, 6, 0.38)',
      '--shadow-lg': '0 28px 56px rgba(2, 4, 6, 0.46)',
      '--glow-accent': '0 0 28px rgba(142, 209, 191, 0.22)',
      '--gradient-app': 'linear-gradient(150deg, #081016 0%, #101923 52%, #162532 100%)',
      '--gradient-ambient-top': 'radial-gradient(72% 54% at 90% 0%, rgba(142, 209, 191, 0.16), transparent 72%)',
      '--gradient-ambient-bottom': 'radial-gradient(66% 58% at 8% 100%, rgba(90, 170, 148, 0.2), transparent 76%)',
      '--gradient-glass': 'linear-gradient(160deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 48%, rgba(0, 0, 0, 0.18) 100%)',
      '--grid-color': 'rgba(184, 239, 224, 0.06)',
      '--noise-opacity': '0.05',
      '--kanban-backlog': 'rgba(128, 189, 233, 0.18)',
      '--kanban-active': 'rgba(142, 209, 191, 0.2)',
      '--kanban-review': 'rgba(227, 186, 107, 0.2)',
      '--kanban-done': 'rgba(105, 202, 141, 0.18)',
      '--timeline-line': 'rgba(142, 209, 191, 0.3)',
      '--chart-1': '#8ed1bf',
      '--chart-2': '#80bde9',
      '--chart-3': '#e3ba6b',
      '--chart-4': '#69ca8d'
    })
  },
  {
    id: 'misty-daybreak',
    mode: 'light',
    name: 'Misty Daybreak',
    description: 'Alternative light preset with cooler neutral surfaces.',
    themeColor: '#e8ecef',
    tokens: withSharedTokens({
      '--bg-primary': '#e8ecef',
      '--bg-secondary': '#dbe2e7',
      '--bg-tertiary': '#cfd8df',
      '--surface-1': 'rgba(239, 244, 247, 0.82)',
      '--surface-2': 'rgba(246, 250, 252, 0.88)',
      '--surface-3': 'rgba(251, 254, 255, 0.94)',
      '--surface-glass': 'rgba(247, 251, 253, 0.62)',
      '--surface-strong': 'rgba(239, 244, 247, 0.96)',
      '--surface-overlay': 'rgba(20, 39, 48, 0.16)',
      '--border-soft': 'rgba(45, 91, 112, 0.2)',
      '--border-strong': 'rgba(45, 91, 112, 0.3)',
      '--border-accent': 'rgba(45, 91, 112, 0.46)',
      '--text-primary': '#1a2f37',
      '--text-secondary': 'rgba(26, 47, 55, 0.78)',
      '--text-tertiary': 'rgba(26, 47, 55, 0.56)',
      '--accent': '#2d5b70',
      '--accent-strong': '#1f4455',
      '--accent-soft': 'rgba(45, 91, 112, 0.2)',
      '--accent-contrast': '#f7fbfd',
      '--status-success': '#2f7454',
      '--status-warning': '#ab7a2a',
      '--status-danger': '#ab4f57',
      '--status-info': '#2e638e',
      '--focus-ring': '0 0 0 2px rgba(45, 91, 112, 0.32)',
      '--shadow-xs': '0 1px 2px rgba(34, 56, 67, 0.14)',
      '--shadow-sm': '0 10px 22px rgba(34, 56, 67, 0.16)',
      '--shadow-md': '0 18px 36px rgba(34, 56, 67, 0.2)',
      '--shadow-lg': '0 26px 50px rgba(34, 56, 67, 0.24)',
      '--glow-accent': '0 0 24px rgba(45, 91, 112, 0.18)',
      '--gradient-app': 'linear-gradient(152deg, #e8ecef 0%, #dbe2e7 55%, #cfd8df 100%)',
      '--gradient-ambient-top': 'radial-gradient(74% 56% at 90% 0%, rgba(45, 91, 112, 0.15), transparent 72%)',
      '--gradient-ambient-bottom': 'radial-gradient(66% 58% at 8% 100%, rgba(107, 154, 177, 0.2), transparent 76%)',
      '--gradient-glass': 'linear-gradient(160deg, rgba(255, 255, 255, 0.66) 0%, rgba(255, 255, 255, 0.24) 54%, rgba(45, 91, 112, 0.08) 100%)',
      '--grid-color': 'rgba(45, 91, 112, 0.08)',
      '--noise-opacity': '0.05',
      '--kanban-backlog': 'rgba(46, 99, 142, 0.14)',
      '--kanban-active': 'rgba(45, 91, 112, 0.16)',
      '--kanban-review': 'rgba(171, 122, 42, 0.16)',
      '--kanban-done': 'rgba(47, 116, 84, 0.14)',
      '--timeline-line': 'rgba(45, 91, 112, 0.28)',
      '--chart-1': '#2d5b70',
      '--chart-2': '#2e638e',
      '--chart-3': '#ab7a2a',
      '--chart-4': '#2f7454'
    })
  }
]

const PRESET_BY_ID = new Map<string, ThemePreset>(THEME_PRESETS.map((preset) => [preset.id, preset]))

const DEFAULT_PRESET_BY_MODE: Record<ThemeMode, string> = {
  dark: 'forest-night',
  light: 'sunrise-leaf'
}

export function getThemePreset(mode: ThemeMode, preferredId?: string): ThemePreset {
  if (preferredId) {
    const preferred = PRESET_BY_ID.get(preferredId)
    if (preferred && preferred.mode === mode) return preferred
  }

  const fallback = PRESET_BY_ID.get(DEFAULT_PRESET_BY_MODE[mode])
  if (!fallback) {
    throw new Error(`Missing default theme preset for mode: ${mode}`)
  }
  return fallback
}

export function getThemePresetById(id: string): ThemePreset | undefined {
  return PRESET_BY_ID.get(id)
}

export function getThemePresetOptions(mode?: ThemeMode): ThemePreset[] {
  if (!mode) return [...THEME_PRESETS]
  return THEME_PRESETS.filter((preset) => preset.mode === mode)
}

export function getDefaultThemePresetId(mode: ThemeMode): string {
  return DEFAULT_PRESET_BY_MODE[mode]
}
