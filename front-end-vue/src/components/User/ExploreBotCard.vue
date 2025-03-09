<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl relative group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
  >
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 rounded-xl backdrop-blur-sm">
      <div class="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500"></div>
    </div>

    <!-- Warning label -->
    <div v-if="showWarningLabel" class="absolute top-3 right-3 z-10">
      <div class="relative group/tooltip">
        <div class="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-full">
          <i class="ri-information-line text-yellow-600 dark:text-yellow-400 text-lg"></i>
        </div>
        <div class="absolute top-full right-0 mt-2 w-64 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-20 border border-gray-700">
          <p>This is a user-generated bot. It may rely on less reliable data to operate. Use with caution.</p>
          <div class="absolute -top-2 right-3 w-4 h-4 bg-gray-800 border-t border-l border-gray-700 transform rotate-45"></div>
        </div>
      </div>
    </div>

    <!-- Bot image with gradient overlay -->
    <div class="relative aspect-square overflow-hidden">
      <img
        :src="bot.icon || '/bot.png'"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        :alt="bot.name"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- Quick action button that appears on hover -->
      <button
        @click.stop="onBotClicked"
        class="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2"
      >
        <i class="ri-chat-3-line"></i>
        <span>Chat Now</span>
      </button>
    </div>

    <!-- Bot info -->
    <div class="p-5">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{{ bot.name }}</h3>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 h-10">{{ bot.description }}</p>

      <div class="flex flex-wrap gap-1.5 mb-4">
        <span
          v-for="category in bot.categories"
          :key="category"
          class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/50 dark:text-blue-200"
        >
          {{ category }}
        </span>
      </div>

      <!-- Bot stats and action button -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          </div>
          <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          </div>
        </div>
        <button
          @click.stop="onBotClicked"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        >
          <span>Try it</span>
          <i class="ri-arrow-right-line"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';

const router = useRouter();
const userStore = useUserStore();
const isLoading = ref(false);

const props = defineProps({
  bot: {
    type: Object,
    required: true
  },
  showWarningLabel: {
    type: Boolean,
    default: false
  }
});

const onBotClicked = async () => {
  isLoading.value = true;

  const response = await userStore.createNewChat(props.bot._id);
  isLoading.value = false;

  if (response.error) {
    MyToast.error(response.error);
    return;
  }

  router.push({
    path: '/chats',
    query: { conversationId: response.conversationId }
  });
};
</script>

