<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  indexUrl: string
  pageUrl: string
}>()

const modalOpen = ref(false)
const tableRows = [
  { client: 'Мария Петрова', channel: 'WhatsApp', status: 'В работе', sla: '01:24' },
  { client: 'Иван Смирнов', channel: 'Telegram', status: 'Новый', sla: '00:41' },
  { client: 'Анна Орлова', channel: 'Email', status: 'Закрыт', sla: '03:12' }
]
</script>

<template>
  <div class="app">
    <header class="components-header">
      <nav class="components-nav">
        <a :href="indexUrl" class="nav-link"><i class="fas fa-arrow-left"></i> К выбору тем</a>
        <a :href="pageUrl" class="nav-link"><i class="fas fa-th-large"></i> Пример страницы</a>
      </nav>
      <h1 class="components-title">Библиотека компонентов · Ночной лес</h1>
      <p class="components-desc">Каталог UI-компонентов в тёмной теме</p>
    </header>

    <div class="content">
      <section class="showcase">
        <h2 class="section-title">КНОПКИ И ИНТЕРАКЦИИ</h2>
        <div class="card showcase-card">
          <div class="btn-row">
            <button class="btn primary"><i class="fas fa-paper-plane"></i> Action</button>
            <button class="btn secondary">Secondary</button>
            <button class="btn ghost">Ghost</button>
            <button class="btn outline">Outline</button>
            <button class="btn" disabled>Disabled</button>
            <button class="btn loading" disabled><i class="fas fa-spinner fa-spin"></i> Loading</button>
          </div>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">ФОРМА И ВАЛИДАЦИЯ</h2>
        <div class="card showcase-card">
          <div class="form-row">
            <label class="field">
              <span class="field-label">ИМЯ КЛИЕНТА</span>
              <div class="input-wrap">
                <i class="fas fa-user"></i>
                <input type="text" placeholder="Имя клиента" />
              </div>
            </label>
            <label class="field error">
              <span class="field-label">EMAIL</span>
              <div class="input-wrap">
                <input type="email" placeholder="email@example.com" />
                <i class="fas fa-copy"></i>
              </div>
              <span class="field-error">Нужен валидный адрес для уведомлений SLA</span>
            </label>
            <label class="field">
              <span class="field-label">КОММЕНТАРИЙ</span>
              <textarea placeholder="Комментарий оператора" rows="3"></textarea>
              <span class="field-hint">Поддерживаются markdown-ссылки и теги.</span>
            </label>
          </div>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">ФИЛЬТРАЦИЯ И ПОИСК</h2>
        <div class="card showcase-card">
          <div class="search-wrap">
            <i class="fas fa-search"></i>
            <input type="search" placeholder="Поиск по клиенту, тегу, ID обращения" />
          </div>
          <div class="filter-tabs">
            <button class="filter-tab active">Все</button>
            <button class="filter-tab">Непрочитанные</button>
            <button class="filter-tab">Открытые</button>
            <button class="filter-tab">Мои</button>
          </div>
          <div class="filter-tags">
            <span class="tag active"><span class="tag-dot"></span> В работе</span>
            <span class="tag">Приоритет</span>
            <span class="tag">Архив</span>
          </div>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">УВЕДОМЛЕНИЯ</h2>
        <div class="card showcase-card">
          <div class="notify-list">
            <div class="notify success">
              <i class="fas fa-check"></i>
              <div>
                <span class="notify-title">Настройки сохранены</span>
                <span class="notify-sub">только что</span>
              </div>
              <button class="btn ghost small">Открыть</button>
            </div>
            <div class="notify warning">
              <i class="fas fa-triangle-exclamation"></i>
              <div>
                <span class="notify-title">SLA для Telegram не задан</span>
                <span class="notify-sub">нужна настройка</span>
              </div>
              <button class="btn ghost small">Исправить</button>
            </div>
            <div class="notify info">
              <i class="fas fa-circle-info"></i>
              <div>
                <span class="notify-title">Доступна версия UI Kit v3.0</span>
                <span class="notify-sub">обновление дизайна</span>
              </div>
              <button class="btn ghost small">Обновить</button>
            </div>
          </div>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">СПИСОК И ТАБЛИЦА</h2>
        <div class="card showcase-card two-col">
          <div class="list-panel">
            <div class="list-item">
              <span class="list-tag hot">HOT</span>
              <div class="list-body">
                <span class="list-title">Клиент 001 · #inq-2045</span>
                <span class="list-desc">Нужно уточнить сроки запуска первой рассылки</span>
              </div>
              <span class="list-time">10:02</span>
            </div>
            <div class="list-item">
              <span class="list-tag">WAIT</span>
              <div class="list-body">
                <span class="list-title">Клиент 002 · #inq-2037</span>
                <span class="list-desc">Вернусь с решением сегодня вечером</span>
              </div>
              <span class="list-time">09:40</span>
            </div>
          </div>
          <div class="table-panel">
            <table>
              <thead>
                <tr><th>КЛИЕНТ</th><th>КАНАЛ</th><th>СТАТУС</th><th>SLA</th></tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in tableRows" :key="i">
                  <td>{{ row.client }}</td>
                  <td>{{ row.channel }}</td>
                  <td><span class="badge-status" :class="row.status === 'Закрыт' ? 'muted' : ''">{{ row.status }}</span></td>
                  <td>{{ row.sla }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">СОСТОЯНИЯ И МОДАЛЬНЫЕ СЦЕНАРИИ</h2>
        <div class="card showcase-card states-grid">
          <div class="state-card">
            <span class="state-label">LOADING</span>
            <div class="state-content loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Загружаем данные таблицы...</span>
            </div>
          </div>
          <div class="state-card">
            <span class="state-label">SKELETON</span>
            <div class="state-content skeleton">
              <div class="sk-line"></div>
              <div class="sk-line short"></div>
              <div class="sk-line mid"></div>
            </div>
          </div>
          <div class="state-card">
            <span class="state-label">ERROR</span>
            <div class="state-content error">
              <span>Ошибка сети: не удалось обновить логи</span>
              <button class="btn ghost small">Повторить</button>
            </div>
          </div>
          <div class="state-card">
            <span class="state-label">EMPTY</span>
            <div class="state-content empty">
              <span>Нет обращений по текущему фильтру.</span>
              <button class="btn ghost small">Сбросить фильтр</button>
            </div>
          </div>
        </div>
      </section>

      <Teleport to="body">
        <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
          <div class="modal">
            <div class="modal-header">
              <h3>Создать новое обращение</h3>
              <button class="modal-close" @click="modalOpen = false" aria-label="Закрыть">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="input-wrap"><i class="fas fa-user"></i><input placeholder="Имя клиента" /></div>
              <div class="input-wrap"><i class="fas fa-phone"></i><input placeholder="Телефон" /></div>
              <div class="input-wrap select"><i class="fas fa-telegram"></i><select><option>Telegram</option></select><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="modal-footer">
              <button class="btn ghost" @click="modalOpen = false">Отмена</button>
              <button class="btn primary">Создать</button>
            </div>
          </div>
        </div>
      </Teleport>

      <section class="showcase">
        <button class="btn primary" @click="modalOpen = true">
          <i class="fas fa-plus"></i> Открыть модальное окно
        </button>
      </section>

      <section class="showcase">
        <h2 class="section-title">ПОКРЫТИЕ ДИЗАЙН-СИСТЕМЫ</h2>
        <div class="coverage-tags">
          <span class="cov-tag"><i class="fas fa-bars"></i> Навигация и shell</span>
          <span class="cov-tag"><i class="fas fa-filter"></i> Фильтры и поиск</span>
          <span class="cov-tag"><i class="fas fa-list"></i> Списки и карточки</span>
          <span class="cov-tag"><i class="fas fa-table"></i> Таблицы и статусы</span>
          <span class="cov-tag"><i class="fas fa-check"></i> Формы и валидация</span>
          <span class="cov-tag"><i class="fas fa-bell"></i> Уведомления</span>
          <span class="cov-tag"><i class="fas fa-window-maximize"></i> Модальные сценарии</span>
          <span class="cov-tag"><i class="fas fa-spinner"></i> Loading / Empty / Error</span>
        </div>
      </section>

      <section class="showcase">
        <h2 class="section-title">ПАЛИТРА ТЕМЫ</h2>
        <div class="palette-grid">
          <div class="palette-item"><div class="swatch" style="background:#05080a"></div><span>BACKGROUND</span><code>#05080a</code></div>
          <div class="palette-item"><div class="swatch" style="background:#11191b"></div><span>SURFACE</span><code>#11191b</code></div>
          <div class="palette-item"><div class="swatch" style="background:#afc45f"></div><span>ACCENT</span><code>#afc45f</code></div>
          <div class="palette-item"><div class="swatch" style="background:#6f8440"></div><span>ACCENT DEEP</span><code>#6f8440</code></div>
          <div class="palette-item"><div class="swatch" style="background:#eef4eb"></div><span>TEXT</span><code>#eef4eb</code></div>
          <div class="palette-item"><div class="swatch" style="background:#c5d879"></div><span>GLOW</span><code>#c5d879</code></div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.app {
  --bg: #05080a;
  --bg2: #0d1214;
  --surface: #11191b;
  --accent: #afc45f;
  --accent-deep: #6f8440;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --glow: #c5d879;
  --glow-soft: rgba(175, 196, 95, 0.15);
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  --glass-strong: rgba(12, 20, 22, 0.68);
  --glass-soft: rgba(12, 20, 22, 0.56);
  --error: #e85555;
  --warning: #e5b04a;
  --info: #5a9cf5;
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
}

.app {
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
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.nav-link:hover {
  background: rgba(175, 196, 95, 0.14);
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
.showcase-card { margin-top: 0; }
.card {
  background: linear-gradient(165deg, var(--glass-strong), var(--glass-soft));
  backdrop-filter: blur(24px) saturate(135%);
  -webkit-backdrop-filter: blur(24px) saturate(135%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 26%);
}

.btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
.btn {
  padding: 12px 20px;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}
.btn.primary { background: var(--accent); color: var(--bg); box-shadow: 0 12px 22px rgba(175, 196, 95, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.28); }
.btn.primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.btn.secondary { background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid rgba(175, 196, 95, 0.14); }
.btn.secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.btn.ghost { background: transparent; color: var(--text2); }
.btn.ghost:hover { background: var(--glow-soft); color: var(--accent); }
.btn.outline { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
.btn.outline:hover { background: var(--glow-soft); transform: translateY(-1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.small { padding: 8px 14px; font-size: 0.85rem; }

.form-row { display: flex; flex-direction: column; gap: 20px; }
.field { display: block; }
.field-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text2); letter-spacing: 0.05em; margin-bottom: 8px; }
.input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  transition: all 0.25s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.field.error .input-wrap { border-color: var(--error); }
.input-wrap input, .input-wrap select {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}
.input-wrap i { color: var(--text3); }
.input-wrap.select select { padding-right: 24px; }
textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}
textarea:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08); }
.field-error { font-size: 0.8rem; color: var(--error); margin-top: 6px; display: block; }
.field-hint { font-size: 0.8rem; color: var(--text3); margin-top: 6px; display: block; }

.search-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  margin-bottom: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.search-wrap i { color: var(--text3); }
.search-wrap input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: inherit; }
.filter-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-tab.active { background: var(--accent); color: var(--bg); }
.filter-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag {
  padding: 8px 14px;
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tag.active { background: var(--accent); color: var(--bg); }
.tag-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }

.notify-list { display: flex; flex-direction: column; gap: 12px; }
.notify {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.1);
}
.notify i { font-size: 1.25rem; }
.notify.success i { color: var(--accent); }
.notify.warning i { color: var(--warning); }
.notify.info i { color: var(--info); }
.notify-title { display: block; font-weight: 600; }
.notify-sub { font-size: 0.85rem; color: var(--text3); }
.notify .btn { margin-left: auto; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.1);
  margin-bottom: 12px;
}
.list-tag { padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
.list-tag.hot { background: var(--accent); color: var(--bg); }
.list-tag:not(.hot) { background: rgba(255,255,255,0.08); color: var(--text2); }
.list-body { flex: 1; min-width: 0; }
.list-title { display: block; font-weight: 600; font-size: 0.9rem; }
.list-desc { font-size: 0.85rem; color: var(--text3); }
.list-time { font-size: 0.85rem; color: var(--text3); flex-shrink: 0; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
.badge-status { padding: 4px 10px; background: var(--glow-soft); color: var(--accent); border-radius: 12px; font-size: 0.8rem; }
.badge-status.muted { background: rgba(255,255,255,0.08); color: var(--text2); }

.states-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.state-card {
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.14);
}
.state-label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; margin-bottom: 12px; }
.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 80px;
  color: var(--text2);
  font-size: 0.85rem;
  text-align: center;
}
.state-content.loading i { font-size: 1.5rem; color: var(--accent); }
.state-content.error span { color: var(--error); }
.skeleton { align-items: stretch; }
.sk-line { height: 12px; background: rgba(255,255,255,0.08); border-radius: 4px; width: 100%; }
.sk-line.short { width: 60%; }
.sk-line.mid { width: 80%; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.66);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade 0.2s ease;
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.modal {
  background: linear-gradient(165deg, rgba(18, 27, 29, 0.94), rgba(14, 22, 24, 0.9));
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.54), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.modal::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 26%);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover { background: var(--glow-soft); color: var(--accent); }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-body .input-wrap { height: 44px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border); }

.coverage-tags { display: flex; flex-wrap: wrap; gap: 12px; }
.cov-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.14);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: var(--text2);
  transition: all 0.25s ease;
}
.cov-tag:hover {
  background: rgba(175, 196, 95, 0.12);
  border-color: rgba(175, 196, 95, 0.24);
  color: var(--text);
}
.cov-tag i { color: var(--accent); }

.palette-grid { display: flex; flex-wrap: wrap; gap: 24px; }
.palette-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.swatch { width: 64px; height: 64px; border-radius: var(--radius); border: 1px solid var(--border); }
.palette-item span { font-size: 0.8rem; font-weight: 600; }
.palette-item code { font-size: 0.75rem; color: var(--text3); font-family: monospace; }

@media (max-width: 1024px) {
  .two-col { grid-template-columns: 1fr; }
  .states-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .app { padding: 16px 20px 32px; }
  .states-grid { grid-template-columns: 1fr; }
}
</style>
