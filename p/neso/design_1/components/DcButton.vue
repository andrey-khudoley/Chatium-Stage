<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'default' | 'small'
  disabled?: boolean
  loading?: boolean
  icon?: string
  href?: string
}>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :disabled="disabled && !href"
    type="button"
    class="dc-btn"
    :class="[
      `theme-${theme ?? 'dark'}`,
      `variant-${variant ?? 'primary'}`,
      size === 'small' ? 'size-small' : '',
      loading ? 'loading' : '',
      disabled && !href ? 'disabled' : ''
    ]"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="['fas', icon]"></i>
    <slot></slot>
  </component>
</template>

<style scoped>
.dc-btn {
  --radius: 12px;
  --accent: #afc45f;
  --accent-deep: #6f8440;
  --bg: #05080a;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.14);
  --border-strong: rgba(175, 196, 95, 0.22);
  --glow-soft: rgba(175, 196, 95, 0.15);
  padding: 12px 20px;
  border-radius: var(--radius);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}
.dc-btn.theme-light {
  --accent: #4f6f2f;
  --bg: #fff;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.2);
  --glow-soft: rgba(79, 111, 47, 0.15);
}
.dc-btn.variant-primary {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--accent);
  color: var(--bg);
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.4);
  border-left-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    6px 10px 20px rgba(0, 0, 0, 0.35),
    3px 16px 32px rgba(0, 0, 0, 0.2),
    0 0 24px var(--glow-soft);
}
.dc-btn.theme-light.variant-primary {
  border-top-color: rgba(255, 255, 255, 0.65);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 1px 0 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    4px 8px 16px rgba(0, 0, 0, 0.1),
    2px 12px 24px rgba(0, 0, 0, 0.06),
    0 12px 22px rgba(79, 111, 47, 0.22);
}
.dc-btn.variant-primary:hover:not(.disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.dc-btn.variant-secondary {
  background: rgba(255,255,255,0.1);
  color: var(--text);
  border: 1px solid rgba(175, 196, 95, 0.14);
}
.dc-btn.theme-light.variant-secondary {
  background: rgba(79, 111, 47, 0.1);
  border: 1px solid rgba(79, 111, 47, 0.2);
}
.dc-btn.variant-secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.dc-btn.theme-light.variant-secondary:hover { background: rgba(79, 111, 47, 0.16); }
.dc-btn.variant-ghost {
  background: transparent;
  color: var(--text2);
  border: 1px solid transparent;
}
.dc-btn.variant-ghost:hover:not(.disabled) {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    var(--glow-soft);
  border-top-color: rgba(255, 255, 255, 0.18);
  border-left-color: rgba(255, 255, 255, 0.08);
  color: var(--accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    3px 6px 12px rgba(0, 0, 0, 0.25),
    2px 10px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}
.dc-btn.theme-light.variant-ghost:hover:not(.disabled) {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.5) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.03) 100%
    ),
    var(--glow-soft);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-left-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05),
    2px 4px 10px rgba(0, 0, 0, 0.08),
    1px 6px 14px rgba(0, 0, 0, 0.05);
}
.dc-btn.variant-outline {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
}
.dc-btn.variant-outline:hover { background: var(--glow-soft); transform: translateY(-1px); }
.dc-btn.disabled { opacity: 0.5; cursor: not-allowed; }
.dc-btn.size-small { padding: 8px 14px; font-size: 0.85rem; }
</style>
