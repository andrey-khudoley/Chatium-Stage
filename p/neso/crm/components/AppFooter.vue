<template>
  <footer class="app-footer">
    <div class="footer-bar"></div>
    <div class="footer-inner">
      <span class="footer-copy">© 2018–{{ currentYear }}</span>
      <a
        href="https://chatium.ru"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
        @click.prevent="onChatiumClick"
      >
        Сделано на Chatium
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('AppFooter')
const currentYear = new Date().getFullYear()
const emit = defineEmits<{ 'chatium-click': [] }>()

function onChatiumClick() {
  log.notice('Chatium link clicked')
  emit('chatium-click')
  window.open('https://chatium.ru', '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.app-footer {
  flex-shrink: 0;
  background: var(--color-bg);
  position: relative;
}

.footer-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--color-gold) 0%, var(--color-green) 100%);
}

.footer-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}

.footer-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-green);
}

@media (max-width: 480px) {
  .footer-inner {
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }
}
</style>
