<script setup lang="ts">
import { ref, computed } from 'vue'

export interface NavItem {
  id: string
  icon: string
  label: string
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

const props = withDefaults(
  defineProps<{
    theme?: 'dark' | 'light'
    logoTitle?: string
    logoSubtitle?: string
    userName?: string
    userRole?: string
    groups?: NavGroup[]
  }>(),
  {
    theme: 'dark',
    logoTitle: 'NeSo',
    logoSubtitle: 'Control OPERATIONS HUB',
    userName: 'Пользователь',
    userRole: 'Admin',
    groups: () => defaultNavGroups
  }
)

const defaultNavGroups: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Рабочая область',
    items: []
  },
  {
    id: 'main',
    label: 'Основные сценарии',
    items: [
      { id: 'inbox', icon: 'fa-inbox', label: 'Входящие' },
      { id: 'pipeline', icon: 'fa-diagram-project', label: 'Воронка' },
      { id: 'calendar', icon: 'fa-calendar-days', label: 'Календарь' }
    ]
  },
  {
    id: 'crm',
    label: 'Клиенты',
    items: [
      { id: 'contacts', icon: 'fa-address-book', label: 'Контакты' },
      { id: 'segments', icon: 'fa-layer-group', label: 'Сегменты' },
      { id: 'deals', icon: 'fa-handshake', label: 'Сделки' }
    ]
  },
  {
    id: 'segment-base',
    label: 'Сегменты и база',
    items: []
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      { id: 'settings', icon: 'fa-sliders', label: 'Настройки проекта' },
      { id: 'automation', icon: 'fa-bolt', label: 'Автоматизация' },
      { id: 'roles', icon: 'fa-user-shield', label: 'Роли доступа' },
      { id: 'integrations', icon: 'fa-plug', label: 'Интеграции' }
    ]
  }
]

const collapsed = ref(false)
const mobileOpen = ref(false)
const activeId = ref<string | null>(null)
const expandedGroups = ref<Set<string>>(new Set(['main', 'crm', 'system']))

const menuGroups = computed(() => props.groups)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function toggleGroup(groupId: string) {
  if (expandedGroups.value.has(groupId)) {
    const next = new Set(expandedGroups.value)
    next.delete(groupId)
    expandedGroups.value = next
  } else {
    expandedGroups.value = new Set([...expandedGroups.value, groupId])
  }
}

function selectItem(id: string) {
  activeId.value = id
  emit('select', id)
}

function closeMobile() {
  mobileOpen.value = false
  emit('close')
}

const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

defineExpose({
  collapsed,
  mobileOpen,
  toggleCollapse,
  openMobile: () => { mobileOpen.value = true },
  closeMobile
})
</script>

<template>
  <aside
    class="app-sidebar"
    :class="[
      `theme-${theme}`,
      { collapsed, 'mobile-open': mobileOpen }
    ]"
    aria-label="Боковое меню"
  >
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon"><i class="fas fa-leaf"></i></div>
        <div v-if="!collapsed" class="sidebar-meta">
          <span class="logo-text">{{ logoTitle }}</span>
          <span v-if="logoSubtitle" class="logo-subtitle">{{ logoSubtitle }}</span>
        </div>
      </div>
      <button
        type="button"
        class="toggle-btn"
        aria-label="Свернуть меню"
        @click="toggleCollapse"
      >
        <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>

    <nav class="nav">
      <template v-for="group in menuGroups" :key="group.id">
        <div
          v-if="group.items.length > 0"
          class="nav-group"
          :class="{ expanded: expandedGroups.has(group.id) }"
        >
          <button
            type="button"
            class="nav-group-trigger"
            :title="collapsed ? group.label : ''"
            @click="toggleGroup(group.id)"
          >
            <span v-if="!collapsed" class="nav-group-label">{{ group.label }}</span>
            <i v-if="!collapsed" class="fas fa-chevron-down nav-chevron"></i>
          </button>
          <div class="submenu">
            <div class="submenu-inner">
              <button
                v-for="item in group.items"
                :key="item.id"
                type="button"
                class="nav-item"
                :class="{ active: activeId === item.id }"
                :title="collapsed ? item.label : ''"
                @click="selectItem(item.id)"
              >
                <i :class="['fas', item.icon, 'nav-icon']"></i>
                <span v-if="!collapsed" class="nav-content">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="!collapsed" class="nav-section-label">
          {{ group.label }}
        </div>
      </template>
    </nav>

    <div class="sidebar-footer">
      <div class="user-pill">
        <div class="avatar"><i class="fas fa-user"></i></div>
        <div v-if="!collapsed" class="user-info">
          <span class="name">{{ userName }}</span>
          <span class="role">{{ userRole }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  --sidebar-width: 286px;
  --sidebar-peek: 76px;
  --radius-sm: 8px;
  --radius: 12px;
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px 16px;
  z-index: 100;
  transition: width 0.3s ease, transform 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Тема: тёмная (по умолчанию) */
.app-sidebar.theme-dark {
  --bg: #05080a;
  --bg2: #0d1214;
  --surface: #11191b;
  --accent: #afc45f;
  --accent-deep: #6f8440;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.12);
  --border-strong: rgba(175, 196, 95, 0.22);
  background: linear-gradient(165deg, rgba(13, 21, 23, 0.84), rgba(10, 16, 18, 0.72));
  backdrop-filter: blur(30px) saturate(170%);
  -webkit-backdrop-filter: blur(30px) saturate(170%);
  border-right: 1px solid var(--border-strong);
  box-shadow: 6px 0 34px rgba(0, 0, 0, 0.4);
  color: var(--text);
}

.app-sidebar.theme-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: transparent;
  z-index: 0;
}

.app-sidebar.theme-dark .logo-icon {
  background: var(--accent);
  color: var(--bg);
  box-shadow:
    0 10px 22px rgba(175, 196, 95, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.app-sidebar.theme-dark .toggle-btn {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  color: var(--text2);
}

.app-sidebar.theme-dark .toggle-btn:hover {
  background: rgba(175, 196, 95, 0.14);
  border-color: var(--border-strong);
  color: var(--accent);
}

.app-sidebar.theme-dark .nav-group-trigger,
.app-sidebar.theme-dark .nav-item {
  color: var(--text2);
}

.app-sidebar.theme-dark .nav-group-trigger:hover,
.app-sidebar.theme-dark .nav-item:hover {
  background: rgba(175, 196, 95, 0.12);
  color: var(--text);
}

.app-sidebar.theme-dark .nav-item.active {
  background: var(--accent);
  color: var(--bg);
  box-shadow: 0 10px 20px rgba(175, 196, 95, 0.22);
}

.app-sidebar.theme-dark .sidebar-footer {
  border-top: 1px solid var(--border);
}

.app-sidebar.theme-dark .user-pill {
  background: rgba(17, 28, 29, 0.72);
  border: 1px solid rgba(175, 196, 95, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.app-sidebar.theme-dark .avatar {
  background: var(--accent-deep);
  color: var(--text);
}

.app-sidebar.theme-dark .role {
  color: var(--text3);
}

.app-sidebar.theme-dark .nav-section-label {
  color: var(--text3);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
}

/* Тема: светлая */
.app-sidebar.theme-light {
  --accent: #4f6f2f;
  --accent-soft: rgba(79, 111, 47, 0.1);
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.12);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border-right: 1px solid var(--border);
  box-shadow: 2px 0 24px rgba(79, 111, 47, 0.06);
  color: var(--text);
}

.app-sidebar.theme-light .logo-icon {
  background: var(--accent);
  color: white;
}

.app-sidebar.theme-light .toggle-btn {
  background: #f0ede0;
  border: 1px solid var(--border);
  color: var(--text2);
}

.app-sidebar.theme-light .toggle-btn:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.app-sidebar.theme-light .nav-group-trigger,
.app-sidebar.theme-light .nav-item {
  color: var(--text2);
}

.app-sidebar.theme-light .nav-group-trigger:hover,
.app-sidebar.theme-light .nav-item:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.app-sidebar.theme-light .nav-item.active {
  background: var(--accent);
  color: white;
}

.app-sidebar.theme-light .sidebar-footer {
  border-top: 1px solid var(--border);
}

.app-sidebar.theme-light .user-pill {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(79, 111, 47, 0.06);
}

.app-sidebar.theme-light .avatar {
  background: var(--accent);
  color: white;
}

.app-sidebar.theme-light .role {
  color: var(--text3);
}

.app-sidebar.theme-light .nav-section-label {
  color: var(--text3);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
}

.app-sidebar > * {
  position: relative;
  z-index: 1;
}

.app-sidebar.collapsed {
  width: var(--sidebar-peek);
  padding-left: 12px;
  padding-right: 12px;
}

.app-sidebar.collapsed .sidebar-meta,
.app-sidebar.collapsed .nav-content,
.app-sidebar.collapsed .nav-chevron,
.app-sidebar.collapsed .nav-group-label,
.app-sidebar.collapsed .user-info,
.app-sidebar.collapsed .nav-section-label {
  opacity: 0;
  visibility: hidden;
  overflow: hidden;
  width: 0;
  height: 0;
  padding: 0;
  margin: 0;
  position: absolute;
}

.app-sidebar.collapsed .nav-group-trigger {
  justify-content: center;
  padding: 12px;
}

.app-sidebar.collapsed .submenu {
  display: none;
}

.app-sidebar.collapsed .sidebar-footer {
  padding-top: 8px;
}

.app-sidebar.collapsed .user-pill {
  justify-content: center;
  padding: 10px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  min-height: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.logo-text {
  font-family: 'Old Standard TT', serif;
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
}

.logo-subtitle {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.85;
  white-space: nowrap;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  width: 100%;
}

.nav-group-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-chevron {
  font-size: 0.7rem;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.nav-group.expanded .nav-chevron {
  transform: rotate(180deg);
}

.submenu {
  overflow: hidden;
}

.submenu-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 8px;
  margin-top: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.nav-icon {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
}

.nav-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  flex-shrink: 0;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius);
  backdrop-filter: blur(16px);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .app-sidebar {
    --sidebar-width: min(84vw, 300px);
    --sidebar-peek: 0px;
    width: var(--sidebar-width);
    transform: translateX(calc(-1 * var(--sidebar-width)));
  }

  .app-sidebar.collapsed {
    transform: translateX(calc(-1 * var(--sidebar-width)));
  }

  .app-sidebar.mobile-open,
  .app-sidebar.collapsed.mobile-open {
    transform: translateX(0);
  }

  .app-sidebar .toggle-btn {
    display: none;
  }
}
</style>
