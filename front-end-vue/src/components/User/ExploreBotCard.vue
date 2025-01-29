<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 relative"
    @click="onBotClicked"
  >
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 rounded-xl">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>

    <!-- Warning label -->
    <div v-if="showWarningLabel" class="absolute top-2 right-2 z-10">
      <div class="relative group">
        <i class="ri-information-line text-yellow-500 text-xl cursor-pointer hover:text-yellow-600 transition-colors duration-200"></i>
        <div class="absolute top-full right-0 mt-2 w-64 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          This is a user-generated bot. It may rely on less reliable data to operate. Use with caution.
        </div>
      </div>
    </div>

    <!-- Bot image -->
    <div class="aspect-square overflow-hidden">
      <img :src="bot.icon || '/bot.png'" class="w-full h-full object-cover transition-transform duration-300 hover:scale-110" :alt="bot.name" />
    </div>

    <!-- Bot info -->
    <div class="p-6">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{{ bot.description }}</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="category in bot.categories"
          :key="category"
          class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
        >
          {{ category }}
        </span>
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

