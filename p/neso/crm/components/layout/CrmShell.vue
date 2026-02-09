<template>
  <div class="crm-shell" :class="{ 'crm-shell-sidebar-collapsed': isSidebarCollapsed }">
    <aside class="crm-shell-sidebar crm-surface-raised">
      <div class="crm-shell-sidebar-head">
        <div class="crm-shell-brand">
          <slot name="brand">
            <span class="crm-shell-brand-title">CRM</span>
          </slot>
        </div>
        <button class="crm-btn crm-btn-ghost crm-shell-collapse" type="button" @click="toggleSidebar">
          <i class="fas" :class="isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
        </button>
      </div>
      <div class="crm-shell-sidebar-body crm-scroll">
        <slot name="sidebar" />
      </div>
    </aside>

    <div class="crm-shell-main">
      <header class="crm-shell-header crm-surface">
        <slot name="header" />
      </header>
      <main class="crm-shell-content">
        <slot />
      </main>
      <footer class="crm-shell-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  defaultSidebarCollapsed?: boolean
}>(), {
  defaultSidebarCollapsed: false
})

const isSidebarCollapsed = ref(props.defaultSidebarCollapsed)

function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
.crm-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 100vh;
  gap: var(--crm-space-4);
  padding: var(--crm-space-4);
}

.crm-shell-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.crm-shell-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--crm-space-2);
  padding: var(--crm-space-4);
  border-bottom: 1px solid color-mix(in srgb, var(--crm-border) 70%, transparent);
}

.crm-shell-brand-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--crm-text);
  font-family: var(--crm-font-navigation);
}

.crm-shell-sidebar-body {
  padding: var(--crm-space-3);
  overflow: auto;
  max-height: calc(100vh - 160px);
}

.crm-shell-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-3);
}

.crm-shell-header {
  padding: var(--crm-space-3) var(--crm-space-4);
}

.crm-shell-content {
  flex: 1;
  min-height: 0;
}

.crm-shell-footer {
  padding-bottom: var(--crm-space-2);
}

.crm-shell-sidebar-collapsed {
  grid-template-columns: 88px minmax(0, 1fr);
}

.crm-shell-sidebar-collapsed .crm-shell-brand-title {
  display: none;
}

.crm-shell-sidebar-collapsed .crm-shell-sidebar-body {
  padding: var(--crm-space-2);
}

.crm-shell-collapse {
  width: 2rem;
  height: 2rem;
  padding: 0;
}

@media (max-width: 1024px) {
  .crm-shell {
    grid-template-columns: 1fr;
    padding: var(--crm-space-2);
  }

  .crm-shell-sidebar,
  .crm-shell-sidebar-collapsed .crm-shell-sidebar {
    display: none;
  }
}
</style>
