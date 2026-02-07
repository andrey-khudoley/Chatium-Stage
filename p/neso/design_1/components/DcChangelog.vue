<script setup lang="ts">
export interface ChangelogItem {
  role: string
  text: string
  time: string
}

defineProps<{
  theme?: 'dark' | 'light'
  items: ChangelogItem[]
  live?: boolean
}>()
</script>

<template>
  <div class="dc-changelog" :class="`theme-${theme ?? 'dark'}`">
    <div v-if="live" class="dc-live-badge">
      <span class="dc-live-dot"></span> LIVE
    </div>
    <div class="dc-changelog-list">
      <div v-for="(item, i) in items" :key="i" class="dc-changelog-item">
        <span class="dc-changelog-role">{{ item.role }}</span>
        <span class="dc-changelog-text">{{ item.text }}</span>
        <span class="dc-changelog-time">{{ item.time }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dc-changelog {
  --radius: 12px;
  --accent: #afc45f;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.1);
  --glow-soft: rgba(175, 196, 95, 0.15);
}
.dc-changelog.theme-light {
  --accent: #4f6f2f;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.14);
  --glow-soft: rgba(79, 111, 47, 0.1);
}
.dc-live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 16px;
  width: fit-content;
}
.dc-live-dot {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: dc-pulse 2s ease-in-out infinite;
}
@keyframes dc-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
.dc-changelog-list { display: flex; flex-direction: column; gap: 12px; }
.dc-changelog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.dc-changelog.theme-light .dc-changelog-item {
  background: var(--bg2, #f0ede0);
  border: none;
}
.dc-changelog-role {
  width: 32px; height: 32px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.dc-changelog-text { flex: 1; font-size: 0.9rem; }
.dc-changelog-time { font-size: 0.8rem; color: var(--text3); }
</style>
