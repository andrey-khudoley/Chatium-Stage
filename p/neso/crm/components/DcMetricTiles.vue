<script setup lang="ts">
export interface MetricTileItem {
  id: string
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  target?: string
  progress?: number
  icon?: string
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  items: MetricTileItem[]
}>()

function getTrendIcon(trend?: MetricTileItem['trend']): string {
  if (trend === 'up') return 'fa-arrow-trend-up'
  if (trend === 'down') return 'fa-arrow-trend-down'
  return 'fa-minus'
}

function getTrendClass(trend?: MetricTileItem['trend']): string {
  if (trend === 'up') return 'trend-up'
  if (trend === 'down') return 'trend-down'
  return 'trend-neutral'
}

function normalizeProgress(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}
</script>

<template>
  <section class="dc-metric-tiles" :class="`theme-${props.theme ?? 'dark'}`">
    <article v-for="item in items" :key="item.id" class="dc-metric-tile">
      <header class="dc-metric-head">
        <div class="dc-metric-label-wrap">
          <span class="dc-metric-label">{{ item.label }}</span>
          <span v-if="item.target" class="dc-metric-target">Цель: {{ item.target }}</span>
        </div>
        <span v-if="item.icon" class="dc-metric-icon" aria-hidden="true">
          <i :class="['fas', item.icon]"></i>
        </span>
      </header>

      <div class="dc-metric-main">
        <span class="dc-metric-value">{{ item.value }}</span>
        <span v-if="item.delta" class="dc-metric-delta" :class="getTrendClass(item.trend)">
          <i :class="['fas', getTrendIcon(item.trend)]" aria-hidden="true"></i>
          {{ item.delta }}
        </span>
      </div>

      <div v-if="typeof item.progress === 'number'" class="dc-metric-progress">
        <div class="dc-metric-progress-bar" :style="{ width: `${normalizeProgress(item.progress)}%` }"></div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.dc-metric-tiles {
  --radius: 14px;
  --accent: #afc45f;
  --accent-soft: rgba(175, 196, 95, 0.16);
  --surface: rgba(10, 18, 20, 0.72);
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.2);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.dc-metric-tiles.theme-light {
  --accent: #4f6f2f;
  --accent-soft: rgba(79, 111, 47, 0.14);
  --surface: rgba(250, 247, 238, 0.82);
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.22);
}

.dc-metric-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.dc-metric-tiles.theme-light .dc-metric-tile {
  box-shadow: 0 8px 18px rgba(79, 111, 47, 0.1);
}

.dc-metric-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dc-metric-label-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dc-metric-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
}

.dc-metric-target {
  font-size: 0.75rem;
  color: var(--text3);
}

.dc-metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
}

.dc-metric-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dc-metric-value {
  font-family: 'Old Standard TT', serif;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.dc-metric-delta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.dc-metric-delta.trend-up {
  color: #9ad274;
}

.dc-metric-delta.trend-down {
  color: #ff8f8f;
}

.dc-metric-delta.trend-neutral {
  color: var(--text2);
}

.dc-metric-progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.dc-metric-tiles.theme-light .dc-metric-progress {
  background: rgba(79, 111, 47, 0.08);
}

.dc-metric-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(175, 196, 95, 0.6) 0%, var(--accent) 100%);
}

@media (max-width: 700px) {
  .dc-metric-tiles {
    grid-template-columns: 1fr;
  }

  .dc-metric-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
