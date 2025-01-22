<template>
  <footer class="bg-white dark:bg-gray-800">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <nav class="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
        <div class="px-5 py-2">
          <a href="#services"
            class="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Services
          </a>
        </div>
        <div class="px-5 py-2">
          <a href="#about" class="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            About
          </a>
        </div>
        <div class="px-5 py-2">
          <a href="#tos" class="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Terms of Service
          </a>
        </div>
      </nav>
      <div class="mt-8 flex justify-center space-x-6">
        <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <span class="sr-only">Facebook</span>
          <facebook-icon class="h-6 w-6" />
        </a>
        <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <span class="sr-only">Twitter</span>
          <twitter-icon class="h-6 w-6" />
        </a>
        <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <span class="sr-only">LinkedIn</span>
          <linkedin-icon class="h-6 w-6" />
        </a>
      </div>
      <p class="mt-8 text-center text-base text-gray-400 dark:text-gray-500">
        &copy; {{ new Date().getFullYear() }} Legal Bot Ethio AI. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<script setup>
import { FacebookIcon, TwitterIcon, LinkedinIcon } from 'lucide-vue-next'
</script>
