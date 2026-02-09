<script setup lang="ts">
export interface TableColumn {
  key: string
  header: string
  badge?: boolean
  mutedWhen?: (value: unknown) => boolean
}

defineProps<{
  theme?: 'dark' | 'light'
  title?: string
  columns: TableColumn[]
  rows: Record<string, unknown>[]
}>()
</script>

<template>
  <section class="dc-page-block" :class="`theme-${theme ?? 'dark'}`">
    <h3 v-if="title" class="dc-block-title">{{ title }}</h3>
    <div class="dc-page-card">
      <table class="dc-page-table">
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
  </section>
</template>

<style scoped>
.dc-page-block {
  --radius-lg: 16px;
  --accent: #afc45f;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  --glass-strong: rgba(10, 18, 20, 0.8);
  --glass-soft: rgba(10, 18, 20, 0.8);
  --glow-soft: rgba(175, 196, 95, 0.22);
  margin-bottom: 32px;
}
.dc-page-block.theme-light {
  --accent: #4f6f2f;
  --text2: #2f3f2c;
  --text3: #4f5e49;
  --border: rgba(79, 111, 47, 0.18);
  --border-strong: rgba(79, 111, 47, 0.28);
  --glass-strong: rgba(249, 245, 234, 0.84);
  --glass-soft: rgba(232, 226, 206, 0.66);
  --glow-soft: rgba(79, 111, 47, 0.2);
}
.dc-block-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin: 0 0 16px 0;
}
.dc-page-card {
  background: var(--glass-strong);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.26);
}
.dc-page-block.theme-light .dc-page-card {
  box-shadow: 0 10px 28px rgba(79, 111, 47, 0.14);
}
.dc-page-table { width: 100%; border-collapse: collapse; }
.dc-page-table th, .dc-page-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
.dc-page-table th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
.dc-badge-status {
  padding: 4px 10px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.28) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.05) 100%
    ),
    var(--glow-soft);
  color: var(--accent);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.28);
  border-left-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
    2px 4px 8px rgba(0, 0, 0, 0.18),
    1px 6px 12px rgba(0, 0, 0, 0.1);
}
.dc-page-block.theme-light .dc-badge-status {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.52) 0%,
      transparent 40%,
      rgba(79, 111, 47, 0.08) 100%
    ),
    var(--glow-soft);
  color: #4a6540;
  border: 1px solid rgba(79, 111, 47, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.48),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(79, 111, 47, 0.06),
    1px 2px 4px rgba(79, 111, 47, 0.06);
}
.dc-badge-status.muted { background: rgba(255,255,255,0.08); color: var(--text2); border: none; box-shadow: none; }
.dc-page-block.theme-light .dc-badge-status.muted { background: rgba(79, 111, 47, 0.1); color: var(--text3); }
</style>
