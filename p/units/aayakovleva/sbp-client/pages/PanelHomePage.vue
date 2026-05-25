<template>
  <div
    class="app-layout flex flex-col"
    @animationend="onAppLayoutAnimationEnd"
  >
    <GlobalGlitch />
    <Header
      v-if="bootLoaderDone"
      :projectTitle="projectTitle"
      :indexUrl="indexUrl"
      :profileUrl="profileUrl"
      :loginUrl="loginUrl"
      :isAuthenticated="isAuthenticated"
      :isAdmin="isAdmin"
      :adminUrl="adminUrl"
      :testsUrl="testsUrl"
      :panelUrl="panelUrl"
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner" :class="{ ready: bootLoaderDone }">

        <!-- ====== STATUS STRIP ====== -->
        <section class="status-strip" aria-label="Состояние конфигурации">
          <div class="status-chips">
            <span
              :class="['chip', 'config-status', allConfigured ? 'is-ok' : 'is-warn']"
              tabindex="0"
            >
              <i class="fas" :class="allConfigured ? 'fa-check' : 'fa-triangle-exclamation'"></i>
              <span>{{ allConfigured ? 'Настройки выполнены успешно' : 'Требуется настройка' }}</span>
              <span v-if="!allConfigured" class="config-status-tooltip" role="tooltip">
                <span class="config-status-tooltip-title">Не хватает для зелёного статуса:</span>
                <ul>
                  <li v-for="m in missingConfig" :key="m">{{ m }}</li>
                </ul>
              </span>
            </span>
          </div>
          <div class="status-webhook">
            <span class="status-webhook-label">
              <i class="fas fa-link"></i> Base URL
            </span>
            <code class="status-webhook-url">{{ baseUrl }}</code>
            <button
              type="button"
              class="btn-mini"
              @click="copyText(baseUrl)"
              title="Скопировать"
            >
              <i class="far fa-copy"></i>
            </button>
          </div>
        </section>

        <!-- ====== SUB-TOOLBAR ====== -->
        <nav class="panel-toolbar" aria-label="Разделы и поиск">
          <div class="toolbar-row toolbar-row--tabs">
            <div class="panel-tabs" role="tablist">
              <button
                v-for="t in visibleTabs"
                :key="t.id"
                :class="['tab', { active: activeTab === t.id }]"
                :aria-selected="activeTab === t.id"
                role="tab"
                type="button"
                @click="setTab(t.id)"
              >
                <i class="fas" :class="t.icon"></i>
                <span>{{ t.label }}</span>
              </button>
            </div>
          </div>
          <div class="toolbar-row toolbar-row--tools">
            <div class="date-filter" role="group" aria-label="Фильтр по дате и времени">
              <i class="fas fa-calendar-day date-filter-icon" title="Фильтр по дате/времени"></i>
              <div class="date-filter-field">
                <span class="date-filter-cap">с</span>
                <input
                  type="date"
                  class="date-filter-input"
                  v-model="fromDate"
                  :max="toDate || undefined"
                  @change="onFilterChange"
                  aria-label="Дата начала"
                />
                <input
                  type="time"
                  class="date-filter-input date-filter-time"
                  v-model="fromTime"
                  @change="onFilterChange"
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
                  v-model="toDate"
                  :min="fromDate || undefined"
                  @change="onFilterChange"
                  aria-label="Дата окончания"
                />
                <input
                  type="time"
                  class="date-filter-input date-filter-time"
                  v-model="toTime"
                  @change="onFilterChange"
                  title="Пусто = 00:00"
                  aria-label="Время окончания (пусто = 00:00)"
                />
              </div>
              <button
                v-if="hasActiveFilter"
                type="button"
                class="btn-mini date-filter-reset"
                :disabled="dateFilterSaving"
                @click="resetDateFilter"
                title="Сбросить фильтр"
              >
                <i class="fas fa-rotate-left"></i> Сброс
              </button>
              <span v-if="dateFilterError" class="date-filter-error" role="alert">{{ dateFilterError }}</span>
            </div>
            <label
              v-show="!hasActiveFilter"
              class="live-toggle"
              :class="{ on: liveMode }"
              :title="liveMode ? 'Авто-обновление включено' : 'Включить авто-обновление'"
            >
              <input v-model="liveMode" type="checkbox" />
              <span class="live-dot"></span>
              <span class="live-label">LIVE</span>
            </label>
            <form class="quick-search" @submit.prevent="doSearch" role="search">
              <i class="fas fa-magnifying-glass quick-search-icon"></i>
              <input
                v-model="searchValue"
                type="text"
                placeholder="Поиск по requestId…"
                class="quick-search-input"
                aria-label="Поиск по requestId"
              />
              <button
                v-if="searchValue"
                type="button"
                class="quick-search-clear"
                @click="clearSearch"
                title="Очистить"
              >
                <i class="fas fa-xmark"></i>
              </button>
            </form>
          </div>
        </nav>

        <!-- ====== SEARCH RESULT PANEL ====== -->
        <section v-if="searchResult" class="panel-section search-result-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Результат поиска</h2>
            <code v-if="searchedQuery" class="search-query">{{ searchedQuery }}</code>
            <button type="button" class="btn-mini head-action" @click="searchResult = null" title="Закрыть">
              <i class="fas fa-xmark"></i> Закрыть
            </button>
          </header>
          <div v-if="searchResult.request">
            <div class="table-wrapper">
              <table class="data-table data-table-vertical">
                <tbody>
                  <tr><th>requestId</th><td><code>{{ searchResult.request.requestId }}</code></td></tr>
                  <tr><th>op</th><td>{{ searchResult.request.op }}</td></tr>
                  <tr><th>orderNumber</th><td>{{ searchResult.request.orderNumber }}</td></tr>
                  <tr><th>correlationId</th><td><code>{{ searchResult.request.correlationId || '—' }}</code></td></tr>
                  <tr><th>HTTP</th><td>{{ searchResult.request.clientHttpStatus }}</td></tr>
                  <tr><th>ok</th><td :class="searchResult.request.ok ? 'cell-ok' : 'cell-err'">{{ searchResult.request.ok ? '✓ успех' : '✗ ошибка' }}</td></tr>
                  <tr><th>errorCode</th><td>{{ searchResult.request.errorCode || '—' }}</td></tr>
                  <tr><th>lpHttpStatus</th><td>{{ searchResult.request.lpHttpStatus || '—' }}</td></tr>
                  <tr><th>lpSemanticRule</th><td>{{ searchResult.request.lpSemanticRule || '—' }}</td></tr>
                  <tr>
                    <th>argsRedacted</th>
                    <td><pre class="json-block">{{ JSON.stringify(searchResult.request.argsRedacted, null, 2) }}</pre></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 class="search-h3">Связанные webhook (по orderNumber / correlationId)</h3>
            <div v-if="searchResult.webhooks.length > 0" class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr><th>Время</th><th>number</th><th>type</th><th>status</th></tr>
                </thead>
                <tbody>
                  <tr v-for="w in searchResult.webhooks" :key="w.id" :class="rowClassWebhook(w)">
                    <td>{{ formatTime(w.processedAt) }}</td>
                    <td>{{ w.number }}</td>
                    <td>{{ w.type }}</td>
                    <td>{{ w.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="muted"><i class="fas fa-circle-info"></i> Связанных webhook нет.</p>
          </div>
          <p v-else class="muted"><i class="fas fa-circle-exclamation"></i> По указанному requestId записей не найдено.</p>
        </section>

        <!-- ====== TAB: ОБЗОР ====== -->
        <template v-if="activeTab === 'overview'">
          <section class="manager-summary" aria-label="Сводка для менеджера">
            <h2 class="summary-title">
              <span class="prompt">›</span> Сводка для менеджера
              <span class="summary-period">{{ periodLabel }}</span>
            </h2>
            <div class="kpi-grid">
              <article class="kpi-card kpi-hero">
                <div class="kpi-icon"><i class="fas fa-file-invoice"></i></div>
                <div class="kpi-label">Сформировано заказов</div>
                <div class="kpi-value">{{ formatKpiNumber(analytics?.orders?.created) }}</div>
              </article>
              <article class="kpi-card kpi-hero kpi-success">
                <div class="kpi-icon"><i class="fas fa-circle-check"></i></div>
                <div class="kpi-label">Оплачено заказов</div>
                <div class="kpi-value">{{ formatKpiNumber(analytics?.orders?.paid) }}</div>
              </article>
              <article class="kpi-card kpi-hero">
                <div class="kpi-icon"><i class="fas fa-ruble-sign"></i></div>
                <div class="kpi-label">Сумма заказов</div>
                <div class="kpi-value">{{ formatMoney(analytics?.orders?.createdSum) }}</div>
              </article>
              <article class="kpi-card kpi-hero kpi-success">
                <div class="kpi-icon"><i class="fas fa-coins"></i></div>
                <div class="kpi-label">Сумма оплат</div>
                <div class="kpi-value">{{ formatMoney(analytics?.orders?.paidSum) }}</div>
              </article>
            </div>
          </section>

          <section class="admin-summary" aria-label="Сводка для администратора">
          <h2 class="summary-title">
            <span class="prompt">›</span> Сводка для администратора
            <span class="summary-period">{{ periodLabel }}</span>
          </h2>
          <section class="kpi-grid" aria-label="Ключевые метрики">
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-paper-plane"></i></div>
              <div class="kpi-label">Запросов</div>
              <div class="kpi-value">{{ formatKpiNumber(analytics?.requests?.total) }}</div>
            </article>
            <article class="kpi-card kpi-hero kpi-success">
              <div class="kpi-icon"><i class="fas fa-circle-check"></i></div>
              <div class="kpi-label">Успешных</div>
              <div class="kpi-value">{{ formatKpiPercent(analytics?.requests?.okShare) }}</div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-gauge-high"></i></div>
              <div class="kpi-label">p95 latency</div>
              <div class="kpi-value">
                {{ formatKpiNumber(analytics?.requests?.p95DurationMs) }}
                <span class="kpi-unit">мс</span>
              </div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-bell"></i></div>
              <div class="kpi-label">Webhook</div>
              <div class="kpi-value">{{ formatKpiNumber(analytics?.webhooks?.total) }}</div>
            </article>
          </section>

          <section class="kpi-grid kpi-grid-secondary" aria-label="Дополнительные метрики">
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-stopwatch"></i> avg latency</div>
              <div class="stat-value">
                {{ formatKpiNumber(analytics?.requests?.avgDurationMs) }}
                <span class="stat-unit">мс</span>
              </div>
            </article>
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-bug"></i> Top errorCode</div>
              <div class="stat-value small">
                {{ analytics?.requests?.topErrorCode || '—' }}
                <span v-if="analytics?.requests?.topErrorCount" class="stat-unit">
                  ({{ analytics.requests.topErrorCount }})
                </span>
              </div>
            </article>
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-shield-halved"></i> webhook success</div>
              <div class="stat-value">{{ formatKpiPercent(analytics?.webhooks?.successShare) }}</div>
            </article>
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-key"></i> tokenValid</div>
              <div class="stat-value">{{ formatKpiPercent(analytics?.webhooks?.tokenValidShare) }}</div>
            </article>
          </section>
          </section>

          <section class="feed-grid">
            <article class="panel-section">
              <header class="panel-section-head">
                <span class="prompt">›</span>
                <h2>Последние запросы</h2>
                <span class="updated-since muted">{{ updatedSince(lastUpdated.requests) }}</span>
                <button type="button" class="btn-mini head-action" @click="setTab('requests')">
                  Все <i class="fas fa-arrow-right"></i>
                </button>
              </header>
              <div v-if="recentRequestsPreview.length > 0" class="table-wrapper">
                <table class="data-table compact-table">
                  <thead>
                    <tr><th>Время</th><th>op</th><th>HTTP</th><th>статус</th><th>ms</th></tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="r in recentRequestsPreview"
                      :key="r.id"
                      :class="rowClassRequest(r)"
                      @click="copyRequestId(r)"
                      :title="'requestId: ' + r.requestId"
                    >
                      <td>{{ formatTime(r.requestedAt) }}</td>
                      <td>{{ r.op }}</td>
                      <td>{{ r.clientHttpStatus }}</td>
                      <td :class="r.ok ? 'cell-ok' : 'cell-err'">
                        <span v-if="r.ok">✓ ok</span>
                        <span v-else>✗ {{ r.errorCode || 'err' }}</span>
                      </td>
                      <td>{{ r.durationMs }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state">
                <i class="fas fa-paper-plane empty-icon"></i>
                <p class="empty-title">Запросов пока нет</p>
                <p class="empty-hint">
                  Создайте тестовый счёт во вкладке
                  <button class="link-button" @click="setTab('createBill')">«Создать»</button>
                </p>
              </div>
            </article>

            <article class="panel-section">
              <header class="panel-section-head">
                <span class="prompt">›</span>
                <h2>Последние webhook</h2>
                <span class="updated-since muted">{{ updatedSince(lastUpdated.webhooks) }}</span>
                <button type="button" class="btn-mini head-action" @click="setTab('webhooks')">
                  Все <i class="fas fa-arrow-right"></i>
                </button>
              </header>
              <div v-if="recentWebhooksPreview.length > 0" class="table-wrapper">
                <table class="data-table compact-table">
                  <thead>
                    <tr><th>Время</th><th>orderNumber</th><th>сумма</th><th>type</th><th>статус</th></tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="w in recentWebhooksPreview"
                      :key="w.id"
                      :class="rowClassWebhook(w)"
                    >
                      <td>{{ formatTime(w.processedAt) }}</td>
                      <td>{{ w.orderNumber }}</td>
                      <td>{{ w.amount }}</td>
                      <td>{{ w.type }}</td>
                      <td :class="w.status === 'success' ? 'cell-ok' : 'cell-err'">
                        <span v-if="!w.tokenValid" class="cell-warn">токен ✗</span>
                        <span v-else>{{ w.status }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state">
                <i class="fas fa-inbox empty-icon"></i>
                <p class="empty-title">Webhook ещё не приходили</p>
                <p class="empty-hint">LifePay присылает уведомления по callbackUrl после оплаты счёта.</p>
              </div>
            </article>
          </section>
        </template>

        <!-- ====== TAB: ЗАПРОСЫ ====== -->
        <section v-show="activeTab === 'requests'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Журнал исходящих запросов</h2>
            <span class="updated-since muted">{{ updatedSince(lastUpdated.requests) }}</span>
            <button type="button" class="btn-mini head-action" @click="loadRequests" title="Обновить">
              <i class="fas fa-rotate"></i>
            </button>
          </header>
          <div class="filter-pills" role="tablist">
            <button
              v-for="f in requestsFilters"
              :key="f.id"
              :class="['pill', { active: requestsFilter === f.id }]"
              type="button"
              @click="requestsFilter = f.id"
            >
              {{ f.label }}
              <span class="pill-count">{{ countRequests(f.id) }}</span>
            </button>
          </div>
          <div v-if="filteredRequests.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>requestId</th>
                  <th>op</th>
                  <th>HTTP</th>
                  <th>статус</th>
                  <th>errorCode</th>
                  <th>lpRule</th>
                  <th>ms</th>
                  <th>raw</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in filteredRequests"
                  :key="r.id"
                  :class="rowClassRequest(r)"
                >
                  <td>{{ formatTime(r.requestedAt) }}</td>
                  <td class="cell-id">
                    <code>{{ r.requestId }}</code>
                    <button
                      v-if="r.requestId"
                      class="btn-mini"
                      @click="lookupRequest(r.requestId)"
                      title="Найти детали"
                    >
                      <i class="fas fa-magnifying-glass"></i>
                    </button>
                    <button
                      v-if="r.requestId"
                      class="btn-mini"
                      @click="copyText(r.requestId)"
                      title="Скопировать"
                    >
                      <i class="far fa-copy"></i>
                    </button>
                  </td>
                  <td>{{ r.op }}</td>
                  <td>{{ r.clientHttpStatus }}</td>
                  <td :class="r.ok ? 'cell-ok' : 'cell-err'">
                    {{ r.ok ? '✓' : '✗' }}
                  </td>
                  <td>{{ r.errorCode || '—' }}</td>
                  <td>{{ r.lpSemanticRule || '—' }}</td>
                  <td>{{ r.durationMs }}</td>
                  <td>
                    <button class="btn-mini" @click="openRaw('request', r.id)" title="Полное тело ответа">
                      <i class="fas fa-code"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-filter empty-icon"></i>
            <p class="empty-title">Под фильтр ничего не подходит</p>
            <p class="empty-hint">
              <button class="link-button" @click="requestsFilter = 'all'">Сбросить фильтр</button>
              или
              <button class="link-button" @click="setTab('createBill')">создать счёт</button>
            </p>
          </div>
        </section>

        <!-- ====== TAB: WEBHOOK ====== -->
        <section v-show="activeTab === 'webhooks'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Журнал входящих webhook</h2>
            <span class="updated-since muted">{{ updatedSince(lastUpdated.webhooks) }}</span>
            <button type="button" class="btn-mini head-action" @click="loadWebhooks" title="Обновить">
              <i class="fas fa-rotate"></i>
            </button>
          </header>
          <div class="filter-pills" role="tablist">
            <button
              v-for="f in webhooksFilters"
              :key="f.id"
              :class="['pill', { active: webhooksFilter === f.id }]"
              type="button"
              @click="webhooksFilter = f.id"
            >
              {{ f.label }}
              <span class="pill-count">{{ countWebhooks(f.id) }}</span>
            </button>
          </div>
          <div v-if="filteredWebhooks.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>number</th>
                  <th>orderNumber</th>
                  <th>токен</th>
                  <th>dup</th>
                  <th>сумма</th>
                  <th>type</th>
                  <th>статус</th>
                  <th>raw</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="w in filteredWebhooks" :key="w.id" :class="rowClassWebhook(w)">
                  <td>{{ formatTime(w.processedAt) }}</td>
                  <td>{{ w.number }}</td>
                  <td>{{ w.orderNumber }}</td>
                  <td :class="w.tokenValid ? 'cell-ok' : 'cell-warn'">
                    {{ w.tokenValid ? '✓' : '✗' }}
                  </td>
                  <td>
                    <span v-if="w.duplicate" class="dup-badge">дубль</span>
                  </td>
                  <td>{{ w.amount }}</td>
                  <td>{{ w.type }}</td>
                  <td :class="w.status === 'success' ? 'cell-ok' : 'cell-err'">{{ w.status }}</td>
                  <td>
                    <button class="btn-mini" @click="openRaw('webhook', w.id)" title="Полное тело webhook">
                      <i class="fas fa-code"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-inbox empty-icon"></i>
            <p class="empty-title">Под фильтр ничего не подходит</p>
            <p class="empty-hint">
              <button class="link-button" @click="webhooksFilter = 'all'">Сбросить фильтр</button>
            </p>
          </div>
        </section>

        <!-- ====== TAB: СОЗДАТЬ СЧЁТ ====== -->
        <section v-show="activeTab === 'createBill'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Создать счёт вручную</h2>
            <span class="head-meta muted">Тестовый вызов <code>createBill</code> через gateway</span>
          </header>
          <form class="grid-form" @submit.prevent="createBill">
            <label class="field">
              <span class="field-label">orderNumber <span class="field-required">*</span></span>
              <input v-model="bill.orderNumber" type="text" required class="field-input" />
            </label>
            <label class="field">
              <span class="field-label">amount, рубли <span class="field-required">*</span></span>
              <input v-model.number="bill.amount" type="number" step="0.01" min="0.01" required class="field-input" />
            </label>
            <label class="field">
              <span class="field-label">customerEmail <span class="field-required">*</span></span>
              <input v-model="bill.customerEmail" type="email" required class="field-input" />
            </label>
            <label class="field">
              <span class="field-label">description <span class="field-required">*</span></span>
              <input v-model="bill.description" type="text" required class="field-input" />
            </label>
            <label class="field field-full">
              <span class="field-label">callbackUrl <span class="field-required">*</span></span>
              <input v-model="bill.callbackUrl" type="url" required class="field-input" />
              <span class="field-hint">Адрес для входящего webhook от LifePay. Авто-подставлен из настроек.</span>
            </label>
            <label class="field">
              <span class="field-label">customerPhone</span>
              <input v-model="bill.customerPhone" type="text" placeholder="7XXXXXXXXXX" class="field-input" />
            </label>
            <div class="form-actions field-full">
              <button type="submit" class="btn-primary" :disabled="billLoading">
                <i class="fas" :class="billLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                {{ billLoading ? 'Отправка...' : 'Создать счёт' }}
              </button>
              <button v-if="billResult" type="button" class="btn-secondary" @click="resetBillResult">
                <i class="fas fa-eraser"></i> Очистить результат
              </button>
            </div>
          </form>

          <div v-if="billResult" class="bill-result" :class="billResult.ok ? 'bill-result-ok' : 'bill-result-err'">
            <p v-if="billResult.ok" class="form-msg is-ok">
              <i class="fas fa-circle-check"></i> Счёт создан
            </p>
            <p v-else class="form-msg is-err">
              <i class="fas fa-circle-exclamation"></i>
              Ошибка: {{ billResult.error?.code }} — {{ billResult.error?.message }}
            </p>
            <p v-if="billResult.requestId" class="bill-meta">
              requestId: <code>{{ billResult.requestId }}</code>
              <button class="btn-mini" @click="lookupRequest(billResult.requestId)" title="Открыть в журнале">
                <i class="fas fa-magnifying-glass"></i> найти
              </button>
              <button class="btn-mini" @click="copyText(billResult.requestId)" title="Скопировать">
                <i class="far fa-copy"></i>
              </button>
            </p>
            <div v-if="billSuccessData" class="bill-success">
              <p>billNumber: <code>{{ billSuccessData.billNumber }}</code></p>
              <p v-if="billSuccessData.paymentUrl">
                paymentUrl: <code class="paymenturl">{{ billSuccessData.paymentUrl }}</code>
              </p>
              <div v-if="billSuccessData.paymentUrl" class="qr-block">
                <p class="muted"><i class="fas fa-qrcode"></i> QR-код для оплаты</p>
                <div ref="qrContainer" class="qr-container"></div>
              </div>
              <p v-if="billSuccessData.paymentUrlWeb" class="bill-action">
                <a
                  :href="billSuccessData.paymentUrlWeb"
                  target="_blank"
                  rel="noopener"
                  class="btn-primary"
                >
                  <i class="fas fa-arrow-up-right-from-square"></i> Открыть в браузере
                </a>
              </p>
            </div>
          </div>
        </section>

        <!-- ====== ACCESS (Admin-only) ====== -->
        <section v-show="activeTab === 'access' && isAdmin" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Управление доступом</h2>
            <button type="button" class="btn-mini head-action" @click="loadAccess" title="Обновить">
              <i class="fas fa-rotate"></i> Обновить
            </button>
          </header>

          <p v-if="accessError" class="form-msg is-err">
            <i class="fas fa-circle-exclamation"></i> {{ accessError }}
          </p>

          <!-- Пригласительные ссылки -->
          <div class="access-block">
            <div class="access-block-head">
              <h3><i class="fas fa-link"></i> Пригласительные ссылки</h3>
              <button type="button" class="btn-primary" @click="openInviteModal">
                <i class="fas fa-plus"></i> Создать ссылку
              </button>
            </div>
            <div v-if="invites.length > 0" class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Комментарий</th><th>Создал</th><th>Создан</th>
                    <th>Истекает</th><th>Использовал</th><th>Статус</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inv in invites" :key="inv.inviteId">
                    <td>{{ inv.note || '—' }}</td>
                    <td>{{ inv.createdByDisplayName }}</td>
                    <td>{{ formatTime(inv.issuedAt) }}</td>
                    <td>{{ formatTime(inv.expiresAt) }}</td>
                    <td>{{ inv.usedByDisplayName || '—' }}</td>
                    <td><span :class="inviteStatusClass(inv.status)">{{ inviteStatusLabel(inv.status) }}</span></td>
                    <td>
                      <button
                        v-if="inv.status === 'active'"
                        type="button"
                        class="btn-mini"
                        @click="revokeInvite(inv.inviteId)"
                      >
                        <i class="fas fa-ban"></i> Отозвать
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="muted">Пригласительных ссылок пока нет.</p>
          </div>

          <!-- Выданные доступы -->
          <div class="access-block">
            <div class="access-block-head">
              <h3><i class="fas fa-user-check"></i> Выданные доступы</h3>
            </div>
            <div v-if="grants.length > 0" class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Пользователь</th><th>Email</th><th>Выдан</th>
                    <th>Кем</th><th>Статус</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in grants" :key="g.userId">
                    <td>{{ g.userDisplayName }}</td>
                    <td>{{ g.userEmail || '—' }}</td>
                    <td>{{ formatTime(g.grantedAt) }}</td>
                    <td>{{ g.grantedByDisplayName }}</td>
                    <td><span :class="g.active ? 'cell-ok' : 'cell-err'">{{ g.active ? 'активен' : 'отозван' }}</span></td>
                    <td>
                      <button
                        v-if="g.active"
                        type="button"
                        class="btn-mini"
                        @click="revokeGrant(g.userId)"
                      >
                        <i class="fas fa-ban"></i> Отозвать доступ
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="muted">Выданных доступов пока нет.</p>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />

    <!-- ====== RAW PAYLOAD MODAL ====== -->
    <div v-if="rawModal" class="raw-modal-backdrop" @click.self="closeRaw">
      <div class="raw-modal" role="dialog" aria-modal="true">
        <header class="raw-modal-head">
          <span class="prompt">›</span>
          <h2>
            {{ rawModal.kind === 'webhook' ? 'Webhook payload' : 'Ответ gateway' }}
            <span class="muted">#{{ rawModal.id }}</span>
          </h2>
          <button type="button" class="btn-mini head-action" @click="closeRaw" title="Закрыть">
            <i class="fas fa-xmark"></i> Закрыть
          </button>
        </header>
        <div class="raw-modal-body">
          <p v-if="rawModal.loading" class="muted">
            <i class="fas fa-spinner fa-spin"></i> Загрузка…
          </p>
          <p v-else-if="rawModal.error" class="form-msg is-err">
            <i class="fas fa-circle-exclamation"></i> {{ rawModal.error }}
          </p>
          <template v-else-if="rawModal.entry">
            <div class="raw-modal-actions">
              <button class="btn-mini" @click="copyText(rawJsonString(rawModal.entry))" title="Скопировать JSON">
                <i class="far fa-copy"></i> Скопировать
              </button>
            </div>
            <pre class="json-block">{{ rawJsonString(rawModal.entry) }}</pre>
          </template>
          <p v-else class="muted">
            <i class="fas fa-circle-info"></i> Запись не найдена.
          </p>
        </div>
      </div>
    </div>

    <!-- ====== CREATE INVITE MODAL ====== -->
    <div v-if="inviteModal" class="raw-modal-backdrop" @click.self="closeInviteModal">
      <div class="raw-modal" role="dialog" aria-modal="true">
        <header class="raw-modal-head">
          <span class="prompt">›</span>
          <h2>Создать пригласительную ссылку</h2>
          <button type="button" class="btn-mini head-action" @click="closeInviteModal" title="Закрыть">
            <i class="fas fa-xmark"></i> Закрыть
          </button>
        </header>
        <div class="raw-modal-body">
          <template v-if="!inviteModal.result">
            <label class="field field-full">
              <span class="field-label">Комментарий (необязательно)</span>
              <input v-model="inviteModal.note" type="text" placeholder="например «для Ольги»" class="field-input" />
            </label>
            <p v-if="inviteModal.error" class="form-msg is-err">
              <i class="fas fa-circle-exclamation"></i> {{ inviteModal.error }}
            </p>
            <div class="settings-save-bar">
              <button type="button" class="btn-primary" :disabled="inviteModal.creating" @click="createInvite">
                <i class="fas fa-link"></i> {{ inviteModal.creating ? 'Создание…' : 'Создать' }}
              </button>
            </div>
          </template>
          <template v-else>
            <p class="muted">Скопируйте ссылку и передайте сотруднику. Токен показывается один раз.</p>
            <div class="raw-modal-actions">
              <button class="btn-mini" @click="copyText(inviteModal.result.fullUrl)" title="Скопировать ссылку">
                <i class="far fa-copy"></i> Скопировать
              </button>
            </div>
            <pre class="json-block">{{ inviteModal.result.fullUrl }}</pre>
            <p class="muted">Действительна до {{ formatTime(inviteModal.result.expiresAt) }}.</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { generateCorrelationId, appendCorrelationId } from '../shared/correlation'

const REFRESH_INTERVAL_MS = 15000
const TICK_INTERVAL_MS = 5000

const pad2 = (n) => String(n).padStart(2, '0')

// Unix ms → строка локальной даты YYYY-MM-DD (для input[type=date]); '' если нет.
function msToLocalDate(ms) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return ''
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
// Unix ms → строка локального времени HH:MM (для input[type=time]); '' если нет.
function msToLocalTime(ms) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return ''
  const d = new Date(ms)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
// Дата + (необязательное) время → Unix ms (локальное время браузера).
// Пустое время трактуется как 00:00. Без даты граница не задана (null).
function localPartsToMs(dateStr, timeStr) {
  if (!dateStr) return null
  const time = /^\d{2}:\d{2}/.test(timeStr || '') ? timeStr : '00:00'
  const ms = new Date(`${dateStr}T${time}`).getTime()
  return Number.isFinite(ms) && ms > 0 ? ms : null
}

export default {
  name: 'PanelHomePage',
  components: { Header, GlobalGlitch, AppFooter },
  props: {
    projectTitle: { type: String, default: 'LifePay SBP Client / Панель' },
    indexUrl: { type: String, default: '/' },
    profileUrl: { type: String, default: '/' },
    loginUrl: { type: String, default: '/' },
    isAuthenticated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    adminUrl: { type: String, default: '' },
    testsUrl: { type: String, default: '' },
    panelUrl: { type: String, default: '' },
    webhookUrl: { type: String, default: '' },
    baseUrlPath: { type: String, default: '' },
    apiUrls: {
      type: Object,
      default: () => ({
        invoke: '',
        recentRequests: '',
        recentWebhooks: '',
        analyticsSummary: '',
        searchByRequestId: '',
        rawRequest: '',
        rawWebhook: '',
        accessGenerateInvite: '',
        accessRevokeInvite: '',
        accessRevokeGrant: '',
        accessInvites: '',
        accessGrants: '',
        filterSave: ''
      })
    },
    initialSettings: {
      type: Object,
      default: () => ({
        lp_apikey: '',
        lp_login: '',
        lp_webhook_token: '',
        gateway_base_url: ''
      })
    },
    initialDateFilter: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      bootLoaderDone: false,
      origin: '',
      // Границы фильтра как строки полей: дата (обязательна) + время (необязательно).
      // Пустое время = 00:00. Источник истины — эти строки; ms выводится в computed.
      fromDate: msToLocalDate(typeof this.initialDateFilter?.from === 'number' ? this.initialDateFilter.from : null),
      fromTime: msToLocalTime(typeof this.initialDateFilter?.from === 'number' ? this.initialDateFilter.from : null),
      toDate: msToLocalDate(typeof this.initialDateFilter?.to === 'number' ? this.initialDateFilter.to : null),
      toTime: msToLocalTime(typeof this.initialDateFilter?.to === 'number' ? this.initialDateFilter.to : null),
      dateFilterSaving: false,
      dateFilterError: '',
      activeTab: 'overview',
      tabs: [
        { id: 'overview',   label: 'Обзор',         icon: 'fa-chart-line' },
        { id: 'requests',   label: 'Запросы',       icon: 'fa-list' },
        { id: 'webhooks',   label: 'Webhook',       icon: 'fa-bell' },
        { id: 'createBill', label: 'Создать',       icon: 'fa-file-invoice' },
        { id: 'access',     label: 'Доступ',        icon: 'fa-user-shield', adminOnly: true }
      ],
      requestsFilters: [
        { id: 'all', label: 'Все' },
        { id: 'ok',  label: 'Успешные' },
        { id: 'err', label: 'Ошибки' }
      ],
      webhooksFilters: [
        { id: 'all',     label: 'Все' },
        { id: 'success', label: 'success' },
        { id: 'fail',    label: 'fail' },
        { id: 'invalid', label: 'токен ✗' }
      ],
      requestsFilter: 'all',
      webhooksFilter: 'all',
      liveMode: false,
      now: Date.now(),
      lastUpdated: {
        analytics: 0,
        requests: 0,
        webhooks: 0
      },
      // Снимок сохранённых настроек (из SSR) — только для индикатора статуса в шапке.
      // Редактирование настроек перенесено на страницу настроек проекта (/web/admin).
      savedSettings: {
        lp_apikey: this.initialSettings?.lp_apikey || '',
        lp_login: this.initialSettings?.lp_login || '',
        lp_webhook_token: this.initialSettings?.lp_webhook_token || '',
        gateway_base_url: this.initialSettings?.gateway_base_url || ''
      },
      analytics: null,
      requests: [],
      webhooks: [],
      searchValue: '',
      searchedQuery: '',
      searchResult: null,
      bill: {
        orderNumber: '',
        amount: 1,
        customerEmail: '',
        description: 'Тестовый счёт',
        callbackUrl: this.webhookUrl,
        customerPhone: ''
      },
      billResult: null,
      billSuccessData: null,
      billLoading: false,
      refreshTimer: null,
      tickTimer: null,
      rawModal: null,
      invites: [],
      grants: [],
      accessError: '',
      inviteModal: null
    }
  },
  computed: {
    // Base URL = хост (читается на фронте) + путь до создания счёта (из config через проп).
    baseUrl() {
      if (!this.origin) return ''
      return `${this.origin}${this.baseUrlPath}`
    },
    // Границы в Unix ms, выведенные из строк полей. Пустое время → 00:00.
    fromMs() {
      return localPartsToMs(this.fromDate, this.fromTime)
    },
    toMs() {
      return localPartsToMs(this.toDate, this.toTime)
    },
    hasActiveFilter() {
      return this.fromMs !== null || this.toMs !== null
    },
    periodLabel() {
      const f = this.fromMs
      const t = this.toMs
      if (f === null && t === null) return 'за всё время'
      if (f !== null && t !== null) return `с ${this.formatTime(f)} по ${this.formatTime(t)}`
      if (f !== null) return `с ${this.formatTime(f)}`
      return `по ${this.formatTime(t)}`
    },
    visibleTabs() {
      return this.tabs.filter((t) => !t.adminOnly || this.isAdmin)
    },
    configChips() {
      return [
        { key: 'lp_apikey',         label: 'API-ключ',      set: !!this.savedSettings.lp_apikey },
        { key: 'lp_login',          label: 'Login',         set: !!this.savedSettings.lp_login },
        { key: 'lp_webhook_token',  label: 'Webhook-токен', set: !!this.savedSettings.lp_webhook_token },
        { key: 'gateway_base_url',  label: 'Gateway URL',   set: !!this.savedSettings.gateway_base_url }
      ]
    },
    allConfigured() {
      return this.configChips.every(c => c.set)
    },
    missingConfig() {
      return this.configChips.filter(c => !c.set).map(c => c.label)
    },
    filteredRequests() {
      if (this.requestsFilter === 'ok')  return this.requests.filter(r => r.ok)
      if (this.requestsFilter === 'err') return this.requests.filter(r => !r.ok)
      return this.requests
    },
    filteredWebhooks() {
      if (this.webhooksFilter === 'success') return this.webhooks.filter(w => w.status === 'success' && w.tokenValid)
      if (this.webhooksFilter === 'fail')    return this.webhooks.filter(w => w.status === 'fail' && w.tokenValid)
      if (this.webhooksFilter === 'invalid') return this.webhooks.filter(w => !w.tokenValid)
      return this.webhooks
    },
    recentRequestsPreview() { return this.requests.slice(0, 5) },
    recentWebhooksPreview() { return this.webhooks.slice(0, 5) }
  },
  watch: {
    activeTab(newVal) {
      this.loadForTab(newVal)
    },
    liveMode(on) {
      if (on) this.startAutoRefresh()
      else this.stopAutoRefresh()
    },
    hasActiveFilter(active) {
      // При активном фильтре авто-обновление недоступно: выключаем Live,
      // watcher liveMode сам остановит таймер (без дублирующего stopAutoRefresh).
      if (active && this.liveMode) this.liveMode = false
    }
  },
  mounted() {
    this.loadQrcodeLib()
    if (typeof window !== 'undefined') {
      this.origin = window.location.origin
      if (window.hideAppLoader) window.hideAppLoader()
      if (window.bootLoaderComplete) {
        this.bootLoaderDone = true
        this.onReady()
      } else {
        window.addEventListener('bootloader-complete', this.handleBootComplete)
      }
    }
    this.tickTimer = setInterval(() => { this.now = Date.now() }, TICK_INTERVAL_MS)
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('bootloader-complete', this.handleBootComplete)
    }
    this.stopAutoRefresh()
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  },
  methods: {
    handleBootComplete() {
      this.bootLoaderDone = true
      this.onReady()
    },
    onReady() {
      this.loadForTab(this.activeTab)
    },
    setTab(id) {
      this.activeTab = id
    },
    loadForTab(tab) {
      if (tab === 'overview') {
        this.loadAnalytics()
        this.loadRequests()
        this.loadWebhooks()
      } else if (tab === 'requests') {
        this.loadRequests()
      } else if (tab === 'webhooks') {
        this.loadWebhooks()
      } else if (tab === 'access') {
        if (this.isAdmin) this.loadAccess()
      }
    },
    startAutoRefresh() {
      this.stopAutoRefresh()
      this.refreshTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return
        this.loadForTab(this.activeTab)
      }, REFRESH_INTERVAL_MS)
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    onAppLayoutAnimationEnd(e) {
      if (e?.animationName === 'crt-power-on') {
        e.target?.classList?.add('app-layout-appeared')
      }
    },
    openChatiumLink() {
      if (typeof window !== 'undefined') {
        window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
      }
    },

    /* ====== Formatters ====== */
    formatKpiNumber(n) {
      if (n === null || n === undefined) return '—'
      if (typeof n !== 'number' || Number.isNaN(n)) return '—'
      return Intl.NumberFormat('ru-RU').format(n)
    },
    formatKpiPercent(share) {
      if (share === null || share === undefined) return '—'
      if (typeof share !== 'number' || Number.isNaN(share)) return '—'
      return (share * 100).toFixed(1) + ' %'
    },
    formatMoney(value) {
      if (value === null || value === undefined) return '—'
      if (typeof value !== 'number' || Number.isNaN(value)) return '—'
      return Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value) + ' ₽'
    },
    formatTime(ts) {
      if (!ts) return ''
      try {
        const d = new Date(ts)
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      } catch (_e) {
        return String(ts)
      }
    },
    updatedSince(ts) {
      if (!ts) return ''
      const diff = Math.max(0, Math.floor((this.now - ts) / 1000))
      if (diff < 5)   return 'сейчас'
      if (diff < 60)  return diff + ' сек назад'
      const min = Math.floor(diff / 60)
      if (min < 60)   return min + ' мин назад'
      const h = Math.floor(min / 60)
      return h + ' ч назад'
    },
    rowClassRequest(r) {
      return {
        'row-clickable': true,
        'row-error': !r.ok
      }
    },
    rowClassWebhook(w) {
      return {
        'row-error': w.tokenValid && w.status !== 'success',
        'row-warn':  !w.tokenValid
      }
    },
    countRequests(id) {
      if (id === 'ok')  return this.requests.filter(r => r.ok).length
      if (id === 'err') return this.requests.filter(r => !r.ok).length
      return this.requests.length
    },
    countWebhooks(id) {
      if (id === 'success') return this.webhooks.filter(w => w.status === 'success' && w.tokenValid).length
      if (id === 'fail')    return this.webhooks.filter(w => w.status === 'fail' && w.tokenValid).length
      if (id === 'invalid') return this.webhooks.filter(w => !w.tokenValid).length
      return this.webhooks.length
    },

    /* ====== UX helpers ====== */
    copyText(text) {
      try {
        if (navigator && navigator.clipboard) navigator.clipboard.writeText(text)
      } catch (_e) {
        // ignore
      }
    },
    copyRequestId(r) {
      if (r && r.requestId) this.copyText(r.requestId)
    },

    /* ====== Управление доступом (Admin) ====== */
    async loadAccess() {
      this.accessError = ''
      try {
        const [invRes, grRes] = await Promise.all([
          fetch(this.apiUrls?.accessInvites, { headers: { Accept: 'application/json' } }),
          fetch(this.apiUrls?.accessGrants, { headers: { Accept: 'application/json' } })
        ])
        const invData = await invRes.json().catch(() => ({}))
        const grData = await grRes.json().catch(() => ({}))
        this.invites = invData && invData.success ? invData.invites || [] : []
        this.grants = grData && grData.success ? grData.grants || [] : []
        if (!(invData && invData.success) || !(grData && grData.success)) {
          this.accessError = 'Не удалось загрузить данные доступа.'
        }
      } catch (e) {
        this.accessError = 'Не удалось загрузить данные доступа.'
      }
    },
    openInviteModal() {
      this.inviteModal = { note: '', creating: false, error: '', result: null }
    },
    closeInviteModal() {
      this.inviteModal = null
      this.loadAccess()
    },
    async createInvite() {
      if (!this.inviteModal || this.inviteModal.creating) return
      this.inviteModal.creating = true
      this.inviteModal.error = ''
      try {
        const resp = await fetch(this.apiUrls?.accessGenerateInvite, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: this.inviteModal.note || '' })
        })
        const data = await resp.json().catch(() => ({}))
        if (data && data.success) {
          this.inviteModal.result = { fullUrl: data.fullUrl, expiresAt: data.expiresAt }
        } else {
          this.inviteModal.error = (data && data.error) || 'Не удалось создать ссылку.'
        }
      } catch (e) {
        this.inviteModal.error = 'Не удалось создать ссылку.'
      } finally {
        if (this.inviteModal) this.inviteModal.creating = false
      }
    },
    async revokeInvite(inviteId) {
      try {
        await fetch(this.apiUrls?.accessRevokeInvite, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId })
        })
      } catch (e) {
        // ignore — обновим список ниже
      }
      this.loadAccess()
    },
    async revokeGrant(userId) {
      try {
        await fetch(this.apiUrls?.accessRevokeGrant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      } catch (e) {
        // ignore — обновим список ниже
      }
      this.loadAccess()
    },
    inviteStatusLabel(status) {
      switch (status) {
        case 'active': return 'активна'
        case 'used': return 'использована'
        case 'revoked': return 'отозвана'
        case 'expired': return 'истекла'
        default: return status
      }
    },
    inviteStatusClass(status) {
      if (status === 'active') return 'cell-ok'
      if (status === 'revoked' || status === 'expired') return 'cell-err'
      return ''
    },

    /* ====== Raw payload modal ====== */
    async openRaw(kind, id) {
      // kind === 'request' → apiUrls.rawRequest, kind === 'webhook' → apiUrls.rawWebhook
      const url = kind === 'webhook' ? this.apiUrls?.rawWebhook : this.apiUrls?.rawRequest
      if (!url || !id) {
        this.rawModal = { kind, id, entry: null, loading: false, error: 'URL или id отсутствуют' }
        return
      }
      this.rawModal = { kind, id, entry: null, loading: true, error: '' }
      try {
        const sep = url.includes('?') ? '&' : '?'
        const res = await fetch(`${url}${sep}id=${encodeURIComponent(String(id))}`, {
          method: 'GET',
          headers: { Accept: 'application/json' }
        })
        const data = await res.json()
        if (!data || data.success !== true) {
          this.rawModal = { kind, id, entry: null, loading: false, error: data?.error || 'Ошибка загрузки' }
          return
        }
        this.rawModal = { kind, id, entry: data.entry || null, loading: false, error: '' }
      } catch (e) {
        this.rawModal = { kind, id, entry: null, loading: false, error: String(e) }
      }
    },
    closeRaw() {
      this.rawModal = null
    },
    rawJsonString(entry) {
      if (!entry) return ''
      try {
        return JSON.stringify(entry, null, 2)
      } catch (_e) {
        return '<unstringifiable>'
      }
    },
    clearSearch() {
      this.searchValue = ''
      this.searchResult = null
      this.searchedQuery = ''
    },
    lookupRequest(requestId) {
      if (!requestId) return
      this.searchValue = requestId
      this.doSearch()
    },
    resetBillResult() {
      this.billResult = null
      this.billSuccessData = null
    },

    /* ====== Data loaders ====== */
    async loadAnalytics() {
      const url = this.apiUrls?.analyticsSummary
      if (!url) return
      try {
        const resp = await fetch(url)
        const data = await resp.json()
        if (data.success) this.analytics = data
        this.lastUpdated.analytics = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },
    async loadRequests() {
      const url = this.apiUrls?.recentRequests
      if (!url) return
      try {
        const resp = await fetch(url + '?limit=50')
        const data = await resp.json()
        if (data.success) this.requests = data.entries || []
        this.lastUpdated.requests = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },
    async loadWebhooks() {
      const url = this.apiUrls?.recentWebhooks
      if (!url) return
      try {
        const resp = await fetch(url + '?limit=50')
        const data = await resp.json()
        if (data.success) this.webhooks = data.entries || []
        this.lastUpdated.webhooks = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },
    async doSearch() {
      const url = this.apiUrls?.searchByRequestId
      const q = (this.searchValue || '').trim()
      if (!url || !q) return
      this.searchedQuery = q
      try {
        const resp = await fetch(url + '?requestId=' + encodeURIComponent(q))
        const data = await resp.json()
        this.searchResult = data.success ? data : { request: null, webhooks: [] }
      } catch (_e) {
        this.searchResult = { request: null, webhooks: [] }
      }
    },

    /* ====== Date filter ====== */
    // Любое изменение полей даты/времени — пересчитать ms и сохранить.
    onFilterChange() {
      this.saveDateFilter()
    },
    // Синхронизировать строки полей с сохранённым на сервере фильтром (Unix ms).
    applySavedFilter(saved) {
      const from = saved && typeof saved.from === 'number' ? saved.from : null
      const to = saved && typeof saved.to === 'number' ? saved.to : null
      this.fromDate = msToLocalDate(from)
      this.fromTime = msToLocalTime(from)
      this.toDate = msToLocalDate(to)
      this.toTime = msToLocalTime(to)
    },
    async saveDateFilter() {
      const url = this.apiUrls?.filterSave
      if (!url) return
      const from = this.fromMs
      const to = this.toMs
      // Клиентская проверка диапазона до запроса — не шлём заведомо невалидное.
      if (from !== null && to !== null && from > to) {
        this.dateFilterError = 'Дата начала не может быть позже даты окончания'
        return
      }
      this.dateFilterError = ''
      this.dateFilterSaving = true
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to })
        })
        const data = await resp.json()
        if (!resp.ok || !data.success) {
          this.dateFilterError = (data && data.error) || 'Не удалось сохранить фильтр'
          return
        }
        // Источник истины — сервер: синхронизируем поля с сохранённым фильтром.
        this.applySavedFilter(data.filter || {})
        this.searchResult = null
        this.loadForTab(this.activeTab)
      } catch (e) {
        this.dateFilterError = 'Ошибка сети при сохранении фильтра'
      } finally {
        this.dateFilterSaving = false
      }
    },
    resetDateFilter() {
      this.fromDate = ''
      this.fromTime = ''
      this.toDate = ''
      this.toTime = ''
      this.saveDateFilter()
    },
    async createBill() {
      const url = this.apiUrls?.invoke
      if (!url) return
      this.billLoading = true
      this.billResult = null
      this.billSuccessData = null
      try {
        // correlationId — уникальный ключ связки счёта с входящим webhook.
        // LifePay не возвращает наш orderNumber в webhook, поэтому кладём ключ
        // и в callbackUrl (query), и в args (сервер сохранит в request_log).
        const correlationId = generateCorrelationId()
        // appendCorrelationId не бросает: при невалидном callbackUrl вернёт оригинал
        // с appended:false (correlationId уйдёт только в args, связка по query не
        // сработает). Счёт всё равно создаётся. Кейс практически недостижим: поле
        // предзаполнено валидным серверным webhookUrl, а с «битым» URL LifePay
        // не доставит webhook вовсе. Логирование на клиенте не ведём (console
        // запрещён стандартом; ctx-логгера в Vue нет).
        const cb = appendCorrelationId(this.bill.callbackUrl, correlationId)
        const args = {
          orderNumber: this.bill.orderNumber,
          amount: Number(this.bill.amount),
          customerEmail: this.bill.customerEmail,
          description: this.bill.description,
          callbackUrl: cb.url,
          correlationId
        }
        if (this.bill.customerPhone && this.bill.customerPhone.trim()) {
          args.customerPhone = this.bill.customerPhone.trim()
        }
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'createBill', args })
        })
        const data = await resp.json()
        this.billResult = data
        if (data.ok && data.data) {
          this.billSuccessData = data.data
          this.$nextTick(() => this.renderQr(data.data.paymentUrl))
        }
      } catch (e) {
        this.billResult = {
          ok: false,
          error: { code: 'CLIENT_FETCH_ERROR', message: String(e.message || e) },
          requestId: null
        }
      } finally {
        this.billLoading = false
      }
    },
    loadQrcodeLib() {
      if (typeof window === 'undefined') return
      if (window.QRCode) return
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
      s.async = true
      document.head.appendChild(s)
    },
    renderQr(paymentUrl) {
      if (!paymentUrl || typeof window === 'undefined') return
      const container = this.$refs.qrContainer
      if (!container) return
      container.innerHTML = ''
      if (!window.QRCode) {
        container.textContent = 'QR-код недоступен — qrcode.js не загружен. Используйте paymentUrl.'
        return
      }
      const canvas = document.createElement('canvas')
      container.appendChild(canvas)
      window.QRCode.toCanvas(canvas, paymentUrl, { width: 240, margin: 1 }, (err) => {
        if (err) container.innerHTML = 'Ошибка построения QR: ' + String(err)
      })
    }
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: transparent;
  position: relative;
}

/* ====== Управление доступом ====== */
.access-block {
  margin-bottom: 2rem;
}
.access-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.access-block-head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text, #e8e8e8);
}
.access-block-head h3 i {
  color: var(--color-accent, #d3234b);
  margin-right: 0.4rem;
}

.content-wrapper { padding: 1.5rem 0 2rem; }
.content-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===================== STATUS STRIP ===================== */
.status-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 1rem;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.status-chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.chip i { font-size: 0.7rem; }
.chip.is-ok {
  color: #b5dec1;
  border-color: rgba(106, 175, 126, 0.35);
  background: rgba(106, 175, 126, 0.08);
}
.chip.is-warn {
  color: #f0c989;
  border-color: rgba(212, 168, 90, 0.4);
  background: rgba(212, 168, 90, 0.08);
}
.config-status {
  position: relative;
  cursor: default;
}
.config-status-tooltip {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  z-index: 50;
  min-width: 200px;
  padding: 0.5rem 0.7rem;
  background: var(--color-bg);
  border: 1px solid rgba(212, 168, 90, 0.4);
  color: var(--color-text);
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.72rem;
  text-align: left;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
}
.config-status:hover .config-status-tooltip,
.config-status:focus-visible .config-status-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.config-status-tooltip-title {
  display: block;
  margin-bottom: 0.35rem;
  color: #f0c989;
}
.config-status-tooltip ul {
  margin: 0;
  padding-left: 1rem;
  list-style: disc;
}
.config-status-tooltip li {
  line-height: 1.5;
}

.status-webhook {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
  flex: 1 1 380px;
  min-width: 0;
  justify-content: flex-end;
}
.status-webhook-label {
  text-transform: uppercase;
  white-space: nowrap;
}
.status-webhook-label i {
  margin-right: 0.3rem;
  color: var(--color-accent);
}
.status-webhook-url {
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 0 1 auto;
}

/* ===================== TOOLBAR ===================== */
.panel-toolbar {
  display: flex;
  flex-direction: column;
  padding: 0 0.75rem;
  background: rgba(20, 20, 20, 0.65);
  border: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.toolbar-row {
  display: flex;
  align-items: center;
  width: 100%;
}
.toolbar-row--tabs {
  padding: 0.5rem 0;
}
.toolbar-row--tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-border-light);
}
.panel-tabs {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 0.45rem 0.85rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.tab::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px);
  pointer-events: none;
  z-index: 0;
}
.tab::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: 2;
}
.tab i, .tab span { position: relative; z-index: 2; }
.tab:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}
.tab:hover::after { transform: scaleX(1); }
.tab.active {
  color: var(--color-text);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}
.tab.active::after { transform: scaleX(1); }

/* live toggle */
.live-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}
.live-toggle input { display: none; }
.live-dot {
  width: 0.5rem; height: 0.5rem;
  border-radius: 50%;
  background: #4a4a4a;
  box-shadow: 0 0 0 2px rgba(74, 74, 74, 0.15);
  transition: background 0.2s, box-shadow 0.2s;
}
.live-toggle.on {
  color: var(--color-text);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}
.live-toggle.on .live-dot {
  background: #d97a8a;
  box-shadow: 0 0 0 2px rgba(217, 122, 138, 0.2);
  animation: live-pulse 1.5s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

/* date filter */
.date-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  flex-wrap: wrap;
  min-width: 0;
}
.date-filter-icon {
  color: var(--color-accent);
  font-size: 0.8rem;
}
.date-filter-field {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.date-filter-cap {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.date-filter-input {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  font-family: inherit;
  color-scheme: dark;
}
.date-filter-sep {
  color: var(--color-text-tertiary);
}
.date-filter-reset {
  white-space: nowrap;
}
.date-filter-error {
  color: #f0a0a0;
  font-size: 0.68rem;
  max-width: 220px;
}

/* quick search */
.quick-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 200px;
  max-width: 480px;
  min-width: 0;
}
.quick-search-icon {
  position: absolute;
  left: 0.6rem;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  pointer-events: none;
}
.quick-search-input {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.35rem 1.85rem 0.35rem 1.85rem;
  font-family: inherit;
  letter-spacing: inherit;
  font-size: 0.75rem;
  width: 100%;
  min-width: 0;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.quick-search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(211, 35, 75, 0.25);
}
.quick-search-clear {
  position: absolute;
  right: 0.35rem;
  background: transparent;
  border: 0;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.15rem 0.35rem;
}
.quick-search-clear:hover { color: var(--color-accent); }

/* ===================== PANEL SECTIONS ===================== */
.panel-section {
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid var(--color-border);
  padding: 1.25rem 1.25rem 1rem;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}
.panel-section::before,
.panel-section::after {
  content: '';
  position: absolute;
  top: 8px;
  width: 16px; height: 16px;
  border-top: 2px solid rgba(211, 35, 75, 0.35);
  pointer-events: none;
}
.panel-section::before { left: 8px;  border-left:  2px solid rgba(211, 35, 75, 0.35); }
.panel-section::after  { right: 8px; border-right: 2px solid rgba(211, 35, 75, 0.35); }

.panel-section-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.panel-section-head h2 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 0 5px rgba(211, 35, 75, 0.25);
}
.panel-section-head .prompt {
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1;
}
.panel-section-head .head-action {
  margin-left: auto;
}
.panel-section-head .head-meta { margin-left: auto; font-size: 0.7rem; }
.updated-since {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  margin-left: 0.6rem;
}
.search-h3 {
  margin: 1rem 0 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* search result section accent */
.search-result-section { border-color: var(--color-accent); }
.search-result-section::before,
.search-result-section::after { border-color: var(--color-accent); }
.search-query {
  margin-left: 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text);
  background: var(--color-bg);
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--color-border);
}

/* ===================== KPI ===================== */
.manager-summary {
  margin-bottom: 1.1rem;
}
.admin-summary .kpi-grid + .kpi-grid {
  margin-top: 0.9rem;
}
.summary-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.7rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text);
}
.summary-title .prompt {
  color: var(--color-accent);
}
.summary-period {
  margin-left: 0.5rem;
  font-size: 0.72rem;
  text-transform: none;
  letter-spacing: normal;
  color: var(--color-accent);
  font-weight: normal;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
}
.kpi-grid-secondary { grid-template-columns: repeat(4, 1fr); }
.kpi-card {
  position: relative;
  background: rgba(20, 20, 20, 0.65);
  border: 1px solid var(--color-border);
  padding: 1.1rem 1.25rem;
  overflow: hidden;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}
.kpi-card::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px);
  pointer-events: none;
  z-index: 0;
}
.kpi-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.5;
}
.kpi-icon, .kpi-label, .kpi-value { position: relative; z-index: 1; }
.kpi-icon {
  font-size: 1rem;
  color: var(--color-accent);
  margin-bottom: 0.4rem;
}
.kpi-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.kpi-value {
  font-size: 1.85rem;
  color: var(--color-text);
  margin-top: 0.3rem;
  text-shadow: 0 0 8px rgba(232, 232, 232, 0.2);
  line-height: 1;
}
.kpi-unit { font-size: 0.85rem; color: var(--color-text-tertiary); margin-left: 0.2rem; }
.kpi-success .kpi-icon { color: #6aaf7e; }
.kpi-success .kpi-value { text-shadow: 0 0 8px rgba(106, 175, 126, 0.25); }

.stat-card {
  position: relative;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  padding: 0.7rem 0.85rem;
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.stat-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.35;
}
.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.stat-label i { margin-right: 0.3rem; color: var(--color-accent); opacity: 0.85; }
.stat-value {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-top: 0.15rem;
  line-height: 1.1;
}
.stat-value.small { font-size: 0.95rem; }
.stat-unit { font-size: 0.7rem; color: var(--color-text-tertiary); margin-left: 0.15rem; }

/* ===================== FEED GRID ===================== */
.feed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}

/* ===================== FILTER PILLS ===================== */
.filter-pills {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 0.3rem 0.7rem;
  font-family: inherit;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.pill:hover { color: var(--color-text); border-color: var(--color-border-light); }
.pill.active {
  color: var(--color-text);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}
.pill-count {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  background: rgba(0,0,0,0.3);
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--color-border);
}
.pill.active .pill-count {
  color: var(--color-text);
  border-color: var(--color-accent);
}

/* ===================== TABLES ===================== */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  background: rgba(10, 10, 10, 0.65);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.data-table th,
.data-table td {
  padding: 0.45rem 0.6rem;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
}
.data-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.65rem;
  border-bottom: 1px solid var(--color-border-light);
}
.data-table tbody tr:hover { background: rgba(211, 35, 75, 0.05); }
.data-table tbody tr:last-child td { border-bottom: 0; }
.data-table .row-clickable { cursor: pointer; }
.data-table .row-error {
  background: rgba(217, 122, 138, 0.06);
  box-shadow: inset 3px 0 0 #d97a8a;
}
.data-table .row-warn {
  background: rgba(212, 168, 90, 0.06);
  box-shadow: inset 3px 0 0 #d4a85a;
}
.data-table td.cell-ok { color: #6aaf7e; }
.data-table td.cell-err { color: #d97a8a; }
.data-table td.cell-warn { color: #d4a85a; }
.data-table .cell-id {
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
}
.data-table code {
  color: var(--color-text);
  font-size: 0.75rem;
}
.data-table-vertical th {
  width: 180px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-right: 1px solid var(--color-border);
}
.compact-table th,
.compact-table td {
  padding: 0.35rem 0.5rem;
  font-size: 0.72rem;
}
.json-block {
  margin: 0;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
}
.dup-badge {
  display: inline-block;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d4a85a;
  background: rgba(212, 168, 90, 0.1);
  border: 1px solid rgba(212, 168, 90, 0.4);
  padding: 0.1rem 0.35rem;
}

/* ===================== EMPTY STATES ===================== */
.empty-state {
  padding: 1.75rem 1rem;
  text-align: center;
  color: var(--color-text-tertiary);
  border: 1px dashed var(--color-border);
  background: rgba(10, 10, 10, 0.4);
}
.empty-icon {
  font-size: 1.5rem;
  color: var(--color-text-tertiary);
  opacity: 0.6;
  display: block;
  margin-bottom: 0.5rem;
}
.empty-title {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
  letter-spacing: 0.04em;
}
.empty-hint {
  margin: 0;
  font-size: 0.75rem;
}
.link-button {
  background: transparent;
  border: 0;
  border-bottom: 1px dashed var(--color-accent);
  color: var(--color-accent);
  font: inherit;
  letter-spacing: inherit;
  padding: 0;
  cursor: pointer;
}
.link-button:hover { color: var(--color-accent-hover); border-color: var(--color-accent-hover); }

/* ===================== SETTINGS ===================== */
/* Форма настроек LifePay перенесена на страницу настроек проекта (/web/admin).
   Класс ниже переиспользуется модалкой создания пригласительной ссылки. */
.settings-save-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
}

/* ===================== FORMS ===================== */
.grid-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.85rem 1rem;
  align-items: start;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field-full { grid-column: 1 / -1; }
.field-label {
  font-size: 0.68rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.field-required { color: var(--color-accent); margin-left: 0.2rem; }
.field-hint {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
}
.field-hint code {
  color: var(--color-text);
  background: var(--color-bg);
  padding: 0.05rem 0.3rem;
  border: 1px solid var(--color-border);
}
.field-input {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.5rem 0.7rem;
  font-family: inherit;
  letter-spacing: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(211, 35, 75, 0.25);
}
.field-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.field-row .field-input { flex: 1; }

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.form-msg {
  margin: 0;
  font-size: 0.78rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.form-msg.is-ok { color: #6aaf7e; }
.form-msg.is-err { color: #d97a8a; }
.hint {
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  margin: 0 0 0.85rem;
  line-height: 1.45;
}
.hint code {
  color: var(--color-text);
  background: var(--color-bg);
  padding: 0.05rem 0.3rem;
  border: 1px solid var(--color-border);
}
.muted {
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  margin: 0;
}
.muted i { margin-right: 0.3rem; }

/* ===================== BUTTONS ===================== */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.72rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  text-decoration: none;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.btn-primary {
  background: var(--color-accent);
  color: #fff;
  border: 1px solid var(--color-accent);
  padding: 0.55rem 1.1rem;
  box-shadow:
    0 4px 12px rgba(211, 35, 75, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(211, 35, 75, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  padding: 0.45rem 0.9rem;
}
.btn-secondary:hover {
  color: var(--color-text);
  border-color: var(--color-accent);
}
.btn-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: transparent;
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  padding: 0.15rem 0.4rem;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  margin-left: 0.35rem;
  transition: color 0.2s, border-color 0.2s;
}
.btn-mini:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

/* ===================== BILL RESULT ===================== */
.bill-result {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  position: relative;
}
.bill-result-ok { border-color: rgba(106, 175, 126, 0.4); }
.bill-result-err { border-color: rgba(217, 122, 138, 0.4); }
.bill-meta {
  margin: 0.5rem 0;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}
.bill-success p { margin: 0.3rem 0; font-size: 0.8rem; }
.bill-success code,
.bill-meta code {
  color: var(--color-text);
  background: var(--color-bg-tertiary);
  padding: 0.1rem 0.35rem;
  border: 1px solid var(--color-border);
}
.bill-success .paymenturl { word-break: break-all; display: inline-block; }
.qr-block { margin-top: 0.85rem; }
.qr-container {
  background: #fff;
  padding: 0.5rem;
  display: inline-block;
  margin-top: 0.4rem;
}
.bill-action { margin-top: 0.85rem; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-grid-secondary { grid-template-columns: repeat(2, 1fr); }
  .feed-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .content-wrapper { padding: 1rem 0 1.5rem; }
  .content-inner { padding: 0 1rem; gap: 1rem; }
  .panel-section { padding: 1rem 0.9rem 0.85rem; }
  .status-strip { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .status-webhook { flex: 0 0 auto; width: 100%; justify-content: flex-start; }
  .panel-toolbar { position: static; }
  .quick-search { flex: 1 1 100%; }
  .kpi-grid, .kpi-grid-secondary { grid-template-columns: 1fr 1fr; }
  .kpi-value { font-size: 1.4rem; }
  .grid-form { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; align-items: flex-start; }
  .data-table { font-size: 0.72rem; }
}
@media (max-width: 480px) {
  .kpi-grid, .kpi-grid-secondary { grid-template-columns: 1fr; }
  .tab span { display: none; }
  .tab { padding: 0.5rem 0.65rem; }
  .date-filter { flex-direction: column; align-items: flex-start; width: 100%; }
  .date-filter-sep { display: none; }
  .date-filter-field { width: 100%; min-width: 0; }
  .date-filter-field .date-filter-input { flex: 1; min-width: 0; }
}

/* ====== RAW PAYLOAD MODAL ====== */
.raw-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(2px);
}
.raw-modal {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  width: 100%;
  max-width: 980px;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(211, 35, 75, 0.15);
}
.raw-modal-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}
.raw-modal-head h2 {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  flex: 1;
}
.raw-modal-head .muted {
  margin-left: 0.4rem;
  color: var(--color-text-tertiary);
  font-weight: 400;
}
.raw-modal-body {
  padding: 1rem;
  overflow: auto;
  flex: 1;
}
.raw-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.raw-modal-body .json-block {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.78rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0;
  color: var(--color-text);
  max-height: 70vh;
  overflow: auto;
}
@media (max-width: 768px) {
  .raw-modal-backdrop { padding: 0.5rem; }
  .raw-modal { max-height: 96vh; }
}
</style>
