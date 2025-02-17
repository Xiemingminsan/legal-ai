<template>
  <div>
    <!-- Quill Editor Container -->
    <div ref="editor" class="rich-text-editor dark:bg-gray-800 dark:text-white"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Import Quill's styles

const props = defineProps({
  modelValue: String, // v-model binding
});

const emit = defineEmits(['update:modelValue']);

const editor = ref(null); // Reference to the editor container
let quillInstance = null; // Store the Quill instance

// Initialize Quill when the component is mounted
onMounted(() => {
  quillInstance = new Quill(editor.value, {
    theme: 'snow', // Use the Snow theme
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'], // Text formatting
        [{ header: [1, 2, 3, false] }], // Headers
        [{ list: 'ordered' }, { list: 'bullet' }], // Lists
        ['link', 'image'], // Links and images
        ['clean'], // Remove formatting
      ],
    },
  });

  // Set initial content from props
  quillInstance.root.innerHTML = props.modelValue || '';

  // Update v-model when the editor content changes
  quillInstance.on('text-change', () => {
    const content = quillInstance.root.innerHTML;
    emit('update:modelValue', content);
  });

  // Apply dark mode styles dynamically
  applyDarkModeStyles();
});

// Watch for changes to modelValue and update the editor
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== quillInstance.root.innerHTML) {
      quillInstance.root.innerHTML = newValue || '';
    }
  }
);

// Function to apply dark mode styles
const applyDarkModeStyles = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  if (isDarkMode) {
    // Dark mode styles for the toolbar
    const toolbar = editor.value.querySelector('.ql-toolbar');
    if (toolbar) {
      toolbar.classList.add('dark:bg-gray-700', 'dark:border-gray-600');
    }

    // Dark mode styles for the editor content
    const editorContent = editor.value.querySelector('.ql-editor');
    if (editorContent) {
      editorContent.classList.add('dark:bg-gray-800', 'dark:text-white');
    }
  }
};
</script>

<style scoped>
.rich-text-editor {
  height: 200px; /* Adjust height as needed */
  background-color: white; /* Light mode background */
  color: black; /* Light mode text */
}

/* Dark mode styles for Quill */
:deep(.ql-toolbar) {
  background-color: white; /* Light mode toolbar background */
  border-color: #e5e7eb; /* Light mode toolbar border */
}

:deep(.ql-toolbar.dark\:bg-gray-700) {
  background-color: #374151; /* Dark mode toolbar background */
  border-color: #4b5563; /* Dark mode toolbar border */
}

:deep(.ql-editor.dark\:bg-gray-800) {
  background-color: #1f2937; /* Dark mode editor background */
  color: white; /* Dark mode editor text */
}
</style>