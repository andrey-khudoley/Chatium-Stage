<script setup lang="ts">
import DesignComponentsPage from './DesignComponentsPage.vue'

defineProps<{
  indexUrl: string
  pageUrl: string
}>()
</script>

<template>
  <DesignComponentsPage theme="dark" theme-preset-id="forest-night" :index-url="indexUrl" :page-url="pageUrl" />
</template>
