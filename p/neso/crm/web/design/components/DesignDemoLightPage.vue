<script setup lang="ts">
import DesignSystemDemo from './DesignSystemDemo.vue'

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
  <DesignSystemDemo v-bind="props" />
</template>
