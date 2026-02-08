<script setup lang="ts">
/** Кнопки хэдера: поиск, уведомления с бейджем, CTA */
import DcNotificationCenter from './DcNotificationCenter.vue'

defineProps<{
  theme?: 'dark' | 'light'
  indexUrl: string
  notificationCount?: number
}>()
</script>

<template>
  <button type="button" class="dc-action-btn dc-action-btn-icon" aria-label="Поиск">
    <i class="fas fa-search"></i>
  </button>
  <DcNotificationCenter :theme="theme" :notification-count="notificationCount" />
  <a :href="indexUrl" class="dc-action-btn dc-action-btn-primary">
    <i class="fas fa-arrow-right"></i>
    <span>Открыть CRM</span>
  </a>
</template>
