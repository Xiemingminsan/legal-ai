<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Uploaded Documents</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="file in documents" :key="file._id"
        class="flex items-center space-x-3 p-2 rounded-md bg-[#1ddcf91f] dark:bg-[#ffffff0c] hover:bg-gray-100 dark:hover:bg-gray-700">
        <!-- File Details -->
        <label :for="'file' + file._id" class="flex-1 flex items-center space-x-3">
          <!-- File Icon -->
          <i :class="getFileIcon(file.title)" class="text-gray-400"></i>
          <!-- File Info -->
          <div>
            <span class="text-sm text-gray-900 dark:text-gray-300">{{ file.title }}</span>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ file.language === 'en' ? 'English' : 'Amharic' }}
              </span>
              <!-- File Category -->
              <span
                class="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md dark:bg-gray-600 dark:text-gray-200">
                {{ file.category }}
              </span>
            </div>
          </div>
        </label>

        <!-- Download Icon -->
        <a :href="MyHttpService.BASE_URL + file.filePath" target="_blank" rel="noopener noreferrer"
          class="text-blue-500 hover:text-blue-700">
          <i class="ri-download-2-line text-lg"></i>
        </a>
      </div>

    </div>
  </div>

</template>

<script setup>
import MyHttpService from '@/stores/MyHttpService';

 defineProps({
  documents: {
    type: Array,
    required: true,
  },
});


const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'ri-file-pdf-line';
    case 'doc':
    case 'docx':
      return 'ri-file-word-line';
    case 'txt':
      return 'ri-file-text-line';
    default:
      return 'ri-file-line';
  }
};

//  Mock uploaded documents data (replace with actual API call)
// const documents = ref([
//   { id: 'doc1', title: 'Legal Contract', language: 'en', fileType: 'pdf' },
//   { id: 'doc2', title: 'Case Summary', language: 'en', fileType: 'docx' },
//   { id: 'doc3', title: 'የህግ ሰነድ', language: 'am', fileType: 'pdf' },
//   { id: 'doc4', title: 'Court Proceedings', language: 'en', fileType: 'txt' },
//   { id: 'doc5', title: 'የፍርድ ቤት ውሳኔ', language: 'am', fileType: 'docx' },
//   { id: 'doc6', title: 'Legal Research Notes', language: 'en', fileType: 'txt' },
// ]);


</script>
