<script setup lang="ts">
import { onMounted, ref } from 'vue'

const isDark = ref(true)

const resolveTheme = () => {
  if (typeof window !== 'undefined' && window.__getTheme) {
    return window.__getTheme()
  }
  try {
    const raw = localStorage.getItem('neso_theme')
    return raw === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const applyTheme = (theme: 'dark' | 'light') => {
  if (typeof window !== 'undefined' && window.__setTheme) {
    window.__setTheme(theme)
  } else {
    document.documentElement.dataset.theme = theme
  }
  isDark.value = theme === 'dark'
}

const toggleTheme = () => {
  const next = isDark.value ? 'light' : 'dark'
  applyTheme(next)
}

onMounted(() => {
  const theme = resolveTheme()
  isDark.value = theme === 'dark'
})
</script>

<template>
  <label class="toggle-row" aria-label="Переключить тему">
    <span>{{ isDark ? 'Тёмная тема' : 'Светлая тема' }}</span>
    <input class="toggle" type="checkbox" :checked="isDark" @change="toggleTheme">
  </label>
</template>
