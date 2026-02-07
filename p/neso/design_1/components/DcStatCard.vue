<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  theme?: 'dark' | 'light'
  icon: string
  value: string | number
  label: string
}>()

const cardBgStyle = computed(() => {
  const t = props.theme ?? 'dark'
  if (t === 'dark') return { background: 'rgba(10, 18, 20, 0.8)' }
  return {}
})
</script>

<template>
  <div
    class="dc-stat-card"
    :class="`theme-${theme ?? 'dark'}`"
    data-dc-opaque="v2"
  >
    <!-- Фон отдельным слоем с инлайн-стилем, чтобы никакой внешний CSS не перекрывал -->
    <div
      class="dc-stat-card__bg"
      :style="cardBgStyle"
      aria-hidden="true"
    />
    <div class="dc-stat-icon"><i :class="['fas', icon]"></i></div>
    <span class="dc-stat-value">{{ value }}</span>
    <span class="dc-stat-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.dc-stat-card {
  position: relative;
  --radius-lg: 16px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.22);
  --glow-soft: rgba(175, 196, 95, 0.15);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  isolation: isolate;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dc-stat-card.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.12);
  --glass-strong: rgba(255, 255, 255, 0.58);
  --glass-soft: rgba(248, 246, 235, 0.5);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 4px 24px rgba(79, 111, 47, 0.06);
}
.dc-stat-icon {
  width: 44px; height: 44px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--glow-soft);
  color: var(--accent);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.25);
  border-left-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    2px 4px 8px rgba(0, 0, 0, 0.2),
    1px 6px 12px rgba(0, 0, 0, 0.12);
}
.dc-stat-card.theme-light .dc-stat-icon {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    rgba(79, 111, 47, 0.1);
  border-top-color: rgba(255, 255, 255, 0.65);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    1px 2px 6px rgba(0, 0, 0, 0.06),
    1px 4px 10px rgba(0, 0, 0, 0.04);
}
.dc-stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text); }
.dc-stat-label { font-size: 0.85rem; color: var(--text2); }

/* Слой фона: инлайн-стиль задаётся в шаблоне, здесь только геометрия */
.dc-stat-card__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}
</style>
