<template>
  <section class="crm-surface crm-card">
    <header class="crm-card-title">
      <div class="crm-stack">
        <h2>{{ title }}</h2>
        <p class="crm-card-subtitle">{{ subtitle }}</p>
      </div>
      <div class="crm-row">
        <button class="crm-btn crm-btn-ghost crm-btn-sm" type="button" @click="showLegend = !showLegend">
          <i class="fas" :class="showLegend ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
          {{ showLegend ? labels.hideLegend : labels.showLegend }}
        </button>
        <button class="crm-btn crm-btn-ghost crm-btn-sm" type="button" @click="showValues = !showValues">
          <i class="fas" :class="showValues ? 'fa-eye' : 'fa-eye-slash'"></i>
          {{ showValues ? labels.hideValues : labels.showValues }}
        </button>
        <button class="crm-btn crm-btn-ghost crm-btn-sm" type="button" @click="toggleMode">
          <i class="fas fa-wave-square"></i>
          {{ mode === 'bars' ? labels.modeBars : labels.modeLine }}
        </button>
      </div>
    </header>

    <div v-if="mode === 'bars'" class="crm-chart-bars">
      <div v-for="point in normalized" :key="point.label" class="crm-chart-bar-row">
        <div class="crm-chart-bar-label">{{ point.label }}</div>
        <div class="crm-chart-bar-track">
          <div class="crm-chart-bar-fill" :style="{ width: point.percent + '%', background: point.color }"></div>
          <span v-if="showValues" class="crm-chart-bar-value">{{ point.value }}</span>
        </div>
      </div>
    </div>

    <div v-else class="crm-chart-line-wrap">
      <svg viewBox="0 0 100 42" class="crm-chart-line" preserveAspectRatio="none">
        <polyline
          class="crm-chart-line-plot"
          :points="linePoints"
          fill="none"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div v-if="showValues" class="crm-chart-line-values">
        <span v-for="point in normalized" :key="'value-' + point.label">{{ point.label }}: {{ point.value }}</span>
      </div>
    </div>

    <footer v-if="showLegend" class="crm-chart-legend">
      <span v-for="point in normalized" :key="'legend-' + point.label" class="crm-chip">
        <i class="fas fa-circle" :style="{ color: point.color }"></i>
        {{ point.label }}
      </span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface CrmChartPoint {
  label: string
  value: number
  color?: string
}

const props = withDefaults(defineProps<{
  data: CrmChartPoint[]
  title?: string
  subtitle?: string
  labels?: {
    showLegend: string
    hideLegend: string
    showValues: string
    hideValues: string
    modeBars: string
    modeLine: string
  }
}>(), {
  title: 'KPI Dynamics',
  subtitle: '',
  labels: () => ({
    showLegend: 'Show legend',
    hideLegend: 'Hide legend',
    showValues: 'Show values',
    hideValues: 'Hide values',
    modeBars: 'Bars',
    modeLine: 'Line'
  })
})

const showLegend = ref(true)
const showValues = ref(true)
const mode = ref<'bars' | 'line'>('bars')

const palette = ['var(--crm-accent)', 'var(--crm-success)', 'var(--crm-warning)', 'var(--crm-info)', 'var(--crm-danger)', 'var(--crm-textMuted)']

const normalized = computed(() => {
  const max = props.data.reduce((acc, point) => Math.max(acc, point.value), 1)
  return props.data.map((point, index) => ({
    ...point,
    percent: max > 0 ? Math.round((point.value / max) * 100) : 0,
    color: point.color || palette[index % palette.length]
  }))
})

const linePoints = computed(() => {
  const points = normalized.value
  if (!points.length) return ''
  if (points.length === 1) return `0,21 100,21`

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 38 - (point.percent * 0.34)
      return `${x},${Math.max(3, Math.min(38, y))}`
    })
    .join(' ')
})

function toggleMode(): void {
  mode.value = mode.value === 'bars' ? 'line' : 'bars'
}
</script>

<style scoped>
.crm-chart-bars {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.crm-chart-bar-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.6fr) minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.crm-chart-bar-label {
  color: var(--crm-textMuted);
  font-size: 0.8rem;
}

.crm-chart-bar-track {
  position: relative;
  border-radius: 999px;
  height: 1.05rem;
  background: color-mix(in srgb, var(--crm-border) 58%, transparent);
  overflow: hidden;
}

.crm-chart-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s ease;
}

.crm-chart-bar-value {
  position: absolute;
  right: 0.5rem;
  top: 0.1rem;
  font-size: 0.7rem;
  color: var(--crm-text);
  font-family: var(--crm-font-tables);
}

.crm-chart-line-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.crm-chart-line {
  width: 100%;
  height: 9rem;
  border-radius: var(--crm-radius-sm);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 65%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--crm-accentSoft) 20%, transparent) 0%, transparent 100%),
    repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--crm-borderStrong) 40%, transparent) 0,
      color-mix(in srgb, var(--crm-borderStrong) 40%, transparent) 1px,
      transparent 1px,
      transparent 14%
    );
}

.crm-chart-line-plot {
  stroke: var(--crm-accent);
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--crm-accent) 60%, transparent));
}

.crm-chart-line-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: var(--crm-textDim);
  font-size: 0.76rem;
  font-family: var(--crm-font-tables);
}

.crm-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

@media (max-width: 640px) {
  .crm-chart-bar-row {
    grid-template-columns: 1fr;
  }
}
</style>
