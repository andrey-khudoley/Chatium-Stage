<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Header from '../components/Header.vue'
import AppFooter from '../components/AppFooter.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('HomePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectName: string
  projectTitle: string
  projectDescription: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
}>()

const bootLoaderDone = ref(false)

function startAnimations() {
  log.info('Boot loader complete')
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})
</script>

<template>
  <div
    class="app-layout"
    :class="{ 'app-layout-visible': bootLoaderDone }"
  >
    <Header
      v-if="bootLoaderDone"
      :projectTitle="props.projectTitle"
      :logoUrl="props.logoUrl"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
      :testsUrl="props.testsUrl"
    />
    <main class="content-wrapper">
      <section class="hero" :class="{ 'hero-visible': bootLoaderDone }">
        <div class="hero-content">
          <p class="hero-label">Добро пожаловать</p>
          <h1 class="hero-title">{{ props.projectName }}</h1>
          <p class="hero-subtitle">{{ props.projectDescription }}</p>
          <div class="hero-actions">
            <a
              v-if="props.isAuthenticated && props.testsUrl"
              :href="props.testsUrl"
              class="hero-btn hero-btn-primary"
            >
              Тесты
            </a>
            <a
              v-if="props.isAuthenticated && props.profileUrl"
              :href="props.profileUrl"
              class="hero-btn hero-btn-secondary"
            >
              Профиль
            </a>
            <a
              v-if="!props.isAuthenticated && props.loginUrl"
              :href="props.loginUrl"
              class="hero-btn hero-btn-primary"
            >
              Войти
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-shape hero-shape-a"></div>
          <div class="hero-shape hero-shape-b"></div>
        </div>
      </section>
    </main>
    <AppFooter v-if="bootLoaderDone" @chatium-click="() => window.open('https://chatium.ru', '_blank')" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.app-layout-visible {
  opacity: 1;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  padding: 2rem 0 3rem;
}

.hero {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: center;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.hero-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-label {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-green);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 0.5rem 0;
}

.hero-title {
  font-family: 'Old Standard TT', serif;
  font-weight: 700;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  letter-spacing: 0.02em;
}

.hero-subtitle {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 1.125rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 1.75rem 0;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.hero-btn-primary {
  color: var(--color-bg);
  background: var(--color-green);
}

.hero-btn-primary:hover {
  background: var(--color-green-medium);
  box-shadow: 0 4px 14px rgba(70, 240, 210, 0.25);
}

.hero-btn-secondary {
  color: var(--color-green);
  background: var(--color-green-pale);
  border: 2px solid transparent;
}

.hero-btn-secondary:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.hero-visual {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.9;
}

.hero-shape-a {
  width: min(280px, 80vw);
  height: min(280px, 80vw);
  background: linear-gradient(135deg, var(--color-green-pale) 0%, var(--color-green-light) 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hero-shape-b {
  width: min(160px, 45vw);
  height: min(160px, 45vw);
  background: linear-gradient(145deg, var(--color-gold-light) 0%, var(--color-gold) 100%);
  top: 50%;
  left: 50%;
  transform: translate(-40%, -60%);
  box-shadow: 0 8px 24px rgba(253, 199, 96, 0.35);
}

@media (min-width: 768px) {
  .hero {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  .hero-visual {
    min-height: 320px;
  }
}
</style>
