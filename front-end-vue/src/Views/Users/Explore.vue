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
        <h1 class="text-4xl text-gray-900 dark:text-white flex items-center justify-between">
          {{ t('explore_bots') }}
          <i class="ri-robot-line text-blue-500 animate-pulse"></i>
        </h1>
      </header>

      <div class="space-y-16 py-6">
        <!-- Primary Bots Section -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{{ t('primary_bots') }}</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('offical_bots')}}</p>
            </div>
          </div>

          <!-- Responsive grid with better mobile spacing -->
          <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <ExploreBotCard v-for="bot in primaryBots" :key="bot._id" :bot="bot" />
          </div>
        </section>

        <!-- Public Bots Section -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{{ t('public_bots') }}</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('comunity_bots') }}</p>
            </div>

          </div>

          <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <ExploreBotCard v-for="bot in userBots" :key="bot._id" :bot="bot" :showWarningLabel="true" />
          </div>
        </section>

        <!-- Private Bots Section -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{{ t('private_bots') }}</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('private_bots_text')}}</p>
            </div>
            <BuyPremiumBtn />
          </div>

          <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <ExploreBotCard v-for="bot in myBots" :key="bot._id" :bot="bot" />
          </div>

          <!-- Empty state for when no private bots exist -->
          <div v-if="myBots.length === 0"
            class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <div class="flex justify-center mb-4">
              <i class="ri-robot-line text-4xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{{ t('no_private_avail') }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">{{ t('no_private_long_text') }}</p>
          </div>
        </section>
      </div>
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
import { useLanguageStore } from '@/stores/languageStore';

const { t } = useLanguageStore(); // Translation function


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
