<template>
  <div class="relative mt-4">
    <!-- Upgrade Button -->
    <button
      class="flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
      @click="showModal = true">
      <i class="ri-flashlight-line mr-2 animate-pulse"></i>
      Upgrade to Premium
    </button>

    <!-- Centered Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 p-6">
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
        <ul class="list-disc list-inside space-y-1 mb-6">
          <li v-for="(feature, index) in premiumFeatures" :key="index" class="text-sm text-gray-600 dark:text-gray-300">
            {{ feature }}
          </li>
        </ul>

        <!-- Proceed Button -->
        <button
          class="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
          @click="proceedToPayment">
          Proceed
        </button>

        <!-- Close Button -->
        <button
          class="mt-4 w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          @click="showModal = false">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// State
const showModal = ref(false);

// Premium Features List
const premiumFeatures = [
  "Unlimited legal document generation",
  "Priority customer support",
  "Access to premium legal templates",
  "Advanced AI-powered legal analysis",
  "Customizable legal document storage",
];

// Proceed to Payment Function
const proceedToPayment = () => {
  // Add your payment processing logic here
  alert("Redirecting to payment gateway...");
  showModal.value = false; // Close the modal after proceeding
};
</script>

<style scoped>
/* Add FontAwesome or other icon library setup here */
</style>
