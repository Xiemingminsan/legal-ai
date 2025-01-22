<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Uploaded Documents</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="doc in documents" :key="doc.id" class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow relative">
        <div class="flex items-center mb-2">
          <i :class="getFileIcon(doc.fileType)" class="text-2xl mr-2 dark:text-white"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ doc.title }}</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Language: {{ doc.language === 'en' ? 'English' :
          'Amharic' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300">File Type: {{ doc.fileType }}</p>

        <!-- Download Button -->
        <a :href="doc.downloadUrl"
          class="absolute bottom-4 right-4 p-2 bg-sky-500 text-white rounded-lg hover:bg-blue-600">
          <i class="ri-download-2-line text-xl"></i>
        </a>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue';

// Mock uploaded documents data (replace with actual API call)
const documents = ref([
  { id: 'doc1', title: 'Legal Contract', language: 'en', fileType: 'pdf' },
  { id: 'doc2', title: 'Case Summary', language: 'en', fileType: 'docx' },
  { id: 'doc3', title: 'የህግ ሰነድ', language: 'am', fileType: 'pdf' },
  { id: 'doc4', title: 'Court Proceedings', language: 'en', fileType: 'txt' },
  { id: 'doc5', title: 'የፍርድ ቤት ውሳኔ', language: 'am', fileType: 'docx' },
  { id: 'doc6', title: 'Legal Research Notes', language: 'en', fileType: 'txt' },
]);

const getFileIcon = (fileType) => {
  const iconMap = {
    pdf: 'ri-file-pdf-line',
    docx: 'ri-file-word-line',
    txt: 'ri-file-text-line',
  };
  return iconMap[fileType] || 'ri-file-line';
};
</script>
