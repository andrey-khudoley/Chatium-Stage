<script setup lang="ts">
/** Кнопки хэдера: поиск, уведомления с бейджем, CTA */
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
  <button type="button" class="dc-action-btn dc-action-btn-icon" aria-label="Уведомления">
    <i class="fas fa-bell"></i>
    <span v-if="(notificationCount ?? 0) > 0" class="dc-badge">{{ notificationCount }}</span>
  </button>
  <a :href="indexUrl" class="dc-action-btn dc-action-btn-primary">
    <i class="fas fa-arrow-right"></i>
    <span>Открыть CRM</span>
  </a>
</template>
