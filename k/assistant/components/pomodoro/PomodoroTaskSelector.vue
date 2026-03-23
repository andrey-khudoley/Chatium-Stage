<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type TaskItem = {
  id: string
  title: string
  projectId: string
}

const props = defineProps<{
  assignTaskUrl: string
  getTasksUrl: string
  currentTaskId: string
}>()

const emit = defineEmits<{
  (event: 'taskAssigned'): void
}>()

const tasks = ref<TaskItem[]>([])
const loading = ref(false)
const expanded = ref(false)

const currentTask = computed(() => tasks.value.find(t => t.id === props.currentTaskId) || null)

async function loadTasks() {
  loading.value = true
  try {
    const r = await fetch(props.getTasksUrl, { credentials: 'include' })
    const j = await r.json()
    if (j.success && j.tasks) {
      tasks.value = j.tasks
    }
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    loading.value = false
  }
}

async function assignTask(taskId: string) {
  try {
    const r = await fetch(props.assignTaskUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    })
    const j = await r.json()
    if (j.success) {
      expanded.value = false
      emit('taskAssigned')
    }
  } catch (error) {
    console.error('Failed to assign task:', error)
  }
}

onMounted(() => {
  void loadTasks()
})
</script>

<template>
  <div class="task-selector">
    <button 
      class="task-selector-toggle" 
      :disabled="loading"
      @click="expanded = !expanded"
    >
      <i class="fa-solid fa-clipboard-list mr-1" />
      <span v-if="currentTask" class="task-name">{{ currentTask.title }}</span>
      <span v-else class="task-name">Выберите задачу</span>
      <i class="fa-solid fa-chevron-down ml-1" :class="{ 'rotated': expanded }" />
    </button>
    <transition name="dropdown">
      <div v-if="expanded" class="task-selector-dropdown">
        <button
          v-if="currentTask"
          class="task-option task-option-clear"
          @click="assignTask('')"
        >
          <i class="fa-solid fa-times" /> Снять задачу
        </button>
        <button
          v-for="task in tasks"
          :key="task.id"
          class="task-option"
          :class="{ 'task-option-active': task.id === currentTaskId }"
          @click="assignTask(task.id)"
        >
          <i class="fa-solid fa-check" v-if="task.id === currentTaskId" />
          <i class="fa-solid fa-circle" v-else />
          {{ task.title }}
        </button>
        <p v-if="tasks.length === 0 && !loading" class="task-option-empty">
          Нет задач в работе
        </p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.task-selector {
  position: relative;
}
.task-selector-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  padding: .5rem .7rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: .4rem;
  cursor: pointer;
  transition: all .2s ease;
  width: 100%;
  font-size: .85rem;
}
.task-selector-toggle:hover:not(:disabled) {
  border-color: var(--color-border-light);
  background: var(--color-bg-secondary);
}
.task-selector-toggle:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.task-name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fa-chevron-down {
  transition: transform .2s ease;
  font-size: .7rem;
}
.fa-chevron-down.rotated {
  transform: rotate(180deg);
}
.task-selector-dropdown {
  position: absolute;
  top: calc(100% + .3rem);
  left: 0;
  right: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .4);
}
.task-option {
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: .6rem .7rem;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .5rem;
  transition: all .15s ease;
  font-size: .85rem;
  border-bottom: 1px solid var(--color-border);
}
.task-option:last-child {
  border-bottom: none;
}
.task-option:hover {
  background: var(--color-bg-tertiary);
}
.task-option-active {
  color: var(--color-accent);
  font-weight: 500;
}
.task-option-clear {
  color: var(--color-accent-hover);
  font-weight: 500;
}
.task-option-clear:hover {
  background: rgba(211, 35, 75, .1);
}
.task-option-empty {
  padding: .8rem;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: .8rem;
  text-align: center;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all .2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>