<script setup lang="ts">
/** Карточка секции админки: заголовок + контент. Поддерживает тёмную/светлую тему. */
defineProps<{
  theme?: 'dark' | 'light'
  /** Подзаголовок карточки (например «Название проекта») */
  label: string
  /** На всю ширину грида */
  wide?: boolean
  /** Расположение контента: column (по умолчанию) или wrap (кнопки/теги в ряд) */
  contentLayout?: 'column' | 'wrap'
}>()
</script>

<template>
  <div
    class="dc-section-card"
    :class="[
      `theme-${theme ?? 'dark'}`,
      { 'dc-section-card--wide': wide }
    ]"
  >
    <h4 class="dc-section-card__label">{{ label }}</h4>
    <div
      class="dc-section-card__content"
      :class="{ 'dc-section-card__content--wrap': contentLayout === 'wrap' }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dc-section-card {
  --radius: 16px;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.12);
  --surface: #11191b;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border);
}
.dc-section-card.theme-light {
  --text: #1f2f1d;
  --text2: #34432f;
  --border: rgba(79, 111, 47, 0.18);
  --surface: #f9f5ea;
  background: var(--surface);
}
.dc-section-card--wide {
  grid-column: 1 / -1;
}
.dc-section-card__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2);
  margin: 0 0 12px 0;
}
.dc-section-card__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dc-section-card__content.dc-section-card__content--wrap {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}
</style>
