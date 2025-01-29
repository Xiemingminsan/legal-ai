<template>
  <div class="relative mt-4">
    <!-- Upgrade Button -->
    <button v-if="authStore.proAccount == false"
      class="flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
      @click="showModal = true">
      <i class="ri-flashlight-line mr-2 animate-pulse"></i>
      Upgrade to Premium
    </button>
    <div v-else class="inline-block ml-2 w-min bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
      Premium
    </div>
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


        <form method="POST" action="https://api.chapa.co/v1/hosted/pay">
          <input type="hidden" name="public_key" v-model="CHAPPA_API_KEY" />
          <input type="hidden" name="amount" v-model="PAYMENT_AMOUNT" />
          <input type="hidden" name="currency" value="ETB" />
          <input type="hidden" name="tx_ref" :value="txRef" />
          <input type="hidden" name="first_name" value="Israel" />
          <input type="hidden" name="last_name" value="Goytom" />
          <input type="hidden" name="title" value="Let us do this" />
          <input type="hidden" name="description" value="Paying with Confidence with cha" />
          <input type="hidden" name="logo" value="/logo.png" />
          <input type="hidden" name="return_url" :value="MyHttpService.FRONT_END_URL + 'myaccount?txRef=' + txRef" />
          <input type="hidden" name="meta[title]" value="test" />
          <!-- Proceed Button -->
          <button
            class="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
            type="submit">
            Proceed
          </button>
        </form>
        <!-- Close Button -->
        <button class="mt-4 w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          @click="showModal = false">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, computed, onMounted } from "vue";
import { useAuthStore } from '@/stores/authStore';
import { PAYMENT_AMOUNT, CHAPPA_API_KEY } from '@/utils/Utils';
import MyHttpService from "@/stores/MyHttpService";
const authStore = useAuthStore();
import { v4 as uuidv4 } from "uuid";
const txRef = ref("");
import { useRoute } from 'vue-router';
import { MyToast } from "@/utils/toast";


const route = useRoute();

onMounted(async () => {
  txRef.value = `TX-${uuidv4()}`; // Generates a unique transaction reference

  console.log(txRef.value);

  // Check if the URL contains a query parameter for verifying payment
  const txRefToVerify = route.query.txRef;


  if (txRefToVerify) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove the query parameter from the URL
    const { href, origin, pathname } = window.location;
    const newUrl = `${origin}${pathname}`;
    window.history.replaceState({}, document.title, newUrl);


    const response = await authStore.buyProSubscription(txRefToVerify, PAYMENT_AMOUNT);

    if (response.error) {
      MyToast.error(response.error);
      return;
    }
    authStore.proAccount = true;
    //update authStore is account Pro here;
    MyToast.success("Pro Account Bought Successfully");
  }
});


const props = defineProps({
  showButtonOrLabel: {
    type: Boolean,
    default: true
  },
  showModal: {
    type: Boolean,
    default: false
  }
});

// State
const showModal = ref(props.showModal);



// Premium Features List
const premiumFeatures = [
  "Unlimited legal document generation",
  "Priority customer support",
  "Access to premium legal templates",
  "Advanced AI-powered legal analysis",
  "Customizable legal document storage",
];


</script>
