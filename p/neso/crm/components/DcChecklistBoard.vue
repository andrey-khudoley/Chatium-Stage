<script setup lang="ts">
import { computed } from 'vue'

export interface ChecklistTaskItem {
  id: string
  title: string
  done?: boolean
  owner?: string
  due?: string
  priority?: 'low' | 'medium' | 'high'
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  items: ChecklistTaskItem[]
}>()

const doneCount = computed(() => props.items.filter((item) => item.done).length)
const completion = computed(() => {
  if (!props.items.length) return 0
  return Math.round((doneCount.value / props.items.length) * 100)
})

function getPriorityLabel(priority?: ChecklistTaskItem['priority']): string {
  if (priority === 'high') return 'Срочно'
  if (priority === 'medium') return 'Средний'
  return 'План'
}
</script>

<template>
  <section class="dc-checklist" :class="`theme-${theme ?? 'dark'}`">
    <header class="dc-checklist-head">
      <div>
        <strong>Выполнено {{ doneCount }} / {{ items.length }}</strong>
        <span>Прогресс {{ completion }}%</span>
      </div>
      <div class="dc-checklist-progress">
        <div class="dc-checklist-progress-bar" :style="{ width: `${completion}%` }"></div>
      </div>
    </header>

    <ul class="dc-checklist-list">
      <li v-for="item in items" :key="item.id" class="dc-checklist-item" :class="{ done: item.done }">
        <label class="dc-checklist-main">
          <input type="checkbox" :checked="item.done" disabled />
          <span>{{ item.title }}</span>
        </label>

        <div class="dc-checklist-meta">
          <span v-if="item.owner"><i class="fas fa-user"></i> {{ item.owner }}</span>
          <span v-if="item.due"><i class="fas fa-calendar"></i> {{ item.due }}</span>
          <span class="dc-checklist-priority" :class="`priority-${item.priority ?? 'low'}`">
            {{ getPriorityLabel(item.priority) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.dc-checklist {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --accent: #afc45f;
  --border: rgba(175, 196, 95, 0.2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.dc-checklist.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --accent: #4f6f2f;
  --border: rgba(79, 111, 47, 0.2);
}

.dc-checklist-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.dc-checklist-head strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text);
}

.dc-checklist-head span {
  font-size: 0.78rem;
  color: var(--text3);
}

.dc-checklist-progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.dc-checklist.theme-light .dc-checklist-progress {
  background: rgba(79, 111, 47, 0.1);
}

.dc-checklist-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(175, 196, 95, 0.6) 0%, var(--accent) 100%);
}

.dc-checklist-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-checklist-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dc-checklist.theme-light .dc-checklist-item {
  background: rgba(79, 111, 47, 0.06);
}

.dc-checklist-item.done {
  opacity: 0.78;
}

.dc-checklist-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--text);
  font-size: 0.84rem;
}

.dc-checklist-main span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.dc-checklist-main input {
  accent-color: var(--accent);
}

.dc-checklist-item.done .dc-checklist-main span {
  text-decoration: line-through;
}

.dc-checklist-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.74rem;
  color: var(--text3);
}

.dc-checklist-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dc-checklist-priority {
  border-radius: 999px;
  padding: 2px 8px;
}

.dc-checklist-priority.priority-low {
  background: rgba(119, 215, 191, 0.2);
  color: #77d7bf;
}

.dc-checklist-priority.priority-medium {
  background: rgba(242, 189, 93, 0.22);
  color: #f2bd5d;
}

.dc-checklist-priority.priority-high {
  background: rgba(255, 127, 127, 0.22);
  color: #ff9d9d;
}

@media (max-width: 520px) {
  .dc-checklist-meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
