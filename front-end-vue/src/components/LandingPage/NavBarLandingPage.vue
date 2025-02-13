<template>
  <nav class="bg-white dark:bg-gray-800 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <a href="/land" class="flex-shrink-0">
            <img class="h-14 w-14 " src="/logo.png" alt="Legal Bot Ethio AI Logo" />
          </a>
          <div v-if="!hideNavLinks" class="hidden md:block text-md">
            <div class="ml-10 flex items-baseline space-x-4 font-light text-md">
              <a href="#services"
                class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md ">Our
                Services</a>
              <a href="#about"
                class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md ">About</a>
              <a href="#contact"
                class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md ">Contact</a>
            </div>
          </div>
        </div>
        <div class="hidden md:block">
          <DarkModeToggle />
          <router-link to="/signin"
            class="ml-20 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
            Login
          </router-link>
        </div>
        <div class="-mr-2 flex md:hidden">
          <button @click="isOpen = !isOpen" type="button"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-controls="mobile-menu" aria-expanded="false">
            <span class="sr-only">Open main menu</span>
            <menu-icon v-if="!isOpen" class="block h-6 w-6" />
            <x-icon v-else class="block h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
    <div :class="{ 'block': isOpen, 'hidden': !isOpen }" class="md:hidden" id="mobile-menu">
      <div v-if="!hideNavLinks" class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <a href="`/land#services`"
          class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">
          Our Services
        </a>
        <a href="`/land#about`"
          class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">
          About
        </a>
        <a href="`/land#contact`"
          class="text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">
          Contact
        </a>
      </div>
      <div class="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center px-5">
          <router-link to="/signin"
            class="mr-10 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
            Login
          </router-link>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { MenuIcon, XIcon } from 'lucide-vue-next'
import DarkModeToggle from '@/components/Basics/DarkModeToggle.vue';

defineProps({
  hideNavLinks: {
    type: Boolean,
    default: false
  }
})

const isOpen = ref(false)

</script>
