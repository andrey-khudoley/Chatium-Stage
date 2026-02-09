<template>
  <footer class="app-footer crm-surface">
    <div class="app-footer-content">
      <span>{{ t('footer.company') }}</span>
      <span>{{ t('footer.rights', { year: currentYear }) }}</span>
      <button class="app-footer-link" type="button" @click="onChatiumClick">
        {{ t('footer.madeWith') }}
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { createComponentLogger } from '../shared/logger'
import { useUiI18n } from '../shared/design/i18n'

const log = createComponentLogger('AppFooter')
const emit = defineEmits<{ 'chatium-click': [] }>()
const currentYear = new Date().getFullYear()
const { t } = useUiI18n()

function onChatiumClick(): void {
  log.notice('Chatium link clicked')
  emit('chatium-click')
}
</script>

<style scoped>
.app-footer {
  width: min(1400px, calc(100% - 2.5rem));
  margin: 0 auto var(--crm-space-3);
  border-radius: var(--crm-radius-xl);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 70%, transparent);
  padding: var(--crm-space-3) var(--crm-space-4);
}

.app-footer-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--crm-space-3);
  color: var(--crm-textDim);
  font-size: 0.78rem;
}

.app-footer-content span:first-child {
  text-align: left;
}

.app-footer-content span:nth-child(2) {
  text-align: center;
  font-family: var(--crm-font-tables);
}

.app-footer-link {
  justify-self: end;
  color: var(--crm-textMuted);
  text-decoration: none;
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 70%, transparent);
  border-radius: var(--crm-radius-sm);
  background: color-mix(in srgb, var(--crm-surfaceRaised) 78%, transparent);
  font-family: inherit;
  font-size: 0.78rem;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-footer-link:hover {
  color: var(--crm-text);
  border-color: color-mix(in srgb, var(--crm-accent) 68%, transparent);
  background: color-mix(in srgb, var(--crm-accentSoft) 24%, transparent);
}

@media (max-width: 900px) {
  .app-footer {
    width: min(100% - 1rem, 1400px);
  }

  .app-footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .app-footer-content span:first-child,
  .app-footer-content span:nth-child(2) {
    text-align: center;
  }

  .app-footer-link {
    justify-self: center;
  }
}
</style>
