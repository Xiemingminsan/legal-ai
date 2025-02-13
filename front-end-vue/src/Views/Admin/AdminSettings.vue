<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
    <div class="max-w-7xl mx-auto">

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center mt-48">
        <LoadingSpinner />
      </div>

      <!-- Error state -->
      <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getServerHealth" />
      <!-- if Page Loadded -->
      <div v-else>
        <!-- Server Health Monitoring -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-4">Server Health Monitoring</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Server Status -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Server Health</h3>
              </div>
              <div class="flex justify-between">
                <!-- Uptime -->
                <div class="mb-4">
                  <p class="text-sm text-gray-600 dark:text-gray-300">Uptime:</p>
                  <p class="font-semibold">{{ formatUptime(serverHealthData.uptime) }}</p>
                </div>

                <!-- Platform -->
                <div class="mb-4">
                  <p class="text-sm text-gray-600 dark:text-gray-300">Platform:</p>
                  <p class="font-semibold">{{ serverHealthData.platform }}</p>
                </div>
              </div>


              <!-- Storage -->
              <div class="mb-4">
                <p class="text-sm text-gray-600 dark:text-gray-300">Storage:</p>
                <p class="font-semibold">
                  <i class="ri-server-line text-2xl text-gray-400 dark:text-gray-500"></i>
                  {{ serverHealthData.storage?.free }} / {{ serverHealthData.storage?.total }}
                  Remaining
                </p>
              </div>
            </div>

            <!-- CPU Usage -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">CPU Usage</h3>
                <i class="ri-cpu-line text-2xl text-blue-400"></i>
              </div>
              <div class="relative pt-1">
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                  <div :style="{ width: `${serverHealthData.cpuUsage}%` }"
                    class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500 ease-in-out">
                  </div>
                </div>
                <p class="text-right">{{ serverHealthData.cpuUsage }}%</p>
              </div>
            </div>

            <!-- Memory Usage -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Memory Usage</h3>
                <i class="ri-memory-line text-2xl text-green-400"></i>
              </div>
              <div class="relative pt-1">
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                  <div :style="{ width: `${serverHealthData.memoryUsage}%` }"
                    class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500 ease-in-out">
                  </div>
                </div>
                <p class="text-right">{{ serverHealthData.memoryUsage }}%</p>
              </div>
            </div>
          </div>
        </section>

        <!-- System Prompts Configuration -->
        <section>
          <h2 class="text-2xl font-bold mb-4">System Prompts Configuration</h2>

          <!-- Default System Prompt -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h3 class="text-lg font-semibold mb-4">System Prompt</h3>
            <textarea v-model="systemPrompt" rows="10"
              class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md p-2 mb-4"
              placeholder="Enter default system prompt"></textarea>
            <div class="flex justify-end space-x-2">
              <button @click="updateSystemPrompt"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out flex items-center">
                <i class="ri-save-line mr-2"></i> Save
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';


const adminStore = useAdminStore();

const isLoading = ref(false);
const error = ref(null);
const serverHealthData = ref({})
const systemPrompt = ref('')



const getServerHealth = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getServerHealth();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  serverHealthData.value = response.serverHealth;
  systemPrompt.value = response.systemPrompt;

  console.log(serverHealthData.value)
};


onMounted(() => {
  getServerHealth();
});

const formatUptime = (uptime) => {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}




const updateSystemPrompt = async () => {

  const response = await adminStore.updateSystemPrompt(systemPrompt.value);

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  MyToast.success("System Prompt Changed Successfully");
};



</script>
