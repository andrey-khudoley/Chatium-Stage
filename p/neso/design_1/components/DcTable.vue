<script setup lang="ts">
export interface TableColumn {
  key: string
  header: string
  badge?: boolean
  mutedWhen?: (value: unknown) => boolean
}

defineProps<{
  theme?: 'dark' | 'light'
  columns: TableColumn[]
  rows: Record<string, unknown>[]
}>()
</script>

<template>
  <div class="dc-table-wrap" :class="`theme-${theme ?? 'dark'}`">
    <table class="dc-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td v-for="col in columns" :key="col.key">
            <span
              v-if="col.badge"
              class="dc-badge-status"
              :class="{ muted: col.mutedWhen?.(row[col.key]) }"
            >
              {{ String(row[col.key] ?? '') }}
            </span>
            <template v-else>{{ row[col.key] }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.dc-table-wrap {
  --accent: #afc45f;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.12);
  --glow-soft: rgba(175, 196, 95, 0.15);
}
.dc-table-wrap.theme-light {
  --accent: #4f6f2f;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.12);
  --glow-soft: rgba(79, 111, 47, 0.15);
}
.dc-table { width: 100%; border-collapse: collapse; }
.dc-table th, .dc-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
.dc-table th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
.dc-badge-status {
  padding: 4px 10px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 12px;
  font-size: 0.8rem;
}
.dc-badge-status.muted { background: rgba(255,255,255,0.08); color: var(--text2); }
.dc-table-wrap.theme-light .dc-badge-status.muted { background: rgba(79, 111, 47, 0.08); }
</style>
