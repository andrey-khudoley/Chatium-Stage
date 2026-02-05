<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('LoginPage')

const props = defineProps<{
  back: string
}>()

const signinUrl = computed(() => `/s/auth/signin?back=${encodeURIComponent(props.back)}`)

onMounted(() => {
  log.info('LoginPage mounted', { signinUrl: signinUrl.value })
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">Вход</h1>
      <p class="login-desc">Для доступа к проекту необходимо авторизоваться.</p>
      <a :href="signinUrl" class="login-btn">Войти</a>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--color-bg);
}

.login-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-green);
  border-radius: 12px;
  padding: 2rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.login-title {
  font-family: 'Old Standard TT', serif;
  font-weight: 700;
  font-size: 1.75rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.login-desc {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem 0;
}

.login-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-bg);
  background: var(--color-green);
  border: none;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.login-btn:hover {
  background: var(--color-green-medium);
  box-shadow: 0 4px 14px rgba(70, 240, 210, 0.25);
}
</style>
