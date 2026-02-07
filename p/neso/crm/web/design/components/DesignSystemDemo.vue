<script setup lang="ts">
import DesignSystemShowcase from './DesignSystemShowcase.vue'

const props = defineProps<{
  projectTitle: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()
</script>

<template>
  <DesignSystemShowcase v-bind="props" />
</template>
