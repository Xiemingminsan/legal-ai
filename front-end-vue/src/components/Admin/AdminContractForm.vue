<template>
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 w-full max-w-4xl p-6 rounded-md shadow-lg">
      <h2 class="text-xl font-bold mb-4 dark:text-white">{{ isEditing ? 'Edit Contract' : 'Create Contract' }}</h2>

      <div class="space-y-2">
        <label class="text-xs font-medium dark:text-gray-200">Contract Type</label>
        <input v-model="localContract.type" type="text"
          class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Enter contract type" />
      </div>

      <div class="space-y-2 mt-4">
        <label class="text-xs font-medium dark:text-gray-200">Contract Content</label>
        <RichTextEditor v-model="localContract.content"
                    class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Contract details..." />
      </div>

      <div class="flex justify-end space-x-3 mt-4">
        <button @click="closeModal"
          class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md flex items-center space-x-2">
          <i class="ri-close-line"></i>
          <span class="dark:text-white">Cancel</span>
        </button>
        <button @click="saveContract" class="px-4 py-2 bg-sky-400 text-white rounded-md dark:bg-sky-500">
          <i :class="isEditing ? 'ri-save-3-line' : 'ri-add-line'"></i>
          <span class="dark:text-white">{{ isEditing ? ' Update' : ' Create' }}</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import RichTextEditor  from '@/components/Basics/RichTextEditor.vue';
const props = defineProps({
  showModal: Boolean,
  contractData: Object, // Optional (for editing)
  isEditing: Boolean
});

const emit = defineEmits(['close', 'save']);

const localContract = ref({ type: '', content: '' });

watch(() => props.contractData, (newData) => {
  if (props.isEditing && newData) {
    localContract.value = { ...newData };
  } else {
    localContract.value = { type: '', content: '' };
  }
}, { immediate: true });

const closeModal = () => {
  emit('close');
};

const saveContract = () => {
  emit('save', localContract.value);
  closeModal();
};
</script>
