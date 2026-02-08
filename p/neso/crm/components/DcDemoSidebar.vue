<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface NavChildItem {
  id: string
  label: string
  icon?: string
}

export interface NavItem {
  id: string
  icon: string
  label: string
  children?: NavChildItem[]
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  logoText?: string
  logoImageUrl?: string
  userName?: string
  userRole?: string
  logoutUrl?: string
  items: NavItem[]
  collapsed?: boolean
  mobileOpen?: boolean
  activeId?: string | null
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
  toggleCollapse: []
}>()

const visualThemeLight = ref((props.theme ?? 'dark') === 'light')
const expandedGroups = ref<Record<string, boolean>>({})

const visualThemeLabel = computed(() => (visualThemeLight.value ? 'Светлая тема' : 'Тёмная тема'))
const visualThemeIcon = computed(() => (visualThemeLight.value ? 'fa-sun' : 'fa-moon'))

watch(
  () => props.theme,
  (theme) => {
    visualThemeLight.value = (theme ?? 'dark') === 'light'
  }
)

watch(
  () => props.items,
  () => {
    const next: Record<string, boolean> = {}
    for (const item of props.items) {
      if (item.children?.length) {
        next[item.id] = expandedGroups.value[item.id] ?? false
      }
    }
    expandedGroups.value = next
    openActiveParent()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.activeId,
  () => {
    openActiveParent()
  },
  { immediate: true }
)

function toggleThemeVisual() {
  visualThemeLight.value = !visualThemeLight.value
}

function hasChildren(item: NavItem): boolean {
  return !!item.children?.length
}

function isParentOpen(item: NavItem): boolean {
  return !!expandedGroups.value[item.id]
}

function isParentActive(item: NavItem): boolean {
  if (props.activeId === item.id) return true
  if (!item.children?.length || !props.activeId) return false
  return item.children.some((child) => child.id === props.activeId)
}

function openActiveParent() {
  if (!props.activeId) return
  const next = { ...expandedGroups.value }
  for (const item of props.items) {
    if (item.children?.some((child) => child.id === props.activeId)) {
      next[item.id] = true
    }
  }
  expandedGroups.value = next
}

function onParentClick(item: NavItem) {
  if (hasChildren(item) && !props.collapsed) {
    expandedGroups.value = {
      ...expandedGroups.value,
      [item.id]: !expandedGroups.value[item.id]
    }
    return
  }
  emit('select', item.id)
}

function onChildClick(parent: NavItem, child: NavChildItem) {
  if (!expandedGroups.value[parent.id]) {
    expandedGroups.value = {
      ...expandedGroups.value,
      [parent.id]: true
    }
  }
  emit('select', child.id)
}
</script>

<template>
  <aside
    class="dc-demo-sidebar"
    :class="[
      `theme-${theme ?? 'dark'}`,
      { collapsed: collapsed, 'mobile-open': mobileOpen }
    ]"
    aria-label="Боковое меню"
  >
    <div class="dc-sidebar-header">
      <div class="dc-logo" :title="collapsed ? (logoText ?? 'NeSo') : ''">
        <div class="dc-logo-icon" :class="{ 'dc-logo-icon--image': !!logoImageUrl }">
          <img
            v-if="logoImageUrl"
            class="dc-logo-img"
            :src="logoImageUrl"
            :alt="`${logoText ?? 'NeSo'} logo`"
          />
          <i v-else class="fas fa-leaf" aria-hidden="true"></i>
        </div>
        <span class="dc-logo-text dc-collapsible-text">{{ logoText ?? 'NeSo' }}</span>
      </div>
      <button
        type="button"
        class="dc-toggle-btn"
        :aria-label="collapsed ? 'Развернуть меню' : 'Свернуть меню'"
        :title="collapsed ? 'Развернуть меню' : 'Свернуть меню'"
        @click="emit('toggleCollapse')"
      >
        <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'" aria-hidden="true"></i>
      </button>
    </div>

    <nav class="dc-nav">
      <div
        v-for="item in items"
        :key="item.id"
        class="dc-nav-group"
        :class="{
          'is-active': isParentActive(item),
          'is-open': isParentOpen(item),
          'has-children': hasChildren(item)
        }"
      >
        <button
          type="button"
          class="dc-nav-item dc-nav-item--parent"
          :class="{ active: isParentActive(item) }"
          :title="collapsed ? item.label : ''"
          @click="onParentClick(item)"
        >
          <span class="dc-nav-icon"><i :class="['fas', item.icon]" aria-hidden="true"></i></span>
          <span class="dc-nav-label dc-collapsible-text">{{ item.label }}</span>
          <span
            v-if="hasChildren(item)"
            class="dc-nav-caret dc-collapsible-text"
            :class="{ open: isParentOpen(item) }"
            aria-hidden="true"
          >
            <i class="fas fa-chevron-down"></i>
          </span>
        </button>

        <div
          v-if="hasChildren(item)"
          class="dc-submenu-wrap"
          :class="{ open: isParentOpen(item) && !collapsed }"
        >
          <div class="dc-submenu-inner">
            <button
              v-for="child in item.children"
              :key="child.id"
              type="button"
              class="dc-submenu-item"
              :class="{ active: activeId === child.id }"
              :title="collapsed ? child.label : ''"
              @click="onChildClick(item, child)"
            >
              <span class="dc-submenu-icon" aria-hidden="true">
                <i v-if="child.icon" :class="['fas', child.icon]"></i>
                <span v-else class="dc-submenu-dot"></span>
              </span>
              <span class="dc-submenu-label dc-collapsible-text">{{ child.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="dc-sidebar-footer">
      <div class="dc-user-pill" :title="collapsed ? `${userName ?? 'Пользователь'} · ${userRole ?? 'Admin'}` : ''">
        <div class="dc-user-main">
          <div class="dc-avatar"><i class="fas fa-user" aria-hidden="true"></i></div>
          <div class="dc-user-info dc-collapsible-text">
            <span class="dc-name">{{ userName ?? 'Пользователь' }}</span>
            <span class="dc-role">{{ userRole ?? 'Admin' }}</span>
          </div>
        </div>
        <a class="dc-user-logout dc-collapsible-action" :href="logoutUrl ?? '#'" title="Выйти" aria-label="Выйти">
          <i class="fas fa-right-from-bracket" aria-hidden="true"></i>
        </a>
      </div>

      <button
        type="button"
        class="dc-theme-toggle"
        :class="{ on: visualThemeLight }"
        :title="collapsed ? 'Переключить тему' : ''"
        @click="toggleThemeVisual"
      >
        <span class="dc-theme-toggle-compact" aria-hidden="true">
          <i :class="['fas', visualThemeIcon]"></i>
        </span>
        <span class="dc-switch dc-collapsible-switch" aria-hidden="true">
          <i class="fas fa-moon dc-switch-moon"></i>
          <i class="fas fa-sun dc-switch-sun"></i>
          <span class="dc-switch-thumb"></span>
        </span>
        <span class="dc-theme-toggle-label dc-collapsible-text">{{ visualThemeLabel }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.dc-demo-sidebar {
  --radius: 12px;
  --radius-sm: 8px;
  --accent: #afc45f;
  --accent-deep: #6f8440;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  --surface-soft: rgba(17, 28, 29, 0.8);
  --surface-hover: rgba(175, 196, 95, 0.12);
  --switch-track: rgba(7, 13, 15, 0.7);
  --switch-thumb: #afc45f;
  --sidebar-width: 240px;
  --sidebar-peek: 72px;
  width: var(--sidebar-width);
  height: 100vh;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px 14px 18px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  background: rgba(10, 16, 18, 0.82);
  backdrop-filter: blur(16px);
  border-right: 1px solid var(--border-strong);
  box-shadow: 8px 0 34px rgba(0, 0, 0, 0.38);
  color: var(--text);
  transition:
    width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.32s ease,
    border-color 0.32s ease,
    box-shadow 0.32s ease,
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: width, transform;
}
.dc-demo-sidebar *,
.dc-demo-sidebar *::before,
.dc-demo-sidebar *::after {
  box-sizing: border-box;
}
.dc-demo-sidebar.theme-light {
  --accent: #4f6f2f;
  --accent-deep: #4f6f2f;
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #4f5e49;
  --border: rgba(79, 111, 47, 0.18);
  --border-strong: rgba(79, 111, 47, 0.28);
  --surface-soft: rgba(248, 244, 233, 0.9);
  --surface-hover: rgba(79, 111, 47, 0.15);
  --switch-track: rgba(79, 111, 47, 0.22);
  --switch-thumb: #4f6f2f;
  background: rgba(245, 240, 226, 0.88);
  box-shadow: 4px 0 30px rgba(79, 111, 47, 0.14);
}
.dc-demo-sidebar.collapsed {
  width: var(--sidebar-peek);
  padding-inline: 10px;
}

.dc-collapsible-text {
  overflow: hidden;
  white-space: nowrap;
  max-width: 180px;
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
  transform-origin: left center;
  transition:
    max-width 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    opacity 0.2s ease,
    transform 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    filter 0.2s ease,
    margin 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-demo-sidebar.collapsed .dc-collapsible-text {
  max-width: 0;
  opacity: 0;
  transform: translateX(-10px);
  filter: blur(3px);
  margin-left: 0 !important;
  margin-right: 0 !important;
  pointer-events: none;
}

.dc-collapsible-action {
  width: 34px;
  min-width: 34px;
  height: 34px;
  opacity: 1;
  transform: translateX(0);
  transition:
    width 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    min-width 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    height 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    opacity 0.2s ease,
    transform 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    border-width 0.2s ease,
    margin 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-demo-sidebar.collapsed .dc-collapsible-action {
  width: 0;
  min-width: 0;
  height: 0;
  opacity: 0;
  transform: translateX(-8px);
  border-width: 0;
  margin: 0;
  pointer-events: none;
}

.dc-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 24px;
}
.dc-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  transition: gap 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-demo-sidebar.collapsed .dc-logo {
  gap: 0;
  width: 100%;
  justify-content: center;
}
.dc-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: var(--accent);
  color: #05080a;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 10px 22px rgba(175, 196, 95, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.dc-logo-icon--image {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}
.dc-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}
.dc-demo-sidebar.theme-light .dc-logo-icon {
  color: white;
}
.dc-demo-sidebar.collapsed .dc-logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
}
.dc-logo-text {
  font-family: 'Old Standard TT', serif;
  font-size: 1.25rem;
  font-weight: 700;
}
.dc-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
}
.dc-demo-sidebar.theme-light .dc-toggle-btn {
  background: rgba(250, 247, 238, 0.88);
  border-color: rgba(79, 111, 47, 0.2);
}
.dc-toggle-btn:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--accent);
  transform: translateX(1px);
}
.dc-demo-sidebar.collapsed .dc-sidebar-header {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  margin-bottom: 18px;
}
.dc-demo-sidebar.collapsed .dc-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  margin-inline: auto;
}
.dc-demo-sidebar.collapsed .dc-toggle-btn:hover {
  transform: none;
}

.dc-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}
.dc-nav-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.dc-demo-sidebar.collapsed .dc-nav {
  align-items: center;
  gap: 8px;
  padding-top: 2px;
  padding-right: 0;
}
.dc-demo-sidebar.collapsed .dc-nav-group {
  width: 100%;
}
.dc-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text2);
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition:
    background-color 0.24s ease,
    border-color 0.24s ease,
    color 0.24s ease,
    box-shadow 0.24s ease,
    gap 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    padding 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-nav-icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dc-nav-caret {
  margin-left: auto;
  width: 16px;
  text-align: center;
  color: var(--text3);
}
.dc-nav-caret i {
  transition: transform 0.28s ease;
}
.dc-nav-caret.open i {
  transform: rotate(-180deg);
}
.dc-nav-item:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    var(--surface-hover);
  border-top-color: rgba(255, 255, 255, 0.18);
  border-left-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.2);
}
.dc-demo-sidebar.theme-light .dc-nav-item:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.42) 0%,
      transparent 40%,
      rgba(79, 111, 47, 0.06) 100%
    ),
    var(--surface-hover);
  border-top-color: rgba(255, 255, 255, 0.46);
  border-left-color: rgba(255, 255, 255, 0.14);
  color: var(--accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(79, 111, 47, 0.1),
    0 3px 8px rgba(79, 111, 47, 0.14);
}
.dc-nav-item.active {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--accent);
  border-top-color: rgba(255, 255, 255, 0.4);
  border-left-color: rgba(255, 255, 255, 0.15);
  color: #05080a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 4px 10px rgba(0, 0, 0, 0.24);
}
.dc-demo-sidebar.theme-light .dc-nav-item.active {
  color: white;
  border-top-color: rgba(255, 255, 255, 0.65);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 1px 0 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(79, 111, 47, 0.18);
}

.dc-submenu-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  overflow: hidden;
  transition:
    grid-template-rows 0.32s cubic-bezier(0.32, 0, 0.2, 1),
    opacity 0.2s ease;
}
.dc-submenu-wrap.open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.dc-submenu-inner {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 4px 2px 42px;
}
.dc-submenu-item {
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  overflow: hidden;
  transition:
    background-color 0.22s ease,
    border-color 0.22s ease,
    color 0.22s ease,
    transform 0.22s ease;
}
.dc-submenu-item:hover {
  background: rgba(175, 196, 95, 0.1);
  border-color: rgba(175, 196, 95, 0.2);
  color: var(--text);
  transform: translateX(2px);
}
.dc-demo-sidebar.theme-light .dc-submenu-item:hover {
  background: rgba(79, 111, 47, 0.1);
  border-color: rgba(79, 111, 47, 0.18);
  color: var(--accent);
}
.dc-submenu-item.active {
  background: rgba(175, 196, 95, 0.18);
  border-color: rgba(175, 196, 95, 0.34);
  color: var(--text);
}
.dc-demo-sidebar.theme-light .dc-submenu-item.active {
  background: rgba(79, 111, 47, 0.14);
  border-color: rgba(79, 111, 47, 0.22);
  color: var(--accent);
}
.dc-submenu-icon {
  width: 12px;
  min-width: 12px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dc-submenu-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.dc-demo-sidebar.collapsed .dc-nav-item {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  margin-inline: auto;
  justify-content: center;
  align-items: center;
  gap: 0;
  padding: 0;
  border-radius: 14px;
}
.dc-demo-sidebar.collapsed .dc-nav-caret {
  width: 0;
  opacity: 0;
  transform: translateX(-6px);
}
.dc-demo-sidebar.collapsed .dc-nav-item.active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(175, 196, 95, 0.22);
}
.dc-demo-sidebar.theme-light.collapsed .dc-nav-item.active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    inset 1px 0 0 rgba(255, 255, 255, 0.26),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    0 6px 14px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(79, 111, 47, 0.22);
}
.dc-demo-sidebar.collapsed .dc-submenu-wrap {
  grid-template-rows: 0fr !important;
  opacity: 0 !important;
}

.dc-sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dc-demo-sidebar.collapsed .dc-sidebar-footer {
  padding-top: 12px;
  gap: 8px;
}
.dc-user-pill {
  min-height: 56px;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.16);
  background: var(--surface-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
}
.dc-demo-sidebar.theme-light .dc-user-pill {
  border: 1px solid rgba(79, 111, 47, 0.18);
}
.dc-demo-sidebar.collapsed .dc-user-pill {
  min-height: 52px;
  padding: 8px;
  justify-content: center;
  align-items: center;
  gap: 0;
}
.dc-user-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  transition: gap 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-demo-sidebar.collapsed .dc-user-main {
  justify-content: center;
  align-items: center;
  gap: 0;
  flex: 0 0 auto;
  min-width: unset;
}
.dc-demo-sidebar.collapsed .dc-user-main .dc-user-info {
  width: 0;
  min-width: 0;
  overflow: hidden;
}
.dc-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    var(--accent-deep);
  color: var(--text);
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    4px 6px 12px rgba(0, 0, 0, 0.3),
    2px 10px 20px rgba(0, 0, 0, 0.15);
}
.dc-demo-sidebar.theme-light .dc-avatar {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.46) 0%,
      transparent 40%,
      rgba(79, 111, 47, 0.08) 100%
    ),
    var(--accent);
  color: white;
  border-top-color: rgba(255, 255, 255, 0.56);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08),
    2px 4px 10px rgba(79, 111, 47, 0.16),
    1px 6px 14px rgba(79, 111, 47, 0.1);
}

.dc-demo-sidebar.theme-light .dc-user-logout {
  background: rgba(250, 247, 238, 0.84);
  border-color: rgba(79, 111, 47, 0.18);
}

.dc-demo-sidebar.theme-light .dc-theme-toggle {
  background: rgba(250, 247, 238, 0.84);
  border-color: rgba(79, 111, 47, 0.18);
}
.dc-user-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.dc-name {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
}
.dc-role {
  font-size: 0.75rem;
  color: var(--text3);
  line-height: 1.15;
}
.dc-user-logout {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  overflow: hidden;
}
.dc-user-logout:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--accent);
}

.dc-theme-toggle {
  min-height: 42px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text2);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  width: 100%;
  text-align: left;
  font-size: 0.85rem;
  cursor: pointer;
  overflow: hidden;
  transition:
    background-color 0.24s ease,
    border-color 0.24s ease,
    color 0.24s ease,
    gap 0.34s cubic-bezier(0.32, 0, 0.2, 1),
    padding 0.34s cubic-bezier(0.32, 0, 0.2, 1);
}
.dc-theme-toggle-compact {
  display: none;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 0.95rem;
  flex-shrink: 0;
}
.dc-theme-toggle:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--text);
}
.dc-demo-sidebar.theme-light .dc-theme-toggle:hover {
  color: var(--accent);
}
.dc-demo-sidebar.collapsed .dc-theme-toggle {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  margin-inline: auto;
  border-radius: 14px;
  justify-content: center;
  gap: 0;
  padding: 0;
}

.dc-switch {
  position: relative;
  width: 58px;
  min-width: 58px;
  height: 28px;
  border-radius: 999px;
  background: var(--switch-track);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: inline-block;
  flex-shrink: 0;
}
.dc-collapsible-switch {
  transition:
    width 0.3s cubic-bezier(0.32, 0, 0.2, 1),
    min-width 0.3s cubic-bezier(0.32, 0, 0.2, 1),
    opacity 0.2s ease,
    transform 0.3s cubic-bezier(0.32, 0, 0.2, 1),
    margin 0.3s cubic-bezier(0.32, 0, 0.2, 1),
    border-width 0.2s ease;
}
.dc-demo-sidebar.collapsed .dc-collapsible-switch {
  width: 0;
  min-width: 0;
  opacity: 0;
  transform: scale(0.88);
  margin: 0;
  border-width: 0;
}
.dc-demo-sidebar.collapsed .dc-theme-toggle-compact {
  display: inline-flex;
}
.dc-switch-moon,
.dc-switch-sun {
  position: absolute;
  top: 7px;
  font-size: 11px;
  color: rgba(238, 244, 235, 0.72);
  transition: opacity 0.24s ease;
}
.dc-switch-moon {
  left: 8px;
}
.dc-switch-sun {
  right: 8px;
}
.dc-demo-sidebar.theme-light .dc-switch-moon,
.dc-demo-sidebar.theme-light .dc-switch-sun {
  color: rgba(36, 53, 35, 0.7);
}
.dc-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(160deg, #f5f7ea 0%, var(--switch-thumb) 100%);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.dc-theme-toggle.on .dc-switch-thumb {
  transform: translateX(30px);
}
.dc-theme-toggle.on .dc-switch-sun {
  opacity: 1;
}
.dc-theme-toggle.on .dc-switch-moon {
  opacity: 0.45;
}
.dc-theme-toggle:not(.on) .dc-switch-sun {
  opacity: 0.45;
}
.dc-theme-toggle:not(.on) .dc-switch-moon {
  opacity: 1;
}
.dc-theme-toggle-label {
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .dc-demo-sidebar {
    --sidebar-width: min(84vw, 300px);
    --sidebar-peek: 0px;
    width: var(--sidebar-width);
    transform: translateX(calc(-1 * var(--sidebar-width)));
    padding: 24px 14px 18px;
  }
  .dc-demo-sidebar.collapsed {
    width: var(--sidebar-width);
    padding: 24px 14px 18px;
  }
  .dc-demo-sidebar.mobile-open,
  .dc-demo-sidebar.collapsed.mobile-open {
    transform: translateX(0);
  }
  .dc-demo-sidebar .dc-toggle-btn {
    display: none;
  }
  .dc-demo-sidebar .dc-collapsible-text {
    max-width: 220px;
    opacity: 1;
    transform: none;
    filter: none;
    pointer-events: auto;
  }
  .dc-demo-sidebar .dc-collapsible-action,
  .dc-demo-sidebar.collapsed .dc-collapsible-action {
    width: 34px;
    min-width: 34px;
    height: 34px;
    border-width: 1px;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
  .dc-demo-sidebar.collapsed .dc-logo,
  .dc-demo-sidebar.collapsed .dc-nav-item,
  .dc-demo-sidebar.collapsed .dc-user-main {
    gap: 12px;
  }
  .dc-demo-sidebar.collapsed .dc-nav-item {
    justify-content: flex-start;
    padding-inline: 14px;
  }
  .dc-demo-sidebar.collapsed .dc-nav-caret {
    width: 16px;
    opacity: 1;
    transform: none;
    margin-left: auto;
  }
  .dc-demo-sidebar.collapsed .dc-submenu-wrap.open {
    grid-template-rows: 1fr !important;
    opacity: 1 !important;
  }
  .dc-demo-sidebar.collapsed .dc-user-pill {
    justify-content: space-between;
    gap: 8px;
  }
  .dc-demo-sidebar.collapsed .dc-user-main {
    justify-content: flex-start;
  }
  .dc-demo-sidebar.collapsed .dc-theme-toggle {
    justify-content: flex-start;
    gap: 10px;
    padding-inline: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dc-demo-sidebar,
  .dc-demo-sidebar * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
