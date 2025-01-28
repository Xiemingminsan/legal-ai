<template>
  <div class="h-full overflow-y-auto">
    <h2 class="text-2xl font-bold p-4 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      Chats
    </h2>
    <ul>
      <li v-for="chat in chats" :key="chat._id"
        class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 group"
        @click="handleSelectChat(chat)">
        <div class="flex items-center p-4">
          <!-- Bot Icon -->
          <img :src="chat.bot?.icon ? chat.bot.icon : '/bot.png'" alt="bot icon" class="w-12 h-12 rounded-full mr-4" />

          <!-- Chat Details -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {{ chat.bot?.name }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ chat.lastTextSentByUser }}
            </p>
          </div>
          <div class="flex flex-col items-end p-2">
            <!-- Timestamp -->
            <span class="text-xs  text-gray-500 dark:text-gray-400">
              {{ MyUtils.dateFormatter(chat.timeStamp) }}
            </span>
            <!-- Share and Delete Icons -->
            <div class="flex  space-x-2 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
              <!-- Share Icon -->
              <button @click.stop="handleShareChat(chat)"
                class="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <i class="ri-share-line text-lg"></i>
              </button>

              <!-- Delete Icon -->
              <button @click.stop="handleDeleteChat(chat)"
                class="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <i class="ri-delete-bin-line text-lg"></i>
              </button>
            </div>
          </div>

        </div>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { MyUtils } from '@/utils/Utils';
import { defineProps, defineEmits, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { MyToast } from '@/utils/toast';
import MyHttpService from '@/stores/MyHttpService';


const userStore = useUserStore();
defineProps({
  chats: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['selectChat']);

const handleSelectChat = (chat) => {
  emit('selectChat', chat);
};




const handleShareChat = async (chat) => {
  const response = await userStore.shareChat(chat._id);
  console.log(response);
  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  const sharedConversationId = response.sharedConversationId;

  const link = `${MyHttpService.FRONT_END_URL}sharedChats/${sharedConversationId}`; // Construct the post link
  try {
    await navigator.clipboard.writeText(link);

    MyToast.success("Link copied to clipboard!");
  } catch (error) {
    // Show error toast if copying fails
    MyToast.error("Failed to copy link to clipboard.");
  }
};


</script>
