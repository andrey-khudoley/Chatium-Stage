<template>
  <!-- Loading Cover (Preloader) -->
  <Transition name="cover">
    <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Cover -->
      <div class="relative w-[90vw] max-w-2xl aspect-[3/4] animate-cover-open" style="perspective: 1000px;">
        <div class="absolute inset-0 rounded-lg shadow-2xl"
             style="background: linear-gradient(135deg, #5A1F29 0%, #4A1721 50%, #5A1F29 100%); transform-style: preserve-3d;">
          
          <!-- Rings on cover -->
          <div class="absolute left-8 top-0 bottom-0 flex flex-col justify-evenly items-center py-12">
            <div v-for="i in 5" :key="i" class="w-10 h-10 rounded-full ring-shadow"
                 style="background: radial-gradient(circle at 30% 30%, #B8A896, #9A8B7A, #7A6B5A);"></div>
          </div>

          <!-- Cover text -->
          <div class="absolute inset-0 flex items-center justify-center pl-20">
            <div class="text-center">
              <h1 class="font-cormorant text-4xl md:text-5xl font-bold mb-4 text-amber-100"
                  style="text-shadow: 2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(184, 134, 11, 0.3);">
                РИТУАЛ<br/>
                "НАКАЗАНИЕ<br/>
                ВРАГОВ"
              </h1>
              <div class="w-16 h-1 bg-amber-200/60 mx-auto mt-6 rounded shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Main Notebook -->
  <div v-show="!isLoading" class="min-h-screen flex items-center justify-center p-4 md:p-8 animate-content-reveal">
    <div class="relative w-full max-w-5xl">
      
      <!-- Notebook Container -->
      <div class="relative bg-page-cream rounded-r-xl shadow-2xl" style="box-shadow: -8px 0 30px rgba(0,0,0,0.3), 0 10px 50px rgba(0,0,0,0.2);">
        
        <!-- Page Content (moved before rings to fix z-index) -->
        <div class="relative ml-16 md:ml-20 paper-texture min-h-[600px] md:min-h-[700px] rounded-r-xl" style="overflow: visible;">
          
          <!-- Photo on Paperclip -->
          <div class="absolute top-8 md:top-12 right-8 md:right-16 w-40 h-48 md:w-48 md:h-56 opacity-0 animate-photo-appear z-20">
            <!-- Paper clip -->
            <div class="absolute -top-4 right-4 w-12 h-16 paper-clip">
              <svg viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 5 Q30 0, 35 5 L35 55 Q35 65, 25 65 Q15 65, 15 55 L15 15" 
                      stroke="#9A9A9A" 
                      stroke-width="3" 
                      fill="none"
                      style="filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"/>
              </svg>
            </div>
            
            <!-- Photo -->
            <div class="w-full h-full bg-white p-2 shadow-lg transform -rotate-2"
                 style="box-shadow: 3px 3px 8px rgba(0,0,0,0.3);">
              <img :src="ritualPhoto" 
                   alt="Ritual atmosphere" 
                   class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- Color Tabs Navigation -->
          <div class="absolute top-0 left-0 right-0 flex justify-center gap-0 z-30">
            <button
              v-for="(tab, index) in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="relative group tab-glow transition-all duration-300"
              :class="{ 'z-10': activeTab === tab.id }"
            >
              <div 
                class="px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-raleway font-semibold text-white rounded-b-xl transition-all duration-300 shadow-lg"
                :class="[
                  activeTab === tab.id 
                    ? 'transform translate-y-0' 
                    : 'transform -translate-y-1 opacity-80 hover:translate-y-0 hover:opacity-100'
                ]"
                :style="{ 
                  backgroundColor: tab.color,
                  boxShadow: activeTab === tab.id ? `0 4px 12px ${tab.color}80` : '0 2px 6px rgba(0,0,0,0.2)'
                }"
              >
                {{ String(index + 1).padStart(2, '0') }}
              </div>
            </button>
          </div>

          <!-- Content Area -->
          <div class="pt-20 md:pt-24 pb-12 md:pb-16 px-8 md:px-16 pr-16 md:pr-32">
            
            <!-- Page 1: Intro -->
            <Transition name="page">
              <div v-if="activeTab === 'intro'" class="space-y-6 md:space-y-8 animate-page-in">
                <div class="text-center md:text-left">
                  <p class="font-caveat text-sm md:text-base text-text-light mb-2">Духовная практика</p>
                  <h1 class="font-cormorant text-4xl md:text-5xl lg:text-6xl font-bold text-text-dark leading-tight mb-4">
                    Ритуал<br/>
                    <span class="text-burgundy">"Наказание врагов"</span>
                  </h1>
                  <p class="font-raleway text-lg md:text-xl text-text-light mb-6">
                    Восстановление справедливости через Высшие Силы
                  </p>
                </div>

                <blockquote class="font-cormorant text-lg md:text-xl text-text-dark italic border-l-4 border-gold-accent pl-4 md:pl-6 py-4 bg-page-shadow/30 rounded-r">
                  Этот ритуал для тех, кто столкнулся с реальным вредом: когда у вас осознанно отняли деньги, возможности, репутацию, здоровье или энергию.
                </blockquote>

                <p class="font-raleway text-base md:text-lg text-text-light leading-relaxed">
                  Когда простить — значит предать себя, а мстить — разрушить себя изнутри.
                </p>

                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <span class="font-cormorant text-text-light opacity-40">— 1 —</span>
                </div>
              </div>
            </Transition>

            <!-- Page 2: Action -->
            <Transition name="page">
              <div v-if="activeTab === 'action'" class="space-y-6 md:space-y-8 animate-page-in">
                <div class="text-center mb-8">
                  <div class="inline-block p-4 rounded-full bg-gold-accent/20 mb-4 animate-float">
                    <i class="fas fa-balance-scale text-4xl md:text-5xl text-gold-accent"></i>
                  </div>
                  <h2 class="font-cormorant text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark">
                    Что делает ритуал
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="flex items-start gap-4 p-4 rounded-lg hover:bg-page-shadow/20 transition-colors">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-burgundy/10 flex items-center justify-center">
                      <i class="fas fa-hand-holding-heart text-burgundy text-xl"></i>
                    </div>
                    <div>
                      <strong class="font-raleway font-semibold text-burgundy text-lg block mb-2">
                        Передаёт вашу ситуацию Архангелам
                      </strong>
                      <p class="font-raleway text-text-dark leading-relaxed">
                        которые управляют законами баланса во Вселенной. Они сами определяют справедливую меру восстановления — без вашей злости, без разрушающей энергии мести.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-4 p-4 rounded-lg hover:bg-page-shadow/20 transition-colors">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gold-accent/10 flex items-center justify-center">
                      <i class="fas fa-exchange-alt text-gold-accent text-xl"></i>
                    </div>
                    <div>
                      <strong class="font-raleway font-semibold text-gold-accent text-lg block mb-2">
                        Человек, причинивший вред
                      </strong>
                      <p class="font-raleway text-text-dark leading-relaxed">
                        либо возвращает отнятое, либо теряет это в семикратном размере по своим каналам. Эта энергия возвращается к вам.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-4 p-4 rounded-lg hover:bg-page-shadow/20 transition-colors">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-green-700/20 flex items-center justify-center">
                      <i class="fas fa-feather-alt text-green-700 text-xl"></i>
                    </div>
                    <div>
                      <strong class="font-raleway font-semibold text-green-700 text-lg block mb-2">
                        И вы освобождаетесь
                      </strong>
                      <p class="font-raleway text-text-dark leading-relaxed">
                        от обиды, которая разъедает изнутри.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <span class="font-cormorant text-text-light opacity-40">— 2 —</span>
                </div>
              </div>
            </Transition>

            <!-- Page 3: Who -->
            <Transition name="page">
              <div v-if="activeTab === 'who'" class="space-y-6 md:space-y-8 animate-page-in">
                <div class="text-center mb-8">
                  <h2 class="font-cormorant text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark mb-4">
                    Для кого этот ритуал
                  </h2>
                  <div class="w-24 h-1 bg-gradient-to-r from-transparent via-gold-accent to-transparent mx-auto"></div>
                </div>

                <div class="space-y-5">
                  <div v-for="(item, index) in forWhom" :key="index"
                       class="group relative pl-8 py-4 border-l-2 border-page-shadow hover:border-burgundy transition-all duration-300">
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-page-cream border-2 border-page-shadow group-hover:border-burgundy group-hover:bg-burgundy/20 transition-all"></div>
                    <p class="font-raleway text-base md:text-lg text-text-dark leading-relaxed">{{ item }}</p>
                  </div>
                </div>

                <div class="mt-10 transform -rotate-1">
                  <div class="bg-yellow-50 p-6 shadow-lg border-l-4 border-yellow-200 relative">
                    <i class="fas fa-quote-left text-yellow-300 text-xl opacity-30 absolute top-2 left-2"></i>
                    <p class="font-cormorant text-xl md:text-2xl italic text-text-light leading-relaxed">
                      "Справедливость — не месть.<br/>Это восстановление баланса."
                    </p>
                  </div>
                </div>

                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <span class="font-cormorant text-text-light opacity-40">— 3 —</span>
                </div>
              </div>
            </Transition>

            <!-- Page 4: Result -->
            <Transition name="page">
              <div v-if="activeTab === 'result'" class="space-y-6 md:space-y-8 animate-page-in">
                <div class="text-center mb-8">
                  <h2 class="font-cormorant text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark mb-4">
                    Что вы получите
                  </h2>
                  <p class="font-raleway text-text-light">в результате ритуала</p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                  <div v-for="(result, index) in results" :key="index"
                       class="p-6 bg-gradient-to-br from-white to-page-shadow rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105">
                    <div class="flex items-start gap-4 mb-3">
                      <div class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-inner"
                           :class="result.bgClass">
                        <i :class="[result.icon, result.iconClass, 'text-2xl']"></i>
                      </div>
                      <h3 class="font-cormorant text-2xl font-semibold text-text-dark pt-3">{{ result.title }}</h3>
                    </div>
                    <p class="font-raleway text-text-light leading-relaxed">{{ result.description }}</p>
                  </div>
                </div>

                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <span class="font-cormorant text-text-light opacity-40">— 4 —</span>
                </div>
              </div>
            </Transition>

            <!-- Page 5: Order -->
            <Transition name="page">
              <div v-if="activeTab === 'order'" class="space-y-8 animate-page-in">
                <div class="text-center max-w-2xl mx-auto">
                  <div class="space-y-5 mb-10">
                    <p class="font-cormorant text-2xl md:text-3xl text-text-dark leading-relaxed">
                      <strong class="text-burgundy">Вы не мстите.</strong>
                    </p>
                    <p class="font-cormorant text-2xl md:text-3xl text-text-dark leading-relaxed">
                      <strong class="text-gold-accent">Вы не прощаете через силу.</strong>
                    </p>
                    <p class="font-cormorant text-2xl md:text-3xl text-text-dark leading-relaxed">
                      Вы передаёте ситуацию туда,<br/>
                      <em class="text-green-700">где умеют разбирать её правильно.</em>
                    </p>
                  </div>

                  <div class="flex items-center justify-center gap-4 my-8 opacity-30">
                    <div class="w-16 h-px bg-gold-accent"></div>
                    <i class="fas fa-star text-gold-accent"></i>
                    <div class="w-16 h-px bg-gold-accent"></div>
                  </div>

                  <div class="inline-block px-12 py-10 rounded-xl shadow-2xl transform hover:scale-105 transition-all"
                       style="background: linear-gradient(135deg, #722F37 0%, #8B3A42 50%, #6B2830 100%);">
                    <p class="font-raleway text-sm uppercase tracking-widest mb-3 text-white/80">Стоимость</p>
                    <p class="font-cormorant text-6xl md:text-7xl font-bold text-white mb-2">50 €</p>
                    <div class="w-20 h-1 bg-white/30 mx-auto rounded-full"></div>
                  </div>

                  <p class="mt-8 font-raleway text-text-light text-sm opacity-70">
                    Для заказа свяжитесь с нами
                  </p>
                </div>

                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <span class="font-cormorant text-text-light opacity-40">— 5 —</span>
                </div>
              </div>
            </Transition>

          </div>
        </div>

        <!-- Left Spine with Rings (moved after content to be on top) -->
        <div class="absolute left-0 top-0 bottom-0 w-12 md:w-16 pointer-events-none" style="z-index: 50;">
          <!-- Metal binding strip -->
          <div class="absolute inset-0" 
               style="background: linear-gradient(90deg, #B8A896 0%, #9A8B7A 40%, #8A7B6A 100%); box-shadow: inset -3px 0 10px rgba(0,0,0,0.4), inset 3px 0 10px rgba(255,255,255,0.1), 3px 0 8px rgba(0,0,0,0.25);">
          </div>
          
          <!-- Rings -->
          <div class="absolute inset-0 flex flex-col justify-evenly items-center py-12 md:py-16">
            <div v-for="i in 5" :key="'ring-'+i" class="relative" style="width: 32px; height: 32px;">
              <!-- Paper hole behind ring -->
              <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 rounded-full"
                   style="background: radial-gradient(circle, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, transparent 70%); transform: translateX(12px) translateY(-50%);"></div>
              
              <!-- Metal ring -->
              <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full ring-shadow"
                   style="background: radial-gradient(circle at 35% 35%, #C8B8A6, #9A8B7A 50%, #7A6B5A 80%);">
                <!-- Inner hole with dark shadow -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-4 h-4 md:w-5 md:h-5 rounded-full"
                       style="background: radial-gradient(circle at 45% 45%, #5A4B3A, #3A2B1A); box-shadow: inset 0 3px 6px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,255,255,0.15), 0 1px 2px rgba(255,255,255,0.1);"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Page Dots Indicator -->
      <div class="flex justify-center gap-2 mt-6">
        <button
          v-for="(tab, index) in tabs"
          :key="'dot-'+tab.id"
          @click="activeTab = tab.id"
          class="transition-all duration-300 rounded-full"
          :style="{
            backgroundColor: activeTab === tab.id ? tab.color : '#D8D0C0',
            width: activeTab === tab.id ? '32px' : '10px',
            height: '10px',
            opacity: activeTab === tab.id ? 1 : 0.5
          }"
        ></button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLoading = ref(true)
const activeTab = ref('intro')

const ritualPhoto = 'https://msk.cdn-chatium.io/get/image_msk_iejyM1HZJp.1408x768.png'

const tabs = [
  { id: 'intro', label: 'Intro', color: '#F48FB1' },
  { id: 'action', label: 'Action', color: '#FF9800' },
  { id: 'who', label: 'Who', color: '#64B5F6' },
  { id: 'result', label: 'Result', color: '#81C784' },
  { id: 'order', label: 'Order', color: '#FFD54F' },
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
    iconClass: 'text-burgundy'
  },
  {
    title: 'Возвращение энергии',
    description: 'вашей силы и ресурсов',
    icon: 'fas fa-sun',
    bgClass: 'bg-gold-accent/10',
    iconClass: 'text-gold-accent'
  },
  {
    title: 'Освобождение',
    description: 'от тяжести ситуации',
    icon: 'fas fa-dove',
    bgClass: 'bg-green-700/20',
    iconClass: 'text-green-700'
  },
  {
    title: 'Справедливость',
    description: 'через высшие законы',
    icon: 'fas fa-gavel',
    bgClass: 'bg-gray-700/10',
    iconClass: 'text-gray-700'
  }
]

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
})
</script>

<style scoped>
/* Cover transition */
.cover-enter-active,
.cover-leave-active {
  transition: opacity 0.3s ease;
}

.cover-enter-from,
.cover-leave-to {
  opacity: 0;
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
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>