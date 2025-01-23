<template>

  <!-- Wrapper for Loading and Error states -->
  <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <!-- Loading state -->
    <div class="animate-spin border-t-2 border-blue-600 border-solid rounded-full w-8 h-8">
    </div>
  </div>

  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.01] relative border-2"
    @click="onBotClicked">
    <div v-if="isPremium" class="absolute top-2 right-2 px-2 py-1 rounded-full z-10">
      <BuyPremiumBtn />
    </div>
    <div class="aspect-square">
      <img :src="'/' + bot.icon" :alt="bot.name" class="w-full h-full object-cover" />
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ bot.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
const router = useRouter();

const userStore = useUserStore();
const isLoading = ref(false);


const onBotClicked = async () => {
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

};







// Props
const props = defineProps({
  bot: {
    type: Object,
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  }
});

// Router instance


</script>
