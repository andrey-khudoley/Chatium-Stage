<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
}>()
</script>

<template>
  <div class="dc-glow-dots" aria-hidden="true">
    <span class="dc-glow-dot dc-glow-dot-1"></span>
    <span class="dc-glow-dot dc-glow-dot-2"></span>
    <span class="dc-glow-dot dc-glow-dot-3"></span>
  </div>
</template>

<style scoped>
.dc-glow-dots {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.dc-glow-dots::before,
.dc-glow-dots::after {
  content: '';
  position: absolute;
  inset: -18%;
}

.dc-glow-dots::before {
  background:
    radial-gradient(44% 34% at 88% 10%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 72%),
    radial-gradient(48% 40% at 12% 92%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 74%);
  filter: blur(1px);
  animation: dc-ambient-drift 28s ease-in-out infinite alternate;
}

.dc-glow-dots::after {
  background-image: radial-gradient(color-mix(in srgb, var(--accent) 36%, transparent) 0.65px, transparent 0.95px);
  background-size: 4px 4px;
  opacity: var(--noise-opacity, 0.05);
  mix-blend-mode: screen;
}

.dc-glow-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-strong);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent),
    0 0 18px color-mix(in srgb, var(--accent) 58%, transparent),
    var(--glow-accent);
  animation:
    dc-firefly-drift 16s ease-in-out infinite,
    dc-firefly-pulse 4.6s ease-in-out infinite;
}

.dc-glow-dot-1 {
  top: 22%;
  right: 18%;
  animation-delay: 0s, -0.5s;
}

.dc-glow-dot-2 {
  width: 5px;
  height: 5px;
  left: 16%;
  bottom: 26%;
  animation-delay: -4s, -1.8s;
}

.dc-glow-dot-3 {
  width: 4px;
  height: 4px;
  right: 34%;
  bottom: 62%;
  animation-delay: -8s, -2.6s;
}

@keyframes dc-ambient-drift {
  0% {
    transform: translate3d(-1%, -1%, 0) scale(1);
  }
  100% {
    transform: translate3d(1%, 1%, 0) scale(1.03);
  }
}

@keyframes dc-firefly-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(14px, -11px, 0);
  }
}

@keyframes dc-firefly-pulse {
  0%,
  100% {
    opacity: 0.28;
  }
  50% {
    opacity: 0.76;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dc-glow-dots::before,
  .dc-glow-dot {
    animation: none !important;
  }
}
</style>
