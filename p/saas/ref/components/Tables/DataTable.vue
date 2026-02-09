<script setup lang="ts">
export interface DataTableColumn {
  key: string
  title: string
  class?: string
  format?: 'text' | 'datetime' | 'money' | 'number' | 'link'
  hrefKey?: string
}

defineProps<{
  columns: DataTableColumn[]
  rows: Record<string, unknown>[]
  loading?: boolean
  emptyMessage?: string
}>()

function formatDatetime(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatMoney(kopecks: number): string {
  if (kopecks === 0) return '0 ₽'
  return `${(kopecks / 100).toFixed(2)} ₽`
}
</script>

<template>
  <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
    <div v-if="loading" class="p-8 text-center text-[var(--color-text-secondary)]">
      <i class="fas fa-spinner fa-spin text-xl"></i>
    </div>
    <template v-else>
      <div
        v-if="rows.length === 0"
        class="p-8 text-center text-[var(--color-text-secondary)]"
      >
        {{ emptyMessage ?? 'Нет данных' }}
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-left">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[col.class, 'px-4 py-2 font-medium']"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody class="text-[var(--color-text)]">
          <tr
            v-for="(row, i) in rows"
            :key="i"
            class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[col.class, 'px-4 py-2']"
            >
              <template v-if="col.format === 'datetime'">
                {{ row[col.key] ? formatDatetime(row[col.key] as string) : '—' }}
              </template>
              <template v-else-if="col.format === 'money'">
                {{ formatMoney((row[col.key] as number) ?? 0) }}
              </template>
              <template v-else-if="col.format === 'number'">
                {{ (row[col.key] as number) ?? 0 }}
              </template>
              <template v-else-if="col.format === 'link' && col.hrefKey && row[col.hrefKey]">
                <a
                  :href="(row[col.hrefKey] as string)"
                  class="text-[var(--color-accent)] hover:underline"
                >
                  {{ (row[col.key] as string) || 'Перейти' }}
                </a>
              </template>
              <template v-else>
                {{ (row[col.key] as string) ?? '—' }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
