<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface NavChildItem {
  id: string
  label: string
  icon?: string
  badge?: string | number
  /** Если задан — пункт рендерится как ссылка <a href>, иначе как кнопка. */
  href?: string
}

export interface NavItem {
  id: string
  icon: string
  label: string
  badge?: string | number
  /** Если задан и нет children — пункт рендерится как ссылка <a href>. */
  href?: string
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

const expandedGroups = ref<Record<string, boolean>>({})

const hasMobileOpen = computed(() => !!props.mobileOpen)
const isMobileViewport = ref(false)
const isCollapsed = computed(() => !!props.collapsed && !isMobileViewport.value && !hasMobileOpen.value)

const MOBILE_BREAKPOINT_QUERY = '(max-width: 980px)'
let mobileQueryList: MediaQueryList | null = null

function syncViewportState() {
  isMobileViewport.value = !!mobileQueryList?.matches
}

onMounted(() => {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return
  mobileQueryList = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
  syncViewportState()
  if (typeof mobileQueryList.addEventListener === 'function') {
    mobileQueryList.addEventListener('change', syncViewportState)
    return
  }
  mobileQueryList.addListener(syncViewportState)
})

onBeforeUnmount(() => {
  if (!mobileQueryList) return
  if (typeof mobileQueryList.removeEventListener === 'function') {
    mobileQueryList.removeEventListener('change', syncViewportState)
  } else {
    mobileQueryList.removeListener(syncViewportState)
  }
  mobileQueryList = null
})

watch(
  () => props.items,
  () => {
    const next: Record<string, boolean> = {}
    for (const item of props.items) {
      if (item.children?.length) {
        next[item.id] = expandedGroups.value[item.id] ?? item.id === props.activeId
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

function toggleGroup(item: NavItem) {
  expandedGroups.value = {
    ...expandedGroups.value,
    [item.id]: !expandedGroups.value[item.id]
  }
}

function onParentClick(item: NavItem) {
  if (hasChildren(item) && !isCollapsed.value) {
    toggleGroup(item)
    return
  }
  emit('select', item.id)
}

function onChildClick(parent: NavItem, child: NavChildItem) {
  if (!expandedGroups.value[parent.id]) {
    toggleGroup(parent)
  }
  emit('select', child.id)
}

function onChildLinkClick() {
  emit('close')
}
</script>

<template>
  <aside
    class="dc-demo-sidebar"
    :class="[
      `theme-${theme ?? 'dark'}`,
      {
        collapsed: isCollapsed,
        'mobile-open': hasMobileOpen
      }
    ]"
    aria-label="BPM navigation"
  >
    <div class="dc-sidebar-top">
      <div class="dc-logo" :title="isCollapsed ? (logoText ?? 'NeSo BPM') : ''">
        <div class="dc-logo-icon" :class="{ 'dc-logo-icon--image': !!logoImageUrl }">
          <img
            v-if="logoImageUrl"
            class="dc-logo-img"
            :src="logoImageUrl"
            :alt="`${logoText ?? 'NeSo BPM'} logo`"
          />
          <i v-else class="fas fa-diagram-project" aria-hidden="true"></i>
        </div>

        <div class="dc-logo-copy dc-collapsible-text">
          <span class="dc-logo-title">{{ logoText ?? 'NeSo BPM' }}</span>
          <span class="dc-logo-subtitle">Process Control Plane</span>
        </div>
      </div>

      <button
        type="button"
        class="dc-toggle-btn"
        :aria-label="isCollapsed ? 'Expand navigation' : 'Collapse navigation'"
        @click="emit('toggleCollapse')"
      >
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'" aria-hidden="true"></i>
      </button>

      <button type="button" class="dc-mobile-close" aria-label="Close navigation" @click="emit('close')">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </div>

    <div class="dc-ops-summary">
      <p class="dc-ops-kicker dc-collapsible-text">Control status</p>
      <div class="dc-ops-pill" :title="isCollapsed ? '7 SLA risks across active processes' : ''">
        <span class="dc-ops-dot"></span>
        <span class="dc-collapsible-text">7 SLA risks</span>
      </div>
    </div>

    <nav class="dc-nav">
      <p class="dc-nav-title dc-collapsible-text">Process spaces</p>

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
        <component
          :is="item.href ? 'a' : 'button'"
          :href="item.href"
          :type="item.href ? undefined : 'button'"
          class="dc-nav-item dc-nav-item--parent"
          :class="{ active: isParentActive(item) }"
          :title="isCollapsed ? item.label : ''"
          @click="item.href ? emit('close') : onParentClick(item)"
        >
          <span class="dc-nav-icon"><i :class="['fas', item.icon]" aria-hidden="true"></i></span>
          <span class="dc-nav-label dc-collapsible-text">{{ item.label }}</span>
          <span v-if="item.badge" class="dc-nav-badge dc-collapsible-badge">{{ item.badge }}</span>
          <span v-if="hasChildren(item)" class="dc-nav-caret dc-collapsible-text" :class="{ open: isParentOpen(item) }">
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </span>
        </component>

        <div v-if="hasChildren(item)" class="dc-submenu-wrap" :class="{ open: isParentOpen(item) && !isCollapsed }">
          <div class="dc-submenu-inner">
            <component
              v-for="child in item.children"
              :key="child.id"
              :is="child.href ? 'a' : 'button'"
              :href="child.href"
              :type="child.href ? undefined : 'button'"
              class="dc-submenu-item"
              :class="{ active: activeId === child.id }"
              :title="isCollapsed ? child.label : ''"
              @click="child.href ? onChildLinkClick() : onChildClick(item, child)"
            >
              <span class="dc-submenu-icon" aria-hidden="true">
                <i v-if="child.icon" :class="['fas', child.icon]"></i>
                <span v-else class="dc-submenu-dot"></span>
              </span>
              <span class="dc-submenu-label dc-collapsible-text">{{ child.label }}</span>
              <span v-if="child.badge" class="dc-nav-badge dc-collapsible-badge">{{ child.badge }}</span>
            </component>
          </div>
        </div>
      </div>
    </nav>

    <div class="dc-sidebar-footer">
      <div class="dc-user-pill" :title="isCollapsed ? `${userName ?? 'Operator'} - ${userRole ?? 'Workflow Admin'}` : ''">
        <div class="dc-avatar"><i class="fas fa-user-gear" aria-hidden="true"></i></div>
        <div class="dc-user-copy dc-collapsible-text">
          <span class="dc-user-name">{{ userName ?? 'Operator' }}</span>
          <span class="dc-user-role">{{ userRole ?? 'Workflow Admin' }}</span>
        </div>
        <a class="dc-logout dc-collapsible-action" :href="logoutUrl ?? '#'" aria-label="Logout">
          <i class="fas fa-right-from-bracket" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.dc-demo-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 48;
  display: flex;
  height: 100vh;
  width: var(--sidebar-width);
  flex-direction: column;
  padding: 12px 10px 12px;
  color: var(--text-primary);
  border-right: 1px solid var(--border-strong);
  background:
    var(--gradient-glass),
    var(--surface-glass);
  backdrop-filter: blur(20px) saturate(140%);
  box-shadow: var(--shadow-lg);
  transition:
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.34s cubic-bezier(0.22, 1, 0.36, 1);
  overflow-x: hidden;
  will-change: width, transform;
}

.dc-demo-sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  padding: 12px 8px 10px;
}

.dc-sidebar-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.dc-logo {
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
}

.dc-logo-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--accent-contrast);
  background: linear-gradient(140deg, var(--accent-strong), var(--accent));
  box-shadow: var(--shadow-sm);
}

.dc-logo-icon--image {
  background: var(--surface-3);
}

.dc-logo-img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.dc-logo-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dc-logo-title {
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  font-weight: 700;
  text-transform: uppercase;
}

.dc-logo-subtitle {
  font-size: 0.66rem;
  color: var(--text-tertiary);
  letter-spacing: 0.03em;
}

.dc-toggle-btn,
.dc-mobile-close {
  width: var(--control-height);
  height: var(--control-height);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 78%, transparent);
  color: var(--text-secondary);
  cursor: pointer;
}

.dc-toggle-btn:hover,
.dc-mobile-close:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.dc-mobile-close {
  display: none;
}

.dc-ops-summary {
  margin-bottom: 8px;
  border-radius: var(--radius-md);
  padding: 8px;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 70%, transparent);
}

.dc-ops-kicker {
  margin: 0 0 6px;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.dc-ops-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 76%, transparent);
}

.dc-ops-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--status-warning);
  box-shadow: 0 0 12px color-mix(in srgb, var(--status-warning) 65%, transparent);
}

.dc-nav {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding-right: 2px;
}

.dc-nav-title {
  margin: 0 0 8px;
  padding: 0 4px;
  font-size: 0.64rem;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  max-height: 22px;
  overflow: hidden;
  transition:
    max-height 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    padding 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease;
}

.dc-nav-group {
  margin-bottom: 2px;
}

.dc-nav-item,
.dc-submenu-item {
  width: 100%;
  height: var(--control-height);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    grid-template-columns 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    gap 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    padding 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dc-nav-item:hover,
.dc-submenu-item:hover {
  background: color-mix(in srgb, var(--accent-soft) 50%, transparent);
  color: var(--text-primary);
}

.dc-nav-item.active,
.dc-submenu-item.active {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: color-mix(in srgb, var(--accent-soft) 78%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent);
}

.dc-nav-icon,
.dc-submenu-icon {
  display: inline-flex;
  justify-content: center;
  font-size: 0.74rem;
}

.dc-nav-label,
.dc-submenu-label {
  font-size: 0.78rem;
  white-space: nowrap;
}

.dc-nav-badge {
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 82%, transparent);
  font-size: 0.66rem;
  line-height: 16px;
  text-align: center;
}

.dc-nav-caret {
  font-size: 0.58rem;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
}

.dc-nav-caret.open {
  transform: rotate(180deg);
}

.dc-submenu-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease;
}

.dc-submenu-wrap.open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.dc-submenu-wrap > * {
  min-height: 0;
  overflow: hidden;
}

.dc-submenu-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 8px;
}

.dc-submenu-item {
  grid-template-columns: 14px minmax(0, 1fr) auto;
  height: 30px;
  margin: 2px 0 2px 18px;
  padding-inline: 8px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.73rem;
}

.dc-submenu-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.dc-sidebar-footer {
  margin-top: 8px;
  flex-shrink: 0;
}

.dc-user-pill {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  height: 44px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 72%, transparent);
  min-width: 0;
}

.dc-avatar {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent-soft) 68%, transparent);
  color: var(--text-primary);
  font-size: 0.72rem;
}

.dc-user-copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.dc-user-name {
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.dc-user-role {
  font-size: 0.66rem;
  color: var(--text-tertiary);
}

.dc-logout {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  text-decoration: none;
}

.dc-logout:hover {
  color: var(--accent);
}

.dc-collapsible-text,
.dc-collapsible-action,
.dc-collapsible-badge {
  overflow: hidden;
  transition:
    max-width 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease,
    transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dc-collapsible-text {
  max-width: 180px;
  opacity: 1;
}

.dc-collapsible-badge {
  max-width: 40px;
  opacity: 1;
}

.dc-collapsible-action {
  max-width: 28px;
  opacity: 1;
}

.dc-demo-sidebar.collapsed .dc-collapsible-text,
.dc-demo-sidebar.collapsed .dc-collapsible-action,
.dc-demo-sidebar.collapsed .dc-collapsible-badge {
  max-width: 0;
  min-width: 0;
  width: 0;
  opacity: 0;
  transform: translateX(-6px);
  margin: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Свёрнутый сайдбар: верх (лого + кнопка) по центру */
.dc-demo-sidebar.collapsed .dc-sidebar-top {
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dc-demo-sidebar.collapsed .dc-logo {
  width: 100%;
  flex: 0 0 auto;
  justify-content: center;
  gap: 0;
}

.dc-demo-sidebar.collapsed .dc-logo-icon {
  width: 30px;
  height: 30px;
  font-size: 0.82rem;
}

.dc-demo-sidebar.collapsed .dc-toggle-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

/* Свёрнутый сайдбар: блок статуса — только точка по центру */
.dc-demo-sidebar.collapsed .dc-ops-summary {
  padding: 0;
  margin: 0 0 10px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.dc-demo-sidebar.collapsed .dc-ops-kicker {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  opacity: 0;
  pointer-events: none;
}

.dc-demo-sidebar.collapsed .dc-ops-pill {
  width: 34px;
  height: 34px;
  padding: 0;
  margin-inline: auto;
  gap: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.dc-demo-sidebar.collapsed .dc-ops-dot {
  width: 8px;
  height: 8px;
}

.dc-demo-sidebar.collapsed .dc-ops-pill .dc-ops-dot {
  margin: 0;
}

/* Свёрнутый сайдбар: нав-пункты — только иконка по центру */
.dc-demo-sidebar.collapsed .dc-nav-title {
  height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.dc-demo-sidebar.collapsed .dc-nav-group {
  margin-bottom: 4px;
}

.dc-demo-sidebar.collapsed .dc-nav-item,
.dc-demo-sidebar.collapsed .dc-submenu-item {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0;
  min-width: 0 !important;
  text-align: center;
  border-radius: 10px;
}

.dc-demo-sidebar.collapsed .dc-nav-item {
  grid-template-columns: unset;
}

.dc-demo-sidebar.collapsed .dc-submenu-item {
  grid-template-columns: unset;
  margin: 2px 0;
}

.dc-demo-sidebar.collapsed .dc-nav-item .dc-nav-icon,
.dc-demo-sidebar.collapsed .dc-submenu-item .dc-submenu-icon {
  margin: 0;
}

.dc-demo-sidebar.collapsed .dc-nav {
  padding-right: 0;
  padding-inline: 0;
}

.dc-demo-sidebar.collapsed .dc-submenu-wrap {
  grid-template-rows: 0fr !important;
  opacity: 0;
  pointer-events: none;
}

/* Свёрнутый сайдбар: футер — только аватар по центру, без обрезки */
.dc-demo-sidebar.collapsed .dc-user-pill {
  justify-content: center;
  height: 38px;
  padding: 0;
  min-width: 0;
  border-radius: 11px;
}

.dc-demo-sidebar.collapsed .dc-avatar {
  width: 24px;
  height: 24px;
  font-size: 0.72rem;
  flex-shrink: 0;
}

@media (max-width: 980px) {
  .dc-demo-sidebar {
    transform: translateX(-100%);
    width: min(86vw, 320px);
    max-width: min(86vw, 320px);
    z-index: 52;
  }

  .dc-demo-sidebar.mobile-open {
    transform: translateX(0);
  }

  .dc-mobile-close {
    display: inline-block;
  }

  .dc-toggle-btn {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dc-demo-sidebar,
  .dc-nav-item,
  .dc-submenu-item,
  .dc-collapsible-text,
  .dc-collapsible-action,
  .dc-collapsible-badge,
  .dc-submenu-wrap,
  .dc-nav-title,
  .dc-nav-caret {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
