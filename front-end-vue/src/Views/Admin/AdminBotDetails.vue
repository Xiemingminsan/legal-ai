<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center mt-48">
    <LoadingSpinner />
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getServerHealth" />
  <!-- if Page Loadded -->

  <div v-else class="space-y-6">
    <!-- Bot Details Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div class="flex items-center space-x-4">
          <img :src="bot.icon || '/bot.png'" class="h-20 w-20 rounded-full object-cover">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ bot.name }}</h1>
            <p class="text-gray-600 dark:text-gray-300">{{ bot.description }}</p>
            <div class="mt-2 space-y-2">
              <div class="flex gap-3">
                <!-- Visibility -->
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-700 dark:text-gray-300">Visibility:</span>
                  <span
                    :class="bot.visibility == 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ bot.visibility }}
                  </span>
                </div>

                <!-- Type -->
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span :class="bot.type == 'public' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ bot.type }}
                  </span>
                </div>

              </div>

              <!-- Categories -->
              <div>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span v-for="category in bot.categories" :key="category"
                    class="bg-gray-100 text-gray-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ category }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div class="mt-4 md:mt-0">
          <button @click="deleteBot"
            class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200">
            <i class="ri-delete-bin-line mr-2"></i> Delete Bot
          </button>
        </div>
      </div>
      <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Owner Information</h2>
        <p class="text-gray-600 dark:text-gray-300">{{ bot.creator?.fullname }} (@{{ bot.creator?.username }})</p>
        <p class="text-gray-600 dark:text-gray-300">{{ bot.creator?.email }}</p>
      </div>
    </div>

    <!-- Tabbed View -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <h1 class="flex items-center justify-end px-4 pt-5 text-gray-900 dark:text-white">
        <i class="ri-flask-line mr-2"></i>
        Bot Playground
      </h1>

      <nav class="flex">
        <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" :class="[
          'px-4 py-2 text-sm font-medium',
          currentTab === tab.id
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        ]">
          {{ tab.name }}
        </button>
      </nav>
      <div class="p-6">
        <RAGSearch v-if="currentTab === 'rag'" :botId="bot._id" />
        <FIASSIndex v-else-if="currentTab === 'fiass'" />
        <AdminUploadedDocuments v-else-if="currentTab === 'documents'" :documents="bot.documents" />
        <BotFeedback v-else-if="currentTab === 'feedback'" :botId="bot._id" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RAGSearch from '@/components/Admin/RAGSearch.vue';
import FIASSIndex from '@/components/Admin/FIASSIndex.vue';
import AdminUploadedDocuments from '@/components/Admin/AdminUploadedDocuments.vue';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';
import BotFeedback from '@/components/User/BotFeedback.vue';
const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();


const botId = route.params.id;

const bot = ref({});

const isLoading = ref(false);
const error = ref(null);

//---------------------------------------------------

const getBot = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getBot(botId);

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  bot.value = response;
  isLoading.value = false;
};


onMounted(() => {
  getBot();
});


//----------------------------------------------------------


const deleteBot = async () => {
  const response = await adminStore.deleteBot(botId);

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  MyToast.success(response.msg);

  // Redirect to the bots page
  router.push('/admin/bots');
};




const tabs = [
  { id: 'rag', name: 'RAG Search' },
  { id: 'fiass', name: 'FIASS Index' },
  { id: 'documents', name: 'Uploaded Documents' },
  { id: 'feedback', name: 'User Feedback' },
];


const currentTab = ref('rag');



</script>
