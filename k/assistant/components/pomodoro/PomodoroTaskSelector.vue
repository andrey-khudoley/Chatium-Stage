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
      class="task-toggle" 
      :disabled="loading"
      @click="expanded = !expanded"
    >
      <i class="fa-solid fa-clipboard-list task-toggle__icon" />
      <span class="task-toggle__text">
        <span v-if="currentTask">{{ currentTask.title }}</span>
        <span v-else class="task-toggle__placeholder">Выберите задачу</span>
      </span>
      <i class="fa-solid fa-chevron-down task-toggle__arrow" :class="{ 'task-toggle__arrow--open': expanded }" />
    </button>
    <transition name="dropdown">
      <div v-if="expanded" class="task-dropdown">
        <div class="task-dropdown__scanlines"></div>
        <button
          v-if="currentTask"
          class="task-item task-item--clear"
          @click="assignTask('')"
        >
          <i class="fa-solid fa-times task-item__icon" /> Снять задачу
        </button>
        <button
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ 'task-item--active': task.id === currentTaskId }"
          @click="assignTask(task.id)"
        >
          <i :class="task.id === currentTaskId ? 'fa-solid fa-check' : 'fa-solid fa-circle'" class="task-item__icon" />
          {{ task.title }}
        </button>
        <p v-if="tasks.length === 0 && !loading" class="task-empty">
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

.task-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  padding: .45rem .65rem;
  display: flex;
  align-items: center;
  gap: .4rem;
  cursor: pointer;
  transition: all .2s ease;
  width: 100%;
  font-size: .8rem;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.task-toggle::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px,
    transparent 1px, transparent 3px
  );
  pointer-events: none;
}

.task-toggle:hover:not(:disabled) {
  border-color: var(--color-border-light);
  background: var(--color-bg-secondary);
}

.task-toggle:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.task-toggle__icon {
  color: var(--color-accent);
  opacity: .7;
  font-size: .75rem;
  flex-shrink: 0;
}

.task-toggle__text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-toggle__placeholder {
  color: var(--color-text-secondary);
}

.task-toggle__arrow {
  transition: transform .2s ease;
  font-size: .6rem;
  color: var(--color-text-secondary);
}

.task-toggle__arrow--open {
  transform: rotate(180deg);
}

.task-dropdown {
  position: absolute;
  top: calc(100% + .3rem);
  left: 0;
  right: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.2);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.task-dropdown__scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px,
    transparent 1px, transparent 3px
  );
  pointer-events: none;
  z-index: 0;
}

.task-item {
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: .5rem .65rem;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .45rem;
  transition: all .15s ease;
  font-size: .8rem;
  font-family: inherit;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  z-index: 1;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: rgba(255, 255, 255, .03);
}

.task-item__icon {
  font-size: .55rem;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}

.task-item--active {
  color: var(--color-accent);
  font-weight: 500;
}

.task-item--active .task-item__icon {
  font-size: .7rem;
}

.task-item--clear {
  color: #ff8a8a;
}

.task-item--clear:hover {
  background: rgba(255, 107, 107, .06);
}

.task-empty {
  padding: .7rem;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: .75rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: .06em;
  position: relative;
  z-index: 1;
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
