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
      <div class="space-y-4 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="result in searchResults" :key="result.doc_id"
          class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ result.title }}</h3>
              <span
                class="px-2 py-1 text-xs font-medium bg-sky-100 text-sky-800 rounded-full dark:bg-sky-900 dark:text-sky-200">
                {{ result.category }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Document ID: {{ result.doc_id }}</p>
          </div>

          <div class="p-4">
            <div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center">
                <i class="ri-calendar-line mr-2 text-gray-400 dark:text-gray-500"></i>
                <span>Uploaded: {{ new Date(result.uploadDate).toLocaleDateString() }}</span>
              </div>
              <div class="flex items-center">
                <i class="ri-bar-chart-box-line mr-2 text-gray-400 dark:text-gray-500"></i>
                <span>Similarity: <strong>{{ result.similarity.toFixed(4) }}</strong></span>
              </div>
            </div>
            <p class="text-gray-700 dark:text-gray-200">{{ result.text }}</p>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-gray-600 dark:text-gray-400">No search results to display.</p>
  </div>
</template>

<script setup>
import MyHttpService from '@/stores/MyHttpService';
import { MyToast } from '@/utils/toast';
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
const performSearch= async () => {
  try {
    const formData = new URLSearchParams();
    formData.append("query", searchQuery.value);
    formData.append("top_k", topK.value);
    formData.append("language", language.value);
    formData.append("bot_id", props.botId);

    const response = await fetch(`${MyHttpService.PYTHON_MICRO_SERVICE_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',  // Correct content type
      },
      body: formData.toString() // Converts URLSearchParams to proper form-encoded string
    });


    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    searchResults.value = data.results || []; // Ensure results is always an array
  } catch (error) {
    MyToast.error('An error occurred while searching for similar documents.');
    searchResults.value = [];
    console.error('Error:', error);
  }
};

//@todo remove not used anymore
const performSearch2 = () => {
  searchResults.value = [
    {
      doc_id: "a1b2c3d4e5",
      title: "Ethiopian Civil Code - Property Law",
      text: "Ownership rights shall not be transferred without a legally binding contract.",
      similarity: 0.8921,
      docScope: "public",
      category: "Property Law",
      uploadDate: "2025-01-28T10:15:30.000Z",
    },
    {
      doc_id: "f6g7h8i9j0",
      title: "Criminal Offenses and Penalties",
      text: "Any individual found guilty of theft shall be subject to a minimum sentence of two years.",
      similarity: 0.8123,
      docScope: "public",
      category: "Criminal Law",
      uploadDate: "2025-01-27T08:45:20.000Z",
    },
    {
      doc_id: "k1l2m3n4o5",
      title: "Business Contracts Act 2024",
      text: "All business agreements must be signed by both parties and notarized to be legally enforceable.",
      similarity: 0.7932,
      docScope: "private",
      category: "Contract Law",
      uploadDate: "2025-01-26T15:30:10.000Z",
    },
    {
      doc_id: "p6q7r8s9t0",
      title: "Employment Rights - Workplace Safety",
      text: "Employers are required to ensure a safe working environment, adhering to federal labor laws.",
      similarity: 0.7689,
      docScope: "public",
      category: "Labor Law",
      uploadDate: "2025-01-25T12:05:50.000Z",
    },
    {
      doc_id: "u1v2w3x4y5",
      title: "Family Law - Child Custody Guidelines",
      text: "In custody cases, the best interest of the child shall be the primary consideration.",
      similarity: 0.7425,
      docScope: "restricted",
      category: "Family Law",
      uploadDate: "2025-01-24T09:20:40.000Z",
    },
  ];

};
</script>
