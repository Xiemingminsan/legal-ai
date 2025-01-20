<script setup>
import { computed } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
});

const isUser = computed(() => props.message.sender === 'user');
</script>

<template>
  <div :class="['flex', isUser ? 'justify-end' : 'justify-start']">
    <div
      :class="['max-w-[70%] rounded-lg p-3', isUser ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200']">
      <p>{{ props.message.content }}</p>
      <span v-if="isUser" class="text-xs text-gray-300 block text-right mt-1">
        {{ props.message.timestamp }}
      </span>
    </div>
  </div>
</template>
