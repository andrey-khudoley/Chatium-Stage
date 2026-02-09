<script setup lang="ts">
export interface FilterTab {
  id: string
  label: string
  active?: boolean
}

export interface FilterTag {
  id: string
  label: string
  active?: boolean
  dot?: boolean
}

defineProps<{
  theme?: 'dark' | 'light'
  searchPlaceholder?: string
  tabs?: FilterTab[]
  tags?: FilterTag[]
}>()
</script>

<template>
  <div class="dc-search-filter" :class="`theme-${theme ?? 'dark'}`">
    <div class="dc-search-wrap">
      <i class="fas fa-search"></i>
      <input type="search" :placeholder="searchPlaceholder ?? 'Поиск'" class="dc-search-input" />
    </div>
    <div v-if="tabs?.length" class="dc-filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="dc-filter-tab"
        :class="{ active: tab.active }"
      >
        {{ tab.label }}
      </button>
    </div>
    <div v-if="tags?.length" class="dc-filter-tags">
      <span
        v-for="tag in tags"
        :key="tag.id"
        class="dc-tag"
        :class="{ active: tag.active }"
      >
        <span v-if="tag.dot" class="dc-tag-dot"></span>
        {{ tag.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.dc-search-filter {
  --radius: 12px;
  --radius-sm: 8px;
  --accent: #afc45f;
  --bg: #05080a;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.16);
}
.dc-search-filter.theme-light {
  --accent: #4f6f2f;
  --bg: #fff;
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
}
.dc-search-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-search-filter.theme-light .dc-search-wrap {
  background: rgba(255,255,255,0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.dc-search-wrap i { color: var(--text3); }
.dc-search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: inherit; }
.dc-filter-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.dc-filter-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.dc-filter-tab.active { background: var(--accent); color: var(--bg); }
.dc-filter-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.dc-tag {
  padding: 8px 14px;
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dc-search-filter.theme-light .dc-tag { background: rgba(79, 111, 47, 0.08); }
.dc-tag.active { background: var(--accent); color: var(--bg); }
.dc-search-filter.theme-light .dc-tag.active { color: #fff; }
.dc-tag-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }
</style>
