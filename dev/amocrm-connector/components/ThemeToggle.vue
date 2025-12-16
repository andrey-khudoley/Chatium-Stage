<template>
  <button
    @click="toggleTheme"
    class="theme-toggle"
    :class="{ 'dark': isDark }"
    :title="isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'"
  >
    <i v-if="isDark" class="fas fa-sun"></i>
    <i v-else class="fas fa-moon"></i>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  // Проверяем сохранённую тему
  const savedTheme = localStorage.getItem('theme')
  
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  } else {
    // Если нет сохранённой темы, используем системную
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    }
  }
})

function toggleTheme() {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 1.5px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: var(--transition);
  z-index: 1000;
  color: var(--color-text);
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

.theme-toggle:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.theme-toggle:active {
  box-shadow: var(--shadow-sm);
}

.theme-toggle.dark {
  color: var(--color-primary);
}

.theme-toggle:not(.dark) {
  color: var(--color-primary);
}

.theme-toggle i {
  transition: opacity 0.2s ease;
}
</style>

