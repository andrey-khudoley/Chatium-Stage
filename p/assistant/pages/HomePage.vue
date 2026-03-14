<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('HomePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    triggerGlobalGlitch?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectName: string
  projectTitle: string
  projectDescription: string
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

const sectionLinks = [
  { id: 'calendar', label: 'Календарь', url: () => props.calendarUrl, icon: 'fa-calendar-days' },
  { id: 'my-day', label: 'Мой день', url: () => props.myDayUrl, icon: 'fa-sun' },
  { id: 'week', label: 'Неделя', url: () => props.weekUrl, icon: 'fa-calendar-week' },
  { id: 'habits', label: 'Привычки', url: () => props.habitsUrl, icon: 'fa-repeat' },
  { id: 'notebook', label: 'Блокнот', url: () => props.notebookUrl, icon: 'fa-book' }
]

const displayedTitle = ref('')
const displayedDescription = ref('')
const showCursor = ref(false)
const bootLoaderDone = ref(false)
const cursorPosition = ref<'title' | 'description' | 'final'>('title')
const showTitleUnderline = ref(false)
const isGlitching = ref(false)

const intervalIds = { title: null as ReturnType<typeof setInterval> | null, desc: null as ReturnType<typeof setInterval> | null }

const onAppLayoutAnimationEnd = (e: AnimationEvent) => {
  if (e.animationName === 'crt-power-on') {
    (e.target as HTMLElement).classList.add('app-layout-appeared')
    log.debug('App layout animation completed')
  }
}

const typeTextSequence = () => {
  log.debug('Typing title animation started')
  const titleText = props.projectName
  cursorPosition.value = 'title'
  let titleIndex = 0
  intervalIds.title = setInterval(() => {
    if (titleIndex < titleText.length) {
      displayedTitle.value = titleText.substring(0, titleIndex + 1)
      titleIndex++
    } else {
      if (intervalIds.title) clearInterval(intervalIds.title)
      intervalIds.title = null
      showTitleUnderline.value = true
      typeDescription()
    }
  }, 30)
}

const typeDescription = () => {
  log.debug('Typing description animation started')
  const descriptionText = props.projectDescription
  cursorPosition.value = 'description'
  let descIndex = 0
  intervalIds.desc = setInterval(() => {
    if (descIndex < descriptionText.length) {
      displayedDescription.value = descriptionText.substring(0, descIndex + 1)
      descIndex++
    } else {
      if (intervalIds.desc) clearInterval(intervalIds.desc)
      intervalIds.desc = null
      cursorPosition.value = 'final'
    }
  }, 30)
}

const startAnimations = () => {
  log.info('Boot loader complete, starting animations')
  bootLoaderDone.value = true
  showCursor.value = true
  cursorPosition.value = 'title'
  setTimeout(() => typeTextSequence(), 1000)
}

onMounted(() => {
  log.info('Component mounted')
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

onUnmounted(() => {
  log.info('Component unmounted')
  window.removeEventListener('bootloader-complete', startAnimations)
  if (intervalIds.title) clearInterval(intervalIds.title)
  if (intervalIds.desc) clearInterval(intervalIds.desc)
})

const triggerGlitch = () => {
  if (isGlitching.value) return
  log.notice('Global glitch effect triggered')
  isGlitching.value = true

  const appLayout = document.querySelector('.app-layout')
  if (appLayout) {
    appLayout.classList.add('global-glitch-active')
    setTimeout(() => {
      appLayout.classList.remove('global-glitch-active')
      isGlitching.value = false
    }, 500)
  } else {
    log.warning('App layout element not found for glitch')
    isGlitching.value = false
  }
}

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
  triggerGlitch()
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div
    class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col"
    @animationend="onAppLayoutAnimationEnd"
  >
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
    <!-- Content -->
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <!-- Hero Section -->
        <section class="hero-section" :class="{ 'hero-ready': bootLoaderDone }">
          <h1 class="hero-title">
            {{ displayedTitle }}<span v-if="showCursor && (cursorPosition === 'title' || cursorPosition === 'final')" class="typing-cursor">▮</span>
          </h1>
          <p class="hero-subtitle">
            {{ displayedDescription }}<span v-if="showCursor && cursorPosition === 'description'" class="typing-cursor">▮</span>
          </p>
        </section>

        <!-- Разделы приложения -->
        <section class="sections-section" :class="{ 'sections-visible': bootLoaderDone }">
          <div class="sections-grid">
            <a
              v-for="(item, index) in sectionLinks"
              :key="item.id"
              :href="item.url()"
              class="section-card"
              :style="{ '--card-index': index }"
            >
              <i class="fas" :class="item.icon"></i>
              <span class="card-label">{{ item.label }}</span>
            </a>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style>
/* Глобальное правило: скрываем курсор на главной странице при hover на хедер */
.app-layout:has(.header-title-section:hover) .typing-cursor {
  opacity: 0 !important;
}
</style>

<style>
:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-tertiary: #1a1a1a;
  --color-text: #e8e8e8;
  --color-text-secondary: #a0a0a0;
  --color-text-tertiary: #707070;
  --color-border: #2a2a2a;
  --color-border-light: #3a3a3a;
  --color-accent: #d3234b;
  --color-accent-hover: #e6395f;
  --color-accent-light: rgba(211, 35, 75, 0.1);
  --color-accent-medium: rgba(211, 35, 75, 0.2);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  margin: 0;
  background: var(--color-bg);
  letter-spacing: 0.03em;
}

::selection {
  background: #e0335a;
  color: #ffffff;
}

::-moz-selection {
  background: #e0335a;
  color: #ffffff;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  position: relative;
}

.hidden-for-modal {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

.content-hidden {
  transition: opacity 0.3s ease;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 100;
  padding: 3rem 0;
}

.content-inner {
  width: 100%;
  max-width: 900px;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
  position: relative;
  z-index: 10;
}

/* Hero Section */
.hero-section {
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.hero-section.hero-ready {
  opacity: 1;
  transform: translateY(0);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: 0.1em;
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
}

.typing-cursor {
  display: inline-block;
  margin-left: 0.25rem;
  animation: terminal-cursor-blink 1s step-end infinite;
  color: var(--color-accent);
}

@keyframes terminal-cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hero-subtitle {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: 0;
  letter-spacing: 0.05em;
}

/* Sections */
.sections-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.sections-section.sections-visible {
  opacity: 1;
  transform: translateY(0);
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.section-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2.5rem 1.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  opacity: 0;
  animation: card-appear 0.5s ease calc(var(--card-index) * 0.1s) forwards;
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-card i {
  font-size: 2.5rem;
  color: var(--color-accent);
  transition: all 0.3s ease;
}

.card-label {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.section-card:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-accent);
  transform: translateY(-3px);
}

.section-card:hover i {
  transform: scale(1.1);
  filter: drop-shadow(0 0 15px rgba(211, 35, 75, 0.6));
}

.section-card:hover .card-label {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .content-inner {
    padding: 0 1.5rem;
    gap: 3rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 0.9375rem;
  }
  
  .sections-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

@media (max-width: 480px) {
  .content-inner {
    padding: 0 1rem;
    gap: 2.5rem;
  }
  
  .content-wrapper {
    padding: 2rem 0;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 0.875rem;
  }
  
  .sections-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .section-card {
    padding: 2rem 1rem;
  }
  
  .section-card i {
    font-size: 2rem;
  }
  
  .card-label {
    font-size: 0.75rem;
  }
}
</style>