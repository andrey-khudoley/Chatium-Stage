<script setup lang="ts">
export interface PaletteItem {
  name: string
  hex: string
  style?: string | Record<string, string>
}

defineProps<{
  theme?: 'dark' | 'light'
  items: PaletteItem[]
}>()
</script>

<template>
  <div class="dc-palette" :class="`theme-${theme ?? 'dark'}`">
    <div v-for="(item, i) in items" :key="i" class="dc-palette-item">
      <div class="dc-swatch" :style="item.style ?? { background: item.hex }"></div>
      <span>{{ item.name }}</span>
      <code>{{ item.hex }}</code>
    </div>
  </div>
</template>

<style scoped>
.dc-palette {
  --border: rgba(175, 196, 95, 0.12);
  --text3: rgba(238, 244, 235, 0.5);
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.dc-palette.theme-light {
  --border: rgba(79, 111, 47, 0.12);
  --text3: #5a6652;
}
.dc-palette-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.dc-swatch { width: 64px; height: 64px; border-radius: 12px; border: 1px solid var(--border); }
.dc-palette-item span { font-size: 0.8rem; font-weight: 600; }
.dc-palette-item code { font-size: 0.75rem; color: var(--text3); font-family: monospace; }
</style>
