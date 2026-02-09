<template>
  <section class="crm-surface crm-card crm-smart-table">
    <header class="crm-card-title">
      <div class="crm-stack">
        <h2>{{ title }}</h2>
        <p class="crm-card-subtitle">{{ subtitle }}</p>
      </div>

      <div class="crm-row">
        <label class="crm-inline crm-smart-table-density">
          <span class="crm-muted">{{ labels.tableMode }}</span>
          <select class="crm-select" :value="density" @change="onDensityChange">
            <option value="compact">{{ labels.compact }}</option>
            <option value="comfortable">{{ labels.comfortable }}</option>
          </select>
        </label>

        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="showColumnsMenu = !showColumnsMenu">
          <i class="fas fa-columns"></i>
          {{ labels.columns }}
        </button>

        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="saveView">
          <i class="fas fa-bookmark"></i>
          {{ labels.saveView }}
        </button>

        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="cardMode = !cardMode">
          <i class="fas" :class="cardMode ? 'fa-table' : 'fa-th-large'"></i>
          {{ labels.cardMode }}
        </button>
      </div>
    </header>

    <div class="crm-row">
      <label class="crm-inline crm-smart-table-saved">
        <span class="crm-muted">{{ labels.savedView }}</span>
        <select class="crm-select" :value="selectedViewId" @change="onSavedViewChange">
          <option value="">{{ labels.defaultView }}</option>
          <option v-for="view in savedViews" :key="view.id" :value="view.id">{{ view.name }}</option>
        </select>
      </label>

      <button
        v-if="selectedViewId"
        type="button"
        class="crm-btn crm-btn-danger crm-btn-sm"
        @click="deleteView(selectedViewId)"
      >
        <i class="fas fa-trash-alt"></i>
        {{ labels.deleteView }}
      </button>
    </div>

    <div v-if="showColumnsMenu" class="crm-smart-table-columns crm-surface-raised crm-card">
      <label v-for="column in columns" :key="column.key" class="crm-inline crm-smart-table-column-item">
        <input
          type="checkbox"
          :checked="visibleColumnSet.has(column.key)"
          @change="toggleColumn(column.key)"
        />
        <span>{{ column.label }}</span>
      </label>
    </div>

    <div v-if="cardMode" class="crm-smart-table-cards">
      <article v-for="row in rows" :key="getRowKey(row)" class="crm-smart-table-card crm-surface-raised crm-card">
        <div
          v-for="column in visibleColumns"
          :key="column.key + '-' + getRowKey(row)"
          class="crm-smart-table-card-row"
        >
          <span class="crm-muted">{{ column.label }}</span>
          <strong>{{ formatCell(row, column) }}</strong>
        </div>
      </article>
    </div>

    <div v-else class="crm-smart-table-wrap crm-scroll">
      <table class="crm-smart-table-grid" :class="densityClass">
        <thead>
          <tr>
            <th v-for="column in visibleColumns" :key="column.key" :class="column.align ? 'align-' + column.align : ''">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="getRowKey(row)">
            <td
              v-for="column in visibleColumns"
              :key="column.key + '-' + getRowKey(row)"
              :class="column.align ? 'align-' + column.align : ''"
            >
              {{ formatCell(row, column) }}
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="Math.max(visibleColumns.length, 1)" class="crm-smart-table-empty">{{ labels.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface CrmTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row: Record<string, unknown>) => string
}

interface SavedView {
  id: string
  name: string
  columns: string[]
  density: 'compact' | 'comfortable'
}

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  rowKey?: string
  rows: Record<string, unknown>[]
  columns: CrmTableColumn[]
  storageKey?: string
  labels?: {
    tableMode: string
    compact: string
    comfortable: string
    columns: string
    saveView: string
    savedView: string
    defaultView: string
    deleteView: string
    cardMode: string
    empty: string
  }
}>(), {
  title: 'CRM Table',
  subtitle: '',
  rowKey: 'id',
  storageKey: 'crm-smart-table',
  labels: () => ({
    tableMode: 'Table mode',
    compact: 'Compact',
    comfortable: 'Comfortable',
    columns: 'Columns',
    saveView: 'Save view',
    savedView: 'Saved view',
    defaultView: 'Default',
    deleteView: 'Delete',
    cardMode: 'Card mode',
    empty: 'No data'
  })
})

const density = ref<'compact' | 'comfortable'>('comfortable')
const cardMode = ref(false)
const showColumnsMenu = ref(false)
const selectedViewId = ref('')
const visibleColumnKeys = ref<string[]>(props.columns.map((column) => column.key))
const savedViews = ref<SavedView[]>([])

const storageViewsKey = `${props.storageKey}-views`
const storagePrefsKey = `${props.storageKey}-prefs`

if (typeof window !== 'undefined') {
  try {
    const rawViews = window.localStorage.getItem(storageViewsKey)
    if (rawViews) {
      const parsed = JSON.parse(rawViews) as SavedView[]
      if (Array.isArray(parsed)) {
        savedViews.value = parsed.filter((view) => view && Array.isArray(view.columns))
      }
    }

    const rawPrefs = window.localStorage.getItem(storagePrefsKey)
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs) as { density?: string; cardMode?: boolean; columns?: string[] }
      if (parsed.density === 'compact' || parsed.density === 'comfortable') {
        density.value = parsed.density
      }
      if (typeof parsed.cardMode === 'boolean') {
        cardMode.value = parsed.cardMode
      }
      if (Array.isArray(parsed.columns) && parsed.columns.length) {
        visibleColumnKeys.value = parsed.columns.filter((key) => props.columns.some((column) => column.key === key))
      }
    }
  } catch {
    // Ignore corrupt local state and continue with defaults.
  }
}

const visibleColumnSet = computed(() => new Set(visibleColumnKeys.value))

const visibleColumns = computed(() => {
  const set = visibleColumnSet.value
  return props.columns.filter((column) => set.has(column.key))
})

const densityClass = computed(() => density.value === 'compact' ? 'is-compact' : 'is-comfortable')

function persistState(): void {
  if (typeof window === 'undefined') return

  const payload = {
    density: density.value,
    cardMode: cardMode.value,
    columns: visibleColumnKeys.value
  }

  window.localStorage.setItem(storagePrefsKey, JSON.stringify(payload))
  window.localStorage.setItem(storageViewsKey, JSON.stringify(savedViews.value))
}

function getRowKey(row: Record<string, unknown>): string {
  const keyValue = row[props.rowKey]
  if (typeof keyValue === 'string' || typeof keyValue === 'number') {
    return String(keyValue)
  }

  const fallback = props.rows.indexOf(row)
  return `row-${fallback}`
}

function formatCell(row: Record<string, unknown>, column: CrmTableColumn): string {
  const value = row[column.key]
  if (column.formatter) return column.formatter(value, row)
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function toggleColumn(columnKey: string): void {
  const current = new Set(visibleColumnKeys.value)

  if (current.has(columnKey)) {
    if (current.size === 1) return
    current.delete(columnKey)
  } else {
    current.add(columnKey)
  }

  visibleColumnKeys.value = props.columns
    .map((column) => column.key)
    .filter((key) => current.has(key))

  persistState()
}

function onDensityChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  density.value = value === 'compact' ? 'compact' : 'comfortable'
  persistState()
}

function saveView(): void {
  const view: SavedView = {
    id: `view-${Date.now()}`,
    name: `View ${savedViews.value.length + 1}`,
    columns: [...visibleColumnKeys.value],
    density: density.value
  }
  savedViews.value = [view, ...savedViews.value].slice(0, 12)
  selectedViewId.value = view.id
  persistState()
}

function onSavedViewChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  selectedViewId.value = value

  const view = savedViews.value.find((item) => item.id === value)
  if (!view) {
    persistState()
    return
  }

  density.value = view.density
  visibleColumnKeys.value = props.columns
    .map((column) => column.key)
    .filter((key) => view.columns.includes(key))

  persistState()
}

function deleteView(viewId: string): void {
  savedViews.value = savedViews.value.filter((view) => view.id !== viewId)
  if (selectedViewId.value === viewId) {
    selectedViewId.value = ''
  }
  persistState()
}
</script>

<style scoped>
.crm-smart-table {
  gap: var(--crm-space-3);
}

.crm-smart-table-density {
  min-width: 10rem;
}

.crm-smart-table-saved {
  min-width: 15rem;
}

.crm-smart-table-columns {
  gap: 0.55rem;
}

.crm-smart-table-column-item {
  width: 100%;
  justify-content: flex-start;
}

.crm-smart-table-wrap {
  width: 100%;
  overflow: auto;
}

.crm-smart-table-grid {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--crm-font-tables);
  font-size: calc(0.85rem * var(--crm-table-density-scale));
}

.crm-smart-table-grid th,
.crm-smart-table-grid td {
  border-bottom: 1px solid color-mix(in srgb, var(--crm-borderStrong) 60%, transparent);
  text-align: left;
  vertical-align: top;
}

.crm-smart-table-grid.is-comfortable th,
.crm-smart-table-grid.is-comfortable td {
  padding: 0.75rem;
}

.crm-smart-table-grid.is-compact th,
.crm-smart-table-grid.is-compact td {
  padding: 0.48rem 0.64rem;
}

.crm-smart-table-grid thead th {
  color: var(--crm-textDim);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.crm-smart-table-grid .align-center {
  text-align: center;
}

.crm-smart-table-grid .align-right {
  text-align: right;
}

.crm-smart-table-empty {
  text-align: center;
  color: var(--crm-textDim);
  padding: 1rem;
}

.crm-smart-table-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--crm-space-3);
}

.crm-smart-table-card {
  gap: var(--crm-space-2);
}

.crm-smart-table-card-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.crm-smart-table-card-row strong {
  color: var(--crm-text);
  font-size: 0.9rem;
  word-break: break-word;
}

@media (max-width: 768px) {
  .crm-smart-table-card {
    padding: var(--crm-space-3);
  }

  .crm-smart-table-cards {
    grid-template-columns: 1fr;
  }
}
</style>
