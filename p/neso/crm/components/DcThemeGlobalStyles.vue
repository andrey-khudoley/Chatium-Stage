<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { getGlobalThemeStyles, getThemeStyleElementId } from '../shared/themeStyles'

/** Компонент подключает общие стили страницы (токены, body, скроллбар, фикс герой-карточки). */
const props = defineProps<{
  theme?: 'dark' | 'light'
}>()

const styleId = getThemeStyleElementId()

function injectStyles(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  let el = document.getElementById(styleId) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = styleId
    document.head.appendChild(el)
  }
  el.textContent = getGlobalThemeStyles(theme)
}

onMounted(() => {
  injectStyles(props.theme ?? 'dark')
})

watch(
  () => props.theme,
  (theme) => {
    if (theme) injectStyles(theme)
  },
  { immediate: false }
)
</script>

<template>
  <!-- Стили инжектятся в head при монтировании; компонент не рендерит разметку -->
  <template />
</template>
