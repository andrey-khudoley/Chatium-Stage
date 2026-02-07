<script setup lang="ts">
/** Компонент «LIVE»: бейдж с точкой + слот для стрима событий (журнал, лента и т.п.) */
defineProps<{
  theme?: 'dark' | 'light'
  /** Текст бейджа (по умолчанию LIVE) */
  label?: string
  /** Только бейдж (для header-extra карточки), без обёртки и слота */
  badgeOnly?: boolean
}>()
</script>

<template>
  <template v-if="badgeOnly">
    <span class="dc-live dc-live--badge-only" :class="`theme-${theme ?? 'dark'}`">
      <span class="dc-live-dot"></span>
      {{ label ?? 'LIVE' }}
    </span>
  </template>
  <div v-else class="dc-live" :class="`theme-${theme ?? 'dark'}`">
    <span class="dc-live-badge" aria-hidden="true">
      <span class="dc-live-dot"></span>
      {{ label ?? 'LIVE' }}
    </span>
    <div v-if="$slots.default" class="dc-live-stream">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dc-live {
  --accent: #afc45f;
  --glow-soft: rgba(175, 196, 95, 0.15);
}
.dc-live.theme-light {
  --accent: #4f6f2f;
  --glow-soft: rgba(79, 111, 47, 0.15);
}
.dc-live--badge-only {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--glow-soft);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.25);
  border-left-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    2px 4px 8px rgba(0, 0, 0, 0.2),
    1px 6px 12px rgba(0, 0, 0, 0.12);
}
.dc-live.theme-light .dc-live--badge-only {
  border-top-color: rgba(255, 255, 255, 0.6);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    1px 2px 6px rgba(0, 0, 0, 0.06),
    1px 4px 10px rgba(0, 0, 0, 0.04);
}
.dc-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--glow-soft);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 12px;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.25);
  border-left-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    2px 4px 8px rgba(0, 0, 0, 0.2),
    1px 6px 12px rgba(0, 0, 0, 0.12);
}
.dc-live.theme-light .dc-live-badge {
  border-top-color: rgba(255, 255, 255, 0.6);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    1px 2px 6px rgba(0, 0, 0, 0.06),
    1px 4px 10px rgba(0, 0, 0, 0.04);
}
.dc-live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: dc-live-pulse 2s ease-in-out infinite;
}
.dc-live-stream {
  margin-top: 0;
}
@keyframes dc-live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (prefers-reduced-motion: reduce) {
  .dc-live-dot {
    animation: none;
  }
}
</style>
