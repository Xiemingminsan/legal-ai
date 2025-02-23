<template>

  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center mt-48">
    <LoadingSpinner />
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getAllBots" />
  <!-- if Page Loadded -->
  <div v-else class="space-y-8">
    <!-- Primary Bots Section -->
    <section>
      <div class="flex items-center justify-start gap-5 mb-4">
        <!-- Title -->
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Primary Bots</h2>
        <!-- Create Bot Button -->
        <router-link to="/admin/createBot"
          class="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-transform transform hover:scale-101">
          <i class="ri-add-line text-xl mr-2"></i>
          <span class="font-semibold">Create Bot</span>
        </router-link>

      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminBotListingCard v-for="bot in primaryBots" :key="bot._id" :bot="bot" />
      </div>
    </section>

    <!-- User Bots Section -->
    <section>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">User Bots</h2>
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Search bots..."
            class="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminBotListingCard v-for="bot in filteredUserBots" :key="bot._id" :bot="bot" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import AdminBotListingCard from '@/components/Admin/AdminBotListingCard.vue';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';


const adminStore = useAdminStore();

const isLoading = ref(false);
const error = ref(null);
const primaryBots = ref([])
const userBots = ref([])



const getAllBots = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getAllBots();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  primaryBots.value = response.primaryBots;
  userBots.value = response.userBots;

};


onMounted(() => {
  getAllBots();
});



const searchQuery = ref('');


const filteredUserBots = computed(() => {
  if (!searchQuery.value) return userBots.value;

  const query = searchQuery.value.toLowerCase();
  return userBots.value.filter(bot =>
    bot.name?.toLowerCase().includes(query)
  );
});
</script>
