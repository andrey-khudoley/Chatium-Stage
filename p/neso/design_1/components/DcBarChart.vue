<script setup lang="ts">
export interface BarItem {
  label: string
  value: number
  active?: boolean
}

defineProps<{
  theme?: 'dark' | 'light'
  items: BarItem[]
  tabs?: { id: string; label: string; active?: boolean }[]
  activeTabId?: string
}>()

const emit = defineEmits<{
  tabChange: [id: string]
}>()
</script>

<template>
  <div class="dc-bar-chart" :class="`theme-${theme ?? 'dark'}`">
    <div v-if="tabs?.length" class="dc-chart-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="dc-tab"
        :class="{ active: tab.active }"
        @click="emit('tabChange', tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="dc-chart-bars">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="dc-bar"
        :class="{ active: item.active }"
        :style="{ '--h': `${item.value}%` }"
      >
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dc-bar-chart {
  --radius-sm: 8px;
  --accent: #afc45f;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --bar-inactive-top: rgba(255, 255, 255, 0.08);
  --bar-inactive-bottom: rgba(131, 148, 72, 0.35);
  --bar-active-top: #d4e88a;
  --bar-active-mid: #b8d060;
  --bar-active-bottom: #6b8a2e;
  --bar-gloss: rgba(255, 255, 255, 0.18);
  --bar-gloss-active: rgba(255, 255, 255, 0.4);
  --bar-shadow-inner: rgba(0, 0, 0, 0.2);
  --bar-shadow-outer: rgba(0, 0, 0, 0.25);
  --bar-glow: rgba(175, 196, 95, 0.35);
  --bar-glass-border: rgba(255, 255, 255, 0.2);
  --bar-lift-1: rgba(0, 0, 0, 0.35);
  --bar-lift-2: rgba(0, 0, 0, 0.2);
  --bar-lift-offset: 6px;
}
.dc-bar-chart.theme-light {
  --accent: #4f6f2f;
  --text2: #3d4a35;
  --text3: #5a6652;
  --bar-inactive-top: rgba(255, 255, 255, 0.75);
  --bar-inactive-bottom: rgba(79, 111, 47, 0.25);
  --bar-active-top: #a8c76a;
  --bar-active-mid: #8fb855;
  --bar-active-bottom: #3d5524;
  --bar-gloss: rgba(255, 255, 255, 0.9);
  --bar-gloss-active: rgba(255, 255, 255, 0.6);
  --bar-shadow-inner: rgba(0, 0, 0, 0.06);
  --bar-shadow-outer: rgba(0, 0, 0, 0.1);
  --bar-glow: rgba(79, 111, 47, 0.2);
  --bar-glass-border: rgba(255, 255, 255, 0.65);
  --bar-lift-1: rgba(0, 0, 0, 0.1);
  --bar-lift-2: rgba(0, 0, 0, 0.06);
  --bar-lift-offset: 4px;
}
.dc-chart-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.dc-tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.dc-tab.active { background: var(--accent); color: #05080a; }
.dc-bar-chart.theme-light .dc-tab.active { color: #fff; }
.dc-chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 100px;
  margin-top: 20px;
}
.dc-bar {
  flex: 1;
  height: var(--h);
  min-height: 4px;
  /* Объём: вертикальный градиент — светлее сверху, как от источника света */
  background: linear-gradient(
      to bottom,
      var(--bar-inactive-top) 0%,
      var(--bar-inactive-bottom) 100%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 45%,
      rgba(0, 0, 0, 0.08) 100%
    );
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid transparent;
  border-top-color: var(--bar-glass-border);
  border-left-color: rgba(255, 255, 255, 0.1);
  /* Приподнятое стекло: внутренний блик + тень под столбцом со смещением вправо-вниз */
  box-shadow:
    inset 0 1px 0 var(--bar-gloss),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 var(--bar-shadow-inner),
    var(--bar-lift-offset) 8px 16px var(--bar-lift-1),
    calc(var(--bar-lift-offset) * 0.5) 14px 28px var(--bar-lift-2);
}
.dc-bar.active {
  /* Активный столбец: более яркий вертикальный градиент (эффект стекла) */
  background: linear-gradient(
      to bottom,
      var(--bar-active-top) 0%,
      var(--bar-active-mid) 45%,
      var(--bar-active-bottom) 100%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    );
  border-top-color: rgba(255, 255, 255, 0.4);
  border-left-color: rgba(255, 255, 255, 0.15);
  /* Усиленная тень и лёгкое свечение для «приподнятого» активного столбца */
  box-shadow:
    inset 0 1px 0 var(--bar-gloss-active),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 var(--bar-shadow-inner),
    var(--bar-lift-offset) 10px 20px var(--bar-lift-1),
    calc(var(--bar-lift-offset) * 0.5) 16px 32px var(--bar-lift-2),
    0 0 24px var(--bar-glow);
}
.dc-bar span {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text3);
}
</style>
