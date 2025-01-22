<template>
  <div class="flex items-center bg-red-100 text-red-600 p-4 rounded-md">
    <!-- Error Icon -->
    <i class="ri-error-warning-line text-xl mr-3"></i>

    <!-- Error Message -->
    <div class="flex flex-col">
      <p class="font-semibold">An Error Occurred</p>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Try Again Button -->
    <button @click="retry" class="ml-auto text-red-600 hover:text-red-700 flex items-center">
      <i class="ri-refresh-line mr-1"></i>
      Try Again
    </button>
  </div>
</template>

<script>
export default {
  name: 'ErrorState',
  props: {
    errorMessage: {
      type: String,
      required: true,
    },
    onRetry: {
      type: Function,
      required: true,
    },
  },
  methods: {
    retry() {
      if (typeof this.onRetry === 'function') {
        this.onRetry();
      } else {
        console.warn('No retry function provided.');
      }
    },
  },
};
</script>

