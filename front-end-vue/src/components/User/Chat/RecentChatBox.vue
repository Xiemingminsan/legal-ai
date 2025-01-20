<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  chats: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['selectChat']);

const handleSelectChat = (chat) => {
  emit('selectChat', chat);
};
</script>

<template>
  <div class="h-full overflow-y-auto">
    <h2 class="text-2xl font-bold p-4 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      Chats
    </h2>
    <ul>
      <li v-for="chat in chats" :key="chat.id"
        class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        @click="handleSelectChat(chat)">
        <div class="flex items-center p-4">
          <img :src="chat.avatar" :alt="chat.botName" class="w-12 h-12 rounded-full mr-4" />
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {{ chat.botName }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ chat.lastMessage }}
            </p>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ chat.timestamp }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>
