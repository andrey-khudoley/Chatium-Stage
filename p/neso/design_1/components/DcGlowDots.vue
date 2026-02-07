<script setup lang="ts">
/** Три маленьких светящихся точки (светлячки) + угловые свечения + атмосферный слой. Как в коммите 999f97b. */
defineProps<{
  theme?: 'dark' | 'light'
}>()
</script>

<template>
  <div class="dc-glow-dots" :class="`dc-glow-dots--${theme ?? 'dark'}`" aria-hidden="true">
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
  backface-visibility: hidden;
}

/* Атмосферный свет — три мягких градиента */
.dc-glow-dots--dark {
  background:
    radial-gradient(68% 54% at 14% 92%, rgba(175, 196, 95, 0.11), transparent 74%),
    radial-gradient(62% 52% at 88% 10%, rgba(197, 216, 121, 0.09), transparent 76%),
    radial-gradient(40% 34% at 58% 52%, rgba(175, 196, 95, 0.06), transparent 78%);
  animation: dc-ambient-shift 38s ease-in-out infinite alternate;
}

.dc-glow-dots--light {
  background:
    radial-gradient(68% 54% at 14% 92%, rgba(79, 111, 47, 0.08), transparent 74%),
    radial-gradient(62% 52% at 88% 10%, rgba(79, 111, 47, 0.06), transparent 76%),
    radial-gradient(40% 34% at 58% 52%, rgba(79, 111, 47, 0.04), transparent 78%);
  animation: dc-ambient-shift 38s ease-in-out infinite alternate;
}

/* Точечная текстура (микро-светлячки) */
.dc-glow-dots::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(197, 216, 121, 0.55) 0.6px, transparent 0.8px);
  background-size: 4px 4px;
  opacity: 0.05;
  mix-blend-mode: screen;
}

.dc-glow-dots--light::before {
  background-image: radial-gradient(rgba(79, 111, 47, 0.25) 0.6px, transparent 0.8px);
  opacity: 0.04;
}

/* Угловые свечения: правый верх + левый низ (радиус сохранён, интенсивность снижена).
   inset увеличен, чтобы при анимации translate+scale не появлялись чёрные полосы у границ экрана. */
.dc-glow-dots::after {
  content: '';
  position: absolute;
  inset: -30%;
  pointer-events: none;
  background:
    radial-gradient(50% 38% at 78% 16%, rgba(197, 216, 121, 0.06), transparent 74%),
    radial-gradient(44% 34% at 28% 84%, rgba(175, 196, 95, 0.05), transparent 76%);
  opacity: 0.12;
  animation: dc-ambient-breathe 46s ease-in-out infinite alternate;
  backface-visibility: hidden;
  will-change: transform;
}

.dc-glow-dots--light::after {
  background:
    radial-gradient(50% 38% at 78% 16%, rgba(255, 248, 230, 0.09), transparent 74%),
    radial-gradient(44% 34% at 28% 84%, rgba(79, 111, 47, 0.04), transparent 76%);
  opacity: 0.14;
  animation: dc-ambient-breathe 46s ease-in-out infinite alternate;
}

/* Три точки-светлячка */
.dc-glow-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c5d879;
  mix-blend-mode: screen;
  opacity: 0.68;
  box-shadow:
    0 0 0 1px rgba(197, 216, 121, 0.2),
    0 0 18px rgba(197, 216, 121, 0.58),
    0 0 36px rgba(175, 196, 95, 0.28);
  animation:
    dc-firefly-drift 16s ease-in-out infinite,
    dc-firefly-pulse 4.8s ease-in-out infinite;
}

.dc-glow-dots--light .dc-glow-dot {
  background: #6f8440;
  box-shadow:
    0 0 0 1px rgba(79, 111, 47, 0.2),
    0 0 12px rgba(79, 111, 47, 0.35),
    0 0 24px rgba(79, 111, 47, 0.18);
}

.dc-glow-dot-1 {
  top: 24%;
  right: 22%;
  animation-delay: 0s, -1s;
}

.dc-glow-dot-2 {
  width: 5px;
  height: 5px;
  bottom: 28%;
  left: 18%;
  opacity: 0.56;
  animation-delay: -5s, -2.2s;
}

.dc-glow-dots--light .dc-glow-dot-2 {
  opacity: 0.46;
}

.dc-glow-dot-3 {
  width: 4px;
  height: 4px;
  top: 62%;
  right: 36%;
  opacity: 0.5;
  animation-delay: -9s, -3.1s;
}

.dc-glow-dots--light .dc-glow-dot-3 {
  opacity: 0.42;
}

/* Анимации контейнера и углов */
@keyframes dc-ambient-shift {
  0% {
    transform: translate3d(-0.8%, -0.6%, 0);
  }
  100% {
    transform: translate3d(0.8%, 0.7%, 0);
  }
}

/* Лёгкое «дыхание» без scale, чтобы не обнажать края и не давать чёрных полос у границ экрана */
@keyframes dc-ambient-breathe {
  0% {
    transform: translate3d(-0.6%, -0.4%, 0);
  }
  100% {
    transform: translate3d(0.5%, 0.45%, 0);
  }
}

/* Анимации точек */
@keyframes dc-firefly-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(18px, -14px, 0);
  }
}

@keyframes dc-firefly-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dc-glow-dots,
  .dc-glow-dots::after,
  .dc-glow-dot {
    animation: none !important;
  }
}
</style>
