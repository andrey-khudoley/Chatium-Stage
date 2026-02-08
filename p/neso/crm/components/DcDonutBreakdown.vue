<script setup lang="ts">
import { computed } from 'vue'

export interface DonutBreakdownItem {
  id: string
  label: string
  value: number
  color?: string
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  items: DonutBreakdownItem[]
  centerLabel?: string
}>()

const DEFAULT_COLORS = ['#afc45f', '#85a8ff', '#f2bd5d', '#ff7f7f', '#77d7bf', '#c59dff']

const coloredItems = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }))
)

const total = computed(() =>
  coloredItems.value.reduce((acc, item) => acc + Math.max(0, item.value), 0)
)

const donutGradient = computed(() => {
  if (!coloredItems.value.length) return 'conic-gradient(#2b3436 0deg 360deg)'

  let current = 0
  const chunks: string[] = []

  for (const item of coloredItems.value) {
    const safeValue = Math.max(0, item.value)
    const ratio = total.value > 0 ? safeValue / total.value : 0
    const end = current + ratio * 360
    chunks.push(`${item.color} ${current}deg ${end}deg`)
    current = end
  }

  if (current < 360) {
    chunks.push(`rgba(255, 255, 255, 0.08) ${current}deg 360deg`)
  }

  return `conic-gradient(${chunks.join(', ')})`
})

function getPercent(value: number): string {
  if (total.value <= 0) return '0%'
  return `${Math.round((value / total.value) * 100)}%`
}
</script>

<template>
  <section class="dc-donut" :class="`theme-${theme ?? 'dark'}`">
    <div class="dc-donut-chart-wrap">
      <div class="dc-donut-ring" :style="{ background: donutGradient }">
        <div class="dc-donut-hole">
          <strong>{{ total }}</strong>
          <span>{{ centerLabel ?? 'Всего' }}</span>
        </div>
      </div>
    </div>

    <ul class="dc-donut-legend">
      <li v-for="item in coloredItems" :key="item.id" class="dc-donut-legend-item">
        <span class="dc-donut-color" :style="{ backgroundColor: item.color }"></span>
        <span class="dc-donut-label">{{ item.label }}</span>
        <span class="dc-donut-value">{{ item.value }} · {{ getPercent(item.value) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.dc-donut {
  --radius: 14px;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.2);
  --hole-bg: #071114;
  display: grid;
  grid-template-columns: minmax(152px, 172px) minmax(0, 1fr);
  gap: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  align-items: center;
  max-width: 100%;
  container-type: inline-size;
}

.dc-donut.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --border: rgba(79, 111, 47, 0.2);
  --hole-bg: #f7f2e4;
}

.dc-donut-chart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.dc-donut-ring {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.dc-donut-hole {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--hole-bg);
  border: 1px solid rgba(175, 196, 95, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dc-donut.theme-light .dc-donut-hole {
  border-color: rgba(79, 111, 47, 0.24);
}

.dc-donut-hole strong {
  font-family: 'Old Standard TT', serif;
  font-size: 2rem;
  color: var(--text);
  line-height: 1;
}

.dc-donut-hole span {
  font-size: 0.95rem;
  color: var(--text2);
}

.dc-donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.dc-donut-legend-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  min-width: 0;
}

.dc-donut.theme-light .dc-donut-legend-item {
  background: rgba(79, 111, 47, 0.06);
}

.dc-donut-color {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.dc-donut-label {
  color: var(--text);
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.25;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.dc-donut-value {
  grid-column: 2;
  color: var(--text2);
  font-size: 1rem;
  font-weight: 600;
  white-space: normal;
  text-align: left;
  line-height: 1.2;
}

@container (max-width: 430px) {
  .dc-donut {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .dc-donut-ring {
    width: 148px;
    height: 148px;
  }

  .dc-donut-hole {
    width: 96px;
    height: 96px;
  }

  .dc-donut-label { font-size: 0.95rem; }
  .dc-donut-value { font-size: 0.9rem; }
}
</style>
