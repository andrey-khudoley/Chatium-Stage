<script setup lang="ts">
/** Группа переключаемых чипов (фильтры логов: Info, Warn, Error). */
export interface ChipOption {
  id: string
  label: string
  icon: string
  active: boolean
}
defineProps<{
  theme?: 'dark' | 'light'
  options: ChipOption[]
}>()
const emit = defineEmits<{ toggle: [id: string] }>()
</script>

<template>
  <div class="dc-filter-chips" :class="`theme-${theme ?? 'dark'}`">
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      class="dc-filter-chip"
      :class="{
        'dc-filter-chip--active': opt.active,
        'dc-filter-chip--muted': !opt.active
      }"
      @click="emit('toggle', opt.id)"
    >
      <i class="fas" :class="opt.icon"></i>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.dc-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.dc-filter-chip {
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: rgba(175, 196, 95, 0.15);
  color: var(--accent);
}
.dc-filter-chips.theme-light .dc-filter-chip {
  --accent: #4f6f2f;
  --text: #1f2f1d;
  --text2: #34432f;
}
.dc-filter-chip:hover {
  background: rgba(175, 196, 95, 0.22);
}
.dc-filter-chip--muted {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text2);
  border-color: rgba(175, 196, 95, 0.1);
}
.dc-filter-chips.theme-light .dc-filter-chip--muted {
  background: rgba(79, 111, 47, 0.08);
  color: var(--text2);
  border-color: rgba(79, 111, 47, 0.12);
}
.dc-filter-chip--muted:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}
.dc-filter-chips.theme-light .dc-filter-chip--muted:hover {
  background: rgba(79, 111, 47, 0.14);
}
</style>
