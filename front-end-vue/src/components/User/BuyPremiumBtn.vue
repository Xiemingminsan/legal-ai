<template>
  <div class="relative mt-4">
    <!-- Upgrade Button -->
    <button
      class="flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
      @mouseenter="showPremiumFeatures = true" @mouseleave="showPremiumFeatures = false" @click="togglePremiumFeatures">
      <i class="ri-flashlight-line mr-2 animate-pulse"></i>
      Upgrade to Premium
    </button>

    <!-- Premium Features Dropdown -->
    <div v-if="showPremiumFeatures" class="absolute z-10 mt-3 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <!-- Pricing Section -->
      <div class="flex items-center mb-4">
        <i class="hi-outline-currency-dollar text-yellow-500 text-2xl mr-2"></i>
        <div>
          <p class="text-lg font-bold text-gray-800 dark:text-white">
            999 Birr / Month
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Get access to all premium features.
          </p>
        </div>
      </div>

      <!-- Features Section -->
      <h4 class="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">
        Premium Features:
      </h4>
      <ul class="list-disc list-inside space-y-1">
        <li v-for="(feature, index) in premiumFeatures" :key="index" class="text-sm text-gray-600 dark:text-gray-300">
          {{ feature }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// State
const showPremiumFeatures = ref(false);

// Premium Features List
const premiumFeatures = [
  "Unlimited legal document generation",
  "Priority customer support",
  "Access to premium legal templates",
  "Advanced AI-powered legal analysis",
  "Customizable legal document storage",
];

// Toggle Function
const togglePremiumFeatures = () => {
  showPremiumFeatures.value = !showPremiumFeatures.value;
};
</script>


<style scoped>
/* Add FontAwesome or other icon library setup here */
</style>
