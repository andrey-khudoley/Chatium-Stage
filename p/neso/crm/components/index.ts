// @shared
// Runtime UI barrel.
// Export only components that physically exist in `components/`.

export { default as AppFooter } from './AppFooter.vue'
export { default as GlobalGlitch } from './GlobalGlitch.vue'
export { default as Header } from './Header.vue'
export { default as LogoutModal } from './LogoutModal.vue'

// Legacy standalone blocks still used by demo pages.
export { default as DcDemoSidebar } from './DcDemoSidebar.vue'
export { default as DcPageHeader } from './DcPageHeader.vue'
export type { NavChildItem, NavItem } from './DcDemoSidebar.vue'

export * from './base'
export * from './data-display'
export * from './editors'
export * from './feature'
export * from './feedback'
export * from './layout'
export * from './navigation'
