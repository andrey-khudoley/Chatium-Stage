<template>
  <div class="app-shell">
    <aside class="app-shell-sidebar">
      <div class="app-shell-brand">
        <div class="app-shell-brand-title">{{ pageTitle }}</div>
        <div v-if="pageSubtitle" class="app-shell-brand-subtitle">{{ pageSubtitle }}</div>
      </div>

      <nav class="app-shell-nav" aria-label="Primary navigation">
        <a
          v-for="item in navItems"
          :key="item.id"
          class="app-shell-nav-link"
          :class="{ 'is-active': item.id === activeSection }"
          :href="item.href"
        >
          <i class="fas" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </aside>

    <section class="app-shell-main">
      <header class="app-shell-header">
        <div class="app-shell-heading">
          <h1>{{ pageTitle }}</h1>
          <p v-if="pageSubtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="app-shell-actions">
          <slot name="headerActions" />
        </div>
      </header>

      <main class="app-shell-content">
        <slot />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
export interface AppShellNavItem {
  id: string
  icon: string
  label: string
  href?: string
}

defineProps<{
  pageTitle: string
  pageSubtitle?: string
  navItems: AppShellNavItem[]
  activeSection?: string
}>()
</script>

<style scoped>
.app-shell {
  --shell-bg: var(--crm-bg, #050a0f);
  --shell-surface: var(--crm-surface, #0d1520);
  --shell-surface-2: var(--crm-surfaceRaised, #0f1a28);
  --shell-border: var(--crm-border, rgba(121, 181, 255, 0.2));
  --shell-border-strong: var(--crm-borderStrong, rgba(121, 181, 255, 0.35));
  --shell-text: var(--crm-text, #d6e9ff);
  --shell-text-muted: var(--crm-textMuted, rgba(214, 233, 255, 0.75));
  --shell-accent: var(--crm-accent, #7ab4ff);
  --shell-accent-soft: var(--crm-accentSoft, rgba(122, 180, 255, 0.14));

  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background:
    radial-gradient(1200px 600px at 10% -10%, var(--shell-accent-soft), transparent 60%),
    radial-gradient(900px 480px at 95% 0%, var(--shell-accent-soft), transparent 62%),
    var(--shell-bg);
  color: var(--shell-text);
}

.app-shell-sidebar {
  border-right: 1px solid var(--shell-border);
  background: linear-gradient(180deg, var(--shell-surface), var(--shell-bg));
  padding: 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
}

.app-shell-brand {
  border: 1px solid var(--shell-border-strong);
  border-radius: 12px;
  background: var(--shell-surface-2);
  padding: 0.9rem;
}

.app-shell-brand-title {
  font-weight: 700;
  font-size: 0.98rem;
}

.app-shell-brand-subtitle {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: var(--shell-text-muted);
}

.app-shell-nav {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.app-shell-nav-link {
  text-decoration: none;
  color: var(--shell-text-muted);
  border: 1px solid transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.7rem;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.app-shell-nav-link:hover {
  color: var(--shell-text);
  border-color: var(--shell-border-strong);
  background: var(--shell-accent-soft);
}

.app-shell-nav-link.is-active {
  color: var(--shell-text);
  border-color: var(--shell-accent);
  background: var(--shell-accent-soft);
}

.app-shell-main {
  min-width: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.app-shell-header {
  border: 1px solid var(--shell-border);
  border-radius: 12px;
  background: var(--shell-surface);
  padding: 0.95rem;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
  align-items: center;
}

.app-shell-heading h1 {
  margin: 0;
  font-size: 1.05rem;
}

.app-shell-heading p {
  margin: 0.35rem 0 0;
  color: var(--shell-text-muted);
  font-size: 0.82rem;
}

.app-shell-actions {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}

.app-shell-content {
  min-width: 0;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-shell-sidebar {
    position: static;
    height: auto;
  }
}
</style>
