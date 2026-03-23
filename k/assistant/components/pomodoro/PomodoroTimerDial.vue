<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  phase: 'work' | 'rest' | 'long_rest'
  remainingSec: number
  phaseDurationSec: number
  status: 'stopped' | 'running' | 'paused'
  phaseLabel: string
  statusLabel: string
  timeLabel: string
}>()

const radius = 90
const circumference = 2 * Math.PI * radius

const progress = computed(() => {
  const total = Math.max(1, props.phaseDurationSec)
  const remain = Math.max(0, Math.min(total, props.remainingSec))
  return 1 - remain / total
})

const dashOffset = computed(() => circumference * (1 - progress.value))

const phaseClass = computed(() => {
  if (props.phase === 'work') return 'phase-work'
  if (props.phase === 'rest') return 'phase-rest'
  return 'phase-long-rest'
})
</script>

<template>
  <section class="dial-card" :class="[phaseClass, `status-${props.status}`]">
    <div class="dial-shell">
      <svg class="dial-svg" viewBox="0 0 220 220" role="img" :aria-label="`${props.phaseLabel}: ${props.timeLabel}`">
        <defs>
          <linearGradient id="gradient-work" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#d3234b" />
            <stop offset="100%" stop-color="#ff4567" />
          </linearGradient>
          <linearGradient id="gradient-rest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2f8f8f" />
            <stop offset="100%" stop-color="#3db8b8" />
          </linearGradient>
          <linearGradient id="gradient-long-rest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8566ff" />
            <stop offset="100%" stop-color="#a78bff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle class="dial-track" cx="110" cy="110" :r="radius" />
        <circle
          class="dial-progress"
          cx="110"
          cy="110"
          :r="radius"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <div class="dial-center">
        <p class="dial-time">{{ props.timeLabel }}</p>
        <p class="dial-meta">{{ props.phaseLabel }} · {{ props.statusLabel }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dial-card {
  border: 1px solid var(--color-border-light);
  background: linear-gradient(180deg, rgba(255, 255, 255, .02), rgba(255, 255, 255, .01));
  border-radius: 14px;
  padding: .85rem;
  transition: all .4s ease;
}
.dial-shell {
  position: relative;
  width: min(290px, 85vw);
  margin: 0 auto;
}
.dial-svg {
  width: 100%;
  height: auto;
  display: block;
  transform: rotate(-90deg);
}
.dial-track {
  fill: none;
  stroke: rgba(255, 255, 255, .08);
  stroke-width: 13;
}
.dial-progress {
  fill: none;
  stroke-width: 13;
  stroke-linecap: round;
  transition: stroke-dashoffset .55s linear, stroke .4s ease, filter .4s ease;
  filter: url(#glow);
}
.phase-work .dial-progress {
  stroke: url(#gradient-work);
}
.phase-rest .dial-progress {
  stroke: url(#gradient-rest);
}
.phase-long-rest .dial-progress {
  stroke: url(#gradient-long-rest);
}
.status-running .dial-progress {
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% {
    filter: url(#glow) drop-shadow(0 0 8px currentColor);
  }
  50% {
    filter: url(#glow) drop-shadow(0 0 16px currentColor);
  }
}
.dial-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  pointer-events: none;
}
.dial-time {
  margin: 0;
  line-height: 1;
  font-size: clamp(2rem, 7vw, 2.8rem);
  letter-spacing: .07em;
  color: var(--color-text);
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(232, 232, 232, .3);
}
.dial-meta {
  margin: .4rem 0 0;
  color: var(--color-text-secondary);
  font-size: .78rem;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.status-paused .dial-progress {
  opacity: .7;
  animation: none;
}
.status-stopped .dial-progress {
  opacity: .5;
  animation: none;
}
</style>