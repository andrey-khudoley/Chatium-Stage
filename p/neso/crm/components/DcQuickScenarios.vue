<script setup lang="ts">
export interface QuickItem {
  icon: string
  label: string
  href?: string
}

defineProps<{
  theme?: 'dark' | 'light'
  items: QuickItem[]
}>()
</script>

<template>
  <div class="dc-quick-scenarios" :class="`theme-${theme ?? 'dark'}`">
    <a
      v-for="(item, i) in items"
      :key="i"
      :href="item.href ?? '#'"
      class="dc-quick-btn"
    >
      <i :class="['fas', item.icon]"></i>
      <span>{{ item.label }}</span>
    </a>
  </div>
</template>

<style scoped>
.dc-quick-scenarios {
  --radius: 12px;
  --accent: #afc45f;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.12);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.dc-quick-scenarios.theme-light {
  --accent: #4f6f2f;
  --text2: #2f3f2c;
  --border: rgba(79, 111, 47, 0.18);
}
.dc-quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.12);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  transition: all 0.25s ease;
}
.dc-quick-scenarios.theme-light .dc-quick-btn {
  background: var(--bg2, #e6dfca);
  border: 1px solid var(--border);
}
.dc-quick-btn:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    rgba(175, 196, 95, 0.14);
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.2);
  border-left-color: rgba(255, 255, 255, 0.08);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    4px 8px 16px rgba(0, 0, 0, 0.28),
    2px 12px 24px rgba(0, 0, 0, 0.16);
}
.dc-quick-scenarios.theme-light .dc-quick-btn:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.5) 0%,
      transparent 40%,
      rgba(79, 111, 47, 0.08) 100%
    ),
    rgba(79, 111, 47, 0.14);
  border-top-color: rgba(255, 255, 255, 0.56);
  border-left-color: rgba(255, 255, 255, 0.2);
  color: var(--accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(79, 111, 47, 0.12),
    2px 4px 12px rgba(79, 111, 47, 0.12),
    1px 8px 18px rgba(79, 111, 47, 0.08);
}
</style>
