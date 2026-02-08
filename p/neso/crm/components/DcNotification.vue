<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  type?: 'success' | 'warning' | 'info'
  title: string
  sub?: string
  actionLabel?: string
}>()
</script>

<template>
  <div class="dc-notify" :class="[`theme-${theme ?? 'dark'}`, type ?? 'success']">
    <i :class="[
      type === 'success' ? 'fas fa-check' : type === 'warning' ? 'fas fa-triangle-exclamation' : 'fas fa-circle-info'
    ]"></i>
    <div>
      <span class="dc-notify-title">{{ title }}</span>
      <span v-if="sub" class="dc-notify-sub">{{ sub }}</span>
    </div>
    <button v-if="actionLabel" type="button" class="dc-notify-btn">
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.dc-notify {
  --radius: 12px;
  --accent: #afc45f;
  --warning: #e5b04a;
  --info: #5a9cf5;
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.dc-notify.theme-light {
  --accent: #4f6f2f;
  --warning: #c9972e;
  --info: #3a7bd5;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.14);
  background: rgba(255,255,255,0.7);
  box-shadow: 0 2px 8px rgba(79, 111, 47, 0.06);
}
.dc-notify i { font-size: 1.25rem; }
.dc-notify.success i { color: var(--accent); }
.dc-notify.warning i { color: var(--warning); }
.dc-notify.info i { color: var(--info); }
.dc-notify-title { display: block; font-weight: 600; }
.dc-notify-sub { font-size: 0.85rem; color: var(--text3); }
.dc-notify-btn {
  margin-left: auto;
  padding: 8px 14px;
  font-size: 0.85rem;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text3);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.dc-notify-btn:hover { background: rgba(175, 196, 95, 0.14); color: var(--accent); }
.dc-notify.theme-light .dc-notify-btn:hover { background: rgba(79, 111, 47, 0.12); color: var(--accent); }
</style>
