<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Header from '../components/Header.vue'
import AppFooter from '../components/AppFooter.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('ProfilePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  user: {
    displayName?: string
    confirmedEmail?: string
    confirmedPhone?: string
  }
}>()

const bootLoaderDone = ref(false)

function startAnimations() {
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if ((window as Window & { bootLoaderComplete?: boolean }).bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})
</script>

<template>
  <div class="app-layout">
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
      <div class="content-inner">
        <section class="profile-section" :class="{ 'profile-visible': bootLoaderDone }">
          <h1 class="profile-title">Профиль</h1>
          <div class="profile-card">
            <div class="profile-field">
              <span class="profile-label">Имя</span>
              <span class="profile-value">{{ props.user.displayName || 'Не указано' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-label">Email</span>
              <span class="profile-value">{{ props.user.confirmedEmail || 'Не подтверждён' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-label">Телефон</span>
              <span class="profile-value">{{ props.user.confirmedPhone || 'Не подтверждён' }}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
    <AppFooter
      v-if="bootLoaderDone"
      @chatium-click="() => window.open('https://chatium.ru', '_blank')"
    />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 2rem 0;
}

.content-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.profile-section {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.profile-section.profile-visible {
  opacity: 1;
}

.profile-title {
  font-family: 'Old Standard TT', serif;
  font-weight: 700;
  font-size: 2rem;
  color: var(--color-text);
  margin: 0 0 1.5rem 0;
}

.profile-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-green);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(26, 46, 31, 0.06);
}

.profile-field {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-field:last-of-type {
  border-bottom: none;
}

.profile-label {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}

.profile-value {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 1rem;
  color: var(--color-text);
}
</style>
