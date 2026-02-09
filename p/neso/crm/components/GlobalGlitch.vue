<template>
  <div class="global-glitch-style-anchor" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('GlobalGlitch')

onMounted(() => {
  log.debug('Global glitch styles mounted')
})
</script>

<style>
.global-glitch-style-anchor {
  display: none;
}

.global-glitch-active {
  animation: crm-global-glitch 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both !important;
}

@keyframes crm-global-glitch {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    filter: none;
  }
  15% {
    transform: translate3d(-1px, 0, 0);
    filter:
      drop-shadow(2px 0 0 color-mix(in srgb, var(--crm-accent, #4da3ff) 75%, transparent))
      drop-shadow(-2px 0 0 color-mix(in srgb, var(--crm-danger, #ff6b7f) 70%, transparent));
  }
  35% {
    transform: translate3d(1px, 0, 0);
    filter:
      drop-shadow(-1px 0 0 color-mix(in srgb, var(--crm-accent, #4da3ff) 72%, transparent))
      drop-shadow(1px 0 0 color-mix(in srgb, var(--crm-info, #7dd3fc) 66%, transparent));
  }
  60% {
    transform: translate3d(-1px, 0, 0);
    filter: contrast(1.1) saturate(1.1);
  }
}

.global-glitch-active * {
  pointer-events: none !important;
}
</style>
