<template>

  <!-- Wrapper for Loading and Error states -->
  <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <!-- Loading state -->
    <div class="animate-spin border-t-2 border-blue-600 border-solid rounded-full w-8 h-8">
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="p-4">
      <div class="flex items-center space-x-4">
        <div class="flex-shrink-0">
          <img :src=" bot.icon || '/bot.png'" class="h-12 w-12 rounded-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <router-link :to="`/admin/bot/${bot._id}`"
            class="text-sm font-medium text-gray-900 dark:text-white truncate hover:underline">
            {{ bot.name }}
          </router-link>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ trimmedDescription }}
          </p>

        </div>
        <div class="flex-shrink-0">
          <span :class="bot.visibility === 'public'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
            {{ bot.visibility }}
          </span>

        </div>
      </div>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 text-right">
      <button :onclick="onChatWithBot"
        class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
        <i class="ri-chat-3-line mr-1"></i> Chat
      </button>
      <router-link :to="`/admin/bot/${bot._id}`"
        class="ml-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
        <i class="ri-information-line mr-1"></i> Details
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import { useRouter } from 'vue-router';
const router = useRouter();

const userStore = useUserStore();
const isLoading = ref(false);

const props = defineProps({
  bot: {
    type: Object,
    required: true
  }
});


const onChatWithBot = async () => {
  isLoading.value = true;

  const response = await userStore.createNewChat(props.bot._id);
  isLoading.value = false;

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  response.conversationId;

  router.push({
    path: '/chats',
    query: { conversationId: response.conversationId }
  });

  // Open the same route in a new tab
  window.open(
    router.resolve({ path: '/chats', query: { conversationId: response.conversationId } }).href,
    '_blank'
  );



};








const trimmedDescription = computed(() =>
  props.bot.description.length > 100
    ? props.bot.description.slice(0, 100) + '...'
    : props.bot.description
);

</script>
