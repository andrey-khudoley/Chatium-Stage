<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../web/design/components/AppShell.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('LoginPage')

const props = defineProps<{
  back: string
  indexUrl: string
}>()

const signinUrl = computed(() => `/s/auth/signin?back=${encodeURIComponent(props.back)}`)

const navItems = computed(() => [
  { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl }
])

log.info('Login page rendered')
</script>

<template>
  <AppShell :pageTitle="'Вход'" :pageSubtitle="'Авторизация'" :navItems="navItems" activeSection="login">
    <section class="showcase">
      <h2 class="section-title">Войти в систему</h2>
      <div class="showcase-grid">
        <div class="showcase-card wide">
          <h4 class="showcase-label">Доступ</h4>
          <div class="showcase-content column">
            <p>Используйте корпоративную учетную запись для доступа к CRM.</p>
            <a class="btn-glow" :href="signinUrl">
              <span>Войти</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
