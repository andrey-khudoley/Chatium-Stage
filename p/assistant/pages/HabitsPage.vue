<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import SectionNav from '../components/SectionNav.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('HabitsPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  calendarUrl: string
  myDayUrl: string
  weekUrl: string
  habitsUrl: string
  notebookUrl: string
}>()

const bootLoaderDone = ref(false)
const currentSection = 'habits' as const

const startAnimations = () => {
  bootLoaderDone.value = true
  log.info('Boot loader complete')
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div class="app-layout section-page-layout">
    <GlobalGlitch />
    <Header
      v-if="bootLoaderDone"
      :projectTitle="props.projectTitle"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
      :testsUrl="props.testsUrl"
    />
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <SectionNav
          :indexUrl="props.indexUrl"
          :calendarUrl="props.calendarUrl"
          :myDayUrl="props.myDayUrl"
          :weekUrl="props.weekUrl"
          :habitsUrl="props.habitsUrl"
          :notebookUrl="props.notebookUrl"
          :currentSection="currentSection"
        />
        <section class="section-content">
          <h1 class="section-heading">Привычки</h1>
          <p class="section-stub">Раздел в разработке</p>
        </section>
      </div>
    </main>
    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.section-page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 1rem 0;
}

.content-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-content {
  padding: 0.5rem 0;
}

.section-heading {
  font-size: 1.75rem;
  font-weight: 400;
  margin: 0 0 0.75rem;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.section-stub {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

@media (max-width: 768px) {
  .content-inner {
    padding: 0 1rem;
  }

  .section-heading {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-inner {
    padding: 0 0.75rem;
  }

  .section-heading {
    font-size: 1.25rem;
  }
}
</style>
