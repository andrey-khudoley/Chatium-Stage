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
  background:
    radial-gradient(circle at 14% 10%, rgba(79, 111, 47, 0.11), transparent 34%),
    radial-gradient(circle at 82% 88%, rgba(61, 85, 37, 0.1), transparent 38%),
    linear-gradient(140deg, #f2eedf 0%, #e8e2ce 62%, #f6f2e3 100%);
}

/* Светлая тема: фоновый рисунок */
.dc-page-background--light .dc-page-bg-layer {
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_09YXnJj0kv.1408x768.png');
  background-size: cover;
  background-position: center;
  opacity: 0.72;
  transform: scale(1.02);
  filter: saturate(108%) contrast(106%) brightness(0.98);
}

/* Светлая тема: градиентный оверлей */
.dc-page-background--light .dc-page-bg-overlay {
  background:
    radial-gradient(circle at 12% 0%, rgba(79, 111, 47, 0.08), transparent 34%),
    linear-gradient(142deg, rgba(242, 237, 223, 0.58) 0%, rgba(232, 226, 206, 0.54) 46%, rgba(249, 245, 234, 0.42) 100%);
  backdrop-filter: blur(1.6px);
}
</style>
