<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  /** Название страницы — первая строка */
  title?: string
  /** Хлебные крошки — вторая строка, отображаются через " / " */
  breadcrumbs?: string[]
  showMenuToggle?: boolean
}>()
const emit = defineEmits<{ 'menu-toggle': [] }>()
</script>

<template>
  <header class="dc-page-header" :class="`theme-${theme ?? 'dark'}`">
    <button
      v-if="showMenuToggle"
      type="button"
      class="dc-menu-toggle"
      aria-label="Открыть меню"
      @click="emit('menu-toggle')"
    >
      <i class="fas fa-bars"></i>
    </button>
    <div class="dc-header-left">
      <h1 class="dc-page-title">{{ title ?? 'Dashboard' }}</h1>
      <p v-if="breadcrumbs?.length" class="dc-page-breadcrumbs dc-page-subtitle">{{ breadcrumbs.join(' / ') }}</p>
    </div>
    <div v-if="$slots.actions" class="dc-header-actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.dc-page-header {
  --radius: 12px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.16);
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 40px;
}
.dc-page-header.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.12);
}
.dc-menu-toggle { display: none; }
.dc-header-left { flex: 1; }
.dc-page-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text);
}
/* dc-page-subtitle оставлен для обратной совместимости со стилями */
.dc-page-breadcrumbs,
.dc-page-subtitle { margin: 0; font-size: 0.95rem; color: var(--text2); }
.dc-header-actions { display: flex; gap: 12px; align-items: center; }

/* Кнопки и бейдж в слоте actions */
.dc-page-header :deep(.dc-action-btn) {
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  position: relative;
}
.dc-page-header :deep(.dc-action-btn.dc-action-btn-icon) {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(175,196,95,0.16);
  color: var(--text2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.dc-page-header.theme-dark :deep(.dc-action-btn.dc-action-btn-icon:hover) {
  background: rgba(175,196,95,0.14);
  color: var(--accent);
  transform: translateY(-1px);
}
.dc-page-header :deep(.dc-action-btn.dc-action-btn-primary) {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--accent);
  color: #05080a;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.4);
  border-left-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    6px 10px 20px rgba(0, 0, 0, 0.35),
    3px 16px 32px rgba(0, 0, 0, 0.2),
    0 0 24px rgba(175, 196, 95, 0.35);
}
.dc-page-header :deep(.dc-action-btn.dc-action-btn-primary:hover) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.dc-page-header.theme-light :deep(.dc-action-btn.dc-action-btn-icon) {
  background: rgba(255,255,255,0.7);
  border: 1px solid var(--border);
}
.dc-page-header.theme-light :deep(.dc-action-btn.dc-action-btn-icon:hover) {
  background: rgba(79,111,47,0.1);
  color: var(--accent);
}
.dc-page-header.theme-light :deep(.dc-action-btn.dc-action-btn-primary) {
  color: white;
  border-top-color: rgba(255, 255, 255, 0.65);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 1px 0 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    4px 8px 16px rgba(0, 0, 0, 0.1),
    2px 12px 24px rgba(0, 0, 0, 0.06),
    0 0 24px rgba(79, 111, 47, 0.2);
}
.dc-page-header.theme-light :deep(.dc-action-btn.dc-action-btn-primary:hover) {
  filter: brightness(1.08);
}
.dc-page-header :deep(.dc-badge) {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent);
  color: #05080a;
  border-radius: 9px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dc-page-header.theme-light :deep(.dc-badge) {
  color: white;
}

@media (max-width: 768px) {
  .dc-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px; height: 44px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
  }
  .dc-page-header.theme-light .dc-menu-toggle {
    background: var(--bg2, #f0ede0);
    border: 1px solid var(--border);
  }
}
</style>
