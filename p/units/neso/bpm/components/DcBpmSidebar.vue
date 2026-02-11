<script setup lang="ts">
import { computed } from 'vue'
import DcDemoSidebar from './DcDemoSidebar.vue'
import type { NavItem } from './DcDemoSidebar.vue'
import { filterNavItems } from '../lib/navVisibility.lib'
import type { NavVisibilityContext } from '../lib/navVisibility.lib'
import { BPM_HOME_NAV_ITEMS } from '../shared/bpmNavConfig'

const props = withDefaults(
  defineProps<{
    /** Подсвечиваемый пункт (текущая страница). */
    activeId?: string | null
    loginUrl: string
    adminUrl: string
    testsUrl: string
    designUrl: string
    scenarioCount?: number
    /** Контекст для показа/скрытия пунктов (роль, права). Без контекста или с пустой ролью — админка скрыта. */
    visibilityContext?: NavVisibilityContext | null
    theme?: 'dark' | 'light'
    logoText?: string
    userName?: string
    userRole?: string
    collapsed?: boolean
    mobileOpen?: boolean
  }>(),
  {
    activeId: null,
    scenarioCount: 0,
    visibilityContext: () => ({})
  }
)

const emit = defineEmits<{
  close: []
  select: [id: string]
  toggleCollapse: []
}>()

const visibilityContext = computed<NavVisibilityContext>(() => props.visibilityContext ?? {})

const menuItems = computed<NavItem[]>(() => {
  const items = filterNavItems(BPM_HOME_NAV_ITEMS, visibilityContext.value)
  const count = props.scenarioCount ?? 0
  return items.map((item) => {
    if (item.id !== 'admin' || !item.children) return item
    return {
      ...item,
      children: item.children.map((child) =>
        child.id === 'admin-design' ? { ...child, badge: count } : child
      )
    }
  })
})

function closeSidebar() {
  emit('close')
}

function onSelect(id: string) {
  const url =
    id === 'admin-panel'
      ? props.adminUrl
      : id === 'admin-tests'
        ? props.testsUrl
        : id === 'admin-design'
          ? props.designUrl
          : ''
  if (url) {
    window.location.href = url
  }
  emit('select', id)
}
</script>

<template>
  <DcDemoSidebar
    :theme="theme"
    :logo-text="logoText"
    :user-name="userName"
    :user-role="userRole"
    :logout-url="loginUrl"
    :items="menuItems"
    :collapsed="collapsed"
    :mobile-open="mobileOpen"
    :active-id="activeId"
    @close="closeSidebar"
    @select="onSelect"
    @toggle-collapse="emit('toggleCollapse')"
  />
</template>
