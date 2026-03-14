<script setup lang="ts">
export type SectionId = 'index' | 'calendar' | 'my-day' | 'week' | 'habits' | 'notebook'

const props = defineProps<{
  indexUrl: string
  calendarUrl: string
  myDayUrl: string
  weekUrl: string
  habitsUrl: string
  notebookUrl: string
  currentSection: SectionId
}>()

const sections = [
  { id: 'index' as const, label: 'Главная', url: () => props.indexUrl },
  { id: 'calendar' as const, label: 'Календарь', url: () => props.calendarUrl },
  { id: 'my-day' as const, label: 'Мой день', url: () => props.myDayUrl },
  { id: 'week' as const, label: 'Неделя', url: () => props.weekUrl },
  { id: 'habits' as const, label: 'Привычки', url: () => props.habitsUrl },
  { id: 'notebook' as const, label: 'Блокнот', url: () => props.notebookUrl }
]
</script>

<template>
  <nav class="section-nav" aria-label="Разделы приложения">
    <ul class="section-nav-list">
      <li v-for="section in sections" :key="section.id" class="section-nav-item">
        <a
          :href="section.url()"
          class="section-nav-link"
          :class="{ 'section-nav-link--active': props.currentSection === section.id }"
        >
          {{ section.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.section-nav {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.section-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  row-gap: 0.5rem;
}

.section-nav-item {
  margin: 0;
}

.section-nav-link {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  letter-spacing: 0.03em;
  border-radius: 2px;
  transition: color 0.2s ease, background 0.2s ease;
}

.section-nav-link:hover {
  color: var(--color-text);
  background: var(--color-accent-light);
}

.section-nav-link--active {
  color: var(--color-accent);
  background: var(--color-accent-light);
  font-weight: 500;
}

.section-nav-link--active:hover {
  color: var(--color-accent-hover);
  background: var(--color-accent-medium);
}

@media (max-width: 767px) {
  .section-nav-list {
    flex-direction: column;
    gap: 0;
  }

  .section-nav-link {
    display: block;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .section-nav-link:last-of-type {
    border-bottom: none;
  }
}

@media (min-width: 1200px) {
  .section-nav-link {
    padding: 0.625rem 1rem;
    font-size: 0.9375rem;
  }
}
</style>
