<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
    <LoadingSpinner />
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getExploreBots" />

  <!-- Page content -->
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <header class="mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
          Explore Bots
          <i class="ri-robot-line text-blue-500 animate-pulse"></i>
        </h1>
      </header>

      <section class="mb-16">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Primary Bots</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ExploreBotCard v-for="bot in primaryBots" :key="bot._id" :bot="bot" />
        </div>
      </section>

      <section class="mb-16">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Public Bots</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ExploreBotCard v-for="bot in userBots" :key="bot._id" :bot="bot" :showWarningLabel="true" />
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Private Bots</h2>
          <BuyPremiumBtn />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ExploreBotCard v-for="bot in myBots" :key="bot._id" :bot="bot" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import ExploreBotCard from '@/components/User/ExploreBotCard.vue';
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const error = ref(null);
const primaryBots = ref([]);
const userBots = ref([]);
const myBots = ref([]);

const getExploreBots = async () => {
  isLoading.value = true;
  error.value = null;

  const response = await userStore.getExploreBots();
  console.log(response);
  isLoading.value = false;

  if (response.error) {
    error.value = response.error;
    MyToast.error(response.error);
    return;
  }
  primaryBots.value = response.primary;
  userBots.value = response.public;
  myBots.value = response.private;
};

onMounted(() => {
  getExploreBots();
});
</script>

