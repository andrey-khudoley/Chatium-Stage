<template>
  <div 
    class="bg-white rounded-xl shadow-lg p-8 relative hover:shadow-xl transition-shadow duration-300"
    :class="{ 'ring-2 ring-primary': isPopular }"
  >
    <div 
      v-if="isPopular" 
      class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm"
    >
      Популярный
    </div>
    
    <h3 class="text-2xl font-bold text-gray-800 mb-2">{{ title }}</h3>
    <div class="mb-6">
      <span class="text-4xl font-bold text-primary">${{ price }}</span>
      <span class="text-gray-600">/мес</span>
    </div>
    
    <ul class="space-y-3 mb-8">
      <li v-for="feature in features" :key="feature" class="flex items-center text-gray-600">
        <i class="fas fa-check text-green-500 mr-3"></i>
        {{ feature }}
      </li>
    </ul>
    
    <button 
      class="w-full py-3 rounded-lg transition"
      :class="isPopular 
        ? 'bg-primary text-white hover:bg-blue-600' 
        : 'border-2 border-primary text-primary hover:bg-blue-50'
      "
    >
      Выбрать план
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  price: {
    type: [String, Number],
    required: true
  },
  features: {
    type: Array,
    required: true
  },
  isPopular: {
    type: [Boolean, String],
    default: false
  }
})
</script>

<style scoped>
</style>