<template>
  <section class="panel-section">
    <header class="panel-section-head">
      <span class="prompt">›</span>
      <h2>Создать счёт вручную</h2>
      <span class="head-meta muted">Тестовый вызов <code>createBill</code> через gateway</span>
    </header>
    <form class="grid-form" @submit.prevent="$emit('submit')">
      <label class="field">
        <span class="field-label">orderNumber <span class="field-required">*</span></span>
        <input
          :value="bill.orderNumber"
          @input="updateField('orderNumber', $event.target.value)"
          type="text"
          required
          class="field-input"
        />
      </label>
      <label class="field">
        <span class="field-label">amount, рубли <span class="field-required">*</span></span>
        <input
          :value="bill.amount"
          @input="updateField('amount', toNumber($event.target.value))"
          type="number"
          step="0.01"
          min="0.01"
          required
          class="field-input"
        />
      </label>
      <label class="field">
        <span class="field-label">customerEmail <span class="field-required">*</span></span>
        <input
          :value="bill.customerEmail"
          @input="updateField('customerEmail', $event.target.value)"
          type="email"
          required
          class="field-input"
        />
      </label>
      <label class="field">
        <span class="field-label">description <span class="field-required">*</span></span>
        <input
          :value="bill.description"
          @input="updateField('description', $event.target.value)"
          type="text"
          required
          class="field-input"
        />
      </label>
      <label class="field field-full">
        <span class="field-label">callbackUrl <span class="field-required">*</span></span>
        <input
          :value="bill.callbackUrl"
          @input="updateField('callbackUrl', $event.target.value)"
          type="url"
          required
          class="field-input"
        />
        <span class="field-hint"
          >Адрес для входящего webhook от LifePay. Авто-подставлен из настроек.</span
        >
      </label>
      <label class="field">
        <span class="field-label">customerPhone</span>
        <input
          :value="bill.customerPhone"
          @input="updateField('customerPhone', $event.target.value)"
          type="text"
          placeholder="7XXXXXXXXXX"
          class="field-input"
        />
      </label>
      <div class="form-actions field-full">
        <button type="submit" class="btn-primary" :disabled="billLoading">
          <i class="fas" :class="billLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
          {{ billLoading ? 'Отправка...' : 'Создать счёт' }}
        </button>
        <button
          v-if="billResult"
          type="button"
          class="btn-secondary"
          @click="$emit('reset-result')"
        >
          <i class="fas fa-eraser"></i> Очистить результат
        </button>
      </div>
    </form>

    <div
      v-if="billResult"
      class="bill-result"
      :class="billResult.ok ? 'bill-result-ok' : 'bill-result-err'"
    >
      <p v-if="billResult.ok" class="form-msg is-ok">
        <i class="fas fa-circle-check"></i> Счёт создан
      </p>
      <p v-else class="form-msg is-err">
        <i class="fas fa-circle-exclamation"></i>
        Ошибка: {{ billResult.error?.code }} — {{ billResult.error?.message }}
      </p>
      <p v-if="billResult.requestId" class="bill-meta">
        requestId: <code>{{ billResult.requestId }}</code>
        <button
          class="btn-mini"
          @click="$emit('lookup', billResult.requestId)"
          title="Открыть в журнале"
        >
          <i class="fas fa-magnifying-glass"></i> найти
        </button>
        <button
          class="btn-mini"
          @click="$emit('copy-text', billResult.requestId)"
          title="Скопировать"
        >
          <i class="far fa-copy"></i>
        </button>
      </p>
      <div v-if="billSuccessData" class="bill-success">
        <p>
          billNumber: <code>{{ billSuccessData.billNumber }}</code>
        </p>
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
</template>

<script>
// Презентация вкладки «Создать счёт»: форма + результат + QR-код.
// Поля формы — двусторонняя связь через update:bill (orchestrator пересоздаёт объект bill).
// Сабмит и сопутствующие действия — через emit. QR рендерится тут: при появлении
// billSuccessData с paymentUrl вызываем window.QRCode (lib грузит orchestrator).
// CSS глобальный (sbpHomeCss*).
export default {
  name: 'HomeCreateBillTab',
  props: {
    bill: { type: Object, required: true },
    billLoading: { type: Boolean, default: false },
    billResult: { type: Object, default: null },
    billSuccessData: { type: Object, default: null }
  },
  emits: ['submit', 'reset-result', 'lookup', 'copy-text', 'update:bill'],
  watch: {
    billSuccessData: {
      handler(val) {
        if (val && val.paymentUrl) {
          this.$nextTick(() => this.renderQr(val.paymentUrl))
        }
      },
      immediate: false
    }
  },
  methods: {
    toNumber(v) {
      const n = Number(v)
      return Number.isFinite(n) ? n : v
    },
    updateField(key, value) {
      const next = { ...(this.bill || {}) }
      next[key] = value
      this.$emit('update:bill', next)
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
