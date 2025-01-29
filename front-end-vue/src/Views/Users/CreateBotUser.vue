<template>
  <div v-if="!authStore.proAccount" class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
      <div class="mb-6">
        <i class="ri-vip-crown-2-line text-6xl text-yellow-500"></i>
      </div>
      <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Unlock Premium Features
      </h2>
      <p class="mb-6 text-gray-600 dark:text-gray-300">
        Upgrade to a Pro account to create and manage your own bots. Enjoy exclusive features and take your experience
        to the next level!
      </p>
      <div class="flex justify-center">
        <BuyPremiumBtn />
      </div>
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        With a Pro account, you can create customized bot for our own personal use!.
      </p>
    </div>
  </div>
  <div v-else>
    <CreateNewBot show-uploaded-files=false />
  </div>
</template>
<script setup>
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
import CreateNewBot from '../Admin/CreateNewBot.vue';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
</script>
