<script setup lang="ts">
import { computed } from 'vue'

export interface FunnelStep {
  id: string
  label: string
  count: number
  note?: string
}

const props = defineProps<{
  theme?: 'dark' | 'light'
  steps: FunnelStep[]
}>()

const maxCount = computed(() => {
  if (!props.steps.length) return 1
  return Math.max(...props.steps.map((step) => step.count), 1)
})

function getStepWidth(step: FunnelStep): string {
  const ratio = step.count / maxCount.value
  return `${Math.max(18, Math.round(ratio * 100))}%`
}

function getConversion(step: FunnelStep, index: number): string {
  if (index === 0) return '100%'
  const prev = props.steps[index - 1]
  if (!prev || prev.count <= 0) return '0%'
  return `${Math.round((step.count / prev.count) * 100)}%`
}
</script>

<template>
  <section class="dc-funnel" :class="`theme-${theme ?? 'dark'}`">
    <div v-for="(step, index) in steps" :key="step.id" class="dc-funnel-row">
      <div class="dc-funnel-head">
        <span class="dc-funnel-label">{{ step.label }}</span>
        <span class="dc-funnel-note">{{ step.note ?? `${step.count} лидов` }}</span>
      </div>
      <div class="dc-funnel-track">
        <div class="dc-funnel-bar" :style="{ width: getStepWidth(step) }">
          <strong>{{ step.count }}</strong>
          <span>{{ getConversion(step, index) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dc-funnel {
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --accent: #afc45f;
  --border: rgba(175, 196, 95, 0.2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dc-funnel.theme-light {
  --text: #1f2f1d;
  --text2: #2f3f2c;
  --text3: #5a6652;
  --accent: #4f6f2f;
  --border: rgba(79, 111, 47, 0.2);
}

.dc-funnel-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dc-funnel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.82rem;
}

.dc-funnel-label {
  color: var(--text);
  font-weight: 600;
  min-width: 0;
}

.dc-funnel-note {
  color: var(--text3);
  min-width: 0;
  text-align: right;
}

.dc-funnel-track {
  height: 34px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  padding: 4px;
}

.dc-funnel.theme-light .dc-funnel-track {
  background: rgba(79, 111, 47, 0.08);
}

.dc-funnel-bar {
  min-width: 64px;
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(175, 196, 95, 0.62) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  color: #05080a;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.dc-funnel.theme-light .dc-funnel-bar {
  color: #fff;
  box-shadow: 0 6px 12px rgba(79, 111, 47, 0.16);
}

.dc-funnel-bar strong {
  font-size: 0.88rem;
}

.dc-funnel-bar span {
  font-size: 0.75rem;
  opacity: 0.95;
}

@media (max-width: 560px) {
  .dc-funnel-head {
    flex-direction: column;
    gap: 4px;
  }

  .dc-funnel-note {
    text-align: left;
  }
}
</style>
