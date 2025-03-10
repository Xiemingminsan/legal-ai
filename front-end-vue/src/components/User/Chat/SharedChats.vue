<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'; // Added nextTick import
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import MessageBubble from '@/components/User/Chat/MessageBubble.vue';
defineProps({
  chat: {
    type: Object,
    required: true,
  },
});

const userStore = useUserStore();
const isLoading = ref(false);
const error = ref(null);
const botDetails = ref({});
const conversation = ref([]);
const messagesContainer = ref(null); // Reference for scrolling
const sharedConversationId = ref(null);
import { useRoute } from 'vue-router';
import { setNavBarShowState } from '@/utils/Utils';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';
import { useLanguageStore } from '@/stores/languageStore';

const { t } = useLanguageStore(); // Translation function

const route = useRoute();

const getConversation = async () => {
  isLoading.value = true;
  error.value = null;

  const response = await userStore.getSharedConversation(sharedConversationId.value);
  isLoading.value = false;

  if (response.error) {
    error.value = response.error;
    MyToast.error(response.error);
    return;
  }

  conversation.value = response.messages;
  botDetails.value = response.bot;

  // Scroll to bottom after load
  nextTick(scrollToBottom);
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

onMounted(() => {
  sharedConversationId.value = route.params.id;
  getConversation();
  scrollToBottom();
  setNavBarShowState(false);

});



onUnmounted(() => {
  setNavBarShowState(true);
});

</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden- bg-gray-100 dark:bg-gray-900">
    <div
      class="bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <!-- Left: Back button and bot details -->
      <div class="flex items-center">
        <router-link to="/home" class="mr-4 md:hidden">
          <i class="ri-arrow-left-line  text-3xl rounded-2xl p-3 bg-[#ffffff10] text-gray-600 dark:text-gray-400"></i>
        </router-link>
        <img :src="botDetails.icon || '/bot.png'" alt="bot icon" class="w-12 h-12 rounded-full mr-4" />
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ botDetails.name }}</h2>
      </div>

      <!-- Center: Shared Chat text -->
      <h2 class="text-xl hidden md:block font-semibold text-gray-800 dark:text-gray-200 flex-grow text-center">
        Shared Chat
      </h2>

      <!-- Right: Info icon -->
      <i class="ri-information-line text-2xl text-gray-500 dark:text-gray-300"
         :title="t('legalAIDisclaimer')"></i>
    </div>

    <div class="flex-grow overflow-y-scroll  scrollable-div" ref="messagesContainer">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center mt-32">
        <LoadingSpinner />
      </div>

      <!-- Error state -->
      <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getConversation" />

      <!-- Sucess State -->
      <div v-else>
        <div v-if="conversation.length === 0" class="flex justify-center items-center  mb-10 h-[80%] mt-32">
          <p class="text-gray-500 dark:text-gray-400">{{ t('startChatting') }}</p>
        </div>
        <div v-else v-for="message in conversation" :key="message._id" class="p-4 space-y-4">
          <MessageBubble :message="message" />
        </div>
      </div>
    </div>
  </div>
</template>
