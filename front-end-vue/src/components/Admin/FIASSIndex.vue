<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">FIASS Index</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in fiassItems" :key="item.id" class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Document ID: {{ item.id }}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">{{ item.textContent }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Mock FIASS index data (replace with actual API call)
const fiassItems = ref([
  { id: 'fiass1', textContent: 'This is a sample text content for FIASS index item 1.' },
  { id: 'fiass2', textContent: 'Another example of FIASS index item content for document 2.' },
  { id: 'fiass3', textContent: 'FIASS index representation for document 3 with some legal context.' },
  { id: 'fiass4', textContent: 'Fourth FIASS index item showcasing document content indexing.' },
  { id: 'fiass5', textContent: 'FIASS indexing example for the fifth document in the system.' },
  { id: 'fiass6', textContent: 'Sixth document\'s FIASS index content for quick retrieval and analysis.' },
]);
</script>