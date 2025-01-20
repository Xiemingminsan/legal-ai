<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import RecentChatBox from '@/components/User/Chat/RecentChatBox.vue';
import ChatArea from '@/components/User/Chat/ChatArea.vue';


const sampleChats = [
  {
    id: '1',
    botName: 'Legal Advisor',
    avatar: '/assets/legal-advisor-avatar.png',
    lastMessage: 'Here’s a summary of your legal rights...',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    botName: 'Contract Assistant',
    avatar: '/assets/contract-assistant-avatar.png',
    lastMessage: 'I’ve reviewed the contract and found...',
    timestamp: 'Yesterday',
  },
  {
    id: '3',
    botName: 'Case Law Bot',
    avatar: '/assets/case-law-bot-avatar.png',
    lastMessage: 'Based on similar cases, I recommend...',
    timestamp: 'Monday',
  },
];

const selectedChat = ref(null);
const isMobileView = ref(window.innerWidth < 768);

const handleResize = () => {
  isMobileView.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const onSelectChat = (chat) => {
  selectedChat.value = chat;
};

const onBack = () => {
  selectedChat.value = null;
};
</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <div :class="[
      isMobileView && selectedChat ? 'hidden' : 'w-full md:w-1/3 lg:w-1/4',
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
    ]">
      <RecentChatBox :chats="sampleChats" @selectChat="onSelectChat" />
    </div>
    <div :class="[
      isMobileView && !selectedChat ? 'hidden' : 'w-full md:w-2/3 lg:w-3/4',
    ]">
      <template v-if="selectedChat">
        <ChatArea :chat="selectedChat" @back="onBack" />
      </template>
      <template v-else>
        <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          Select a chat to start messaging
        </div>
      </template>
    </div>
  </div>
</template>
