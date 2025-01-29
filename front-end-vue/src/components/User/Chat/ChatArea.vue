<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'; // Added nextTick import
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import MessageBubble from '@/components/User/Chat/MessageBubble.vue';
import { setNavBarShowState } from '@/utils/Utils';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';
const authStore = useAuthStore();
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
const selectedFile = ref(null);
const fileUploaded = ref(false);

// Allowed file types
const allowedTypes = [
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
];


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
  setNavBarShowState(false);
});

onUnmounted(() => {
  setNavBarShowState(true);
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




// Handle file input change
const onFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) return; // No file selected

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    console.log(`Failed attempt: File type "${file.type}" is not allowed.`);
    fileUploaded.value = false;
    return;
  }

  // File is valid
  selectedFile.value = file;
  fileUploaded.value = true;

  console.log(`File selected: ${file.name}`);
};

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

  // const payload = {
  //   query: message,
  //   file: selectedFile,
  //   language: selectedLanguage.value,
  //   conversationId: conversationId.value,
  // };

  const formData = new FormData();
  formData.append('query', message);
  formData.append('language', selectedLanguage.value);
  formData.append('conversationId', conversationId.value);

  // Conditionally append the file only if it exists
  if (selectedFile.value) {
    formData.append('file', selectedFile.value);
  }

  messageToSend.value = '';

  try {
    scrollToBottom();
    isLoadingNewMessage.value = true;
    errorGettingLastChat.value = null;
    const response = await userStore.askAi(formData);

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
        <i class="ri-arrow-left-line  text-3xl rounded-2xl p-3 bg-[#ffffff10] text-gray-600 dark:text-gray-400"></i>
      </button>
      <img :src="chat.bot?.icon ? chat.bot.icon : '/bot.png'" alt="bot icon" class="w-12 h-12 rounded-full mr-4" />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ chat.bot.name }}</h2>
      <div class="flex-grow"></div>
      <!-- Right: Info icon -->
      <i class="ri-information-line text-2xl text-gray-500 dark:text-gray-300"
        title="Using AI for legal matters in Ethiopia cannot guarantee 100% accuracy or reliability due to the complexities and nuances of local laws and regulations."></i>

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
          <p class="text-gray-500 dark:text-gray-400">Start chatting by typing a message below.</p>
        </div>

        <div v-else v-for="message in conversation" :key="message._id" class="p-4 space-y-4">
          <MessageBubble :message="message" />
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

    <!-- Input Areaa -->
    <form @submit.prevent="askAi"
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:mb-0 shadow-lg rounded-lg">
      <div class="flex items-center gap-3">
        <!-- Language Dropdown -->
        <select v-model="selectedLanguage"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
          aria-label="Select language">
          <option value="en">English</option>
          <option value="amh">Amharic</option>
        </select>

        <!-- Message Input -->
        <div class="relative flex-1">
          <input v-model="messageToSend" type="text" placeholder="Type your message..."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
            aria-label="Message input" />

          <!-- Send Button (inside input) -->
          <button type="submit"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sky-500 hover:text-sky-600 focus:outline-none"
            aria-label="Send message">
            <i class="ri-send-plane-2-line text-xl"></i>
          </button>
        </div>

        <!-- File Upload Button with Pro Label -->
        <div class="relative">
          <label for="file-upload" :class="[
            'cursor-pointer flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200',
            authStore.proAccount
              ? 'bg-sky-500 hover:bg-sky-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]" aria-label="Upload file">
            <i :class="[fileUploaded ? 'ri-check-line' : 'ri-upload-cloud-2-line', 'text-lg']"></i>
          </label>
          <input id="file-upload" type="file" class="hidden" :disabled="!authStore.proAccount"
            accept=".txt,.doc,.docx,.pdf,image/*" @change="onFileChange" />
          <span v-if="!authStore.proAccount"
            class="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white font-bold px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        </div>
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
