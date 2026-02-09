<template>
  <section class="crm-surface crm-card crm-theme-customizer">
    <header class="crm-card-title">
      <div class="crm-stack">
        <h2>{{ t('admin.customization') }}</h2>
        <p class="crm-card-subtitle">{{ t('admin.customizationDesc') }}</p>
      </div>
      <div class="crm-row">
        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="resetColorOverrides">
          <i class="fas fa-droplet-slash"></i>
          {{ t('common.clear') }}
        </button>
        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="resetToThemeDefaults">
          <i class="fas fa-rotate-left"></i>
          {{ t('common.retry') }}
        </button>
      </div>
    </header>

    <div class="crm-grid crm-grid-2">
      <CrmSelect
        :model-value="preferences.themeId"
        :label="t('admin.themePreset')"
        :options="themeOptions"
        @update:model-value="setTheme"
      />
      <CrmSelect
        :model-value="preferences.density"
        :label="t('admin.density')"
        :options="densityOptions"
        @update:model-value="(value) => setDensity(toDensity(value))"
      />
      <CrmSelect
        :model-value="preferences.tableDensity"
        :label="t('admin.tableDensity')"
        :options="densityOptions"
        @update:model-value="(value) => setTableDensity(toDensity(value))"
      />
      <CrmSelect
        :model-value="preferences.chartVisualMode"
        :label="t('admin.chartVisualMode')"
        :options="chartOptions"
        @update:model-value="(value) => setChartVisualMode(value === 'contrast' ? 'contrast' : 'soft')"
      />
    </div>

    <div class="crm-grid crm-grid-3">
      <label class="crm-field">
        <span class="crm-field-label">{{ t('admin.radius') }} {{ preferences.radiusScale.toFixed(2) }}</span>
        <input class="crm-range" type="range" min="0.7" max="1.4" step="0.01" :value="preferences.radiusScale" @input="(e) => setNumericScale('radiusScale', Number((e.target as HTMLInputElement).value))" />
      </label>
      <label class="crm-field">
        <span class="crm-field-label">{{ t('admin.shadow') }} {{ preferences.shadowScale.toFixed(2) }}</span>
        <input class="crm-range" type="range" min="0.5" max="1.6" step="0.01" :value="preferences.shadowScale" @input="(e) => setNumericScale('shadowScale', Number((e.target as HTMLInputElement).value))" />
      </label>
      <label class="crm-field">
        <span class="crm-field-label">{{ t('admin.scale') }} {{ preferences.elementScale.toFixed(2) }}</span>
        <input class="crm-range" type="range" min="0.85" max="1.2" step="0.01" :value="preferences.elementScale" @input="(e) => setNumericScale('elementScale', Number((e.target as HTMLInputElement).value))" />
      </label>
    </div>

    <div class="crm-grid crm-grid-4">
      <label class="crm-field" v-for="picker in colorPickers" :key="picker.token">
        <span class="crm-field-label">{{ picker.label }}</span>
        <input
          class="crm-color"
          type="color"
          :value="normalizeColor(tokens[picker.token])"
          @input="(e) => setColorOverride(picker.token, (e.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <div class="crm-grid crm-grid-2">
      <CrmSelect
        :model-value="preferences.fonts.heading"
        :label="t('admin.fontHeading')"
        :options="fontOptions"
        @update:model-value="(value) => setFontRole('heading', value)"
      />
      <CrmSelect
        :model-value="preferences.fonts.body"
        :label="t('admin.fontBody')"
        :options="fontOptions"
        @update:model-value="(value) => setFontRole('body', value)"
      />
      <CrmSelect
        :model-value="preferences.fonts.tables"
        :label="t('admin.fontTables')"
        :options="fontOptions"
        @update:model-value="(value) => setFontRole('tables', value)"
      />
      <CrmSelect
        :model-value="preferences.fonts.forms"
        :label="t('admin.fontForms')"
        :options="fontOptions"
        @update:model-value="(value) => setFontRole('forms', value)"
      />
      <CrmSelect
        :model-value="preferences.fonts.navigation"
        :label="t('admin.fontNavigation')"
        :options="fontOptions"
        @update:model-value="(value) => setFontRole('navigation', value)"
      />
      <div class="crm-field">
        <span class="crm-field-label">{{ t('header.preloader') }}</span>
        <button type="button" class="crm-btn crm-btn-ghost" @click="setPreloaderEnabled(!preferences.preloaderEnabled)">
          <i class="fas" :class="preferences.preloaderEnabled ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
          {{ preferences.preloaderEnabled ? t('header.preloaderOn') : t('header.preloaderOff') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CrmSelect from '../base/CrmSelect.vue'
import { useDesignSystem } from '../../shared/design/useDesignSystem'
import { useUiI18n } from '../../shared/design/i18n'
import type { ThemeTokens, UiDensity } from '../../shared/design/system'

const props = withDefaults(defineProps<{
  initialThemeId?: string
}>(), {
  initialThemeId: 'midnight-ops'
})

const {
  preferences,
  tokens,
  themes,
  fontOptions: availableFonts,
  setTheme,
  setDensity,
  setTableDensity,
  setChartVisualMode,
  setFontRole,
  setNumericScale,
  setColorOverride,
  setPreloaderEnabled,
  resetColorOverrides,
  resetToThemeDefaults
} = useDesignSystem(props.initialThemeId)

const { t } = useUiI18n()

const themeOptions = computed(() => themes.map((theme) => ({ value: theme.id, label: theme.name })))
const fontOptionsComputed = computed(() => availableFonts.map((font) => ({ value: font.id, label: font.label })))

const densityOptions = computed(() => [
  { value: 'compact', label: t('common.compact') },
  { value: 'comfortable', label: t('common.comfortable') }
])

const chartOptions = computed(() => [
  { value: 'soft', label: t('admin.chartVisualSoft') },
  { value: 'contrast', label: t('admin.chartVisualContrast') }
])

const colorPickers = computed<Array<{ token: keyof ThemeTokens; label: string }>>(() => [
  { token: 'bg', label: t('admin.colorBg') },
  { token: 'surface', label: t('admin.colorSurface') },
  { token: 'text', label: t('admin.colorText') },
  { token: 'accent', label: t('admin.colorAccent') },
  { token: 'success', label: t('admin.colorSuccess') },
  { token: 'warning', label: t('admin.colorWarning') },
  { token: 'danger', label: t('admin.colorDanger') }
])

const fontOptions = computed(() => fontOptionsComputed.value)

function normalizeColor(color: string): string {
  return color.startsWith('#') ? color : '#4da3ff'
}

function toDensity(value: string): UiDensity {
  return value === 'compact' ? 'compact' : 'comfortable'
}
</script>

<style scoped>
.crm-theme-customizer {
  gap: var(--crm-space-4);
}

.crm-range {
  width: 100%;
  accent-color: var(--crm-accent);
}

.crm-color {
  width: 100%;
  height: 2.35rem;
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 72%, transparent);
  border-radius: var(--crm-radius-sm);
  background: color-mix(in srgb, var(--crm-surfaceRaised) 88%, transparent);
  cursor: pointer;
}

@media (max-width: 768px) {
  .crm-theme-customizer {
    gap: var(--crm-space-3);
  }
}
</style>
