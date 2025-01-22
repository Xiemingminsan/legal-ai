<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New Bot</h1>

    <form @submit.prevent="createBot" class="space-y-8">
      <!-- Bot Details Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bot Details</h2>
        <div class="space-y-4">
          <div class="flex flex-col md:flex-row md:space-x-4">
            <div class="flex-1">
              <label for="botName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Name</label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="ri-robot-line text-gray-400"></i>
                </div>
                <input v-model="botName" type="text" id="botName" required
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
            </div>
            <div class="flex-1 mt-4 md:mt-0">
              <label for="botImage" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Image</label>
              <div class="mt-1 flex items-center">
                <span class="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                  <img v-if="botImage" :src="botImage" alt="Selected bot image" class="h-full w-full object-cover">
                  <i v-else class="ri-image-line text-gray-300 text-3xl flex items-center justify-center h-full"></i>
                </span>
                <button @click="openIconPicker"
                  class="ml-5 bg-white dark:bg-gray-600 py-2 px-3 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <i class="ri-gallery-line mr-2"></i>
                  Choose Icon
                </button>
              </div>

              <!-- Modal for Selecting Bot Icons -->
              <div v-if="isIconPickerOpen"
                class="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center">
                <div class="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg max-w-md w-full">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Bot Icon</h3>
                  <div class="grid grid-cols-4 gap-4">
                    <div v-for="icon in botIcons" :key="icon" class="cursor-pointer">
                      <img :src="icon" @click="selectIcon(icon)" alt="Bot Icon"
                        class="h-12 w-12 rounded-full object-cover border-2"
                        :class="botImage === icon ? 'border-blue-500' : 'border-transparent'">
                    </div>
                  </div>
                  <div class="mt-4 flex justify-end">
                    <button @click="closeIconPicker"
                      class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div>
            <label for="botDesc" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="ri-file-text-line text-gray-400"></i>
              </div>
              <textarea v-model="botDesc" id="botDesc" rows="3" required
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
            </div>
          </div>
          <div>
            <label for="subSystemPrompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub System Prompt</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="ri-robot-line text-gray-400"></i>
              </div>
              <textarea v-model="subSystemPrompt" id="subSystemPrompt" rows="3" required
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <div class="flex items-center">
              <input v-model="isPublic" type="checkbox" id="isPublic"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label for="isPublic" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Make Public</label>
            </div>
            <div class="sm:mt-0 flex-1">
              <fieldset>
                <legend class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select up to 3 Categories
                </legend>
                <div class="space-y-2">
                  <div v-for="cat in categories" :key="cat" class="flex items-center">
                    <input type="checkbox" :value="cat" v-model="category" @change="handleCategoryChange"
                      id="category-{{ cat }}"
                      class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-400 rounded" />
                    <label :for="'category-' + cat" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {{ cat }}
                    </label>
                  </div>
                </div>
                <p v-if="category.length > 0" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Selected:
                  <span v-for="cat in category" :key="cat"
                    class="bg-purple-100 text-purple-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-1">
                    {{ cat }}
                  </span>
                </p>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  No categories selected.
                </p>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      <!-- File Upload Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(file, index) in uploadedFiles" :key="index"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ file.name }}</span>
              <button @click="removeFile(index)" type="button"
                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
            <div class="space-y-2">
              <div class="">
                <label :for="'docTitle' + index"
                  class="block text-xs font-medium text-gray-700 dark:text-gray-300">Document Title</label>
                <input v-model="file.title" :id="'docTitle' + index" type="text" required
                  class="h-10 p-2 mt-1 block w-full rounded-md bg-sky-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
              </div>
              <div>
                <label :for="'docLang' + index"
                  class="block text-xs font-medium text-gray-700 dark:text-gray-300">Language</label>
                <select v-model="file.language" :id="'docLang' + index" required
                  class="h-10 p-2 mt-1 block w-full rounded-md bg-sky-100  border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-400 border-dashed rounded-md">
            <div class="space-y-1 text-center">
              <div class="flex text-sm  bg-sky-400 rounded-lg p-2 mx-auto px-10 mb-3 text-gray-700 dark:text-white">
                <label for="fileUpload" class="relative cursor-pointer  rounded-md font-medium">
                  <span>Upload files</span>
                  <i class="ml-2 ri-upload-cloud-2-line mx-auto h-15"></i>
                  <input id="fileUpload" type="file" @change="handleFileUpload" multiple class="sr-only">
                </label>
              </div>
              <p class="text-xs text-gray-700 dark:text-white">PDF, DOC, TXT up to 10MB each</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Files Section (if showUploadedFiles is true) -->
      <div v-if="showUploadedFiles" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Existing Files</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="file in existingFiles" :key="file.id"
            class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <input :id="'file' + file.id" v-model="selectedExistingFiles" type="checkbox" :value="file.id"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label :for="'file' + file.id" class="flex-1 flex items-center space-x-3">
              <i :class="getFileIcon(file.title)" class="text-gray-400"></i>
              <span class="text-sm text-gray-900 dark:text-gray-300">{{ file.title }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ file.language === 'en' ? 'English' : 'Amharic'
                }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button type="submit"
          class="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
          <i class="ri-save-line mr-2"></i> Create Bot
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Props
const props = defineProps({
  showUploadedFiles: {
    type: Boolean,
    default: true
  }
});

// Reactive state
const botName = ref('');
const botDesc = ref('');
const subSystemPrompt = ref('');
const botImage = ref(null); // Selected bot image
const botIcons = ref([]); // List of icons from /botIcons
const isIconPickerOpen = ref(false); // Modal state
const previewImage = ref(null);
const isPublic = ref(false);
const category = ref([]);
const uploadedFiles = ref([]);
const selectedExistingFiles = ref([]);
import { MyToast } from '@/utils/toast';


const categories = ref([
  "Criminal Law",
  "Family Law",
  "Corporate Law",
  "Intellectual Property",
  "Tax Law",
  "Labor Law",
]);

// Handle category selection (limit to 3)
const handleCategoryChange = () => {
  if (category.value.length > 3) {
    category.value.pop(); // Remove the latest addition if it exceeds the limit
    MyToast.error("Only Possible to Select 3 categories");
  }
};

const fetchIcons = () => {
  // Assuming the icons are named in a predictable way, e.g., icon1.png, icon2.png, ...
  const iconCount = 2;
  const basePath = '/botIcons/';

  botIcons.value = Array.from({ length: iconCount }, (_, i) => `${basePath}bot${i + 1}.png`);
};


const openIconPicker = () => {
  isIconPickerOpen.value = true;
};

const closeIconPicker = () => {
  isIconPickerOpen.value = false;
};

const selectIcon = (icon) => {
  botImage.value = icon;
  closeIconPicker();
};

onMounted(() => {
  fetchIcons();
});



// Mock existing files (replace with API call)
const existingFiles = ref([
  { id: 1, title: 'Criminal Code.pdf', language: 'en' },
  { id: 2, title: 'Family Law Guide.docx', language: 'en' },
  { id: 3, title: 'የወንጀል ህግ.pdf', language: 'am' },
  { id: 4, title: 'Corporate Governance.txt', language: 'en' },
]);

// Methods
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    botImage.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);
  uploadedFiles.value.push(...files.map(file => ({
    name: file.name,
    file: file,
    title: file.name.split('.').slice(0, -1).join('.'),
    language: 'en'
  })));
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

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

const createBot = () => {
  // Here you would typically send the data to your backend API
  const formData = new FormData();
  formData.append('name', botName.value);
  formData.append('description', botDesc.value);
  formData.append('isPublic', isPublic.value);
  formData.append('category', category.value);
  if (botImage.value) {
    formData.append('image', botImage.value);
  }

  uploadedFiles.value.forEach((file, index) => {
    formData.append(`files[${index}]`, file.file);
    formData.append(`fileTitles[${index}]`, file.title);
    formData.append(`fileLanguages[${index}]`, file.language);
  });

  formData.append('selectedExistingFiles', JSON.stringify(selectedExistingFiles.value));

  // Send formData to your API endpoint
  console.log('Bot data to be sent:', formData);
  // Implement your API call here
  // Example: await api.createBot(formData);

  // Reset form after submission
  resetForm();
};

const resetForm = () => {
  botName.value = '';
  botDesc.value = '';
  botImage.value = null;
  previewImage.value = null;
  isPublic.value = false;
  category.value = '';
  uploadedFiles.value = [];
  selectedExistingFiles.value = [];
};
</script>

<style>
@import 'remixicon/fonts/remixicon.css';
</style>
