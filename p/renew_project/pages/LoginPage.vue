<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  back: string
}>()

const signinUrl = computed(() => `/s/auth/signin?back=${encodeURIComponent(props.back)}`)
</script>

<template>
  <div>
    <a :href="signinUrl">Войти</a>
  </div>
</template>
