<template>
    <button @click="languageStore.switchLanguage"
      class="w-12 bg-sky-400 dark:bg-sky-700 hover:bg-sky-400 dark:hover:bg-sky-600 text-white px-3 py-1 rounded">
      {{ languageStore.currentLanguage === 'en' ? 'አማ' : 'Eng' }}
    </button>
  </template>
  
  <script setup>
  import { useLanguageStore } from '@/stores/languageStore';
  import { storeToRefs } from 'pinia'
  
  // Initialize the language store
  const languageStore = useLanguageStore();
  
  
  // The t function doesn't need to be reactive, so we can destructure it directly
  const { t } = languageStore;
  </script>
  
  <style scoped></style>
  
  