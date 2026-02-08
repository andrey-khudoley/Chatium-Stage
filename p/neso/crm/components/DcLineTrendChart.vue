<script setup lang="ts">
import { computed } from 'vue'

export interface LineTrendPoint {
  label: string
  value: number
}

interface NormalizedPoint {
  label: string
  value: number
  x: number
  y: number
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  points: LineTrendPoint[]
  valueSuffix?: string
}>()

const CHART_WIDTH = 420
const CHART_HEIGHT = 220
const CHART_PADDING = 28

const maxValue = computed(() => {
  if (!props.points.length) return 0
  return Math.max(...props.points.map((item) => item.value))
})

const minValue = computed(() => {
  if (!props.points.length) return 0
  return Math.min(...props.points.map((item) => item.value))
})

const avgValue = computed(() => {
  if (!props.points.length) return 0
  const sum = props.points.reduce((acc, item) => acc + item.value, 0)
  return sum / props.points.length
})

const normalizedPoints = computed<NormalizedPoint[]>(() => {
  if (!props.points.length) return []

  const range = Math.max(1, maxValue.value - minValue.value)
  const xRange = CHART_WIDTH - CHART_PADDING * 2
  const yRange = CHART_HEIGHT - CHART_PADDING * 2

  return props.points.map((point, index) => {
    const x = props.points.length > 1
      ? CHART_PADDING + (index / (props.points.length - 1)) * xRange
      : CHART_PADDING + xRange / 2
    const yRatio = (point.value - minValue.value) / range
    const y = CHART_HEIGHT - CHART_PADDING - yRatio * yRange

    return {
      label: point.label,
      value: point.value,
      x,
      y
    }
  })
})

const linePath = computed(() => {
  if (!normalizedPoints.value.length) return ''
  return normalizedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const fillPath = computed(() => {
  if (!normalizedPoints.value.length) return ''
  const first = normalizedPoints.value[0]
  const last = normalizedPoints.value[normalizedPoints.value.length - 1]
  const baseY = CHART_HEIGHT - CHART_PADDING
  return `${linePath.value} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
})

function formatValue(value: number): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${rounded}${props.valueSuffix ?? ''}`
}

function getValueY(y: number): number {
  return Math.max(18, y - 14)
}
</script>

<template>
  <section class="dc-line-trend" :class="`theme-${theme ?? 'dark'}`">
    <header class="dc-line-trend-meta">
      <div class="dc-line-trend-kpis">
        <div>
          <span>MIN</span>
          <strong>{{ formatValue(minValue) }}</strong>
        </div>
        <div>
          <span>AVG</span>
          <strong>{{ formatValue(avgValue) }}</strong>
        </div>
        <div>
          <span>MAX</span>
          <strong>{{ formatValue(maxValue) }}</strong>
        </div>
      </div>
    </header>

    <svg
      class="dc-line-trend-svg"
      :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
      role="img"
      aria-label="График тренда"
    >
      <defs>
        <linearGradient id="dc-line-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8da84c" />
          <stop offset="100%" stop-color="#d8ea93" />
        </linearGradient>
        <linearGradient id="dc-fill-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(175, 196, 95, 0.36)" />
          <stop offset="100%" stop-color="rgba(175, 196, 95, 0)" />
        </linearGradient>
      </defs>

      <path v-if="fillPath" :d="fillPath" class="dc-line-fill" />
      <path v-if="linePath" :d="linePath" class="dc-line-stroke" />

      <g v-for="point in normalizedPoints" :key="point.label">
        <circle :cx="point.x" :cy="point.y" r="4.5" class="dc-line-dot" />
        <text :x="point.x" :y="getValueY(point.y)" class="dc-line-value">{{ formatValue(point.value) }}</text>
        <text :x="point.x" :y="CHART_HEIGHT - 4" class="dc-line-label">{{ point.label }}</text>
      </g>
    </svg>
  </section>
</template>

<style scoped>
.dc-line-trend {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.2);
  --value-text: #f3fae2;
  --value-halo: rgba(5, 8, 10, 0.95);
  --label-text: rgba(238, 244, 235, 0.88);
  --label-halo: rgba(5, 8, 10, 0.9);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  container-type: inline-size;
}

.dc-line-trend.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
  --value-text: #2e4329;
  --value-halo: rgba(248, 243, 228, 0.95);
  --label-text: #42583b;
  --label-halo: rgba(248, 243, 228, 0.95);
}

.dc-line-trend-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dc-line-trend-kpis {
  display: flex;
  gap: 14px;
}

.dc-line-trend-kpis div {
  min-width: 82px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(175, 196, 95, 0.12);
  border-radius: 10px;
  padding: 6px 10px;
}

.dc-line-trend.theme-light .dc-line-trend-kpis div {
  background: rgba(79, 111, 47, 0.06);
  border-color: rgba(79, 111, 47, 0.18);
}

.dc-line-trend-kpis span {
  display: block;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--text3);
}

.dc-line-trend-kpis strong {
  font-size: 1.14rem;
  font-weight: 700;
  color: var(--text);
}

.dc-line-trend-svg {
  width: 100%;
  height: 220px;
}

.dc-line-fill {
  fill: url(#dc-fill-gradient);
}

.dc-line-stroke {
  fill: none;
  stroke: url(#dc-line-gradient);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 4px 8px rgba(175, 196, 95, 0.2));
}

.dc-line-dot {
  fill: #d4e88a;
  stroke: rgba(7, 13, 15, 0.7);
  stroke-width: 1.5;
}

.dc-line-value {
  fill: var(--value-text);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-anchor: middle;
  paint-order: stroke fill;
  stroke: var(--value-halo);
  stroke-width: 4px;
  stroke-linejoin: round;
}

.dc-line-label {
  fill: var(--label-text);
  font-size: 14px;
  font-weight: 600;
  text-anchor: middle;
  paint-order: stroke fill;
  stroke: var(--label-halo);
  stroke-width: 3px;
  stroke-linejoin: round;
}

@container (max-width: 460px) {
  .dc-line-trend-kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }

  .dc-line-trend-kpis div {
    min-width: 0;
    padding: 6px 8px;
  }

  .dc-line-trend-kpis strong {
    font-size: 1rem;
  }

  .dc-line-trend-svg {
    height: 200px;
  }

  .dc-line-value {
    font-size: 17px;
    stroke-width: 3.8px;
  }

  .dc-line-label {
    font-size: 13.5px;
    stroke-width: 2.6px;
  }
}

@container (max-width: 360px) {
  .dc-line-trend-svg g:nth-of-type(even) .dc-line-value {
    display: none;
  }
}
</style>
