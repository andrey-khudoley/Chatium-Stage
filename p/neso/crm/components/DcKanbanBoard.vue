<script setup lang="ts">
export interface KanbanLabel {
  text: string
  tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success'
}

export interface KanbanCard {
  id: string
  title: string
  subtitle?: string
  assignee?: string
  sla?: string
  priority?: 'low' | 'medium' | 'high'
  labels?: KanbanLabel[]
}

export interface KanbanColumn {
  id: string
  title: string
  wipLimit?: number
  cards: KanbanCard[]
}

defineProps<{
  theme?: 'dark' | 'light'
  columns: KanbanColumn[]
}>()

function getPriorityLabel(priority?: KanbanCard['priority']): string {
  if (priority === 'high') return 'Высокий'
  if (priority === 'medium') return 'Средний'
  return 'Низкий'
}
</script>

<template>
  <section class="dc-kanban" :class="`theme-${theme ?? 'dark'}`">
    <article v-for="column in columns" :key="column.id" class="dc-kanban-column">
      <header class="dc-kanban-column-head">
        <div>
          <h3>{{ column.title }}</h3>
          <p>{{ column.cards.length }} карточек</p>
        </div>
        <span v-if="typeof column.wipLimit === 'number'" class="dc-kanban-wip">
          WIP {{ column.cards.length }}/{{ column.wipLimit }}
        </span>
      </header>

      <div class="dc-kanban-cards">
        <article v-for="card in column.cards" :key="card.id" class="dc-kanban-card">
          <div class="dc-kanban-card-title-wrap">
            <h4>{{ card.title }}</h4>
            <span class="dc-kanban-priority" :class="`priority-${card.priority ?? 'low'}`">
              {{ getPriorityLabel(card.priority) }}
            </span>
          </div>

          <p v-if="card.subtitle" class="dc-kanban-subtitle">{{ card.subtitle }}</p>

          <div v-if="card.labels?.length" class="dc-kanban-labels">
            <span
              v-for="label in card.labels"
              :key="`${card.id}-${label.text}`"
              class="dc-kanban-label"
              :class="`tone-${label.tone ?? 'neutral'}`"
            >
              {{ label.text }}
            </span>
          </div>

          <footer class="dc-kanban-meta">
            <span v-if="card.assignee"><i class="fas fa-user" aria-hidden="true"></i> {{ card.assignee }}</span>
            <span v-if="card.sla"><i class="fas fa-clock" aria-hidden="true"></i> {{ card.sla }}</span>
          </footer>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped>
.dc-kanban {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --accent: #afc45f;
  --surface: rgba(10, 18, 20, 0.72);
  --surface-2: rgba(255, 255, 255, 0.05);
  --border: rgba(175, 196, 95, 0.2);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  min-width: 0;
  align-items: stretch;
}

.dc-kanban.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --accent: #4f6f2f;
  --surface: rgba(250, 247, 238, 0.84);
  --surface-2: rgba(79, 111, 47, 0.08);
  --border: rgba(79, 111, 47, 0.22);
}

.dc-kanban-column {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  container-type: inline-size;
}

.dc-kanban-column-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dc-kanban-column-head h3 {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text);
}

.dc-kanban-column-head p {
  margin: 3px 0 0;
  font-size: 0.78rem;
  line-height: 1.25;
  color: var(--text3);
}

.dc-kanban-wip {
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1;
  color: var(--text2);
  background: var(--surface-2);
  border-radius: 999px;
  padding: 4px 9px;
  white-space: nowrap;
  flex-shrink: 0;
}

.dc-kanban-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dc-kanban-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dc-kanban-card-title-wrap {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.dc-kanban-card h4 {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.3;
  font-weight: 700;
  color: var(--text);
  min-width: 0;
  overflow-wrap: anywhere;
}

.dc-kanban-priority {
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 4px 8px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.dc-kanban-priority.priority-low {
  background: rgba(119, 215, 191, 0.2);
  color: #77d7bf;
}

.dc-kanban-priority.priority-medium {
  background: rgba(242, 189, 93, 0.2);
  color: #f2bd5d;
}

.dc-kanban-priority.priority-high {
  background: rgba(255, 127, 127, 0.2);
  color: #ff9d9d;
}

.dc-kanban-subtitle {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--text2);
  overflow-wrap: anywhere;
}

.dc-kanban-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dc-kanban-label {
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text2);
}

.dc-kanban.theme-light .dc-kanban-label {
  background: rgba(79, 111, 47, 0.1);
}

.dc-kanban-label.tone-accent {
  background: rgba(175, 196, 95, 0.18);
  color: var(--accent);
}

.dc-kanban-label.tone-warning {
  background: rgba(242, 189, 93, 0.22);
  color: #f2bd5d;
}

.dc-kanban-label.tone-danger {
  background: rgba(255, 127, 127, 0.2);
  color: #ff9d9d;
}

.dc-kanban-label.tone-success {
  background: rgba(119, 215, 191, 0.2);
  color: #77d7bf;
}

.dc-kanban-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 0.76rem;
  line-height: 1.25;
  color: var(--text3);
}

.dc-kanban-meta span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  overflow-wrap: anywhere;
}

@container (max-width: 360px) {
  .dc-kanban-card-title-wrap {
    flex-direction: column;
    gap: 6px;
  }

  .dc-kanban-priority {
    align-self: flex-start;
  }
}

@media (max-width: 760px) {
  .dc-kanban {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dc-kanban-column {
    padding: 12px;
  }

  .dc-kanban-column-head h3 {
    font-size: 0.96rem;
  }

  .dc-kanban-column-head p {
    font-size: 0.76rem;
  }
}
</style>
