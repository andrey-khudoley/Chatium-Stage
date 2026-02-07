<script setup lang="ts">
export interface NavItem {
  id: string
  icon: string
  label: string
}

defineProps<{
  theme?: 'dark' | 'light'
  logoText?: string
  userName?: string
  userRole?: string
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
      <div class="dc-logo">
        <div class="dc-logo-icon"><i class="fas fa-leaf"></i></div>
        <span v-if="!collapsed" class="dc-logo-text">{{ logoText ?? 'NeSo' }}</span>
      </div>
      <button
        type="button"
        class="dc-toggle-btn"
        aria-label="Свернуть меню"
        @click="emit('toggleCollapse')"
      >
        <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>

    <nav class="dc-nav">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="dc-nav-item"
        :class="{ active: activeId === item.id }"
        :title="collapsed ? item.label : ''"
        @click="emit('select', item.id)"
      >
        <i :class="['fas', item.icon]"></i>
        <span v-if="!collapsed">{{ item.label }}</span>
      </button>
    </nav>

    <div v-if="!collapsed && (userName || userRole)" class="dc-sidebar-footer">
      <div class="dc-user-pill">
        <div class="dc-avatar"><i class="fas fa-user"></i></div>
        <div class="dc-user-info">
          <span class="dc-name">{{ userName ?? 'Пользователь' }}</span>
          <span class="dc-role">{{ userRole ?? 'Admin' }}</span>
        </div>
      </div>
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
  width: 240px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px 16px;
  z-index: 100;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  background: rgba(10, 16, 18, 0.8);
  border-right: 1px solid var(--border-strong);
  box-shadow: 6px 0 34px rgba(0, 0, 0, 0.4);
  color: var(--text);
}
.dc-demo-sidebar.theme-light {
  --accent: #4f6f2f;
  --accent-deep: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.12);
  --border-strong: rgba(79, 111, 47, 0.22);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 2px 0 24px rgba(79, 111, 47, 0.06);
}
.dc-demo-sidebar.collapsed { width: 72px; }
.dc-toggle-btn { display: block; }
.dc-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.dc-logo { display: flex; align-items: center; gap: 12px; }
.dc-logo-icon {
  width: 40px; height: 40px;
  background: var(--accent);
  color: #05080a;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 22px rgba(175, 196, 95, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.dc-demo-sidebar.theme-light .dc-logo-icon { color: white; }
.dc-logo-text { font-family: 'Old Standard TT', serif; font-size: 1.25rem; font-weight: 700; }
.dc-toggle-btn {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}
.dc-demo-sidebar.theme-light .dc-toggle-btn {
  background: var(--bg2, #f0ede0);
  border: 1px solid var(--border);
}
.dc-toggle-btn:hover {
  background: rgba(175, 196, 95, 0.14);
  border-color: var(--border-strong);
  color: var(--accent);
}
.dc-demo-sidebar.theme-light .dc-toggle-btn:hover {
  background: rgba(79, 111, 47, 0.1);
  color: var(--accent);
}
.dc-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.dc-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
}
.dc-nav-item i { width: 20px; }
.dc-nav-item:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    rgba(175, 196, 95, 0.12);
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.18);
  border-left-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 1px 0 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    3px 6px 12px rgba(0, 0, 0, 0.25),
    2px 10px 20px rgba(0, 0, 0, 0.15);
}
.dc-demo-sidebar.theme-light .dc-nav-item:hover {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.5) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.03) 100%
    ),
    rgba(79, 111, 47, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-left-color: rgba(255, 255, 255, 0.15);
  color: var(--accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05),
    2px 4px 10px rgba(0, 0, 0, 0.08),
    1px 6px 14px rgba(0, 0, 0, 0.05);
}
.dc-nav-item.active {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--accent);
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.4);
  border-left-color: rgba(255, 255, 255, 0.15);
  color: #05080a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    6px 10px 20px rgba(0, 0, 0, 0.35),
    3px 16px 32px rgba(0, 0, 0, 0.2),
    0 0 24px rgba(175, 196, 95, 0.35);
}
.dc-demo-sidebar.theme-light .dc-nav-item.active {
  color: white;
  border-top-color: rgba(255, 255, 255, 0.65);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 1px 0 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    4px 8px 16px rgba(0, 0, 0, 0.1),
    2px 12px 24px rgba(0, 0, 0, 0.06),
    0 10px 20px rgba(175, 196, 95, 0.22);
}
.dc-sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
.dc-user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(17, 28, 29, 0.8);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-demo-sidebar.theme-light .dc-user-pill {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(79, 111, 47, 0.06);
}
.dc-avatar {
  width: 36px; height: 36px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    var(--accent-deep);
  color: var(--text);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.25);
  border-left-color: rgba(255, 255, 255, 0.1);
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
      rgba(255, 255, 255, 0.5) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.04) 100%
    ),
    var(--accent);
  color: white;
  border-top-color: rgba(255, 255, 255, 0.6);
  border-left-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.06),
    2px 4px 10px rgba(0, 0, 0, 0.08),
    1px 6px 14px rgba(0, 0, 0, 0.05);
}
.dc-user-info { display: flex; flex-direction: column; }
.dc-name { font-weight: 600; font-size: 0.9rem; }
.dc-role { font-size: 0.75rem; color: var(--text3); }
@media (max-width: 768px) {
  .dc-demo-sidebar {
    width: 240px;
    transform: translateX(-240px);
    transition: transform 0.3s ease;
  }
  .dc-demo-sidebar.collapsed { transform: translateX(-240px); }
  .dc-demo-sidebar.mobile-open,
  .dc-demo-sidebar.collapsed.mobile-open { transform: translateX(0); }
  .dc-toggle-btn { display: none; }
}
</style>
