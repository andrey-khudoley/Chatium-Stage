<template>
  <!-- Layout v3: improved tabs and rings -->
  <div class="min-h-screen py-8 px-4 md:py-12 md:px-8 flex items-center justify-center">
    <!-- Notebook Container -->
    <div class="relative max-w-3xl w-full">
      
      <!-- Main Paper with integrated binder -->
      <div class="flex">
        <!-- Binder Spine -->
        <div class="flex-shrink-0 w-12 md:w-16 flex flex-col justify-evenly items-center py-6 relative z-10"
             style="background: linear-gradient(90deg, #4a4a4a 0%, #6a6a6a 30%, #7a7a7a 50%, #6a6a6a 70%, #4a4a4a 100%); border-radius: 6px 0 0 6px; box-shadow: inset -2px 0 8px rgba(0,0,0,0.3);">
          <div v-for="i in 5" :key="i" class="relative">
            <!-- Ring outer -->
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                 style="background: linear-gradient(145deg, #c0c0c0 0%, #909090 50%, #707070 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3);">
              <!-- Ring inner hole -->
              <div class="w-4 h-4 md:w-5 md:h-5 rounded-full"
                   style="background: linear-gradient(145deg, #3a3a3a, #5a5a5a); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);"></div>
            </div>
          </div>
        </div>
        
        <!-- Paper Area -->
        <div 
          class="relative flex-1 paper-main rounded-r-lg overflow-hidden"
          :class="{ 'animate-paper-rustle': isTransitioning }"
        >
          <!-- Binder holes on paper -->
          <div class="absolute left-3 md:left-5 top-0 bottom-0 flex flex-col justify-evenly items-center pointer-events-none">
            <div v-for="i in 5" :key="'hole-'+i" class="w-4 h-4 md:w-5 md:h-5 rounded-full" 
                 style="background: #9A8B7A; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);"></div>
          </div>
          
          <!-- Content Area -->
          <div class="relative min-h-[600px] md:min-h-[700px] pl-12 md:pl-16 pr-24 md:pr-28 py-8 md:py-12">
          
            <!-- Tab Navigation (Sticky Bookmarks) - positioned at right edge -->
            <div class="absolute right-0 top-8 z-30 flex flex-col gap-0.5">
              <button 
                v-for="(tab, index) in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                class="tab-button relative group"
                :class="{ 'active': activeTab === tab.id }"
                :style="{ transitionDelay: `${index * 50}ms` }"
              >
                <div 
                  class="relative px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-raleway font-medium rounded-r-md shadow-md transition-all duration-300 transform"
                  :class="[
                    activeTab === tab.id 
                      ? 'translate-x-2 shadow-lg' 
                      : 'translate-x-0 group-hover:translate-x-1'
                  ]"
                  :style="{ backgroundColor: tab.color }"
                >
                  <span class="text-white drop-shadow-sm whitespace-nowrap">{{ tab.label }}</span>
                </div>
              </button>
            </div>
          
          <!-- Page 1: Intro -->
          <Transition name="page">
            <div v-if="activeTab === 'intro'" class="page-content">
              <!-- Decorative mystical icon -->
              <div class="absolute top-4 right-4 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center opacity-20"
                   style="background: radial-gradient(circle, rgba(184,134,11,0.3) 0%, transparent 70%);">
                <i class="fas fa-moon text-3xl md:text-4xl text-amber-600"></i>
              </div>
              
              <!-- Date header -->
              <div class="text-center mb-8 md:mb-12">
                <p class="text-ink-light font-raleway text-sm tracking-widest uppercase">Духовная практика</p>
              </div>
              
              <!-- Title -->
              <h1 class="font-cormorant text-4xl md:text-6xl font-bold text-ink leading-tight mb-8 animate-slide-up">
                Ритуал<br/>
                <span class="text-burgundy">"Наказание врагов"</span>
              </h1>
              
              <!-- Subtitle -->
              <p class="font-raleway text-lg md:text-xl text-ink-light leading-relaxed mb-8 max-w-xl" style="animation-delay: 0.2s">
                Восстановление справедливости через Высшие Силы
              </p>
              
              <!-- Intro text -->
              <div class="prose prose-lg max-w-none">
                <p class="font-cormorant text-xl md:text-2xl text-ink leading-relaxed italic border-l-4 border-gold pl-6 py-2">
                  Этот ритуал для тех, кто столкнулся с реальным вредом: когда у вас осознанно отняли деньги, возможности, репутацию, здоровье или энергию.
                </p>
                <p class="font-raleway text-lg text-ink-light mt-6 leading-relaxed">
                  Когда простить — значит предать себя, а мстить — разрушить себя изнутри.
                </p>
              </div>
              
              <!-- Page number -->
              <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="font-cormorant text-ink-light text-sm">— 1 —</span>
              </div>
            </div>
          </Transition>
          
          <!-- Page 2: What it does -->
          <Transition name="page">
            <div v-if="activeTab === 'action'" class="page-content">
              <div class="text-center mb-8">
                <div class="inline-block p-4 rounded-full bg-gold/10 mb-4">
                  <i class="fas fa-balance-scale text-4xl text-gold"></i>
                </div>
                <h2 class="font-cormorant text-3xl md:text-5xl font-bold text-ink">
                  Что делает ритуал
                </h2>
              </div>
              
              <div class="space-y-8 mt-10">
                <div class="flex items-start gap-4 animate-slide-up" style="animation-delay: 0.1s">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center">
                    <i class="fas fa-hand-holding-heart text-burgundy"></i>
                  </div>
                  <p class="font-raleway text-lg text-ink leading-relaxed">
                    <strong class="font-semibold text-burgundy">Передаёт вашу ситуацию Архангелам,</strong> которые управляют законами баланса во Вселенной. Они сами определяют справедливую меру восстановления — без вашей злости, без разрушающей энергии мести.
                  </p>
                </div>
                
                <div class="flex items-start gap-4 animate-slide-up" style="animation-delay: 0.2s">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <i class="fas fa-exchange-alt text-gold"></i>
                  </div>
                  <p class="font-raleway text-lg text-ink leading-relaxed">
                    <strong class="font-semibold text-gold">Человек, причинивший вред,</strong> либо возвращает отнятое, либо теряет это в семикратном размере по своим каналам. Эта энергия возвращается к вам.
                  </p>
                </div>
                
                <div class="flex items-start gap-4 animate-slide-up" style="animation-delay: 0.3s">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                    <i class="fas fa-feather-alt text-sage"></i>
                  </div>
                  <p class="font-raleway text-lg text-ink leading-relaxed">
                    <strong class="font-semibold text-sage">И вы освобождаетесь</strong> от обиды, которая разъедает изнутри.
                  </p>
                </div>
              </div>
              
              <!-- Decorative element -->
              <div class="absolute bottom-20 right-8 opacity-10">
                <i class="fas fa-infinity text-8xl text-burgundy"></i>
              </div>
              
              <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="font-cormorant text-ink-light text-sm">— 2 —</span>
              </div>
            </div>
          </Transition>
          
          <!-- Page 3: For whom -->
          <Transition name="page">
            <div v-if="activeTab === 'who'" class="page-content">
              <div class="text-center mb-10">
                <h2 class="font-cormorant text-3xl md:text-5xl font-bold text-ink mb-4">
                  Для кого этот ритуал
                </h2>
                <div class="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"></div>
              </div>
              
              <div class="grid gap-6 mt-8">
                <div v-for="(item, index) in forWhom" :key="index" 
                     class="group relative pl-8 py-4 border-l-2 border-paper-dark hover:border-burgundy transition-colors duration-300 animate-slide-up"
                     :style="{ animationDelay: `${index * 0.1}s` }">
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-paper border-2 border-paper-dark group-hover:border-burgundy group-hover:bg-burgundy/10 transition-colors duration-300"></div>
                  <p class="font-raleway text-lg text-ink leading-relaxed">{{ item }}</p>
                </div>
              </div>
              
              <!-- Handwritten note style -->
              <div class="mt-12 transform -rotate-1">
                <div class="bg-yellow-50 p-6 shadow-md relative">
                  <div class="absolute -top-2 -left-2 w-6 h-6 bg-yellow-100 transform rotate-45"></div>
                  <p class="font-cormorant text-xl italic text-ink-light">
                    "Справедливость — не месть. Это восстановление баланса."
                  </p>
                </div>
              </div>
              
              <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="font-cormorant text-ink-light text-sm">— 3 —</span>
              </div>
            </div>
          </Transition>
          
          <!-- Page 4: Results -->
          <Transition name="page">
            <div v-if="activeTab === 'result'" class="page-content">
              <div class="text-center mb-10">
                <h2 class="font-cormorant text-3xl md:text-5xl font-bold text-ink mb-4">
                  Что вы получите
                </h2>
                <p class="font-raleway text-ink-light">в результате ритуала</p>
              </div>
              
              <div class="grid md:grid-cols-2 gap-6 mt-8">
                <div v-for="(result, index) in results" :key="index"
                     class="p-6 bg-gradient-to-br from-paper to-paper-dark rounded-lg shadow-inner animate-slide-up"
                     :style="{ animationDelay: `${index * 0.1}s` }">
                  <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center" 
                         :class="result.bgClass">
                      <i :class="[result.icon, result.iconClass]"></i>
                    </div>
                    <h3 class="font-cormorant text-xl font-semibold text-ink">{{ result.title }}</h3>
                  </div>
                  <p class="font-raleway text-ink-light text-sm leading-relaxed pl-16">
                    {{ result.description }}
                  </p>
                </div>
              </div>
              
              <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="font-cormorant text-ink-light text-sm">— 4 —</span>
              </div>
            </div>
          </Transition>
          
          <!-- Page 5: Summary & Price -->
          <Transition name="page">
            <div v-if="activeTab === 'order'" class="page-content">
              <div class="text-center">
                <!-- Key message -->
                <div class="space-y-6 mb-12">
                  <p class="font-cormorant text-2xl md:text-3xl text-ink leading-relaxed animate-slide-up">
                    <strong class="text-burgundy">Вы не мстите.</strong>
                  </p>
                  <p class="font-cormorant text-2xl md:text-3xl text-ink leading-relaxed animate-slide-up" style="animation-delay: 0.1s">
                    <strong class="text-gold">Вы не прощаете через силу.</strong>
                  </p>
                  <p class="font-cormorant text-2xl md:text-3xl text-ink leading-relaxed animate-slide-up" style="animation-delay: 0.2s">
                    Вы передаёте ситуацию туда,<br/>
                    <em class="text-sage">где умеют разбирать её правильно.</em>
                  </p>
                </div>
                
                <!-- Divider -->
                <div class="flex items-center justify-center gap-4 my-10">
                  <div class="w-16 h-px bg-gold/30"></div>
                  <i class="fas fa-star text-gold/50"></i>
                  <div class="w-16 h-px bg-gold/30"></div>
                </div>
                
                <!-- Price card -->
                <div class="inline-block px-10 py-8 rounded-lg transform hover:scale-105 transition-transform duration-300 animate-slide-up" 
                     style="animation-delay: 0.3s; background: linear-gradient(135deg, #722F37 0%, #8B3A42 50%, #6B2830 100%); box-shadow: 0 4px 15px rgba(114, 47, 55, 0.4), 0 8px 30px rgba(114, 47, 55, 0.2);">
                  <p class="font-raleway text-sm uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.8);">Стоимость</p>
                  <p class="font-cormorant text-5xl md:text-6xl font-bold" style="color: white;">50 €</p>
                </div>
                
                <!-- CTA hint -->
                <p class="mt-8 font-raleway text-ink-light text-sm">
                  Для заказа свяжитесь с нами
                </p>
              </div>
              
              <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="font-cormorant text-ink-light text-sm">— 5 —</span>
              </div>
            </div>
          </Transition>
          
          </div>
        </div>
      </div>
      
      <!-- Page dots indicator -->
      <div class="flex justify-center gap-2 mt-6">
        <button 
          v-for="tab in tabs" 
          :key="'dot-'+tab.id"
          @click="activeTab = tab.id"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :style="{ backgroundColor: activeTab === tab.id ? '#722F37' : '#D8D0C0' }"
          :class="activeTab === tab.id ? 'w-6' : 'hover:opacity-70'"
        ></button>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const activeTab = ref('intro')
const isTransitioning = ref(false)

const tabs = [
  { id: 'intro', label: 'О ритуале', color: '#722F37', colorDark: '#5a252c' },
  { id: 'action', label: 'Действие', color: '#B8860B', colorDark: '#8a6508' },
  { id: 'who', label: 'Для кого', color: '#87906F', colorDark: '#6b7358' },
  { id: 'result', label: 'Результат', color: '#5C4F3A', colorDark: '#4a3f2e' },
  { id: 'order', label: 'Заказать', color: '#8B3A42', colorDark: '#6f2e35' },
]

const forWhom = [
  'Когда вас предали, обворовали или целенаправленно навредили',
  'Когда вы не хотите носить в себе яд обиды и злости',
  'Когда вы не готовы "простить и забыть", давая разрешение на повторение',
  'Когда вам нужна справедливость, а не месть'
]

const results = [
  {
    title: 'Восстановление баланса',
    description: 'без разрушения себя',
    icon: 'fas fa-balance-scale-right',
    bgClass: 'bg-burgundy/10',
    iconClass: 'text-burgundy text-xl'
  },
  {
    title: 'Возвращение энергии',
    description: 'вашей силы и ресурсов',
    icon: 'fas fa-sun',
    bgClass: 'bg-gold/10',
    iconClass: 'text-gold text-xl'
  },
  {
    title: 'Освобождение',
    description: 'от тяжести ситуации',
    icon: 'fas fa-dove',
    bgClass: 'bg-sage/20',
    iconClass: 'text-sage text-xl'
  },
  {
    title: 'Справедливость',
    description: 'через высшие законы',
    icon: 'fas fa-gavel',
    bgClass: 'bg-ink/10',
    iconClass: 'text-ink text-xl'
  }
]

// Page transition effect
watch(activeTab, () => {
  isTransitioning.value = true
  setTimeout(() => {
    isTransitioning.value = false
  }, 400)
})
</script>

<style scoped>
/* Color variables for reliable styling */
:deep(.text-ink) {
  color: #2C2416 !important;
}
:deep(.text-ink-light) {
  color: #5C4F3A !important;
}
:deep(.text-burgundy) {
  color: #722F37 !important;
}
:deep(.text-gold) {
  color: #B8860B !important;
}
:deep(.text-sage) {
  color: #87906F !important;
}
:deep(.border-gold) {
  border-color: #B8860B !important;
}
:deep(.bg-burgundy\/10) {
  background-color: rgba(114, 47, 55, 0.1) !important;
}
:deep(.bg-gold\/10) {
  background-color: rgba(184, 134, 11, 0.1) !important;
}
:deep(.bg-sage\/20) {
  background-color: rgba(135, 144, 111, 0.2) !important;
}

/* Main paper background */
.paper-main {
  background: linear-gradient(165deg, #FAF7F2 0%, #F5F0E8 30%, #EFE8DC 70%, #E8E0D2 100%);
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.05),
    0 4px 8px rgba(0,0,0,0.05),
    0 8px 16px rgba(0,0,0,0.08),
    0 16px 32px rgba(0,0,0,0.10),
    0 32px 64px rgba(0,0,0,0.08);
}

/* Price card with burgundy gradient */
.price-card {
  background: linear-gradient(135deg, #722F37 0%, #8B3A42 50%, #6B2830 100%);
  box-shadow: 
    0 4px 15px rgba(114, 47, 55, 0.4),
    0 8px 30px rgba(114, 47, 55, 0.2);
}

/* Page transitions */
.page-enter-active {
  animation: pageIn 0.5s ease-out;
}
.page-leave-active {
  animation: pageOut 0.3s ease-in;
  position: absolute;
  width: 100%;
}

@keyframes pageIn {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pageOut {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-30px);
  }
}

/* Tab button styling */
.tab-button {
  transition: all 0.3s ease;
}

.tab-button:hover {
  filter: brightness(1.1);
}

.tab-button.active {
  z-index: 10;
}

/* Content animation */
.page-content {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Animate slide up */
.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Paper shadow */
.shadow-paper {
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 0 80px rgba(0, 0, 0, 0.03);
}

/* Custom paper style with realistic shadow */
.paper-realistic {
  box-shadow: 
    0 1px 1px rgba(0,0,0,0.08),
    0 2px 2px rgba(0,0,0,0.08),
    0 4px 4px rgba(0,0,0,0.08),
    0 8px 8px rgba(0,0,0,0.08),
    0 16px 16px rgba(0,0,0,0.08),
    0 32px 32px rgba(0,0,0,0.06);
}

/* Ring holes styling */
.ring-hole {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tab-button {
    font-size: 0.75rem;
  }
}
</style>
