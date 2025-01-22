<template>
  <div class="space-y-6">
    <!-- Bot Details Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div class="flex items-center space-x-4">
          <img :src="bot.imageUrl || '/bot.png'" :alt="bot.botName"
            class="h-20 w-20 rounded-full object-cover">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ bot.botName }}</h1>
            <p class="text-gray-600 dark:text-gray-300">{{ bot.botDesc }}</p>
            <div class="mt-2 flex items-center space-x-2">
              <span :class="bot.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ bot.isPublic ? 'Public' : 'Private' }}
              </span>
              <span :class="bot.isPrimaryBot ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ bot.isPrimaryBot ? 'Primary Bot' : 'User Bot' }}
              </span>
              <span class="bg-purple-100 text-purple-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ bot.botTypeCategory }}
              </span>
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
        <p class="text-gray-600 dark:text-gray-300">{{ bot.owner.fullname }} (@{{ bot.owner.username }})</p>
        <p class="text-gray-600 dark:text-gray-300">{{ bot.owner.email }}</p>
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
        <RAGSearch v-if="currentTab === 'rag'" />
        <FIASSIndex v-else-if="currentTab === 'fiass'" />
        <AdminUploadedDocuments v-else-if="currentTab === 'documents'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RAGSearch from '@/components/Admin/RAGSearch.vue';
import FIASSIndex from '@/components/Admin/FIASSIndex.vue';
import AdminUploadedDocuments from '@/components/Admin/AdminUploadedDocuments.vue';

const tabs = [
  { id: 'rag', name: 'RAG Search' },
  { id: 'fiass', name: 'FIASS Index' },
  { id: 'documents', name: 'Uploaded Documents' },
];

const currentTab = ref('rag');

// Mock bot data (replace with actual API call)
const bot = ref({
  botName: 'Legal Assistant Bot',
  botDesc: 'An AI-powered legal assistant to help with various legal queries and document analysis.',
  imageUrl: '',
  owner: {
    fullname: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
  },
  isPublic: true,
  isPrimaryBot: true,
  botTypeCategory: 'Chatbot',
});

const deleteBot = () => {
  // Implement bot deletion logic here
  console.log('Deleting bot:', bot.value.botName);
  // You would typically make an API call to delete the bot
  // and then redirect to the bots listing page
};
</script>

<style>
@import 'remixicon/fonts/remixicon.css';
</style>
