# Дизайн-система и UI/UX в Chatium

Исчерпывающее руководство по созданию современных, консистентных и адаптивных интерфейсов для приложений на платформе Chatium. Документ структурирован для удобства полнотекстового поиска и работы с эмбеддингами.

## Содержание

- [Философия дизайна](#философия-дизайна)
- [Стили дизайна](#стили-дизайна)
  - [Урбанистический (Urban/Tech)](#урбанистический-urbantech)
  - [Классический (Business)](#классический-business)
  - [Минималистичный (Clean)](#минималистичный-clean)
- [Архитектура стилей](#архитектура-стилей)
  - [Файл styles.tsx](#файл-stylestsx)
  - [CSS Variables](#css-variables)
  - [TailwindCSS](#tailwindcss)
- [Темная и светлая тема](#темная-и-светлая-тема)
  - [Переключатель темы](#переключатель-темы)
  - [CSS Variables для тем](#css-variables-для-тем)
  - [Поддержка системных предпочтений](#поддержка-системных-предпочтений)
- [Типографика](#типографика)
  - [Шрифты](#шрифты)
  - [Заголовки](#заголовки)
  - [Размеры текста](#размеры-текста)
- [Цветовая палитра](#цветовая-палитра)
  - [Основные цвета](#основные-цвета)
  - [Семантические цвета](#семантические-цвета)
  - [Градиенты](#градиенты)
- [Компоненты](#компоненты)
  - [Структура страниц](#структура-страниц)
  - [Заголовки страниц](#заголовки-страниц)
  - [Навигация (хлебные крошки)](#навигация-хлебные-крошки)
  - [Карточки (Cards)](#карточки-cards)
  - [Таблицы](#таблицы)
  - [Кнопки](#кнопки)
  - [Формы и поля ввода](#формы-и-поля-ввода)
  - [Модальные окна](#модальные-окна)
  - [Бейджи (Badges)](#бейджи-badges)
  - [Состояния интерфейса](#состояния-интерфейса)
- [Иконки](#иконки)
  - [FontAwesome](#fontawesome)
  - [Размеры и цвета](#размеры-и-цвета)
  - [Семантика иконок](#семантика-иконок)
- [Анимации и переходы](#анимации-и-переходы)
  - [Transitions](#transitions)
  - [Анимации загрузки](#анимации-загрузки)
  - [Hover эффекты](#hover-эффекты)
- [Прелоадеры](#прелоадеры)
  - [Глобальный прелоадер](#глобальный-прелоадер)
  - [Локальные индикаторы загрузки](#локальные-индикаторы-загрузки)
- [Адаптивность](#адаптивность)
  - [Breakpoints](#breakpoints)
  - [Grid системы](#grid-системы)
  - [Адаптивные отступы](#адаптивные-отступы)
- [Отступы и интервалы](#отступы-и-интервалы)
- [Тени и глубина](#тени-и-глубина)
- [Лучшие практики](#лучшие-практики)
- [Чеклист для новой страницы](#чеклист-для-новой-страницы)
- [Типичные ошибки](#типичные-ошибки)

---

## Философия дизайна

### Основные принципы

**Консистентность** — все элементы должны выглядеть и вести себя единообразно:
- Единая цветовая палитра
- Одинаковые отступы и интервалы
- Унифицированные компоненты
- Предсказуемое поведение

**Простота и минимализм** — интерфейс должен быть понятным:
- Чистые макеты без лишних элементов
- Ясная визуальная иерархия
- Достаточное количество воздуха между элементами
- Фокус на содержимом

**Доступность** — интерфейс должен быть доступен всем:
- Поддержка клавиатурной навигации
- Достаточная контрастность цветов
- Понятные текстовые метки
- Адаптивность под разные устройства

**Производительность** — быстрая загрузка и плавная работа:
- Оптимизация анимаций (CSS вместо JS)
- Минимальное количество перерендеров
- Быстрые transitions (0.2s)
- Эффективные CSS селекторы

### Современный UI

✅ **Используйте:**
- Градиенты для создания глубины
- Тени для выделения элементов
- Скругленные углы (border-radius)
- Плавные анимации и переходы
- CSS Variables для гибкости

❌ **Избегайте:**
- Плоских одноцветных элементов
- Резких переходов без анимации
- Острых углов (90 градусов)
- Жестко закодированных цветов
- Избыточных украшений

---

## Стили дизайна

### Урбанистический (Urban/Tech)

**Концепция:** Технологичный, индустриальный дизайн в стиле киберпанк/урбан. Идеально подходит для IT-систем, аналитических платформ, DevOps инструментов.

#### Ключевые характеристики

**Цветовая палитра:**
- Очень тёмный фон (#0a0a0a - почти чёрный)
- Тёмно-серые слои (#141414, #1a1a1a)
- Один яркий акцентный цвет (например, #d3234b - красный)
- Максимум 3 цвета на странице

**Визуальные элементы:**
- Grid-сетка на фоне (геометрический паттерн)
- Плавающие градиентные сферы
- Острые углы (border-radius: 0)
- Тонкие границы (#2a2a2a)
- Многоуровневые тени

**Анимации:**
- 3D трансформации (perspective, rotateX, rotateY)
- Эффект "качания стекла" при hover
- Диагональные блики света
- Плавные transitions (0.6s cubic-bezier)

#### Полная реализация

##### CSS Variables

```css
:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-tertiary: #1a1a1a;
  --color-text: #e8e8e8;
  --color-text-secondary: #a0a0a0;
  --color-text-tertiary: #707070;
  --color-border: #2a2a2a;
  --color-border-light: #3a3a3a;
  --color-accent: #d3234b;
  --color-accent-hover: #e6395f;
  --color-accent-light: rgba(211, 35, 75, 0.1);
  --color-accent-medium: rgba(211, 35, 75, 0.2);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

##### Геометрический фон

```html
<!-- В body, самым первым элементом -->
<div id="geometric-bg"></div>
```

```css
#geometric-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  pointer-events: none;
}

/* Grid-сетка */
#geometric-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(90deg, transparent 0%, transparent calc(100% - 1px), #2a2a2a calc(100% - 1px)),
    linear-gradient(0deg, transparent 0%, transparent calc(100% - 1px), #2a2a2a calc(100% - 1px));
  background-size: 60px 60px;
  opacity: 0.12;
}

/* Плавающий градиентный шар */
#geometric-bg::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(211, 35, 75, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  animation: geometric-float 20s ease-in-out infinite;
}

@keyframes geometric-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-50px, 50px) scale(1.1);
  }
}
```

##### Навигационные карточки

```vue
<template>
  <a :href="url" class="nav-card">
    <div class="nav-card-content">
      <div class="nav-card-icon">
        <i class="fas fa-chart-line"></i>
      </div>
      <h2 class="nav-card-title">Управлять аналитикой</h2>
      <p class="nav-card-description">
        Просматривайте статистику переходов, анализируйте источники трафика
      </p>
      <div class="nav-card-arrow">
        <i class="fas fa-arrow-right"></i>
      </div>
    </div>
  </a>
</template>

<style>
.nav-card {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
  transition: var(--transition);
  position: relative;
  perspective: 1000px;
}

.nav-card-content {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 2px solid var(--color-border);
  border-radius: 0; /* Острые углы! */
  padding: 2.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), 
              border-color 0.25s ease, 
              box-shadow 0.25s ease;
  position: relative;
  z-index: 1;
  overflow: hidden;
  transform-style: preserve-3d;
}

/* Угловой блик */
.nav-card-content::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, transparent 40%, rgba(211, 35, 75, 0.03) 50%, transparent 60%);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

.nav-card:hover .nav-card-content::before {
  animation: corner-glow 1s ease-out forwards;
}

@keyframes corner-glow {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translate(10px, -10px);
  }
}

/* Hover эффект: поднятие и качание */
.nav-card:hover .nav-card-content {
  transform: translateY(-4px) rotateX(0.8deg) rotateY(-0.4deg);
  border-color: var(--color-border-light);
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.nav-card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: var(--color-text);
  font-size: 1.25rem;
  transition: transform 0.5s ease-out, border-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
}

/* Красная линия снизу иконки при hover */
.nav-card-icon::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.nav-card:hover .nav-card-icon::after {
  transform: scaleX(1);
}

/* Цветная иконка с красным градиентом */
.nav-card-icon {
  background: linear-gradient(135deg, var(--color-accent-medium) 0%, var(--color-accent-light) 100%);
  border-color: rgba(211, 35, 75, 0.4);
  color: var(--color-accent);
}

.nav-card:hover .nav-card-icon {
  background: linear-gradient(135deg, rgba(211, 35, 75, 0.3) 0%, rgba(211, 35, 75, 0.2) 100%);
  border-color: var(--color-accent);
  box-shadow: 
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 2px 6px rgba(211, 35, 75, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.nav-card-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text);
  margin: 0 0 0.75rem 0;
  position: relative;
  z-index: 1;
}

.nav-card-description {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  flex-grow: 1;
  margin: 0 0 1.5rem 0;
  position: relative;
  z-index: 1;
}

.nav-card-arrow {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--color-text-tertiary);
  font-size: 1rem;
  transition: transform 0.5s ease-out, color 0.25s ease;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.nav-card:hover .nav-card-arrow {
  transform: translateX(4px);
  color: var(--color-accent);
}
</style>
```

##### Hero-секция с typing эффектом

```vue
<template>
  <section class="hero-section" :class="{ 'hero-ready': bootLoaderDone }">
    <!-- Иконка темы -->
    <div class="hero-icon-wrapper" :class="{ 'hero-icon-visible': showCards }">
      <i class="fas fa-chart-line hero-icon"></i>
    </div>
    
    <!-- Заголовок с typing эффектом -->
    <h1 class="hero-heading">
      {{ displayedTitle }}<span v-if="showCursor" class="typing-cursor">|</span>
    </h1>
    
    <p class="hero-description">
      Выберите раздел для управления
    </p>
  </section>
</template>

<style>
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  padding: 2rem 0;
  position: relative;
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.hero-section.hero-ready {
  opacity: 1;
}

/* Пульсирующее свечение за секцией */
.hero-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(211, 35, 75, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
  animation: hero-glow 4s ease-in-out infinite;
}

@keyframes hero-glow {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* Иконка темы */
.hero-icon-wrapper {
  width: 5rem;
  height: 5rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(211, 35, 75, 0.4),
    0 4px 12px rgba(211, 35, 75, 0.3);
  margin-bottom: 0.5rem;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), 
              transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.hero-icon-wrapper.hero-icon-visible {
  opacity: 1;
  transform: scale(1);
  animation: hero-icon-pulse 3s ease-in-out infinite 0.6s;
}

@keyframes hero-icon-pulse {
  0%, 100% {
    box-shadow: 
      0 8px 24px rgba(211, 35, 75, 0.4),
      0 4px 12px rgba(211, 35, 75, 0.3);
  }
  50% {
    box-shadow: 
      0 12px 32px rgba(211, 35, 75, 0.5),
      0 6px 16px rgba(211, 35, 75, 0.4);
  }
}

.hero-icon {
  font-size: 2rem;
  color: white;
}

/* Заголовок */
.hero-heading {
  font-size: 3rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--color-text);
  position: relative;
  z-index: 1;
}

/* Красная линия под заголовком */
.hero-heading::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  border-radius: 2px;
}

/* Мигающий курсор */
.typing-cursor {
  display: inline-block;
  margin-left: 4px;
  animation: cursor-blink 1s step-end infinite;
  color: var(--color-accent);
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hero-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 600px;
}
</style>
```

##### Typing анимация (JavaScript в Vue)

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const displayedTitle = ref('')
const showCursor = ref(true)
const showCards = ref(false)
const bootLoaderDone = ref(false)

const props = defineProps<{
  projectTitle: string
}>()

onMounted(() => {
  // Ждём завершения bootloader
  const startAnimations = () => {
    bootLoaderDone.value = true
    setTimeout(() => {
      typeTitle()
    }, 100)
  }

  if ((window as any).bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  const typeTitle = () => {
    const fullText = props.projectTitle
    let currentIndex = 0
    
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        displayedTitle.value = fullText.substring(0, currentIndex + 1)
        currentIndex++
      } else {
        clearInterval(typeInterval)
        // Показываем карточки после завершения печати
        setTimeout(() => {
          showCards.value = true
        }, 400)
      }
    }, 40) // 40ms на символ
  }
})
</script>
```

##### Последовательное появление карточек

```css
/* Карточки скрыты по умолчанию */
.nav-card {
  opacity: 0;
  transform: translateY(30px);
}

/* При добавлении класса cards-visible */
.cards-visible .nav-card {
  animation: card-appear 0.6s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
}

/* Последовательная задержка */
.cards-visible .nav-card:nth-child(1) {
  animation-delay: 0s;
}

.cards-visible .nav-card:nth-child(2) {
  animation-delay: 0.15s;
}

.cards-visible .nav-card:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

##### Header с логотипом

```vue
<template>
  <header class="header">
    <div class="container mx-auto px-4 max-w-6xl header-content">
      <div class="header-title-section">
        <a href="/" class="header-logo-link">
          <img 
            src="https://example.com/logo.png" 
            alt="Логотип" 
            class="header-logo"
          />
        </a>
        <h1 class="header-title">{{ pageTitle }}</h1>
      </div>
      <div class="header-actions">
        <a :href="profileUrl" class="header-action-btn">
          <i class="fas fa-user"></i>
        </a>
        <a :href="settingsUrl" class="header-action-btn">
          <i class="fas fa-cog"></i>
        </a>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border);
  padding: 1.25rem 0;
  position: relative;
  z-index: 200;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.header-logo-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.header-logo-link:hover {
  transform: scale(1.05);
}

.header-logo {
  height: 2.5rem;
  width: auto;
  object-fit: contain;
  filter: brightness(0.95);
  transition: filter 0.25s ease;
}

.header-logo-link:hover .header-logo {
  filter: brightness(1.1);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.25s ease;
}

.header-action-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-light);
  transform: translateY(-2px);
}
</style>
```

##### Footer

```vue
<template>
  <footer class="app-footer">
    <div class="footer-content">
      <i class="fab fa-telegram footer-icon"></i>
      <span>{{ projectTitle }}</span>
      <span class="footer-divider">•</span>
      <span class="footer-platform">Chatium Platform</span>
    </div>
  </footer>
</template>

<style>
.app-footer {
  background: var(--color-bg-secondary);
  border-top: 2px solid var(--color-border);
  padding: 1.5rem 0;
  position: relative;
  z-index: 200;
  box-shadow: 
    0 -2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.footer-icon {
  font-size: 1rem;
  color: var(--color-text-tertiary);
}
</style>
```

#### Правила урбанистического стиля

**DO ✅**
1. Используйте очень тёмный фон (#0a0a0a)
2. Применяйте острые углы (border-radius: 0)
3. Добавляйте геометрические паттерны (grid, линии)
4. Используйте один яркий акцентный цвет
5. Применяйте 3D трансформации для hover
6. Добавляйте тонкие блики света
7. Используйте многоуровневые тени
8. Применяйте градиенты для глубины

**DON'T ❌**
1. Не используйте скругления (это не урбан стиль)
2. Не применяйте больше 3 цветов одновременно
3. Не делайте яркий фон (только тёмный)
4. Не используйте плоские тени
5. Не перегружайте анимациями

#### Когда использовать урбанистический стиль

**✅ Подходит для:**
- Аналитических систем
- DevOps инструментов
- Технических дашбордов
- IT-сервисов
- Admin панелей
- Мониторинг систем

**❌ Не подходит для:**
- E-commerce
- Контентных сайтов
- Детских приложений
- Медицинских сервисов
- Образовательных платформ (если не IT-курсы)

### Классический (Business)

**Концепция:** Профессиональный, деловой стиль для корпоративных приложений.

#### Ключевые характеристики

- Светлый фон (#fafbfc)
- Скругленные углы (border-radius: 1rem)
- Синий как основной цвет (#0ea5e9)
- Мягкие тени
- Минимум анимаций

#### Цветовая палитра

```css
:root {
  --color-bg: #fafbfc;
  --color-bg-secondary: #ffffff;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #0ea5e9;
  --color-primary-hover: #0284c7;
}
```

#### Карточки

```css
.card {
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--color-primary);
}
```

### Минималистичный (Clean)

**Концепция:** Чистый, простой интерфейс без излишеств.

#### Ключевые характеристики

- Белый фон (#ffffff)
- Минимум теней
- Тонкие линии
- Много воздуха (большие отступы)
- Один акцентный цвет

#### Цветовая палитра

```css
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-text: #212529;
  --color-text-secondary: #6c757d;
  --color-border: #dee2e6;
  --color-primary: #0d6efd;
}
```

#### Карточки

```css
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 2rem;
  transition: border-color 0.2s ease;
}

.card:hover {
  border-color: var(--color-primary);
}
```

---

## Архитектура стилей

### Файл styles.tsx

**Создайте файл `styles.tsx`** в корне проекта для централизованного управления стилями.

```typescript
// @shared

export const tailwindScript = `
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            // ... остальные оттенки
            900: '#0c4a6e'
          }
        }
      }
    }
  }
`

export const cssVariables = `
  :root {
    --color-bg: #fafbfc;
    --color-text: #1e293b;
    /* ... остальные переменные */
  }
  
  .dark {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
    /* ... темные переменные */
  }
`

export const commonStyles = `
  .card {
    background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
    border: 1.5px solid var(--color-border);
    /* ... */
  }
`
```

### CSS Variables

**Всегда используйте CSS Variables** вместо хардкода цветов:

✅ **Правильно:**
```vue
<div style="color: var(--color-text)">
<div class="text-[var(--color-text)]">
```

❌ **Неправильно:**
```vue
<div style="color: #1e293b">
<div class="text-gray-800">
```

**Преимущества CSS Variables:**
- Автоматическая поддержка темной/светлой темы
- Единый источник правды для цветов
- Легко изменить всю палитру
- Не нужно дублировать стили

### TailwindCSS

**Используйте Tailwind** через CDN для быстрой разработки:

```typescript
// В styles.tsx
export const tailwindScript = `
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        // Кастомизация
      }
    }
  }
`
```

**Подключение в роуте:**

```tsx
export const indexRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: tailwindScript }} />
      </head>
    </html>
  )
})
```

**Когда использовать Tailwind:**
- ✅ Для layout (flex, grid, spacing)
- ✅ Для адаптивности (md:, lg:)
- ✅ Для утилит (rounded, shadow)

**Когда использовать CSS Variables:**
- ✅ Для цветов (поддержка тем)
- ✅ Для кастомных значений
- ✅ Для динамических стилей

---

## Темная и светлая тема

### Переключатель темы

**Создайте компонент `ThemeToggle.vue`:**

```vue
<template>
  <button
    @click="toggleTheme"
    class="theme-toggle"
    :class="{ 'dark': isDark }"
  >
    <i v-if="isDark" class="fas fa-sun"></i>
    <i v-else class="fas fa-moon"></i>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  } else {
    // Системная тема
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    }
  }
})

function toggleTheme() {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 1.5px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: var(--transition);
  z-index: 1000;
  color: var(--color-primary);
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

.theme-toggle:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}
</style>
```

**Добавьте на каждую страницу:**

```vue
<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    <ThemeToggle />
    <!-- Контент -->
  </div>
</template>

<script setup>
import ThemeToggle from './components/ThemeToggle.vue'
</script>
```

### CSS Variables для тем

**Определите переменные для обеих тем:**

```css
:root {
  /* Светлая тема */
  --color-bg: #fafbfc;
  --color-bg-secondary: #ffffff;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-tertiary: #94a3b8;
  --color-border: #e2e8f0;
  --color-primary: #0ea5e9;
  --color-primary-hover: #0284c7;
  --color-primary-light: #e0f2fe;
}

.dark {
  /* Темная тема */
  --color-bg: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;
  --color-border: #334155;
  --color-primary: #38bdf8;
  --color-primary-hover: #0ea5e9;
  --color-primary-light: #1e3a5f;
}
```

### Поддержка системных предпочтений

**Автоматическое определение темы:**

```javascript
// При первом посещении
if (!localStorage.getItem('theme')) {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (isDark) {
    document.documentElement.classList.add('dark')
  }
}
```

**Реагирование на изменения:**

```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    // Только если пользователь не выбрал тему вручную
    if (e.matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})
```

### Работа с Tailwind dark: модификаторами

**КРИТИЧЕСКИ ВАЖНО:** При использовании Tailwind CSS всегда указывайте стили для **обеих тем одновременно**.

#### ⚠️ Типичная ошибка - недостаточный контраст

**ПЛОХО - текст невидим в темной теме:**

```vue
<div class="bg-white text-gray-900">
  Этот текст будет невидим в dark mode!
</div>
```

**ХОРОШО - контраст обеспечен для обеих тем:**

```vue
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Этот текст читаем в обеих темах!
</div>
```

#### 🎨 Правила контраста для карточек

**Системный подход к дизайну карточек:**

```vue
<!-- Невыбранная карточка (unselected state) -->
<div 
  class="p-3 border rounded-md cursor-pointer transition-all hover:shadow-sm"
  :class="isSelected 
    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'"
>
  <!-- Заголовок -->
  <h4 :class="isSelected 
    ? 'text-blue-900 dark:text-blue-200' 
    : 'text-gray-800 dark:text-gray-100'">
    Описание события
  </h4>
  
  <!-- Подпись/код -->
  <p :class="isSelected 
    ? 'text-blue-700 dark:text-blue-300' 
    : 'text-gray-600 dark:text-gray-300'">
    event_name
  </p>
</div>
```

#### 📊 Таблица рекомендуемых комбинаций

| Состояние | Фон (светлая) | Фон (темная) | Текст (светлая) | Текст (темная) |
|-----------|---------------|--------------|-----------------|----------------|
| **Невыбранная карточка** | `bg-white` | `dark:bg-gray-800` | `text-gray-800` | `dark:text-gray-100` |
| **Выбранная карточка (синяя)** | `bg-blue-50` | `dark:bg-blue-900/30` | `text-blue-900` | `dark:text-blue-200` |
| **Выбранная карточка (фиолетовая)** | `bg-purple-50` | `dark:bg-purple-900/30` | `text-purple-900` | `dark:text-purple-200` |
| **Выбранная карточка (оранжевая)** | `bg-orange-50` | `dark:bg-orange-900/30` | `text-orange-900` | `dark:text-orange-200` |
| **Бэйдж невыбранный** | `bg-gray-200` | `dark:bg-gray-900` | `text-gray-800` | `dark:text-gray-200` |
| **Бэйдж выбранный (код)** | `bg-orange-200` | `dark:bg-orange-950` | `text-orange-900` | `dark:text-orange-200` |

#### 🔍 Правило "Светлый фон = Светлый текст"

**Для темной темы:**
- Фон `dark:bg-gray-800` (серый) → Текст `dark:text-gray-100` (почти белый)
- Фон `dark:bg-gray-900` (темно-серый) → Текст `dark:text-gray-200` (белый)
- Фон `dark:bg-blue-900/30` (полупрозрачный синий) → Текст `dark:text-blue-200` (светло-синий)

**НЕ делайте:**
- ❌ `dark:bg-gray-700` + `dark:text-gray-900` — темный на темном
- ❌ `dark:bg-gray-800` + `dark:text-gray-600` — низкий контраст
- ❌ Использование только `text-gray-900` без dark: варианта

#### 💡 Полный пример с чекбоксом и бэйджем

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <div 
      v-for="item in items" 
      :key="item.id"
      class="p-3 border rounded-md cursor-pointer transition-all hover:shadow-sm"
      :class="selectedItems.includes(item.id) 
        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30' 
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'"
      @click="toggleItem(item.id)"
    >
      <div class="flex items-start gap-2">
        <input 
          type="checkbox" 
          :checked="selectedItems.includes(item.id)"
          class="w-4 h-4 flex-shrink-0 mt-0.5"
          @click.stop="toggleItem(item.id)"
        />
        <div class="flex-1">
          <!-- Заголовок с правильным контрастом -->
          <h4 
            class="font-medium text-sm leading-tight mb-1" 
            :class="selectedItems.includes(item.id) 
              ? 'text-purple-900 dark:text-purple-200' 
              : 'text-gray-800 dark:text-gray-100'"
          >
            {{ item.title }}
          </h4>
          
          <!-- Бэйдж/код с правильным контрастом -->
          <code 
            class="text-xs px-2 py-1 rounded inline-block font-mono" 
            :class="selectedItems.includes(item.id) 
              ? 'text-purple-900 dark:text-purple-200 bg-purple-200 dark:bg-purple-950' 
              : 'text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-900'"
          >
            {{ item.code }}
          </code>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 🚨 Проверочный чеклист

Перед публикацией страницы проверьте:

- [ ] Все элементы имеют `dark:` варианты для фона
- [ ] Все текстовые элементы имеют `dark:` варианты для цвета
- [ ] Контраст между фоном и текстом достаточен (минимум 4.5:1)
- [ ] Бордеры видны в обеих темах (`dark:border-gray-600` для темной)
- [ ] Бэйджи и code блоки имеют собственный фон
- [ ] Проверено переключением темы в браузере

#### 🎯 Отладка проблем с контрастом

**Если текст не виден в темной теме:**

1. **Проверьте фон элемента** - возможно, он наследует темный фон без `dark:bg-*`
2. **Добавьте явный фон** - `bg-white dark:bg-gray-800`
3. **Используйте светлый текст** - `dark:text-gray-100` вместо `dark:text-gray-900`
4. **Проверьте вложенность** - родительский элемент может перекрывать стили

**Пример проблемы:**
```vue
<!-- ПЛОХО: фон не задан, текст темный -->
<div class="text-gray-900">
  Невидимый текст в dark mode
</div>

<!-- ХОРОШО: фон и текст заданы для обеих тем -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Читаемый текст в обеих темах
</div>
```

---

## Типографика

### Шрифты

**Используйте Inter** как основной шрифт:

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
```

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}
```

**Почему Inter:**
- ✅ Современный геометрический шрифт
- ✅ Отличная читаемость на экране
- ✅ Широкая поддержка начертаний (400-700)
- ✅ Оптимизирован для интерфейсов

### Заголовки

**Используйте следующие размеры:**

```css
h1 {
  font-size: 2.25rem;  /* 36px - text-4xl */
  font-weight: 700;
  line-height: 1.2;
}

h2 {
  font-size: 1.5rem;   /* 24px - text-2xl */
  font-weight: 700;
  line-height: 1.3;
}

h3 {
  font-size: 1.25rem;  /* 20px - text-xl */
  font-weight: 700;
  line-height: 1.4;
}
```

**В Vue компонентах:**

```vue
<h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
  Заголовок страницы
</h1>

<h2 class="text-2xl font-bold flex items-center gap-3">
  <i class="fas fa-cog" style="color: var(--color-primary)"></i>
  Секция
</h2>

<h3 class="text-xl font-bold mb-2">
  Подзаголовок
</h3>
```

### Размеры текста

```css
.text-xs   /* 12px - мелкий текст */
.text-sm   /* 14px - малый текст */
.text-base /* 16px - основной текст */
.text-lg   /* 18px - описание */
.text-xl   /* 20px - подзаголовки */
.text-2xl  /* 24px - секции */
.text-3xl  /* 30px - статистика */
.text-4xl  /* 36px - заголовки страниц */
```

**Цвета текста:**

```vue
<p class="text-[var(--color-text)]">
  Основной текст
</p>

<p class="text-[var(--color-text-secondary)]">
  Вторичный текст (описания)
</p>

<p class="text-[var(--color-text-tertiary)]">
  Третичный текст (подсказки)
</p>
```

---

## Цветовая палитра

### Основные цвета

**Background (фон):**
```css
--color-bg: #fafbfc / #0f172a (dark)
--color-bg-secondary: #ffffff / #1e293b (dark)
```

**Text (текст):**
```css
--color-text: #1e293b / #f1f5f9 (dark)
--color-text-secondary: #64748b / #94a3b8 (dark)
--color-text-tertiary: #94a3b8 / #64748b (dark)
```

**Border (границы):**
```css
--color-border: #e2e8f0 / #334155 (dark)
```

**Primary (акцентный цвет):**
```css
--color-primary: #0ea5e9 / #38bdf8 (dark)
--color-primary-hover: #0284c7 / #0ea5e9 (dark)
--color-primary-light: #e0f2fe / #1e3a5f (dark)
```

### Семантические цвета

**Success (успех):**
```css
--color-success: #10b981 / #34d399 (dark)
--color-success-light: #d1fae5 / #064e3b (dark)
```

**Warning (предупреждение):**
```css
--color-warning: #f59e0b / #fbbf24 (dark)
--color-warning-dark: #d97706 / #f59e0b (dark)
```

**Danger (ошибка):**
```css
--color-danger: #ef4444 / #f87171 (dark)
--color-danger-light: #fee2e2 / #7f1d1d (dark)
```

**Использование:**

```vue
<!-- Success -->
<div style="color: var(--color-success)">
  <i class="fas fa-check-circle"></i>
  Успех
</div>

<!-- Warning -->
<div style="color: var(--color-warning)">
  <i class="fas fa-exclamation-triangle"></i>
  Предупреждение
</div>

<!-- Danger -->
<div style="color: var(--color-danger)">
  <i class="fas fa-times-circle"></i>
  Ошибка
</div>
```

### Градиенты

**Primary градиент:**
```css
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
```

**Card градиент:**
```css
background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
```

**Использование:**

```vue
<!-- Иконка с градиентом -->
<div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
  <i class="fas fa-plug text-2xl text-white"></i>
</div>

<!-- Кнопка с градиентом -->
<button class="btn btn-primary">
  Действие
</button>
```

```css
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
}
```

---

## Компоненты

### Структура страниц

**Главная страница (/):**

```vue
<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
      <!-- Заголовок (центрированный) -->
      <header class="text-center mb-8 mt-8">
        <!-- ... -->
      </header>

      <!-- Статистика -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <!-- Карточки статистики -->
      </div>

      <!-- Основной контент -->
      <div class="card mb-8">
        <!-- ... -->
      </div>
    </div>
  </div>
</template>
```

**Внутренняя страница:**

```vue
<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
      <!-- Хлебные крошки -->
      <div class="mb-6">
        <a :href="homeUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
          <i class="fas fa-arrow-left"></i>
          Назад к главной
        </a>
      </div>

      <!-- Заголовок (центрированный) -->
      <header class="text-center mb-8 mt-4">
        <!-- ... -->
      </header>

      <!-- Основной контент -->
      <div class="card mb-8">
        <!-- ... -->
      </div>
    </div>
  </div>
</template>
```

**Ключевые отличия:**
- Главная: `mt-8` для заголовка, нет хлебных крошек
- Внутренняя: `mt-4` для заголовка, есть хлебные крошки

### Заголовки страниц

**Всегда центрированные:**

```vue
<header class="text-center mb-8 mt-4">
  <!-- Иконка -->
  <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
    <i class="fas fa-[icon] text-2xl text-white"></i>
  </div>
  
  <!-- Заголовок -->
  <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
    Название страницы
  </h1>
  
  <!-- Описание -->
  <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
    Краткое описание функционала страницы
  </p>
</header>
```

**Спецификация:**
- Иконка: `w-16 h-16` (64×64px) в градиентном круге
- Иконка FontAwesome: `text-2xl` белая
- Заголовок: `text-4xl font-bold`
- Описание: `text-lg` с максимальной шириной `max-w-2xl`
- Отступ снизу: `mb-8`
- Отступ сверху: `mt-4` (или `mt-8` для главной)

### Навигация (хлебные крошки)

**Всегда на внутренних страницах:**

```vue
<div class="mb-6">
  <a :href="homeUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
    <i class="fas fa-arrow-left"></i>
    Назад к главной
  </a>
</div>
```

**Правила:**
- ✅ Всегда ТЕКСТ + ИКОНКА (не только иконка)
- ✅ Цвет: `text-[var(--color-primary)]`
- ✅ Hover: `hover:opacity-70`
- ✅ Layout: `flex items-center gap-2`
- ✅ Отступ снизу: `mb-6`

### Карточки (Cards)

**CSS класс `.card`:**

```css
.card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 1.5px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}
```

**Использование:**

```vue
<div class="card mb-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold flex items-center gap-3">
      <i class="fas fa-cog" style="color: var(--color-primary)"></i>
      Название секции
    </h2>
    <button class="btn btn-primary">
      <i class="fas fa-plus mr-2"></i>
      Добавить
    </button>
  </div>
  
  <!-- Контент карточки -->
</div>
```

**Warning карточка:**

```vue
<div class="card warning-card">
  <div class="flex items-start gap-4">
    <div class="warning-icon-box">
      <i class="fas fa-exclamation-triangle text-2xl"></i>
    </div>
    <div class="flex-1">
      <h3 class="text-xl font-bold mb-2">Внимание</h3>
      <p class="mb-4 opacity-90">Важная информация</p>
    </div>
  </div>
</div>
```

**Danger карточка:**

```vue
<div class="card danger-card">
  <div class="flex items-start gap-4">
    <div class="danger-icon-box">
      <i class="fas fa-times-circle text-2xl"></i>
    </div>
    <div class="flex-1">
      <h3 class="text-xl font-bold mb-2">Ошибка</h3>
      <p class="mb-4 opacity-90">Текст ошибки</p>
    </div>
  </div>
</div>
```

### Таблицы

**CSS класс `.table`:**

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table tr:hover {
  background: var(--color-bg-secondary);
}
```

**Использование:**

```vue
<div class="card mb-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold flex items-center gap-3">
      <i class="fas fa-table" style="color: var(--color-primary)"></i>
      Таблица
    </h2>
    <button class="btn btn-primary">
      <i class="fas fa-plus mr-2"></i>
      Добавить
    </button>
  </div>
  
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Статус</th>
          <th class="text-right">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td>
          <td>
            <span class="badge">{{ item.status }}</span>
          </td>
          <td class="text-right">
            <button class="btn btn-primary">
              Подробнее
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Кнопки

**Primary кнопка:**

```vue
<button class="btn btn-primary">
  <i class="fas fa-save mr-2"></i>
  Сохранить
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.625rem;
  font-weight: 600;
  transition: var(--transition);
  border: none;
  outline: none;
  box-shadow: var(--shadow-sm);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  border: 1px solid var(--color-primary-hover);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  opacity: 0.95;
}
```

**Вторичная кнопка:**

```vue
<button class="btn" style="background: var(--color-border);">
  <i class="fas fa-times mr-2"></i>
  Отмена
</button>
```

**Кнопка с состоянием загрузки:**

```vue
<button class="btn btn-primary" :disabled="loading">
  <i v-if="loading" class="fas fa-spinner animate-spin mr-2"></i>
  <i v-else class="fas fa-save mr-2"></i>
  {{ loading ? 'Сохранение...' : 'Сохранить' }}
</button>
```

**Правила:**
- ✅ Всегда с иконкой слева (если применимо)
- ✅ Отступ между иконкой и текстом: `mr-2`
- ✅ Используйте `:disabled` для состояния загрузки
- ✅ Показывайте spinner при загрузке

### Формы и поля ввода

**CSS класс `.input`:**

```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-family: inherit;
  transition: var(--transition);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light), inset 0 1px 2px rgba(0, 0, 0, 0.03);
}
```

**Использование:**

```vue
<form @submit.prevent="handleSubmit">
  <!-- Текстовое поле -->
  <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-[var(--color-text)]">
      Email
    </label>
    <input 
      v-model="email" 
      type="email" 
      class="input" 
      placeholder="user@example.com"
      required
    />
  </div>

  <!-- Textarea -->
  <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-[var(--color-text)]">
      Описание
    </label>
    <textarea 
      v-model="description" 
      class="input" 
      rows="4"
      placeholder="Введите описание..."
    ></textarea>
  </div>

  <!-- Select -->
  <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-[var(--color-text)]">
      Категория
    </label>
    <select v-model="category" class="input">
      <option value="">Выберите...</option>
      <option value="1">Категория 1</option>
      <option value="2">Категория 2</option>
    </select>
  </div>

  <!-- Кнопки -->
  <div class="flex gap-3">
    <button type="submit" class="btn btn-primary flex-1">
      <i class="fas fa-save mr-2"></i>
      Сохранить
    </button>
    <button type="button" @click="cancel" class="btn" style="background: var(--color-border);">
      Отмена
    </button>
  </div>
</form>
```

### Модальные окна

**Структура:**

```vue
<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
  <div class="modal-content">
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-2xl font-bold text-[var(--color-text)]">
        Заголовок
      </h3>
      <button @click="closeModal" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
        <i class="fas fa-times text-2xl"></i>
      </button>
    </div>
    
    <!-- Форма -->
    <form @submit.prevent="handleSubmit">
      <!-- Поля -->
      
      <div class="flex gap-3">
        <button type="submit" class="btn btn-primary flex-1">
          <i class="fas fa-save mr-2"></i>
          Сохранить
        </button>
        <button type="button" @click="closeModal" class="btn" style="background: var(--color-border);">
          Отмена
        </button>
      </div>
    </form>
  </div>
</div>
```

```css
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 1.5px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
```

### Бейджи (Badges)

**CSS класс `.badge`:**

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
```

**Использование:**

```vue
<!-- Success badge -->
<span 
  class="badge"
  style="background: var(--color-success-light); color: var(--color-success);"
>
  Активен
</span>

<!-- Danger badge -->
<span 
  class="badge"
  style="background: var(--color-danger-light); color: var(--color-danger);"
>
  Ошибка
</span>

<!-- Warning badge -->
<span 
  class="badge"
  style="background: var(--color-warning); color: white;"
>
  Внимание
</span>

<!-- Inactive badge -->
<span 
  class="badge"
  style="background: var(--color-text-tertiary); color: var(--color-text-secondary);"
>
  Неактивен
</span>
```

### Состояния интерфейса

**Loading (загрузка):**

```vue
<div v-if="loading" class="text-center py-12">
  <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
  <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка...</p>
</div>
```

**Error (ошибка):**

```vue
<div v-else-if="error" class="text-center py-12">
  <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
  <p style="color: var(--color-danger)">{{ errorMessage }}</p>
  <button @click="retry" class="btn btn-primary mt-4">
    <i class="fas fa-redo mr-2"></i>
    Попробовать снова
  </button>
</div>
```

**Empty (пусто):**

```vue
<div v-else-if="items.length === 0" class="text-center py-12">
  <i class="fas fa-inbox text-4xl mb-4 text-[var(--color-text-tertiary)]"></i>
  <p class="text-[var(--color-text-secondary)]">Нет данных</p>
  <p class="text-sm text-[var(--color-text-tertiary)] mt-2">
    Начните с добавления первого элемента
  </p>
  <button @click="add" class="btn btn-primary mt-4">
    <i class="fas fa-plus mr-2"></i>
    Добавить
  </button>
</div>
```

**Success (успех):**

```vue
<div v-else-if="success" class="text-center py-12">
  <i class="fas fa-check-circle text-4xl mb-4" style="color: var(--color-success)"></i>
  <p style="color: var(--color-success)">Операция выполнена успешно</p>
</div>
```

---

## Иконки

### FontAwesome

**Подключение FontAwesome 6.7.2:**

```html
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
</head>
```

**Базовое использование:**

```vue
<i class="fas fa-user"></i>          <!-- Solid -->
<i class="far fa-user"></i>          <!-- Regular -->
<i class="fal fa-user"></i>          <!-- Light -->
<i class="fab fa-facebook"></i>      <!-- Brands -->
```

### Размеры и цвета

**Размеры:**

```vue
<i class="fas fa-user text-xs"></i>   <!-- 12px -->
<i class="fas fa-user text-sm"></i>   <!-- 14px -->
<i class="fas fa-user text-base"></i> <!-- 16px -->
<i class="fas fa-user text-lg"></i>   <!-- 18px -->
<i class="fas fa-user text-xl"></i>   <!-- 20px -->
<i class="fas fa-user text-2xl"></i>  <!-- 24px -->
<i class="fas fa-user text-3xl"></i>  <!-- 30px -->
<i class="fas fa-user text-4xl"></i>  <!-- 36px -->
```

**Цвета:**

```vue
<i class="fas fa-check" style="color: var(--color-success)"></i>
<i class="fas fa-times" style="color: var(--color-danger)"></i>
<i class="fas fa-exclamation-triangle" style="color: var(--color-warning)"></i>
<i class="fas fa-info-circle" style="color: var(--color-primary)"></i>
```

### Семантика иконок

**Стандартные иконки:**

| Действие | Иконка | Класс |
|----------|--------|-------|
| Добавить | ➕ | `fa-plus` |
| Редактировать | ✏️ | `fa-edit` |
| Удалить | 🗑️ | `fa-trash` |
| Сохранить | 💾 | `fa-save` |
| Обновить | 🔄 | `fa-sync` или `fa-sync-alt` |
| Закрыть | ✖️ | `fa-times` |
| Назад | ⬅️ | `fa-arrow-left` |
| Настройки | ⚙️ | `fa-cog` или `fa-cogs` |
| Пользователь | 👤 | `fa-user` |
| Поиск | 🔍 | `fa-search` |

**Статусы:**

| Статус | Иконка | Класс |
|--------|--------|-------|
| Успех | ✅ | `fa-check-circle` |
| Ошибка | ❌ | `fa-times-circle` или `fa-exclamation-triangle` |
| Предупреждение | ⚠️ | `fa-exclamation-triangle` |
| Информация | ℹ️ | `fa-info-circle` |
| Загрузка | ⏳ | `fa-spinner` с `animate-spin` |
| Пусто | 📭 | `fa-inbox` |

**Специальные:**

| Назначение | Иконка | Класс |
|------------|--------|-------|
| OAuth/Ключ | 🔑 | `fa-key` |
| Вебхук | ⚡ | `fa-bolt` |
| Таблица/Список | 📋 | `fa-list-alt` или `fa-table` |
| Оплата | 💳 | `fa-credit-card` |
| Комментарий | 💬 | `fa-comment-dots` |
| Подключение | 🔌 | `fa-plug` |
| Email | 📧 | `fa-envelope` |
| Время/Часы | 🕒 | `fa-clock` |

**Использование в проекте:**

```vue
<!-- Заголовок страницы -->
<div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
  <i class="fas fa-key text-2xl text-white"></i>
</div>

<!-- Заголовок секции -->
<h2 class="text-2xl font-bold flex items-center gap-3">
  <i class="fas fa-cogs" style="color: var(--color-primary)"></i>
  Сервисы
</h2>

<!-- Кнопка -->
<button class="btn btn-primary">
  <i class="fas fa-save mr-2"></i>
  Сохранить
</button>

<!-- Статус -->
<div class="flex items-center gap-2">
  <i class="fas fa-check-circle" style="color: var(--color-success)"></i>
  <span>Активен</span>
</div>
```

---

## Анимации и переходы

### Transitions

**Стандартный transition:**

```css
--transition: all 0.2s ease;

.element {
  transition: var(--transition);
}
```

**Использование:**

```css
.card {
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.btn {
  transition: var(--transition);
}

.btn:hover {
  opacity: 0.95;
}
```

### Анимации загрузки

**Spinner:**

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

```vue
<i class="fas fa-spinner animate-spin"></i>
```

**Pulse:**

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Hover эффекты

**Opacity:**

```vue
<a class="hover:opacity-70">Ссылка</a>
<button class="hover:opacity-80">Кнопка</button>
```

**Box shadow:**

```css
.card:hover {
  box-shadow: var(--shadow-md);
}

.btn:hover {
  box-shadow: var(--shadow-lg);
}
```

**Border color:**

```css
.card:hover {
  border-color: var(--color-primary);
}

.input:focus {
  border-color: var(--color-primary);
}
```

---

## Прелоадеры

### Глобальный прелоадер

**HTML (в body перед #app-content):**

```html
<body>
  <!-- Прелоадер -->
  <div id="app-loader">
    <div class="loader-content">
      <div class="loader-logo">
        <i class="fas fa-plug"></i>
      </div>
      <div class="loader-spinner">
        <div class="loader-ring"></div>
      </div>
      <p class="loader-text">Загрузка приложения...</p>
    </div>
  </div>

  <!-- Контент приложения -->
  <div id="app-content" style="opacity: 0;">
    <!-- Vue приложение -->
  </div>
</body>
```

**Скрытие из Vue:**

```vue
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Скрываем прелоадер после монтирования
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})
</script>
```

**Стили прелоадера:**

```css
#app-loader {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: loader-fade-in 0.3s ease-out;
}

.loader-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.3);
  animation: loader-logo-pulse 2s ease-in-out infinite;
}

.loader-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 40deg,
    var(--color-primary) 60deg,
    var(--color-primary-hover) 180deg,
    var(--color-primary) 300deg,
    transparent 320deg,
    transparent 360deg
  );
  animation: loader-spin 1.2s linear infinite;
}

@keyframes loader-spin {
  to { transform: rotate(360deg); }
}

@keyframes loader-logo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Локальные индикаторы загрузки

**В карточке:**

```vue
<div class="card">
  <div v-if="loading" class="text-center py-12">
    <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
    <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка данных...</p>
  </div>
  
  <div v-else>
    <!-- Контент -->
  </div>
</div>
```

**В кнопке:**

```vue
<button class="btn btn-primary" :disabled="loading">
  <i v-if="loading" class="fas fa-spinner animate-spin mr-2"></i>
  <i v-else class="fas fa-save mr-2"></i>
  {{ loading ? 'Сохранение...' : 'Сохранить' }}
</button>
```

---

## Адаптивность

### Breakpoints

**Tailwind breakpoints:**

```css
/* Mobile first подход */
.element { /* < 640px */ }

@media (min-width: 640px) {  /* sm: */  }
@media (min-width: 768px) {  /* md: */  }
@media (min-width: 1024px) { /* lg: */  }
@media (min-width: 1280px) { /* xl: */  }
```

**Использование в Vue:**

```vue
<!-- Одна колонка на мобильных, три на десктопе -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="card">Карточка 1</div>
  <div class="card">Карточка 2</div>
  <div class="card">Карточка 3</div>
</div>

<!-- Скрыть на мобильных -->
<div class="hidden md:block">
  Видно только на десктопе
</div>

<!-- Адаптивные размеры текста -->
<h1 class="text-3xl md:text-4xl lg:text-5xl">
  Заголовок
</h1>
```

### Grid системы

**Статистика (3 колонки):**

```vue
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
  <div class="card">Статистика 1</div>
  <div class="card">Статистика 2</div>
  <div class="card">Статистика 3</div>
</div>
```

**Форма (2 колонки):**

```vue
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label>Поле 1</label>
    <input class="input" />
  </div>
  <div>
    <label>Поле 2</label>
    <input class="input" />
  </div>
</div>
```

### Адаптивные отступы

**Контейнер:**

```vue
<div class="container py-6 px-4 md:px-6 lg:px-8">
  <!-- Контент -->
</div>
```

**Отступы:**

```vue
<div class="mb-4 md:mb-6 lg:mb-8">
  <!-- Больше отступ на больших экранах -->
</div>
```

---

## Отступы и интервалы

### Стандартные отступы

**Между секциями:**
```vue
<div class="card mb-8">
  <!-- Секция -->
</div>
```

**Внутри секции:**
```vue
<div class="card">
  <h2 class="text-2xl font-bold mb-6">Заголовок</h2>
  <div class="mb-4">Элемент 1</div>
  <div class="mb-4">Элемент 2</div>
</div>
```

**Между мелкими элементами:**
```vue
<div class="flex items-center gap-2">
  <i class="fas fa-check"></i>
  <span>Текст</span>
</div>

<div class="flex items-center gap-3">
  <i class="fas fa-user text-xl"></i>
  <span class="text-lg">Текст</span>
</div>
```

### Внутренние отступы (padding)

**Контейнер страницы:**
```css
.container {
  padding: 1.5rem 1rem; /* py-6 px-4 */
}
```

**Карточки:**
```css
.card {
  padding: 1.5rem; /* p-6 */
}
```

**Кнопки:**
```css
.btn {
  padding: 0.75rem 1.5rem; /* px-6 py-3 */
}
```

**Поля ввода:**
```css
.input {
  padding: 0.75rem 1rem; /* px-4 py-3 */
}
```

---

## Тени и глубина

### Трёхуровневая система теней

**CSS Variables:**

```css
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dark {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

**Использование:**

```css
.card {
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.modal-content {
  box-shadow: var(--shadow-lg);
}
```

**Иерархия:**
- `--shadow-sm` — обычные элементы (карточки, кнопки)
- `--shadow-md` — hover состояния, выделенные элементы
- `--shadow-lg` — модальные окна, выпадающие меню

---

## Лучшие практики

### DO ✅

**1. Используйте CSS Variables:**
```vue
<div style="color: var(--color-text)">
```

**2. Применяйте единые компоненты:**
```vue
<div class="card">
<button class="btn btn-primary">
<input class="input">
```

**3. Следуйте структуре страниц:**
```vue
<ThemeToggle />
<div class="container py-6 max-w-6xl">
  <div class="mb-6"><!-- Хлебные крошки --></div>
  <header class="text-center mb-8 mt-4"><!-- Заголовок --></header>
  <div class="card mb-8"><!-- Контент --></div>
</div>
```

**4. Центрируйте заголовки:**
```vue
<header class="text-center mb-8 mt-4">
  <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
    <i class="fas fa-key text-2xl text-white"></i>
  </div>
  <h1 class="text-4xl font-bold mb-3">Заголовок</h1>
</header>
```

**5. Обрабатывайте все состояния:**
```vue
<div v-if="loading">Загрузка...</div>
<div v-else-if="error">Ошибка...</div>
<div v-else-if="items.length === 0">Пусто...</div>
<div v-else>Данные...</div>
```

**6. Используйте иконки семантично:**
```vue
<i class="fas fa-check-circle" style="color: var(--color-success)"></i>
<i class="fas fa-times-circle" style="color: var(--color-danger)"></i>
```

### DON'T ❌

**1. Не используйте хардкод цветов:**
```vue
❌ <div style="color: #1e293b">
✅ <div style="color: var(--color-text)">
```

**2. Не создавайте кастомные стили для стандартных компонентов:**
```vue
❌ <div style="padding: 1.5rem; border: 1px solid #ccc; border-radius: 8px;">
✅ <div class="card">
```

**3. Не выравнивайте заголовки влево:**
```vue
❌ <h1 class="text-4xl font-bold">Заголовок</h1>
✅ <header class="text-center mb-8">
     <h1 class="text-4xl font-bold">Заголовок</h1>
   </header>
```

**4. Не забывайте про хлебные крошки:**
```vue
❌ <!-- Нет навигации -->
✅ <div class="mb-6">
     <a :href="homeUrl" class="text-[var(--color-primary)]">
       <i class="fas fa-arrow-left"></i> Назад к главной
     </a>
   </div>
```

**5. Не игнорируйте состояния:**
```vue
❌ <div>{{ items }}</div>
✅ <div v-if="loading">Загрузка...</div>
   <div v-else-if="error">Ошибка</div>
   <div v-else>{{ items }}</div>
```

**6. Не забывайте про адаптивность:**
```vue
❌ <div class="grid grid-cols-3">
✅ <div class="grid grid-cols-1 md:grid-cols-3">
```

---

## Чеклист для новой страницы

При создании новой страницы проверьте:

### Обязательные элементы

- [ ] `<ThemeToggle />` добавлен в шаблон
- [ ] `min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]` на корневом div
- [ ] `container py-6 max-w-6xl` для контейнера (или `max-w-4xl` для узких форм)
- [ ] Хлебные крошки добавлены (если не главная страница)
- [ ] Заголовок центрирован с иконкой 64×64px
- [ ] Используются CSS Variables для всех цветов
- [ ] Все карточки используют класс `.card`
- [ ] Все кнопки используют класс `.btn`
- [ ] Все поля ввода используют класс `.input`

### Состояния интерфейса

- [ ] Loading состояние с spinner
- [ ] Error состояние с иконкой и сообщением
- [ ] Empty состояние для пустых списков
- [ ] Success состояние (если применимо)

### Иконки

- [ ] FontAwesome подключен
- [ ] Иконки используются семантично
- [ ] Размеры иконок соответствуют контексту
- [ ] Цвета иконок через CSS Variables

### Анимации

- [ ] Transitions добавлены на интерактивные элементы
- [ ] Hover эффекты работают корректно
- [ ] Loading спиннеры анимированы

### Адаптивность

- [ ] Grid системы адаптивны (`grid-cols-1 md:grid-cols-3`)
- [ ] Тестирование на мобильных (< 640px)
- [ ] Тестирование на планшетах (768px - 1024px)
- [ ] Тестирование на десктопах (> 1280px)

### Прелоадер

- [ ] Глобальный прелоадер добавлен в HTML
- [ ] `window.hideAppLoader()` вызван в `onMounted`
- [ ] Прелоадер скрывается после загрузки

---

## Типичные ошибки

### Ошибка 1: Хардкод цветов

❌ **Неправильно:**
```vue
<div style="color: #1e293b; background: #ffffff;">
```

✅ **Правильно:**
```vue
<div style="color: var(--color-text); background: var(--color-bg-secondary);">
```

### Ошибка 2: Не центрированный заголовок

❌ **Неправильно:**
```vue
<div class="flex items-center gap-4 mb-8">
  <i class="fas fa-key"></i>
  <h1 class="text-4xl font-bold">Заголовок</h1>
</div>
```

✅ **Правильно:**
```vue
<header class="text-center mb-8 mt-4">
  <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
    <i class="fas fa-key text-2xl text-white"></i>
  </div>
  <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
    Заголовок
  </h1>
  <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
    Описание
  </p>
</header>
```

### Ошибка 3: Отсутствие хлебных крошек

❌ **Неправильно:**
```vue
<div class="container">
  <header><!-- Заголовок --></header>
</div>
```

✅ **Правильно:**
```vue
<div class="container py-6 max-w-6xl">
  <div class="mb-6">
    <a :href="homeUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
      <i class="fas fa-arrow-left"></i>
      Назад к главной
    </a>
  </div>
  <header><!-- Заголовок --></header>
</div>
```

### Ошибка 4: Игнорирование состояний

❌ **Неправильно:**
```vue
<table class="table">
  <tr v-for="item in items">...</tr>
</table>
```

✅ **Правильно:**
```vue
<div v-if="loading">
  <i class="fas fa-spinner animate-spin"></i> Загрузка...
</div>
<div v-else-if="error">
  <i class="fas fa-exclamation-triangle"></i> {{ error }}
</div>
<div v-else-if="items.length === 0">
  <i class="fas fa-inbox"></i> Нет данных
</div>
<table v-else class="table">
  <tr v-for="item in items">...</tr>
</table>
```

### Ошибка 5: Кастомные стили вместо классов

❌ **Неправильно:**
```vue
<div style="padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 1rem;">
  Контент
</div>
```

✅ **Правильно:**
```vue
<div class="card">
  Контент
</div>
```

### Ошибка 6: Неадаптивные layout

❌ **Неправильно:**
```vue
<div class="grid grid-cols-3 gap-6">
  <!-- На мобильных будет плохо -->
</div>
```

✅ **Правильно:**
```vue
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Mobile first подход -->
</div>
```

---

## Заключение

### Основные принципы

1. **Консистентность** — используйте единые компоненты и стили
2. **CSS Variables** — для поддержки тем и гибкости
3. **Центрированные заголовки** — на всех страницах
4. **Обработка состояний** — loading, error, empty, success
5. **Адаптивность** — mobile first подход
6. **Семантические иконки** — используйте по назначению
7. **Анимации** — плавные transitions (0.2s)
8. **Прелоадеры** — глобальный и локальные

### Полезные ссылки

- **TailwindCSS:** https://tailwindcss.com/
- **FontAwesome:** https://fontawesome.com/
- **Google Fonts (Inter):** https://fonts.google.com/specimen/Inter
- **Vue 3:** https://vuejs.org/

### Пример идеальной страницы

См. `pages/OAuthSettingsPage.vue` или `pages/HomePage.vue` в проекте `amocrm-connector` для референса.

---

**Версия:** 1.0  
**Дата создания:** 2025-11-04  
**Основано на проекте:** AmoCRM Connector  
**Автор:** Chatium AI Assistant

