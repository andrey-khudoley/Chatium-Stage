<script setup lang="ts">
import type { BpmInstanceRow } from '../../shared/bpmTypes'
import DcBpmPanel from './DcBpmPanel.vue'

interface TableModeOption {
  id: 'compact' | 'standard' | 'audit'
  label: string
}

const props = defineProps<{
  title: string
  hint: string
  linkLabel?: string
  linkHref?: string
  filters: string[]
  savedViewLabel: string
  savedViews: string[]
  tableModeLabel: string
  tableModes: TableModeOption[]
  activeTableMode: TableModeOption['id']
  columns: {
    instance: string
    process: string
    stage: string
    status: string
    sla: string
    owner: string
  }
  rows: BpmInstanceRow[]
  selectedInstanceId: string
}>()

const emit = defineEmits<{
  selectInstance: [id: string]
  changeTableMode: [mode: 'compact' | 'standard' | 'audit']
}>()

function onModeClick(mode: 'compact' | 'standard' | 'audit') {
  emit('changeTableMode', mode)
}

function onRowClick(id: string) {
  emit('selectInstance', id)
}
</script>

<template>
  <DcBpmPanel :title="title" :hint="hint" :link-label="linkLabel" :link-href="linkHref">
    <div class="dc-bpm-process-inbox__toolbar">
      <button v-for="filter in filters" :key="filter" type="button" class="dc-pill" :class="{ active: filter === filters[0] }">
        {{ filter }}
      </button>
    </div>

    <div class="dc-bpm-process-inbox__toolbar dc-bpm-process-inbox__toolbar--secondary">
      <span class="dc-bpm-process-inbox__toolbar-label">{{ savedViewLabel }}</span>
      <button v-for="view in savedViews" :key="view" type="button" class="dc-pill">{{ view }}</button>

      <span class="dc-bpm-process-inbox__toolbar-label dc-bpm-process-inbox__toolbar-label--spaced">
        {{ tableModeLabel }}
      </span>
      <button
        v-for="mode in tableModes"
        :key="mode.id"
        type="button"
        class="dc-pill"
        :class="{ active: activeTableMode === mode.id }"
        @click="onModeClick(mode.id)"
      >
        {{ mode.label }}
      </button>
    </div>

    <div class="dc-bpm-process-inbox__table-wrap" :class="`table-mode-${activeTableMode}`">
      <table class="dc-bpm-process-inbox__table">
        <thead>
          <tr>
            <th>{{ columns.instance }}</th>
            <th>{{ columns.process }}</th>
            <th>{{ columns.stage }}</th>
            <th>{{ columns.status }}</th>
            <th>{{ columns.sla }}</th>
            <th>{{ columns.owner }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ selected: selectedInstanceId === row.id }"
            @click="onRowClick(row.id)"
          >
            <td><span class="mono">{{ row.id }}</span></td>
            <td>{{ row.process }}</td>
            <td>{{ row.stage }}</td>
            <td>
              <span class="dc-status-chip" :class="`status-${row.risk}`">{{ row.status }}</span>
            </td>
            <td><span class="mono">{{ row.sla }}</span></td>
            <td>{{ row.owner }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </DcBpmPanel>
</template>

<style scoped>
.dc-bpm-process-inbox__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.dc-bpm-process-inbox__toolbar--secondary {
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 76%, transparent);
}

.dc-bpm-process-inbox__toolbar-label {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  padding-right: 4px;
}

.dc-bpm-process-inbox__toolbar-label--spaced {
  margin-left: auto;
}

.dc-pill {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
  color: var(--text-secondary);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
}

.dc-pill.active {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: color-mix(in srgb, var(--accent-soft) 78%, transparent);
  box-shadow: var(--focus-ring);
}

.dc-bpm-process-inbox__table-wrap {
  overflow: auto;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
}

.dc-bpm-process-inbox__table {
  width: 100%;
  border-collapse: collapse;
}

.dc-bpm-process-inbox__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px;
  background: color-mix(in srgb, var(--surface-3) 84%, transparent);
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-soft);
}

.dc-bpm-process-inbox__table tbody td {
  padding: 0 8px;
  height: var(--table-row-height, 34px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-soft) 78%, transparent);
  font-size: 0.74rem;
}

.dc-bpm-process-inbox__table tbody tr {
  cursor: pointer;
}

.dc-bpm-process-inbox__table tbody tr:hover {
  background: color-mix(in srgb, var(--accent-soft) 44%, transparent);
}

.dc-bpm-process-inbox__table tbody tr.selected {
  background: color-mix(in srgb, var(--accent-soft) 76%, transparent);
}

.table-mode-compact {
  --table-row-height: 32px;
}

.table-mode-standard {
  --table-row-height: 38px;
}

.table-mode-audit {
  --table-row-height: 44px;
}

.dc-status-chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  border: 1px solid transparent;
}

.status-warning {
  color: var(--status-warning);
  border-color: color-mix(in srgb, var(--status-warning) 56%, transparent);
  background: color-mix(in srgb, var(--status-warning) 20%, transparent);
}

.status-danger {
  color: var(--status-danger);
  border-color: color-mix(in srgb, var(--status-danger) 56%, transparent);
  background: color-mix(in srgb, var(--status-danger) 20%, transparent);
}

.status-success {
  color: var(--status-success);
  border-color: color-mix(in srgb, var(--status-success) 56%, transparent);
  background: color-mix(in srgb, var(--status-success) 20%, transparent);
}

.status-info {
  color: var(--status-info);
  border-color: color-mix(in srgb, var(--status-info) 56%, transparent);
  background: color-mix(in srgb, var(--status-info) 20%, transparent);
}

.status-neutral {
  color: var(--text-secondary);
  border-color: var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 84%, transparent);
}

.mono {
  font-family: var(--font-mono);
}

@media (max-width: 980px) {
  .dc-bpm-process-inbox__toolbar-label--spaced {
    margin-left: 0;
  }
}
</style>
