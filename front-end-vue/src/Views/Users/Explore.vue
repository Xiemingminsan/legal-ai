<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center mt-32">
    <div class="animate-spin border-t-2 border-blue-600 border-solid rounded-full w-8 h-8"></div>
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getExploreBots" />
  <!-- if Page Loadded -->
  <div v-else class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8 text-right pr-5 sm:pr-20">Explore Bots
      <i class="ri-robot-line animate-pulse "></i>
    </h1>
    <section class="mb-12">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Primary Bots</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExploreBotCard v-for="bot in primaryBots" :key="bot._id" :bot="bot" />
      </div>
    </section>
    <section>
      <h2 class="inline text-2xl font-semibold text-gray-800 dark:text-gray-200">My Bots</h2>
      <div class="inline-block ml-2 w-min bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
        Premium
      </div>
      <div class="mb-4"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        <ExploreBotCard v-for="bot in userBots" :key="bot._id" :bot="bot" :is-premium="true" />
      </div>
    </section>
    <section>
      <br><br>
      <h2 class="inline text-2xl font-semibold text-gray-800 dark:text-gray-200">Custom Bots</h2>
      <div class="inline-block ml-2 w-min bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
        Premium
      </div>
      <div class="mb-4"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        <ExploreBotCard v-for="bot in myBots" :key="bot._id" :bot="bot" :is-premium="true" />
      </div>
    </section>
  </div>
</template>
<script setup>
import ExploreBotCard from '@/components/User/ExploreBotCard.vue';
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';


const userStore = useUserStore();

const isLoading = ref(false);
const error = ref(null);
const primaryBots = ref([])
const userBots = ref([])
const myBots = ref([])


const getExploreBots = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await userStore.getExploreBots();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  primaryBots.value = response.primary;
  userBots.value = response.custom;
  myBots.value = response.private;


};


onMounted(() => {
  getExploreBots();
});


</script>
