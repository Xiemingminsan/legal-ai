<template>
  <main class="bg-gray-100 dark:bg-gray-900">
    <!-- Hero Section with Slider -->
    <section class="relative h-screen">
      <div class="absolute inset-0 overflow-hidden">
        <transition-group name="fade">
          <div v-for="(slide, index) in slides" :key="slide.id" v-show="currentSlide === index"
            class="absolute inset-0">
            <img :src="slide.image" :alt="slide.alt" class="object-cover w-full h-full" />
            <div class="absolute inset-0 bg-black opacity-50"></div>
          </div>
        </transition-group>
      </div>
      <div class="relative z-10 flex items-center justify-center h-full text-center text-white">
        <div class="max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {{ slides[currentSlide].title }}
          </h1>
          <p class="mt-6 text-xl">
            {{ slides[currentSlide].description }}
          </p>
          <div class="mt-10">
            <a href="/signup" class="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Get
              Started</a>
          </div>
        </div>
      </div>
      <div class="absolute bottom-5 left-0 right-0 flex justify-center">
        <div class="flex space-x-2">
          <button v-for="(_, index) in slides" :key="index" @click="currentSlide = index" class="w-3 h-3 rounded-full"
            :class="currentSlide === index ? 'bg-white' : 'bg-gray-400'"></button>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Our Team</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="dev in developers" :key="dev.name"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div
              class="m-auto mt-2 flex items-center justify-center w-48 h-48 rounded-full bg-gray-200 overflow-hidden">
              <img :src="dev.avatar" :alt="dev.name" class="object-contain w-full h-full" />
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{{ dev.name }}</h3>
              <div class="flex flex-col gap-1">
                <!-- GitHub Link -->
                <a :href="'https://github.com/' + dev.github" target="_blank" rel="noopener noreferrer"
                  class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <i class="ri-github-fill "></i> @{{ dev.github }}
                </a>
                <!-- Telegram Link -->
                <a :href="'https://t.me/' + dev.telegram" target="_blank" rel="noopener noreferrer"
                  class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <i class="ri-telegram-fill "></i> @{{ dev.telegram }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="py-20 bg-gray-200 dark:bg-gray-800">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Our Services</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="service in services" :key="service.title"
            class="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <component :is="service.icon" class="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{{ service.title }}</h3>
            <p class="text-gray-600 dark:text-gray-300">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <LawFirms />

    <!-- Terms of Service Section -->
    <section id="tos" class="py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Terms of Service</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ul class="list-disc list-inside space-y-4 text-gray-600 dark:text-gray-300">
            <li v-for="(term, index) in termsOfService" :key="index">{{ term }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Contact Us Section -->
    <section id="contact" class="py-20 bg-gray-200 dark:bg-gray-800">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Contact Us</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <mail-icon class="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Email</h3>
            <p class="text-gray-600 dark:text-gray-300">{{ contactInfo.email }}</p>
          </div>
          <div class="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <phone-icon class="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Phone</h3>
            <p class="text-gray-600 dark:text-gray-300">{{ contactInfo.phone }}</p>
          </div>
          <div class="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <map-pin-icon class="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Address</h3>
            <p class="text-gray-600 dark:text-gray-300">{{ contactInfo.address }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { MailIcon, PhoneIcon, MapPinIcon, BookOpenIcon, ScaleIcon, MessageCircleIcon } from 'lucide-vue-next'
import LawFirms from './LawFirms.vue';

const slides = [
  {
    id: 1,
    title: "Welcome to Legal Bot Ethio AI",
    description: "Revolutionizing legal advice with cutting-edge AI technology",
    image: "/slide1.jpg",
    alt: "AI-powered legal advice"
  },
  {
    id: 2,
    title: "Get Expert Legal Advice Instantly",
    description: "Our AI system provides accurate and timely legal guidance",
    image: "/slide2.jpg",
    alt: "Instant legal advice"
  },
  {
    id: 3,
    title: "Empowering Ethiopian Citizens",
    description: "Making legal information accessible to everyone",
    image: "/slide3.jpg",
    alt: "Empowering citizens"
  }
];


const currentSlide = ref(0)
let intervalId = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

onMounted(() => {
  intervalId = setInterval(nextSlide, 5000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})




const developers = ref([
  {
    name: 'nedia ',
    avatar: '/neda.png',
    github: 'nedahashim',
    telegram: 'Ailurophilie'
  },
  {
    name: 'yosf ',
    avatar: '/yosef.png',
    github: 'Xiemingminsan',
    telegram: 'demi_dieux'
  },
  {
    name: 'agi ',
    avatar: '/agi.png',
    github: 'ajkel9',
    telegram: 'ajkel9'
  },
  {
    name: 'Surafel',
    avatar: '/sura.png',
    github: 'surafel-47',
    telegram: 'surafel-47'
  }
]);

const services = ref([
  {
    title: 'Legal Research',
    description: 'AI-powered legal research to find relevant cases and statutes.',
    icon: BookOpenIcon
  },
  {
    title: 'Case Analysis',
    description: 'In-depth analysis of legal cases using advanced AI algorithms.',
    icon: ScaleIcon
  },
  {
    title: 'Legal Consultation',
    description: 'Get instant legal advice from our AI-powered chatbot.',
    icon: MessageCircleIcon
  }
])

const termsOfService = ref([
  'Users must be at least 18 years old to use the service.',
  'The advice provided by the AI is for informational purposes only and should not be considered as a substitute for professional legal counsel.',
  'Users are responsible for the accuracy of the information they provide to the AI system.',
  'Legal Bot Ethio AI reserves the right to terminate or suspend access to the service at any time.',
  'Users agree not to use the service for any illegal or unauthorized purpose.',
  'All intellectual property rights related to the service belong to Legal Bot Ethio AI.',
  'Users personal data will be processed in accordance with our Privacy Policy.'
])

const contactInfo = ref({
  email: 'surafelzewdu@gmail.com',
  phone: '+251 965651110',
  address: '4 Kilo HiLCoE, Addis Ababa, Ethiopia'
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
