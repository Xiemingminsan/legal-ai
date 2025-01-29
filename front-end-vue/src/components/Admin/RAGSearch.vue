<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cosine Similarity Chunk Search</h2>
    <form @submit.prevent="performSearch" class="mb-4">
      <div class="relative">
        <input v-model="searchQuery" type="text" placeholder="Enter your search query..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
        <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>

      <div class="mt-3 flex gap-3">
        <!-- Top K Dropdown -->
        <select v-model="topK"
          class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <option v-for="k in 10" :key="k" :value="k">Top {{ k }}</option>
        </select>

        <!-- Language Dropdown -->
        <select v-model="language"
          class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <option value="en">English</option>
          <option value="amh">Amharic</option>
        </select>

        <button type="submit"
          class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
          Search
        </button>
      </div>



    </form>
    <div v-if="searchResults.length > 0" class="space-y-4">
      <div v-for="result in searchResults" :key="result.id" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ result.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Document ID: {{ result.id }}</p>
        <p class="mt-2 text-gray-700 dark:text-gray-200">{{ result.chunkText }}</p>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Similarity Score: {{ result.similarityScore.toFixed(4)
          }}</p>
      </div>
    </div>
    <p v-else class="text-gray-600 dark:text-gray-400">No search results to display.</p>
  </div>
</template>

<script setup>
import MyHttpService from '@/stores/MyHttpService';
import { ref } from 'vue';

const searchQuery = ref('');
const searchResults = ref([]);
const topK = ref(5);
const language = ref("en");
const props = defineProps({
  botId: {
    type: String,
    required: true
  }
});

const searchSimilariDocs = async () => {

  try {
    const response = await fetch(`${MyHttpService.PYTHON_MICRO_SERVICE_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery.value,
        top_k: topK.value,
        language: language.value,
        botId: props.botId
      })
    });
    const data = await response.json();
    console.log(data);
    // searchResults.value = data.results;
  } catch (error) {
    console.error('Error:', error);
  }
}

const performSearch = () => {
  searchSimilariDocs();
  // Mock search results (replace with actual API call)
  searchResults.value = [
    {
      id: 'doc1',
      title: 'Legal Contract Template',
      chunkText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel consectetur interdum, nisl nunc egestas nunc, vitae tincidunt nisl nunc euismod nunc.',
      similarityScore: 0.8765,
    },
    {
      id: 'doc2',
      title: 'Case Law Summary',
      chunkText: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      similarityScore: 0.7654,
    },
    {
      id: 'doc3',
      title: 'Legal Procedures Guide',
      chunkText: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
      similarityScore: 0.6543,
    },
  ];
};
</script>
