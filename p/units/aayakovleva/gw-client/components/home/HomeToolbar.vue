<template>
  <nav class="panel-toolbar" aria-label="Разделы и поиск">
    <div class="toolbar-row toolbar-row--tabs">
      <div class="panel-tabs" role="tablist">
        <template v-for="(group, gi) in groupedTabs" :key="group.id">
          <span v-if="gi > 0" class="tab-group-sep" aria-hidden="true"></span>
          <div class="tab-group" :data-group="group.id">
            <button
              v-for="t in group.tabs"
              :key="t.id"
              :class="['tab', { active: activeTab === t.id }]"
              :aria-selected="activeTab === t.id"
              role="tab"
              type="button"
              @click="$emit('set-tab', t.id)"
            >
              <i class="fas" :class="t.icon"></i>
              <span>{{ t.label }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
    <div v-if="showJournalTools" class="toolbar-row toolbar-row--tools">
      <div class="date-filter" role="group" aria-label="Фильтр по дате и времени">
        <i class="fas fa-calendar-day date-filter-icon" title="Фильтр по дате/времени"></i>
        <div class="date-filter-field">
          <span class="date-filter-cap">с</span>
          <input
            type="date"
            class="date-filter-input"
            :value="fromDate"
            :max="toDate || undefined"
            @input="$emit('update:fromDate', $event.target.value)"
            @change="$emit('filter-change')"
            aria-label="Дата начала"
          />
          <input
            type="time"
            class="date-filter-input date-filter-time"
            :value="fromTime"
            @input="$emit('update:fromTime', $event.target.value)"
            @change="$emit('filter-change')"
            title="Пусто = 00:00"
            aria-label="Время начала (пусто = 00:00)"
          />
        </div>
        <span class="date-filter-sep">—</span>
        <div class="date-filter-field">
          <span class="date-filter-cap">по</span>
          <input
            type="date"
            class="date-filter-input"
            :value="toDate"
            :min="fromDate || undefined"
            @input="$emit('update:toDate', $event.target.value)"
            @change="$emit('filter-change')"
            aria-label="Дата окончания"
          />
          <input
            type="time"
            class="date-filter-input date-filter-time"
            :value="toTime"
            @input="$emit('update:toTime', $event.target.value)"
            @change="$emit('filter-change')"
            title="Пусто = 00:00"
            aria-label="Время окончания (пусто = 00:00)"
          />
        </div>
        <button
          v-if="hasActiveFilter"
          type="button"
          class="btn-mini date-filter-reset"
          :disabled="dateFilterSaving"
          @click="$emit('reset-filter')"
          title="Сбросить фильтр"
        >
          <i class="fas fa-rotate-left"></i> Сброс
        </button>
        <span v-if="dateFilterError" class="date-filter-error" role="alert">{{
          dateFilterError
        }}</span>
      </div>
      <label
        v-show="!hasActiveFilter"
        class="live-toggle"
        :class="{ on: liveMode }"
        :title="liveMode ? 'Авто-обновление включено' : 'Включить авто-обновление'"
      >
        <input
          type="checkbox"
          :checked="liveMode"
          @change="$emit('update:liveMode', $event.target.checked)"
        />
        <span class="live-dot"></span>
        <span class="live-label">LIVE</span>
      </label>
      <form class="quick-search" @submit.prevent="$emit('search')" role="search">
        <i class="fas fa-magnifying-glass quick-search-icon"></i>
        <input
          type="text"
          placeholder="Поиск по requestId…"
          class="quick-search-input"
          aria-label="Поиск по requestId"
          :value="searchValue"
          @input="$emit('update:searchValue', $event.target.value)"
        />
        <button
          v-if="searchValue"
          type="button"
          class="quick-search-clear"
          @click="$emit('clear-search')"
          title="Очистить"
        >
          <i class="fas fa-xmark"></i>
        </button>
      </form>
    </div>
  </nav>
</template>

<script>
// Sub-toolbar домашней панели: табы (сгруппированы по семантике) +
// контекстный ряд инструментов (фильтр по дате/Live/поиск), который
// показывается только когда активна журнальная вкладка (overview / requests /
// webhooks) — на «Создать запрос», «Формат запросов», «Настройки», «Доступ»
// фильтровать нечего, и ряд инструментов скрыт.
//
// Все значения приходят пропсами, изменения — через update:* и события
// (set-tab, filter-change, reset-filter, search, clear-search).
// Состояние/логика — в orchestrator'е HomePage. CSS глобальный (sbpHomeCss*).
import { sbpTabHasJournalTools } from '../../shared/sbpHomeFormat'

const GROUP_ORDER = ['journal', 'actions', 'management']

export default {
  name: 'HomeToolbar',
  props: {
    visibleTabs: { type: Array, required: true },
    activeTab: { type: String, required: true },
    fromDate: { type: String, default: '' },
    fromTime: { type: String, default: '' },
    toDate: { type: String, default: '' },
    toTime: { type: String, default: '' },
    hasActiveFilter: { type: Boolean, default: false },
    dateFilterSaving: { type: Boolean, default: false },
    dateFilterError: { type: String, default: '' },
    liveMode: { type: Boolean, default: false },
    searchValue: { type: String, default: '' }
  },
  emits: [
    'set-tab',
    'update:fromDate',
    'update:fromTime',
    'update:toDate',
    'update:toTime',
    'filter-change',
    'reset-filter',
    'update:liveMode',
    'update:searchValue',
    'search',
    'clear-search'
  ],
  computed: {
    groupedTabs() {
      const map = new Map()
      for (const t of this.visibleTabs) {
        const key = t.group || 'actions'
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(t)
      }
      const groups = []
      for (const id of GROUP_ORDER) {
        const tabs = map.get(id)
        if (tabs && tabs.length > 0) groups.push({ id, tabs })
      }
      for (const [id, tabs] of map.entries()) {
        if (!GROUP_ORDER.includes(id)) groups.push({ id, tabs })
      }
      return groups
    },
    showJournalTools() {
      return sbpTabHasJournalTools(this.activeTab)
    }
  }
}
</script>
