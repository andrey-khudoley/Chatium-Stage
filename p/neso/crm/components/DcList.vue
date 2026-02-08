<script setup lang="ts">
export interface ListItem {
  tag?: string
  tagHot?: boolean
  title: string
  desc?: string
  time?: string
}

defineProps<{
  theme?: 'dark' | 'light'
  items: ListItem[]
}>()
</script>

<template>
  <div class="dc-list-panel" :class="`theme-${theme ?? 'dark'}`">
    <div v-for="(item, i) in items" :key="i" class="dc-list-item">
      <span v-if="item.tag" class="dc-list-tag" :class="{ hot: item.tagHot }">
        {{ item.tag }}
      </span>
      <div class="dc-list-body">
        <span class="dc-list-title">{{ item.title }}</span>
        <span v-if="item.desc" class="dc-list-desc">{{ item.desc }}</span>
      </div>
      <span v-if="item.time" class="dc-list-time">{{ item.time }}</span>
    </div>
  </div>
</template>

<style scoped>
.dc-list-panel {
  --radius: 12px;
  --accent: #afc45f;
  --bg: #05080a;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.1);
}
.dc-list-panel.theme-light {
  --accent: #4f6f2f;
  --bg: #fff;
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.14);
}
.dc-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  margin-bottom: 12px;
}
.dc-list-panel.theme-light .dc-list-item {
  background: rgba(255,255,255,0.7);
  box-shadow: 0 2px 8px rgba(79, 111, 47, 0.06);
}
.dc-list-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}
.dc-list-tag.hot { background: var(--accent); color: var(--bg); }
.dc-list-tag:not(.hot) { background: rgba(255,255,255,0.08); color: var(--text2); }
.dc-list-panel.theme-light .dc-list-tag:not(.hot) { background: rgba(79, 111, 47, 0.1); }
.dc-list-body { flex: 1; min-width: 0; }
.dc-list-title { display: block; font-weight: 600; font-size: 0.9rem; }
.dc-list-desc { font-size: 0.85rem; color: var(--text3); }
.dc-list-time { font-size: 0.85rem; color: var(--text3); flex-shrink: 0; }
</style>
