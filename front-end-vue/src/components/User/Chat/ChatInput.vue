<script setup>
import { ref } from 'vue';

defineProps({
  onSendMessage: {
    type: Function,
    required: true,
  },
});

const message = ref('');

const handleSubmit = (e) => {
  e.preventDefault();
  if (message.value.trim()) {
    onSendMessage(message.value);
    message.value = '';
  }
};
</script>

<template>
  <form @submit="handleSubmit" class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center">
      <input v-model="message" type="text" placeholder="Type your message..."
        class="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200" />
      <button type="submit"
        class="bg-sky-500 text-white rounded-r-lg py-2 px-4 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
        <i class="ri-send-plane-2-line h-5 w-5"></i>
      </button>
    </div>
  </form>
</template>
