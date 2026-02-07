<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  type: 'loading' | 'skeleton' | 'error' | 'empty'
  message?: string
  actionLabel?: string
}>()
</script>

<template>
  <div class="dc-state-card" :class="[`theme-${theme ?? 'dark'}`, type]">
    <span class="dc-state-label">{{ type.toUpperCase() }}</span>
    <div class="dc-state-content" :class="type">
      <template v-if="type === 'loading'">
        <i class="fas fa-spinner fa-spin"></i>
        <span>{{ message ?? 'Загрузка...' }}</span>
      </template>
      <template v-else-if="type === 'skeleton'">
        <div class="dc-sk-line"></div>
        <div class="dc-sk-line short"></div>
        <div class="dc-sk-line mid"></div>
      </template>
      <template v-else-if="type === 'error'">
        <span>{{ message ?? 'Ошибка' }}</span>
        <button v-if="actionLabel" type="button" class="dc-state-btn">{{ actionLabel }}</button>
      </template>
      <template v-else-if="type === 'empty'">
        <span>{{ message ?? 'Нет данных' }}</span>
        <button v-if="actionLabel" type="button" class="dc-state-btn">{{ actionLabel }}</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dc-state-card {
  --radius: 12px;
  --accent: #afc45f;
  --error: #e85555;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.14);
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.dc-state-card.theme-light {
  --accent: #4f6f2f;
  --error: #c53d3d;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
  background: rgba(255,255,255,0.7);
  box-shadow: 0 2px 8px rgba(79, 111, 47, 0.06);
}
.dc-state-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}
.dc-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 80px;
  color: var(--text2);
  font-size: 0.85rem;
  text-align: center;
}
.dc-state-content.loading i { font-size: 1.5rem; color: var(--accent); }
.dc-state-content.error span { color: var(--error); }
.dc-state-content.skeleton { align-items: stretch; }
.dc-sk-line { height: 12px; background: rgba(255,255,255,0.08); border-radius: 4px; width: 100%; }
.dc-state-card.theme-light .dc-sk-line { background: rgba(79, 111, 47, 0.12); }
.dc-sk-line.short { width: 60%; }
.dc-sk-line.mid { width: 80%; }
.dc-state-btn {
  padding: 8px 14px;
  font-size: 0.85rem;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.dc-state-btn:hover { background: rgba(175, 196, 95, 0.14); color: var(--accent); }
.dc-state-card.theme-light .dc-state-btn:hover { background: rgba(79, 111, 47, 0.12); }
</style>
