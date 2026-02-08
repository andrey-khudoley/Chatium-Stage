<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  theme?: 'dark' | 'light'
  title: string
  desc?: string
}>()

const cardBgStyle = computed(() => {
  const t = props.theme ?? 'dark'
  if (t === 'dark') return { background: 'rgba(10, 18, 20, 0.8)' }
  return {}
})
</script>

<template>
  <div class="dc-hero-card" :class="`theme-${theme ?? 'dark'}`" data-dc-opaque="v2">
    <div
      class="dc-hero-card__bg"
      :style="cardBgStyle"
      aria-hidden="true"
    />
    <div v-if="theme === 'dark'" class="dc-glow-spot" aria-hidden="true"></div>
    <div v-else class="dc-sunray-diagonal" aria-hidden="true"></div>
    <h2 class="dc-hero-title">{{ title }}</h2>
    <p v-if="desc" class="dc-hero-desc">{{ desc }}</p>
    <div v-if="$slots.actions" class="dc-hero-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
.dc-hero-card {
  position: relative;
  --radius-lg: 16px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.22);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dc-hero-card__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}
.dc-hero-card.theme-light {
  --accent: #4f6f2f;
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --border: rgba(79, 111, 47, 0.18);
  background:
    linear-gradient(158deg, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.22) 46%, rgba(79, 111, 47, 0.08) 100%),
    rgba(249, 245, 234, 0.84);
  box-shadow: 0 10px 34px rgba(79, 111, 47, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.dc-glow-spot {
  position: absolute;
  top: -30%; right: -15%;
  width: 56%; height: 74%;
  background: radial-gradient(ellipse at 70% 30%, rgba(175, 196, 95, 0.08), transparent 60%);
  pointer-events: none;
  filter: blur(6px);
}
.dc-sunray-diagonal {
  position: absolute;
  top: -50%; right: -20%;
  width: 150%; height: 150%;
  background: linear-gradient(135deg, transparent 0%, rgba(79, 111, 47, 0.12) 35%, transparent 58%);
  pointer-events: none;
  transform: rotate(-12deg);
}
.dc-hero-title { font-family: 'Old Standard TT', serif; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0; color: var(--text); }
.dc-hero-desc { color: var(--text2); margin: 0 0 24px 0; max-width: 520px; line-height: 1.6; }
.dc-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
</style>
