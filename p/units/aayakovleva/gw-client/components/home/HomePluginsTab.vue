<script setup lang="ts">
import { ref } from 'vue'
import { pluginSettingsGetRoute } from '../../api/plugins/settings-get'
import type { PluginRuntimeConfig } from '../../shared/pluginManifestTypes'
import PluginManifestForm from './PluginManifestForm.vue'

declare const ctx: app.Ctx

const props = defineProps<{
  initialPlugins?: PluginRuntimeConfig[]
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:plugin-settings', value: PluginRuntimeConfig[]): void
}>()

const plugins = ref<PluginRuntimeConfig[]>(
  Array.isArray(props.initialPlugins) ? props.initialPlugins : []
)
const loading = ref(false)
const error = ref('')

function publish(next: PluginRuntimeConfig[]) {
  plugins.value = next
  emit('update:plugin-settings', next)
}

function onPluginUpdate(plugin: PluginRuntimeConfig) {
  publish(plugins.value.map((item) => (item.manifest.id === plugin.manifest.id ? plugin : item)))
}

async function reloadPlugins() {
  if (!props.canEdit) return
  loading.value = true
  error.value = ''
  try {
    const response = await pluginSettingsGetRoute.run(ctx)
    publish((response as { plugins: PluginRuntimeConfig[] }).plugins || [])
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="st-tab hp-tab">
    <div v-if="!canEdit" class="panel-section hp-guard">
      <i class="fas fa-lock"></i>
      <span>Плагины и секреты платежных систем доступны только администратору.</span>
    </div>

    <div v-else class="hp-toolbar">
      <button
        type="button"
        class="btn-primary hp-refresh"
        :disabled="loading"
        @click="reloadPlugins"
      >
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-rotate"></i>
        Обновить
      </button>
      <span v-if="error" class="hp-error">{{ error }}</span>
    </div>

    <PluginManifestForm
      v-for="plugin in plugins"
      :key="plugin.manifest.id"
      :plugin="plugin"
      :can-edit="!!canEdit"
      @update:plugin="onPluginUpdate"
    />
  </div>
</template>

<style scoped>
.hp-tab {
  display: grid;
  gap: 16px;
}

.hp-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 2.5rem;
}

.hp-refresh,
.hp-guard {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hp-refresh {
  min-height: 2.25rem;
}

.hp-refresh:disabled {
  cursor: wait;
  opacity: 0.65;
}

.hp-guard {
  width: 100%;
  justify-content: flex-start;
  color: var(--color-warning, var(--color-accent));
}

.hp-error {
  color: var(--color-danger, var(--color-accent));
  font-size: 12px;
}
</style>
