<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
}>()
</script>

<template>
  <div class="dc-page-background" :class="`dc-page-background--${theme ?? 'dark'}`" aria-hidden="true">
    <div class="dc-page-bg-base"></div>
    <div class="dc-page-bg-layer"></div>
    <div class="dc-page-bg-overlay"></div>
  </div>
</template>

<style scoped>
.dc-page-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.dc-page-bg-base,
.dc-page-bg-layer,
.dc-page-bg-overlay {
  position: absolute;
  inset: 0;
}

/* Тёмная тема: базовый градиент */
.dc-page-background--dark .dc-page-bg-base {
  background: radial-gradient(circle at 16% 12%, rgba(175, 196, 95, 0.1), transparent 34%),
    radial-gradient(circle at 84% 86%, rgba(111, 132, 64, 0.08), transparent 38%),
    linear-gradient(140deg, #05080a 0%, #0d1214 60%, #11191b 100%);
}

/* Тёмная тема: фоновый рисунок */
.dc-page-background--dark .dc-page-bg-layer {
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_3IQ3znw7md.1376x768.png');
  background-size: cover;
  background-position: center;
  opacity: 0.34;
  transform: scale(1.03);
  filter: saturate(112%) contrast(106%);
}

/* Тёмная тема: градиентный оверлей */
.dc-page-background--dark .dc-page-bg-overlay {
  background: linear-gradient(145deg, rgba(5,8,10,0.92) 0%, rgba(13,18,20,0.82) 48%, rgba(17,25,27,0.9) 100%);
  backdrop-filter: blur(4px);
}

/* Светлая тема: базовый фон */
.dc-page-background--light .dc-page-bg-base {
  background: #f8f6eb;
}

/* Светлая тема: фоновый рисунок */
.dc-page-background--light .dc-page-bg-layer {
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_09YXnJj0kv.1408x768.png');
  background-size: cover;
  background-position: center;
}

/* Светлая тема: градиентный оверлей */
.dc-page-background--light .dc-page-bg-overlay {
  background: linear-gradient(135deg, rgba(248,246,235,0.78) 0%, rgba(240,237,224,0.68) 50%, rgba(255,255,255,0.55) 100%);
  backdrop-filter: blur(2px);
}
</style>
