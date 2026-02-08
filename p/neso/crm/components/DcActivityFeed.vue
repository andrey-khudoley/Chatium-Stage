<script setup lang="ts">
export interface ActivityFeedItem {
  id: string
  title: string
  details?: string
  actor?: string
  time: string
  icon?: string
  level?: 'info' | 'success' | 'warning' | 'error'
}

defineProps<{
  theme?: 'dark' | 'light'
  items: ActivityFeedItem[]
}>()
</script>

<template>
  <section class="dc-activity-feed" :class="`theme-${theme ?? 'dark'}`">
    <article v-for="item in items" :key="item.id" class="dc-activity-item">
      <span class="dc-activity-icon" :class="`level-${item.level ?? 'info'}`">
        <i :class="['fas', item.icon ?? 'fa-circle-info']" aria-hidden="true"></i>
      </span>

      <div class="dc-activity-content">
        <div class="dc-activity-head">
          <strong>{{ item.title }}</strong>
          <span>{{ item.time }}</span>
        </div>

        <p v-if="item.details">{{ item.details }}</p>

        <span v-if="item.actor" class="dc-activity-actor">
          <i class="fas fa-user" aria-hidden="true"></i>
          {{ item.actor }}
        </span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.dc-activity-feed {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.18);
  --surface: rgba(10, 18, 20, 0.72);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dc-activity-feed.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
  --surface: rgba(250, 247, 238, 0.88);
}

.dc-activity-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.dc-activity-feed.theme-light .dc-activity-item {
  background: rgba(79, 111, 47, 0.06);
}

.dc-activity-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dc-activity-icon.level-info {
  background: rgba(133, 168, 255, 0.22);
  color: #9abaff;
}

.dc-activity-icon.level-success {
  background: rgba(119, 215, 191, 0.22);
  color: #77d7bf;
}

.dc-activity-icon.level-warning {
  background: rgba(242, 189, 93, 0.22);
  color: #f2bd5d;
}

.dc-activity-icon.level-error {
  background: rgba(255, 127, 127, 0.22);
  color: #ff9d9d;
}

.dc-activity-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dc-activity-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.dc-activity-head strong {
  font-size: 0.84rem;
  color: var(--text);
  min-width: 0;
  overflow-wrap: anywhere;
}

.dc-activity-head span {
  font-size: 0.74rem;
  color: var(--text3);
  white-space: nowrap;
}

.dc-activity-content p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text2);
}

.dc-activity-actor {
  font-size: 0.74rem;
  color: var(--text3);
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

@media (max-width: 520px) {
  .dc-activity-head {
    flex-direction: column;
    gap: 4px;
  }

  .dc-activity-head span {
    white-space: normal;
  }
}
</style>
