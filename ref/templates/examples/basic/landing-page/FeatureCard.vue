<template>
  <div class="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div class="text-primary text-4xl mb-4">
      <i :class="icon"></i>
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-3">{{ title }}</h3>
    <p class="text-gray-600">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
</style>