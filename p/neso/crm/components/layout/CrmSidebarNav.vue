<template>
  <nav class="crm-sidebar-nav">
    <a
      v-for="item in items"
      :key="item.href"
      class="crm-sidebar-link"
      :class="{ 'is-active': item.active }"
      :href="item.href"
    >
      <i v-if="item.icon" :class="item.icon" aria-hidden="true"></i>
      <span>{{ item.label }}</span>
      <span v-if="item.badge" class="crm-sidebar-badge">{{ item.badge }}</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
export interface CrmSidebarItem {
  href: string
  label: string
  icon?: string
  badge?: string
  active?: boolean
}

defineProps<{
  items: CrmSidebarItem[]
}>()
</script>

<style scoped>
.crm-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.crm-sidebar-link {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.58rem 0.68rem;
  border-radius: var(--crm-radius-sm);
  text-decoration: none;
  color: var(--crm-textMuted);
  border: 1px solid transparent;
  font-family: var(--crm-font-navigation);
  font-size: 0.84rem;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.crm-sidebar-link:hover {
  color: var(--crm-text);
  border-color: color-mix(in srgb, var(--crm-borderStrong) 72%, transparent);
  background: color-mix(in srgb, var(--crm-accentSoft) 24%, transparent);
}

.crm-sidebar-link.is-active {
  color: var(--crm-text);
  border-color: color-mix(in srgb, var(--crm-accent) 60%, transparent);
  background: color-mix(in srgb, var(--crm-accentSoft) 36%, transparent);
}

.crm-sidebar-badge {
  font-family: var(--crm-font-tables);
  font-size: 0.66rem;
  color: var(--crm-accent);
}
</style>
