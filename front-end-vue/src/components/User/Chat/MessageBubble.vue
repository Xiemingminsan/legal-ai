<template>
  <div :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <div
      :class="['max-w-[70%] rounded-lg p-3 space-y-2', message.role === 'user' ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200']">


      <!-- File Info (if file exists) -->
      <div v-if="message.file && Object.keys(message.file).length > 0 && message.file.filename"
        class="border rounded-lg p-3 bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
        <!-- File Type Box -->
        <div
          class="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          {{ message.file.filetype?.split('/')[1]?.toUpperCase() || 'FILE' }}
        </div>

        <!-- File Details -->
        <div class="flex-1">
          <a :href="MyHttpService.BASE_URL + message.file.filedownloadUrl" target="_blank" rel="noopener noreferrer"
            class="font-semibold truncate text-gray-700 dark:text-gray-200">{{ message.file.filename.length > 20 ?
              message.file.filename.slice(0, 20) + '...' : message.file.filename }}</a>
          <p class="text-sm text-gray-500">
            {{ message.file.fileSize }} MB
          </p>
        </div>

        <!-- Eye Icon with File Content Tooltip -->
        <div class="relative group">
          <i class="ri-eye-line text-gray-500 dark:text-gray-300 cursor-pointer"></i>

          <!-- Scrollable File Content Tooltip -->
          <div
            class="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-sm text-gray-800 dark:text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 overflow-y-auto max-h-40">
            <p>{{ message.fileTextContent || "No preview available" }}</p>
          </div>
        </div>
      </div>

      <!-- Message Text -->
      <p v-html="formattedText"></p>

      <!-- Timestamp -->
      <span v-if="message.role === 'user'" class="text-xs text-gray-300 block text-right mt-1">
        {{ MyUtils.formatTimestamp(message.timestamp) }}
      </span>
    </div>
  </div>
</template>


<script setup>
import { defineProps,computed } from 'vue';
import { MyUtils } from '@/utils/Utils';
import MyHttpService from '@/stores/MyHttpService';
import { marked } from "marked";


const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
});
const formattedText = computed(() => marked(props.message.text));

console.log(props.message.file);
</script>
