<template>
  <div class="crm-inline crm-lang-switcher">
    <i class="fas fa-language" aria-hidden="true"></i>
    <select class="crm-select crm-lang-select" :value="localeValue" @change="onChange">
      <option v-for="option in localeOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiI18n, type UiLocale } from '../../shared/design/i18n'

const props = withDefaults(defineProps<{
  initialLocale?: string
}>(), {
  initialLocale: 'ru'
})

const { locale, localeOptions, setLocale } = useUiI18n(props.initialLocale)

const emit = defineEmits<{ changed: [UiLocale] }>()

const localeValue = computed(() => locale.value)

function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value === 'en' ? 'en' : 'ru'
  setLocale(value)
  emit('changed', value)
}
</script>

<style scoped>
.crm-lang-switcher {
  width: 11.2rem;
}

.crm-lang-select {
  min-width: 9.2rem;
  padding-right: 1.8rem;
}
</style>
