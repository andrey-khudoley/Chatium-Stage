<script setup lang="ts">
const props = defineProps<{
  user: {
    displayName?: string
    confirmedEmail?: string
    confirmedPhone?: string
  }
}>()
</script>

<template>
  <div>
    <p>Профиль пользователя</p>
    <p v-if="props.user.displayName">Имя: {{ props.user.displayName }}</p>
    <p v-if="props.user.confirmedEmail">Email: {{ props.user.confirmedEmail }}</p>
    <p v-if="props.user.confirmedPhone">Телефон: {{ props.user.confirmedPhone }}</p>
  </div>
</template>
