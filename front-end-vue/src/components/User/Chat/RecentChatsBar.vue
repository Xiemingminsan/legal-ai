<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import RecentChatBox from '@/components/User/Chat/RecentChatBox.vue';
import ChatArea from '@/components/User/Chat/ChatArea.vue';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';
import { useLanguageStore } from '@/stores/languageStore';

const { t } = useLanguageStore(); // Translation function


const route = useRoute();

const userStore = useUserStore();

const isLoading = ref(false);
const error = ref(null);
const recentChats = ref([])


defineProps({
  conversationId: {
    type: String,
    default: null
  }
});


const getRecentChats = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await userStore.getRecentChats();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  recentChats.value = response;
};


onMounted(async () => {
  await getRecentChats();

  // If a conversationId is provided via query, find the corresponding chat
  const conversationIdFromQuery = route.query.conversationId;

  if (conversationIdFromQuery) {
    const chat = recentChats.value.find(chat => chat._id === conversationIdFromQuery);
    if (chat) {
      selectedChat.value = chat; // Set the selected chat
    } else {
      MyToast.error("Chat Not Found")
    }
  }
});



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
  console.log("Chat Selected")
  selectedChat.value = chat;
};


const onDeleteChat = async (chat) => {
  console.log(chat);
  const response = await userStore.deleteChat(chat._id);
  console.log(response);
  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  recentChats.value = recentChats.value.filter(c => c._id !== chat._id);
  if(selectedChat.value?._id === chat._id) {
    selectedChat.value = null;
  }

  MyToast.success("Chat deleted successfully");
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
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center mt-32">
        <LoadingSpinner />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="h-min-full">
        <ErrorRetryComp :errorMessage="error" :onRetry="getRecentChats" />
      </div>


      <RecentChatBox v-else :chats="recentChats" @selectChat="onSelectChat" @deleteChat="onDeleteChat" />
    </div>
    <div :class="[
      isMobileView && !selectedChat ? 'hidden' : 'w-full md:w-2/3 lg:w-3/4',
    ]">
      <template v-if="selectedChat">
        <ChatArea :chat="selectedChat" @back="onBack" />
      </template>
      <template v-else>
        <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          {{ t('selectChat') }} 
         </div>
      </template>
    </div>
  </div>
</template>
