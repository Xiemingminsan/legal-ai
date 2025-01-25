<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'; // Added nextTick import
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import { MyUtils } from '@/utils/Utils';

const props = defineProps({
  chat: {
    type: Object,
    required: true,
  },
  onBack: {
    type: Function,
    required: true,
  },
});

const userStore = useUserStore();
const isLoading = ref(false);
const error = ref(null);
const botDetails = ref({});
const conversationId = ref('');
const conversation = ref([]);
const messageToSend = ref('');
const selectedLanguage = ref('en');
const messagesContainer = ref(null); // Reference for scrolling


const isLoadingNewMessage = ref(false);
const errorGettingLastChat = ref(null);

const getConversation = async () => {
  isLoading.value = true;
  error.value = null;

  const response = await userStore.getConversation(props.chat.conversationId);
  isLoading.value = false;

  if (response.error) {
    error.value = response.error;
    MyToast.error(response.error);
    return;
  }

  conversation.value = response.messages;
  botDetails.value = response.bot;
  conversationId.value = response.conversationId;

  // Scroll to bottom after load
  nextTick(scrollToBottom);
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

onMounted(() => {
  getConversation();
  scrollToBottom();
});

watch(
  () => props.chat,
  (newChat) => {
    if (newChat) getConversation();
  },
  { immediate: true }
);

// Auto-scroll when conversation updates
watch(conversation, () => {
  nextTick(scrollToBottom);
}, { deep: true });

const askAi = async () => {
  const message = messageToSend.value.trim();
  if (!message) return;

  if (message.length > 200) {
    MyToast.error("Message is too long. Please keep it under 200 characters.");
    return;
  }

  // Optimistic update
  const tempId = Date.now().toString();
  conversation.value.push({
    _id: tempId,
    role: 'user',
    text: message,
    timestamp: new Date().toISOString()
  });

  const payload = {
    query: message,
    language: selectedLanguage.value,
    conversationId: conversationId.value,
  };

  messageToSend.value = '';

  try {
    scrollToBottom();
    isLoadingNewMessage.value = true;
    errorGettingLastChat.value = null;
    const response = await userStore.askAi(payload);

    if (response.error) {
      MyToast.error(response.error);
      // Remove optimistic update
      conversation.value = conversation.value.filter(msg => msg._id !== tempId);
      errorGettingLastChat.value = response.error; // Set error state
      return;
    }

    // Update with server response
    conversation.value = response.conversation;
    conversationId.value = response.conversationId;

  } catch (error) {
    MyToast.error("Failed to send message");
    conversation.value = conversation.value.filter(msg => msg._id !== tempId);
    errorGettingLastChat.value = error; // Set error state
    console.error("Ask AI error:", error);

  } finally {
    isLoadingNewMessage.value = false; // Reset loading state
    scrollToBottom();

  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
    <div class="bg-white dark:bg-gray-800 p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
      <button @click="onBack" class="mr-4 md:hidden">
        <i class="ri-arrow-left-line h-6 w-6 text-gray-600 dark:text-gray-400"></i>
      </button>
      <img :src="chat.bot?.icon ? '/' + chat.bot.icon : '/bot.png'" alt="bot icon"
        class="w-12 h-12 rounded-full mr-4" />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ chat.bot.name }}</h2>
    </div>

    <div class="flex-grow overflow-y-scroll  scrollable-div" ref="messagesContainer">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center mt-32">
        <div class="animate-spin border-t-2 border-blue-600 border-solid rounded-full w-8 h-8"></div>
      </div>

      <!-- Error state -->
      <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getConversation" />

      <!-- Sucess State -->
      <div v-else>
        <div v-if="conversation.length === 0"
          class="flex justify-center items-center overflow-scroll mb-10 h-[80%] mt-32">
          <p class="text-gray-500 dark:text-gray-400">Start chatting by typing a message below.</p>
        </div>

        <div v-else v-for="message in conversation" :key="message._id" class=" p-4 space-y-4"
          :class="{ 'justify-end': message.role == 'user' }">
          <div :class="['flex', message.role == 'user' ? 'justify-end' : 'justify-start']">
            <div
              :class="['max-w-[70%] rounded-lg p-3', message.role == 'user' ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200']">
              <p>{{ message.text }}</p>
              <span v-if="message.role == 'user'" class="text-xs text-gray-300 block text-right mt-1">
                {{ MyUtils.formatTimestamp(message.timestamp) }}
              </span>
            </div>
          </div>
        </div>
        <!-- Show spinner when loading -->
        <div v-if="isLoadingNewMessage" class="p-4 space-y-4">
          <div class='justify-start py-3'>
            <div
              class='max-w-[25%] rounded-lg p-3 py-7 flex justify-center bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
              <div class="flex space-x-1">
                <div class="dot dot-1"></div>
                <div class="dot dot-2"></div>
                <div class="dot dot-3"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Show error message if there's an error -->
        <div v-else-if="errorGettingLastChat" class="p-4 space-y-4">
          <div
            class="max-w-[25%] rounded-lg p-4 flex flex-row items-center justify-center  bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-lg">
            <!-- Error Message -->
            <div class="text-center mb-4">
              <i class="ri-error-warning-line text-2xl text-red-500 dark:text-red-400 mb-2"></i>
              <p class="text-sm font-medium">{{ errorGettingLastChat }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- @todo reponsviness -->
    <!-- Input Areaa -->
    <form @submit.prevent="askAi"
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mb-32 md:mb-0">
      <div class="flex items-center gap-2">
        <!-- Language Dropdown -->
        <select v-model="selectedLanguage"
          class="px-2 rounded-lg border border-gray-300 dark:border-gray-600 rounded-l-lg py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200">
          <option value="en">Eng</option>
          <option value="amh">Amh</option>
        </select>

        <!-- Message Input -->
        <input v-model="messageToSend" type="text" placeholder="Type your message..."
          class="flex-1 rounded-lg border-t border-b border-r border-gray-300 dark:border-gray-600 py-2 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200" />

        <!-- Send Button -->
        <button type="submit"
          class="bg-sky-500 text-white rounded-r-lg py-2 px-5 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <i class="ri-send-plane-2-line h-5 w-5"></i>
        </button>
      </div>
    </form>

  </div>
</template>



<style scoped>
/* Define the dots */
.dot {
  width: 0.6rem;
  height: 0.6rem;
  background-color: #3b82f6;
  /* blue-600 */
  border-radius: 50%;
}

/* Define the enhanced wave animation */
@keyframes wave {

  0%,
  100% {
    transform: translateY(0);
  }

  25% {
    transform: translateY(-15px);
  }

  50% {
    transform: translateY(0);
  }

  75% {
    transform: translateY(-10px);
  }
}

/* Apply the animation with delays */
.dot-1 {
  animation: wave 1.8s ease-in-out infinite;
}

.dot-2 {
  animation: wave 1.8s ease-in-out infinite;
  animation-delay: 0.2s;
}

.dot-3 {
  animation: wave 1.8s ease-in-out infinite;
  animation-delay: 0.4s;
}
</style>
