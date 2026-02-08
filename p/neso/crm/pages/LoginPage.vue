<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { DcPageBackground } from '../components'

const log = createComponentLogger('LoginPage')

const props = defineProps<{
  back: string
}>()

const theme = 'dark' as const
const bootLoaderDone = ref(false)

const signinUrl = computed(() => `/s/auth/signin?back=${encodeURIComponent(props.back)}`)

onMounted(() => {
  if (window.bootLoaderComplete) {
    bootLoaderDone.value = true
  } else {
    window.addEventListener('bootloader-complete', () => {
      bootLoaderDone.value = true
    })
  }
  log.info('Component mounted', { signinUrl: signinUrl.value })
})
</script>

<template>
  <DcPageBackground :theme="theme" />
  <div class="login-wrap" :class="{ 'login-wrap--ready': bootLoaderDone }">
    <div class="login-card">
      <h1 class="login-title">NeSo CRM</h1>
      <p class="login-subtitle">Войдите в аккаунт</p>
      <a :href="signinUrl" class="login-btn">
        <i class="fas fa-right-to-bracket"></i>
        <span>Войти</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.login-wrap--ready {
  opacity: 1;
}
.login-card {
  width: min(400px, 100%);
  padding: 32px;
  background: var(--surface, #11191b);
  border-radius: 24px;
  border: 1px solid rgba(175, 196, 95, 0.2);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34);
  text-align: center;
}
.login-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary, #eef4eb);
}
.login-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary, rgba(238, 244, 235, 0.75));
  margin: 0 0 24px 0;
}
.login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--accent, #afc45f);
  color: #05080a;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(175, 196, 95, 0.35);
}
</style>
