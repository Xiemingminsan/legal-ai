<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow transition-all duration-300 hover:shadow-xl hover:scale-105"
    @click="onBotClicked"
  >
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 rounded-lg">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>
    
    <!-- Bot image header with gradient overlay -->
          <div class="relative h-32 bg-gradient-to-r from-blue-100 to-blue-900 dark:from-blue-700 dark:to-slate-900">
      <img 
        v-if="bot.imageUrl" 
        :src="bot.imageUrl" 
        :alt="bot.name" 
        class="w-full h-full object-cover mix-blend-overlay"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      
      <!-- Warning label for user bots -->
      <div 
        v-if="showWarningLabel" 
        class="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded"
      >
        Community Bot
      </div>
      
      <!-- Bot icon overlay -->
      <div class="absolute bottom-3 left-3 flex items-center space-x-2">
        <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow">
          <i :class="['text-lg text-black', bot.iconClass || 'ri-robot-line']"></i>
        </div>
        <div class="text-white">
          <h3 class="font-bold text-base truncate max-w-[160px]">{{ bot.name }}</h3>
          <div class="flex items-center text-gray-200 text-xs">
            <i class="ri-user-line mr-1"></i>
            <span>{{ bot.creator || 'Unknown Creator' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Card body -->
    <div class="p-3">
      <!-- Description -->
      <p class="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-3">
        {{ bot.description || 'No description provided' }}
      </p>
      
      <!-- Action buttons -->
      <div class="flex gap-2">
        <button 
          class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 rounded text-xs font-medium transition-colors duration-200"
          @click.stop="onBotClicked"
        >
          Ask AI
        </button>
        <button 
          class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors duration-200"
        >
          <i class="ri-information-line text-gray-500 dark:text-gray-400"></i>
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