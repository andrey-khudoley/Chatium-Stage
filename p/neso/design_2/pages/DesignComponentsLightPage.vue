<script setup lang="ts">
import DesignComponentsPage from './DesignComponentsPage.vue'

defineProps<{
  indexUrl: string
  pageUrl: string
}>()
</script>

<template>
  <DesignComponentsPage theme="light" theme-preset-id="sunrise-leaf" :index-url="indexUrl" :page-url="pageUrl" />
</template>
