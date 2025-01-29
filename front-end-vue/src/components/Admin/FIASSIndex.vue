<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">FIASS Index</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in fiassItems" :key="item.id" class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Document ID: {{ item.doc_id }}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">{{ item.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import MyHttpService from '@/stores/MyHttpService';
import { MyToast } from '@/utils/toast';
import { onMounted, ref } from 'vue';

const fiassItems = ref([]);

const getFiassItems = async () => {

  try {
    const response = await fetch(`${MyHttpService.PYTHON_MICRO_SERVICE_API_URL}/faiss/documents`, {
      method: 'GET',
    });
    const data = await response.json();
    fiassItems.value = data.documents;
  } catch (error) {
    MyToast.error('An error occurred while Getting FIASS documents.');
    console.error('Error:', error);
    fiassItems.value = [];
  }
}


onMounted(() => {
  getFiassItems();
});


// // Mock FIASS index data (replace with actual API call)
// const fiassItems = ref([
//   { id: 'fiass1', text: 'This is a sample text content for FIASS index item 1.' },
//   { id: 'fiass2', text: 'Another example of FIASS index item content for document 2.' },
//   { id: 'fiass3', text: 'FIASS index representation for document 3 with some legal context.' },
//   { id: 'fiass4', text: 'Fourth FIASS index item showcasing document content indexing.' },
//   { id: 'fiass5', text: 'FIASS indexing example for the fifth document in the system.' },
//   { id: 'fiass6', text: 'Sixth document\'s FIASS index content for quick retrieval and analysis.' },
// ]);
</script>
