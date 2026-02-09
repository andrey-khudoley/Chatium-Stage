<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import CrmBadge from '../components/base/CrmBadge.vue'
import { createComponentLogger } from '../shared/logger'
import { useUiI18n } from '../shared/design/i18n'

const log = createComponentLogger('DesignCatalogIndexPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

interface ModuleLink {
  slug: string
  title: string
  group: string
  description: string
  demoUrl: string
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  testsUrl?: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  initialLocale?: string
  modules: ModuleLink[]
}>()

const { t } = useUiI18n(props.initialLocale || 'ru')
const bootLoaderDone = ref(false)
const query = ref('')

const groupedModules = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const buckets = new Map<string, ModuleLink[]>()

  for (const module of props.modules) {
    const searchable = `${module.title} ${module.description} ${module.group}`.toLowerCase()
    if (needle && !searchable.includes(needle)) continue

    const current = buckets.get(module.group) || []
    current.push(module)
    buckets.set(module.group, current)
  }

  return Array.from(buckets.entries()).map(([group, modules]) => ({ group, modules }))
})

const totalVisible = computed(() => groupedModules.value.reduce((sum, item) => sum + item.modules.length, 0))

function startAnimations(): void {
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  log.info('Design catalog index mounted')
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
  log.info('Design catalog index unmounted')
})

function openChatiumLink(): void {
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div class="app-layout crm-app">
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
      :initialLocale="props.initialLocale"
    />

    <main class="content-wrapper">
      <div class="crm-page crm-reveal">
        <section class="crm-surface-raised crm-card">
          <h1 class="design-index-title">CRM Design Demo Catalog</h1>
          <p>
            Browser-ready demo routes for every module in <code>/design</code>.
            Use this page as a launchpad for visual exploration.
          </p>
          <div class="crm-row">
            <CrmBadge variant="info" icon="fas fa-cubes">{{ totalVisible }} modules</CrmBadge>
            <CrmBadge variant="success" icon="fas fa-layer-group">Live .tsx routes</CrmBadge>
            <CrmBadge variant="warning" icon="fas fa-mobile-screen">Desktop + mobile patterns</CrmBadge>
          </div>
          <label class="crm-field design-index-search">
            <span class="crm-field-label">Search modules</span>
            <input
              v-model="query"
              class="crm-input"
              type="text"
              placeholder="Type module name, group, or keyword"
            />
          </label>
        </section>

        <section
          v-for="group in groupedModules"
          :key="group.group"
          class="crm-surface crm-card"
        >
          <header class="crm-card-title">
            <h2>{{ group.group }}</h2>
            <span class="crm-muted">{{ group.modules.length }} modules</span>
          </header>

          <div class="design-module-grid">
            <article
              v-for="module in group.modules"
              :key="module.slug"
              class="design-module-card crm-surface-raised"
            >
              <h3>{{ module.title }}</h3>
              <p>{{ module.description }}</p>
              <div class="crm-row">
                <a :href="module.demoUrl" class="crm-btn crm-btn-primary">
                  <i class="fas fa-eye"></i>
                  Open Demo
                </a>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  min-height: 0;
}

.design-index-title {
  font-size: clamp(1.24rem, 2.2vw, 1.9rem);
}

.design-index-search {
  margin-top: 0.6rem;
}

.design-module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--crm-space-3);
}

.design-module-card {
  border-radius: var(--crm-radius-md);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 72%, transparent);
  padding: var(--crm-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-3);
}

.design-module-card h3 {
  font-size: 0.98rem;
}

@media (max-width: 1100px) {
  .design-module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .design-module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
