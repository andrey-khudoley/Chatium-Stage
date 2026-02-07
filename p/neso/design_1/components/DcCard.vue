<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  theme?: 'dark' | 'light'
  title?: string
  twoCol?: boolean
}>()

const cardBgStyle = computed(() => {
  const t = props.theme ?? 'dark'
  if (t === 'dark') return { background: 'rgba(10, 18, 20, 0.8)' }
  return {}
})
</script>

<template>
  <div
    class="dc-card"
    :class="[
      `theme-${theme ?? 'dark'}`,
      twoCol ? 'two-col' : ''
    ]"
    data-dc-opaque="v2"
  >
    <div
      class="dc-card__bg"
      :style="cardBgStyle"
      aria-hidden="true"
    />
    <div v-if="title" class="dc-card-header">
      <h3 class="dc-card-title">{{ title }}</h3>
      <slot name="header-extra"></slot>
    </div>
    <div class="dc-card-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.dc-card {
  position: relative;
  --radius-lg: 16px;
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  overflow: visible;
  isolation: isolate;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.26);
}
.dc-card__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}
.dc-card-body {
  position: relative;
}
.dc-card.theme-light {
  --border: rgba(79, 111, 47, 0.12);
  --border-strong: rgba(79, 111, 47, 0.22);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 30px rgba(79, 111, 47, 0.1);
}
.dc-card.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.dc-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; min-height: 28px; }
.dc-card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(238, 244, 235, 0.75);
  letter-spacing: 0.05em;
  margin: 0;
}
.dc-card.theme-light .dc-card-title { color: #3d4a35; }
@media (max-width: 1024px) {
  .dc-card.two-col { grid-template-columns: 1fr; }
}
</style>
