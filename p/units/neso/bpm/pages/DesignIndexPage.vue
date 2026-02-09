<script setup lang="ts">
import { computed, ref } from 'vue'
import { DcThemeGlobalStyles } from '../components'

interface ScenarioLink {
  slug: string
  title: string
  description: string
  objective: string
  tags: string[]
  theme: 'dark' | 'light'
  presetId: string
  layout: string
  url: string
}

const props = defineProps<{
  homeUrl: string
  loginUrl: string
  adminUrl: string
  testsUrl: string
  scenarios: ScenarioLink[]
}>()

const query = ref('')
const themeFilter = ref<'all' | 'dark' | 'light'>('all')

const visibleScenarios = computed(() => {
  const q = query.value.trim().toLowerCase()

  return props.scenarios.filter((scenario) => {
    if (themeFilter.value !== 'all' && scenario.theme !== themeFilter.value) return false
    if (!q) return true

    return (
      scenario.slug.toLowerCase().includes(q) ||
      scenario.title.toLowerCase().includes(q) ||
      scenario.description.toLowerCase().includes(q) ||
      scenario.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  })
})
</script>

<template>
  <DcThemeGlobalStyles theme="light" theme-preset-id="sunrise-leaf" />

  <div class="bpm-design-index">
    <header class="bpm-design-index__header">
      <div>
        <p class="bpm-design-index__kicker">Design Catalog</p>
        <h1>Design scenarios for BPM</h1>
        <p>
          Каталог полностью изолирован от API-логики: только демонстрация UI-компоновок
          на reusable-компонентах из `design_2`.
        </p>
      </div>

      <nav>
        <a :href="homeUrl">Главная</a>
        <a :href="adminUrl">Админка</a>
        <a :href="testsUrl">Тесты</a>
        <a :href="loginUrl">Вход</a>
      </nav>
    </header>

    <section class="bpm-design-index__controls">
      <input v-model="query" type="text" placeholder="Поиск сценария" />
      <button type="button" :class="{ active: themeFilter === 'all' }" @click="themeFilter = 'all'">All</button>
      <button type="button" :class="{ active: themeFilter === 'dark' }" @click="themeFilter = 'dark'">Dark</button>
      <button type="button" :class="{ active: themeFilter === 'light' }" @click="themeFilter = 'light'">Light</button>
      <span class="bpm-design-index__counter">{{ visibleScenarios.length }} / {{ scenarios.length }}</span>
    </section>

    <section class="bpm-design-index__grid">
      <a
        v-for="scenario in visibleScenarios"
        :key="scenario.slug"
        :href="scenario.url"
        class="bpm-design-index__card"
        :class="`layout-${scenario.layout}`"
      >
        <p class="mono">{{ scenario.slug }}</p>
        <h2>{{ scenario.title }}</h2>
        <p class="desc">{{ scenario.description }}</p>
        <p class="objective"><strong>Objective:</strong> {{ scenario.objective }}</p>
        <div class="meta">
          <span>{{ scenario.theme }}</span>
          <span>{{ scenario.presetId }}</span>
          <span>{{ scenario.layout }}</span>
        </div>
        <div class="tags">
          <span v-for="tag in scenario.tags" :key="tag">{{ tag }}</span>
        </div>
      </a>
    </section>
  </div>
</template>

<style scoped>
.bpm-design-index {
  max-width: 1380px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.bpm-design-index__header {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-1) 84%, transparent);
}

.bpm-design-index__kicker {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.bpm-design-index__header h1 {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.3vw, 2rem);
}

.bpm-design-index__header p {
  margin: 8px 0 0;
  max-width: 780px;
  color: var(--text-secondary);
  font-size: 0.83rem;
}

.bpm-design-index__header nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.bpm-design-index__header nav a {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.73rem;
}

.bpm-design-index__header nav a:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.bpm-design-index__controls {
  display: grid;
  grid-template-columns: minmax(220px, 380px) auto auto auto 1fr;
  align-items: center;
  gap: 8px;
}

.bpm-design-index__controls input {
  height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 82%, transparent);
  color: var(--text-primary);
  padding: 0 10px;
}

.bpm-design-index__controls button {
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 82%, transparent);
  color: var(--text-secondary);
  font-size: 0.73rem;
}

.bpm-design-index__controls button.active {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: color-mix(in srgb, var(--accent-soft) 68%, transparent);
}

.bpm-design-index__counter {
  justify-self: end;
  color: var(--text-tertiary);
  font-size: 0.72rem;
}

.bpm-design-index__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.bpm-design-index__card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  padding: 10px;
  text-decoration: none;
  color: inherit;
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-2) 82%, transparent);
}

.bpm-design-index__card h2 {
  margin: 5px 0 0;
  font-size: 0.9rem;
}

.bpm-design-index__card p {
  margin: 0;
}

.bpm-design-index__card .desc {
  margin-top: 7px;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.bpm-design-index__card .objective {
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.bpm-design-index__card .meta {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bpm-design-index__card .meta span,
.bpm-design-index__card .tags span {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  font-size: 0.64rem;
}

.bpm-design-index__card .tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bpm-design-index__card.layout-war-room {
  border-color: color-mix(in srgb, var(--status-danger) 44%, var(--border-soft));
}

.bpm-design-index__card.layout-approval-lab {
  border-color: color-mix(in srgb, var(--status-info) 44%, var(--border-soft));
}

.bpm-design-index__card.layout-operations-hub {
  border-color: color-mix(in srgb, var(--status-success) 44%, var(--border-soft));
}

.bpm-design-index__card.layout-risk-console {
  border-color: color-mix(in srgb, var(--status-warning) 44%, var(--border-soft));
}

.bpm-design-index__card.layout-delivery-studio {
  border-color: color-mix(in srgb, var(--accent) 44%, var(--border-soft));
}

.bpm-design-index__card.layout-executive-deck {
  border-color: color-mix(in srgb, var(--status-info) 32%, var(--status-warning));
}

.mono {
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

@media (max-width: 1140px) {
  .bpm-design-index__header,
  .bpm-design-index__controls,
  .bpm-design-index__grid {
    grid-template-columns: 1fr;
  }

  .bpm-design-index__counter {
    justify-self: start;
  }
}
</style>
