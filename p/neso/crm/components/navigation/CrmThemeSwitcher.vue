<template>
  <div class="crm-inline crm-theme-switcher">
    <i class="fas fa-palette" aria-hidden="true"></i>
    <select class="crm-select" :value="currentTheme" @change="onChange">
      <option v-for="theme in themes" :key="theme.id" :value="theme.id">
        {{ theme.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem } from '../../shared/design/useDesignSystem'

const props = withDefaults(defineProps<{
  initialThemeId?: string
}>(), {
  initialThemeId: 'midnight-ops'
})

const { preferences, themes, setTheme } = useDesignSystem(props.initialThemeId)

const emit = defineEmits<{ changed: [string] }>()

const currentTheme = computed(() => preferences.value.themeId)

function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  setTheme(value)
  emit('changed', value)
}
</script>

<style scoped>
.crm-theme-switcher {
  min-width: 12.5rem;
}
</style>
