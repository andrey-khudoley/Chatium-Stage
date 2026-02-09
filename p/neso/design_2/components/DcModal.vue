<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  title: string
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dc-modal-overlay" @click.self="emit('close')">
      <div class="dc-modal" :class="`theme-${theme ?? 'dark'}`">
        <div class="dc-modal-header">
          <h3>{{ title }}</h3>
          <button type="button" class="dc-modal-close" aria-label="Закрыть" @click="emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dc-modal-body">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="dc-modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dc-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.66);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: dc-fade 0.2s ease;
}
.dc-modal-overlay:has(.theme-light) { background: rgba(0,0,0,0.4); }
@keyframes dc-fade { from { opacity: 0; } to { opacity: 1; } }
.dc-modal {
  --radius: 16px;
  --radius-sm: 8px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  --glow-soft: rgba(175, 196, 95, 0.15);
  background: linear-gradient(165deg, rgba(18, 27, 29, 0.94), rgba(14, 22, 24, 0.9));
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.54);
}
.dc-modal.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.12);
  --border-strong: rgba(79, 111, 47, 0.22);
  --glow-soft: rgba(79, 111, 47, 0.15);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(248, 246, 235, 0.95));
  box-shadow: 0 28px 72px rgba(79, 111, 47, 0.18);
}
.dc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.dc-modal-header h3 { margin: 0; font-size: 1.1rem; }
.dc-modal-close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.dc-modal-close:hover { background: var(--glow-soft); color: var(--accent); }
.dc-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.dc-modal-body :deep(.dc-mf-row) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-modal.theme-light .dc-modal-body :deep(.dc-mf-row) {
  background: rgba(255,255,255,0.8);
  border-color: rgba(79, 111, 47, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.dc-modal-body :deep(.dc-mf-row):focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16);
}
.dc-modal.theme-light .dc-modal-body :deep(.dc-mf-row):focus-within {
  box-shadow: 0 0 0 2px rgba(79, 111, 47, 0.16);
}
.dc-modal-body :deep(.dc-mf-row i) { color: var(--text2); }
.dc-modal-body :deep(.dc-mf-row input),
.dc-modal-body :deep(.dc-mf-row select) {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}
.dc-modal-body :deep(.dc-mf-row select) { padding-right: 24px; cursor: pointer; }
.dc-modal-body :deep(.dc-mf-row .dc-mf-chevron) { color: var(--text2); font-size: 0.7rem; }
.dc-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border); }
</style>
