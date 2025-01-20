<script setup>
import { ref } from 'vue';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';

defineProps({
  chat: {
    type: Object,
    required: true,
  },
  onBack: {
    type: Function,
    required: true,
  },
});

const messages = ref([
  { id: '1', sender: 'bot', content: 'Hello! How can I assist you today?', timestamp: '10:00 AM' },
  { id: '2', sender: 'user', content: 'I need help with a legal question.', timestamp: '10:01 AM' },
  { id: '3', sender: 'bot', content: 'What\'s your legal question?', timestamp: '10:02 AM' },
]);

const handleSendMessage = (content) => {
  const newMessage = {
    id: Date.now().toString(),
    sender: 'user',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  messages.value.push(newMessage);
  // Here you would typically send the message to your backend and handle the bot's response
};
</script>

<template>
  <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
    <div class="bg-white dark:bg-gray-800 p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
      <button @click="onBack" class="mr-4 md:hidden">
        <i class="ri-arrow-left-line h-6 w-6 text-gray-600 dark:text-gray-400"></i>
      </button>
      <img :src="chat.avatar" :alt="chat.botName" class="w-10 h-10 rounded-full mr-3" />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ chat.botName }}</h2>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
    </div>
    <ChatInput @sendMessage="handleSendMessage" />
  </div>
</template>
