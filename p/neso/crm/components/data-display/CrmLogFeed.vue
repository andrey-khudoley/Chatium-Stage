<template>
  <div class="crm-log-feed">
    <div class="crm-log-feed-output crm-scroll" role="log" aria-live="polite" aria-atomic="false">
      <div v-if="items.length === 0" class="crm-muted">{{ emptyText }}</div>
      <div v-for="(item, index) in items" :key="index" class="crm-log-feed-item">
        <div v-if="item.type === 'divider'" class="crm-log-feed-divider">
          --- {{ item.date }} ---
        </div>
        <div v-else class="crm-log-feed-entry">
          <span class="crm-log-feed-time">{{ item.formattedTime }}</span>
          <span class="crm-log-feed-level" :class="`is-${item.level}`">
            [{{ item.level.toUpperCase() }}]
          </span>
          <span class="crm-log-feed-message">{{ item.formattedMessage }}</span>
        </div>
      </div>
    </div>

    <div class="crm-row crm-log-feed-actions">
      <p v-if="loading" class="crm-muted">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span>{{ loadingText }}</span>
      </p>
      <p v-if="error" class="crm-status-danger">{{ error }}</p>
      <CrmButton
        v-if="hasMore && !loading"
        variant="ghost"
        icon="fas fa-arrow-down"
        @click="emit('load-more')"
      >
        {{ loadMoreLabel }}
      </CrmButton>
      <CrmButton variant="danger" icon="fas fa-trash-alt" @click="emit('clear')">
        {{ clearLabel }}
      </CrmButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import CrmButton from '../base/CrmButton.vue'

export type CrmLogFeedItem =
  | {
      type: 'divider'
      date: string
    }
  | {
      type: 'log'
      level: string
      formattedTime: string
      formattedMessage: string
    }

const props = withDefaults(
  defineProps<{
    items: CrmLogFeedItem[]
    loading?: boolean
    error?: string
    hasMore?: boolean
    emptyText?: string
    loadingText?: string
    loadMoreLabel?: string
    clearLabel?: string
  }>(),
  {
    loading: false,
    error: '',
    hasMore: false,
    emptyText: 'Логи появятся здесь...',
    loadingText: 'Загрузка логов...',
    loadMoreLabel: 'Загрузить ещё',
    clearLabel: 'Очистить'
  }
)

const emit = defineEmits<{
  'load-more': []
  clear: []
}>()
</script>

<style scoped>
.crm-log-feed {
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-3);
}

.crm-log-feed-output {
  border: 1px solid var(--crm-borderStrong);
  border-radius: var(--crm-radius-md);
  background: var(--crm-surfaceRaised);
  min-height: 240px;
  max-height: 420px;
  overflow: auto;
  padding: var(--crm-space-3);
  font-family: var(--crm-font-tables);
  font-size: 0.78rem;
}

.crm-log-feed-item {
  margin: 0;
}

.crm-log-feed-divider {
  text-align: center;
  color: var(--crm-textDim);
  font-size: 0.68rem;
  padding: 0.4rem 0;
}

.crm-log-feed-entry {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  line-height: 1.5;
  padding: 0.12rem 0;
}

.crm-log-feed-time {
  color: var(--crm-textDim);
  font-variant-numeric: tabular-nums;
}

.crm-log-feed-level {
  font-weight: 600;
}

.crm-log-feed-level.is-debug { color: var(--crm-info); }
.crm-log-feed-level.is-info { color: var(--crm-info); }
.crm-log-feed-level.is-notice { color: var(--crm-success); }
.crm-log-feed-level.is-warning { color: var(--crm-warning); }
.crm-log-feed-level.is-warn { color: var(--crm-warning); }
.crm-log-feed-level.is-error { color: var(--crm-danger); }
.crm-log-feed-level.is-critical { color: var(--crm-danger); }
.crm-log-feed-level.is-alert { color: var(--crm-warning); }
.crm-log-feed-level.is-emergency { color: var(--crm-danger); }

.crm-log-feed-message {
  color: var(--crm-textMuted);
  word-break: break-word;
  min-width: 0;
  flex: 1;
}

.crm-log-feed-actions {
  justify-content: flex-end;
}

.crm-log-feed-actions p {
  margin: 0 auto 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
}
</style>
