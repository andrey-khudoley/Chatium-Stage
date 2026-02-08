<script setup lang="ts">
import { computed, ref } from 'vue'

export interface DataGridColumn {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  format?: 'text' | 'number' | 'currency' | 'percent' | 'status'
}

export interface DataGridRow {
  id: string
  [key: string]: unknown
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  columns: DataGridColumn[]
  rows: DataGridRow[]
}>()

const numberFormatter = new Intl.NumberFormat('ru-RU')
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

function getCellValue(row: DataGridRow, key: string): unknown {
  return row[key]
}

function toggleSort(column: DataGridColumn): void {
  if (!column.sortable) return

  if (sortKey.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = column.key
  sortDirection.value = 'asc'
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows

  const key = sortKey.value
  const direction = sortDirection.value === 'asc' ? 1 : -1

  return [...props.rows].sort((a, b) => {
    const av = getCellValue(a, key)
    const bv = getCellValue(b, key)

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * direction
    }

    return String(av ?? '').localeCompare(String(bv ?? ''), 'ru') * direction
  })
})

function formatCell(value: unknown, format: DataGridColumn['format']): string {
  if (value == null) return ''

  if (format === 'number') {
    const num = Number(value)
    return Number.isFinite(num) ? numberFormatter.format(num) : String(value)
  }

  if (format === 'currency') {
    const num = Number(value)
    return Number.isFinite(num) ? currencyFormatter.format(num) : String(value)
  }

  if (format === 'percent') {
    const num = Number(value)
    return Number.isFinite(num) ? `${Math.round(num)}%` : String(value)
  }

  return String(value)
}

function getStatusClass(value: unknown): string {
  const normalized = String(value ?? '').toLowerCase()

  if (normalized.includes('нов')) return 'status-new'
  if (normalized.includes('работ') || normalized.includes('progress')) return 'status-progress'
  if (normalized.includes('закры') || normalized.includes('done')) return 'status-done'
  if (normalized.includes('risk') || normalized.includes('проср')) return 'status-risk'

  return 'status-default'
}
</script>

<template>
  <section class="dc-data-grid" :class="`theme-${theme ?? 'dark'}`">
    <div class="dc-data-grid-wrap">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[`align-${column.align ?? 'left'}`]"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="dc-sort-btn"
                @click="toggleSort(column)"
              >
                <span>{{ column.header }}</span>
                <i
                  class="fas"
                  :class="{
                    'fa-sort': sortKey !== column.key,
                    'fa-sort-up': sortKey === column.key && sortDirection === 'asc',
                    'fa-sort-down': sortKey === column.key && sortDirection === 'desc'
                  }"
                  aria-hidden="true"
                ></i>
              </button>
              <span v-else>{{ column.header }}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in sortedRows" :key="row.id">
            <td
              v-for="column in columns"
              :key="`${row.id}-${column.key}`"
              :class="[`align-${column.align ?? 'left'}`]"
            >
              <span
                v-if="column.format === 'status'"
                class="dc-status-pill"
                :class="getStatusClass(getCellValue(row, column.key))"
              >
                {{ formatCell(getCellValue(row, column.key), column.format) }}
              </span>
              <template v-else>
                {{ formatCell(getCellValue(row, column.key), column.format) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.dc-data-grid {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.2);
  --surface: rgba(10, 18, 20, 0.72);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  min-width: 0;
}

.dc-data-grid.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
  --surface: rgba(250, 247, 238, 0.88);
}

.dc-data-grid-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.dc-data-grid table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  background: var(--surface);
}

.dc-data-grid th,
.dc-data-grid td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text2);
  font-size: 0.84rem;
}

.dc-data-grid th {
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
}

.dc-data-grid tbody tr:hover {
  background: rgba(175, 196, 95, 0.08);
}

.dc-data-grid.theme-light tbody tr:hover {
  background: rgba(79, 111, 47, 0.08);
}

.dc-sort-btn {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;
}

.dc-sort-btn i {
  opacity: 0.7;
}

.align-left {
  text-align: left;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

.dc-status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.74rem;
  font-weight: 600;
}

.dc-status-pill.status-new {
  background: rgba(133, 168, 255, 0.22);
  color: #9abaff;
}

.dc-status-pill.status-progress {
  background: rgba(175, 196, 95, 0.22);
  color: #afc45f;
}

.dc-status-pill.status-done {
  background: rgba(119, 215, 191, 0.22);
  color: #77d7bf;
}

.dc-status-pill.status-risk {
  background: rgba(255, 127, 127, 0.22);
  color: #ff9d9d;
}

.dc-status-pill.status-default {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text2);
}

@media (max-width: 680px) {
  .dc-data-grid table {
    min-width: 500px;
  }

  .dc-data-grid th,
  .dc-data-grid td {
    padding: 10px 10px;
    font-size: 0.78rem;
  }

  .dc-data-grid th {
    font-size: 0.68rem;
  }
}
</style>
