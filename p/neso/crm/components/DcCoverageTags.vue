<script setup lang="ts">
export interface CoverageTag {
  icon: string
  label: string
}

defineProps<{
  theme?: 'dark' | 'light'
  tags: CoverageTag[]
}>()
</script>

<template>
  <div class="dc-coverage-tags" :class="`theme-${theme ?? 'dark'}`">
    <span v-for="(tag, i) in tags" :key="i" class="dc-cov-tag">
      <i :class="['fas', tag.icon]"></i>
      {{ tag.label }}
    </span>
  </div>
</template>

<style scoped>
.dc-coverage-tags {
  --radius: 12px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.14);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.dc-coverage-tags.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.2);
}
.dc-cov-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: var(--text2);
  transition: all 0.25s ease;
}
.dc-coverage-tags.theme-light .dc-cov-tag {
  background: rgba(255,255,255,0.8);
  box-shadow: 0 2px 8px rgba(79, 111, 47, 0.06);
}
.dc-cov-tag:hover {
  background: rgba(175, 196, 95, 0.12);
  border-color: rgba(175, 196, 95, 0.24);
  color: var(--text);
}
.dc-coverage-tags.theme-light .dc-cov-tag:hover {
  background: rgba(79, 111, 47, 0.12);
  border-color: rgba(79, 111, 47, 0.3);
}
.dc-cov-tag i { color: var(--accent); }
</style>
