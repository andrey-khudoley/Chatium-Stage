<script setup lang="ts">
import { ref } from 'vue'
import {
  DcButton,
  DcCard,
  DcCoverageTags,
  DcFormField,
  DcList,
  DcModal,
  DcNotification,
  DcPalette,
  DcSearchFilter,
  DcState,
  DcTable,
  type TableColumn,
  type ListItem,
  type FilterTab,
  type FilterTag,
  type CoverageTag,
  type PaletteItem
} from '../components'

defineProps<{
  indexUrl: string
  pageUrl: string
}>()

const modalOpen = ref(false)
const theme = 'light' as const
const tableRows = [
  { client: 'Мария Петрова', channel: 'WhatsApp', status: 'В работе', sla: '01:24' },
  { client: 'Иван Смирнов', channel: 'Telegram', status: 'Новый', sla: '00:41' },
  { client: 'Анна Орлова', channel: 'Email', status: 'Закрыт', sla: '03:12' }
]
const tableColumns: TableColumn[] = [
  { key: 'client', header: 'КЛИЕНТ' },
  { key: 'channel', header: 'КАНАЛ' },
  { key: 'status', header: 'СТАТУС', badge: true, mutedWhen: (v) => v === 'Закрыт' },
  { key: 'sla', header: 'SLA' }
]
const listItems: ListItem[] = [
  { tag: 'HOT', tagHot: true, title: 'Клиент 001 · #inq-2045', desc: 'Нужно уточнить сроки запуска первой рассылки', time: '10:02' },
  { tag: 'WAIT', title: 'Клиент 002 · #inq-2037', desc: 'Вернусь с решением сегодня вечером', time: '09:40' }
]
const filterTabs: FilterTab[] = [
  { id: 'all', label: 'Все', active: true },
  { id: 'unread', label: 'Непрочитанные' },
  { id: 'open', label: 'Открытые' },
  { id: 'mine', label: 'Мои' }
]
const filterTags: FilterTag[] = [
  { id: 'work', label: 'В работе', active: true, dot: true },
  { id: 'priority', label: 'Приоритет' },
  { id: 'archive', label: 'Архив' }
]
const coverageTags: CoverageTag[] = [
  { icon: 'fa-bars', label: 'Навигация и shell' },
  { icon: 'fa-filter', label: 'Фильтры и поиск' },
  { icon: 'fa-list', label: 'Списки и карточки' },
  { icon: 'fa-table', label: 'Таблицы и статусы' },
  { icon: 'fa-check', label: 'Формы и валидация' },
  { icon: 'fa-bell', label: 'Уведомления' },
  { icon: 'fa-window-maximize', label: 'Модальные сценарии' },
  { icon: 'fa-spinner', label: 'Loading / Empty / Error' }
]
const paletteItems: PaletteItem[] = [
  { name: 'BACKGROUND', hex: '#f8f6eb' },
  { name: 'SURFACE', hex: '#ffffff', style: 'background:#ffffff;border:1px solid #e8e6df' },
  { name: 'ACCENT', hex: '#4f6f2f' },
  { name: 'ACCENT WARM', hex: '#7a8f3f' },
  { name: 'TEXT', hex: '#243523' },
  { name: 'SUNRAY', hex: '#fff3ca' }
]
</script>

<template>
  <div class="app">
    <header class="components-header">
      <nav class="components-nav">
        <a :href="indexUrl" class="nav-link"><i class="fas fa-arrow-left"></i> К выбору тем</a>
        <a :href="pageUrl" class="nav-link"><i class="fas fa-th-large"></i> Пример страницы</a>
      </nav>
      <h1 class="components-title">Библиотека компонентов · Солнечная листва</h1>
      <p class="components-desc">Каталог UI-компонентов в светлой теме</p>
    </header>

    <div class="content">
      <section class="showcase">
        <h2 class="section-title">КНОПКИ И ИНТЕРАКЦИИ</h2>
        <DcCard :theme="theme">
          <div class="btn-row">
            <DcButton :theme="theme" variant="primary" icon="fa-paper-plane">Action</DcButton>
            <DcButton :theme="theme" variant="secondary">Secondary</DcButton>
            <DcButton :theme="theme" variant="ghost">Ghost</DcButton>
            <DcButton :theme="theme" variant="outline">Outline</DcButton>
            <DcButton :theme="theme" variant="primary" disabled>Disabled</DcButton>
            <DcButton :theme="theme" variant="primary" loading>Loading</DcButton>
          </div>
        </DcCard>
      </section>

      <section class="showcase">
        <h2 class="section-title">ФОРМА И ВАЛИДАЦИЯ</h2>
        <DcCard :theme="theme">
          <div class="form-row">
            <DcFormField :theme="theme" label="ИМЯ КЛИЕНТА" placeholder="Имя клиента" icon="fa-user" />
            <DcFormField :theme="theme" label="EMAIL" placeholder="email@example.com" icon="fa-copy" icon-position="right" has-error error="Нужен валидный адрес для уведомлений SLA" type="email" />
            <DcFormField :theme="theme" label="КОММЕНТАРИЙ" placeholder="Комментарий оператора" type="textarea" rows="3" hint="Поддерживаются markdown-ссылки и теги." />
          </div>
        </DcCard>
      </section>

      <section class="showcase">
        <h2 class="section-title">ФИЛЬТРАЦИЯ И ПОИСК</h2>
        <DcCard :theme="theme">
          <DcSearchFilter
            :theme="theme"
            search-placeholder="Поиск по клиенту, тегу, ID обращения"
            :tabs="filterTabs"
            :tags="filterTags"
          />
        </DcCard>
      </section>

      <section class="showcase">
        <h2 class="section-title">УВЕДОМЛЕНИЯ</h2>
        <DcCard :theme="theme">
          <div class="notify-list">
            <DcNotification :theme="theme" type="success" title="Настройки сохранены" sub="только что" action-label="Открыть" />
            <DcNotification :theme="theme" type="warning" title="SLA для Telegram не задан" sub="нужна настройка" action-label="Исправить" />
            <DcNotification :theme="theme" type="info" title="Доступна версия UI Kit v3.0" sub="обновление дизайна" action-label="Обновить" />
          </div>
        </DcCard>
      </section>

      <section class="showcase">
        <h2 class="section-title">СПИСОК И ТАБЛИЦА</h2>
        <DcCard :theme="theme" :two-col="true">
          <DcList :theme="theme" :items="listItems" />
          <DcTable :theme="theme" :columns="tableColumns" :rows="tableRows" />
        </DcCard>
      </section>

      <section class="showcase">
        <h2 class="section-title">СОСТОЯНИЯ И МОДАЛЬНЫЕ СЦЕНАРИИ</h2>
        <DcCard :theme="theme">
          <div class="states-grid">
            <DcState :theme="theme" type="loading" message="Загружаем данные таблицы..." />
            <DcState :theme="theme" type="skeleton" />
            <DcState :theme="theme" type="error" message="Ошибка сети: не удалось обновить логи" action-label="Повторить" />
            <DcState :theme="theme" type="empty" message="Нет обращений по текущему фильтру." action-label="Сбросить фильтр" />
          </div>
        </DcCard>
      </section>

      <DcModal :theme="theme" title="Создать новое обращение" :open="modalOpen" @close="modalOpen = false">
        <div class="dc-mf-row"><i class="fas fa-user"></i><input placeholder="Имя клиента" /></div>
        <div class="dc-mf-row"><i class="fas fa-phone"></i><input placeholder="Телефон" /></div>
        <div class="dc-mf-row">
          <i class="fas fa-telegram"></i>
          <select><option>Telegram</option></select>
          <i class="fas fa-chevron-down dc-mf-chevron"></i>
        </div>
        <template #footer>
          <DcButton :theme="theme" variant="ghost" @click="modalOpen = false">Отмена</DcButton>
          <DcButton :theme="theme" variant="primary">Создать</DcButton>
        </template>
      </DcModal>

      <section class="showcase">
        <DcButton :theme="theme" variant="primary" icon="fa-plus" @click="modalOpen = true">
          Открыть модальное окно
        </DcButton>
      </section>

      <section class="showcase">
        <h2 class="section-title">ПОКРЫТИЕ ДИЗАЙН-СИСТЕМЫ</h2>
        <DcCoverageTags :theme="theme" :tags="coverageTags" />
      </section>

      <section class="showcase">
        <h2 class="section-title">ПАЛИТРА ТЕМЫ</h2>
        <DcPalette :theme="theme" :items="paletteItems" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.app {
  --bg: #f8f6eb;
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.12);
  --border-strong: rgba(79, 111, 47, 0.22);
  --radius: 12px;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 24px 32px 48px;
}

.components-header { margin-bottom: 40px; }
.components-nav { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.7);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(79, 111, 47, 0.08);
}
.nav-link:hover {
  background: rgba(79, 111, 47, 0.12);
  border-color: var(--border-strong);
  color: var(--accent);
}
.components-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.components-desc { margin: 0; font-size: 0.95rem; color: var(--text2); }

.content { max-width: 1200px; }
.showcase { margin-bottom: 40px; }
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin: 0 0 16px 0;
}

.btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
.form-row { display: flex; flex-direction: column; gap: 20px; }
.notify-list { display: flex; flex-direction: column; gap: 12px; }
.states-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

@media (max-width: 1024px) {
  .states-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .app { padding: 16px 20px 32px; }
  .states-grid { grid-template-columns: 1fr; }
}
</style>
