# BPM components reference

This file documents copy-ready components from `components/bpm/`.

## Common dependencies

All BPM components rely on theme CSS variables defined by:

- `shared/themeCatalog.ts`
- `shared/themeStyles.ts`

Shared types:

- `shared/bpmTypes.ts`

## Components

### `DcBpmPanel.vue`
Base panel wrapper with title/hint/link slots.
Use as shell for section content.

### `DcBpmMetricGrid.vue`
KPI cards row.
Input: `metrics: BpmMetric[]`.

### `DcBpmProcessInbox.vue`
Process inbox table with filters and table mode controls.
Inputs: titles, labels, rows, selected id, mode options.
Emits: `selectInstance`, `changeTableMode`.

### `DcBpmInstanceDetail.vue`
Detail panel for selected instance.
Inputs: labels, selected instance, timeline, rule/action strings.

### `DcBpmKanbanBoard.vue`
Kanban stages board.
Input: `columns: BpmKanbanColumn[]`.

### `DcBpmExecutionTimeline.vue`
Linear process timeline.
Input: `events: BpmExecutionEvent[]`.

### `DcBpmBuilderStudio.vue`
Flow/rules/automation section.
Inputs: rules list, automation jobs, labels.

### `DcBpmAnalyticsPanel.vue`
Chart panel + bottleneck matrix.
Inputs: chart modes, active mode, bars, bottleneck rows.
Emits: `changeMode`.

### `DcBpmKnowledgeEditor.vue`
Markdown + WYSIWYG split/editor modes.
Inputs: modes, active mode, markdown value.
Emits: `changeMode`, `updateMarkdown`.

### `DcBpmHeaderControls.vue`
Header controls for language, theme preset and index link.
Emits: `changeLocale`, `changeTheme`.

## Copy checklist

1. Copy target `DcBpm*` component.
2. Copy required type(s) from `shared/bpmTypes.ts`.
3. Ensure CSS tokens exist in host project.
4. If component emits events, wire handler in host page.
5. Validate dark and light preset readability.
