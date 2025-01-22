<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Server Health Monitoring -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Server Health Monitoring</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Server Status -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Server Status</h3>
              <i class="ri-server-line text-2xl" :class="serverStatus.color"></i>
            </div>
            <p :class="serverStatus.color">{{ serverStatus.text }}</p>
          </div>

          <!-- CPU Usage -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">CPU Usage</h3>
              <i class="ri-cpu-line text-2xl text-blue-400"></i>
            </div>
            <div class="relative pt-1">
              <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div :style="{ width: `${cpuUsage}%` }" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500 ease-in-out"></div>
              </div>
              <p class="text-right">{{ cpuUsage }}%</p>
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
                <div :style="{ width: `${memoryUsage}%` }" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500 ease-in-out"></div>
              </div>
              <p class="text-right">{{ memoryUsage }}%</p>
            </div>
          </div>
        </div>
      </section>

      <!-- System Prompts Configuration -->
      <section>
        <h2 class="text-2xl font-bold mb-4">System Prompts Configuration</h2>

        <!-- Default System Prompt -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <h3 class="text-lg font-semibold mb-4">Default System Prompt</h3>
          <textarea
            v-model="defaultSystemPrompt"
            rows="4"
            class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md p-2 mb-4"
            placeholder="Enter default system prompt"
          ></textarea>
          <div class="flex justify-end space-x-2">
            <button @click="saveDefaultPrompt" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out flex items-center">
              <i class="ri-save-line mr-2"></i> Save
            </button>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Server Health Monitoring
const cpuUsage = ref(45)
const memoryUsage = ref(60)

const serverStatus = computed(() => {
  if (cpuUsage.value < 50 && memoryUsage.value < 70) {
    return { text: 'Healthy', color: 'text-green-400' }
  } else if (cpuUsage.value < 80 && memoryUsage.value < 90) {
    return { text: 'Moderate Load', color: 'text-yellow-400' }
  } else {
    return { text: 'High Load', color: 'text-red-400' }
  }
})

// System Prompts Configuration
const defaultSystemPrompt = ref('You are a helpful AI assistant.')

const bots = ref([
  { name: 'General Bot', customPrompt: '', sampleQuery: '', testResponse: '' },
  { name: 'Code Bot', customPrompt: '', sampleQuery: '', testResponse: '' },
])

const saveDefaultPrompt = () => {
  // Implement save logic here
  console.log('Default prompt saved:', defaultSystemPrompt.value)
}

const saveCustomPrompt = (bot) => {
  // Implement save logic here
  console.log(`Custom prompt saved for ${bot.name}:`, bot.customPrompt)
}

const testPrompt = (bot) => {
  // Implement test logic here
  // This is a mock response. In a real application, you would send the prompt and query to your AI service.
  bot.testResponse = `This is a mock response for "${bot.sampleQuery}" using the custom prompt: "${bot.customPrompt}"`
}
</script>

<style>
@import 'remixicon/fonts/remixicon.css';
</style>
