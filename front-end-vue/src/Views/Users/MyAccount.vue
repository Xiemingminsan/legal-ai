<template>
  <div class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">My Account</h1>


      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center">
        <div class="animate-spin border-t-2 border-blue-600 border-solid rounded-full w-8 h-8"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex items-center bg-red-100 text-red-600 p-4 rounded-md">
        <!-- Error Icon -->
        <i class="ri-error-warning-line text-xl mr-3"></i>

        <!-- Error Message -->
        <div class="flex flex-col">
          <p class="font-semibold">An Error Occurred</p>
          <p>{{ error }}</p>
        </div>

        <!-- Try Again Button -->
        <button @click="getMyAccount" class="ml-auto text-red-600 hover:text-red-700 flex items-center">
          <i class="ri-refresh-line mr-1"></i>
          Try Again
        </button>
      </div>


      <!-- User Profile Section -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-row items-center justify-between mb-6">
          <div class="flex flex-row">
            <img src="https://ui-avatars.com/api/?name=Abel+Derbe&background=random" alt="Profile Avatar"
              class="w-24 h-24 rounded-full mb-4 sm:mb-0 sm:mr-6" />
            <div class="text-center sm:text-left ml-2">
              <h2 class="text-2xl font-semibold">{{ userModel?.fullname }}.</h2>
              <p class="text-gray-600 dark:text-gray-400">{{ userModel.username }}</p>
              <p class="text-sm hidden sm:block text-gray-500 dark:text-gray-500">
                Joined {{ MyUtils.dateFormatter(userModel?.createdAt) }}
              </p>
            </div>
          </div>
          <div class="md:hidden flex flex-col gap-3">
            <LanguageSelector />
            <DarkModeToggle />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="hidden md:block">
            <h3 class="text-lg font-semibold mb-2">Email</h3>
            <p>{{ userModel.email }}</p>
          </div>
          <div class="p-2">
            <h3 class="text-lg font-semibold mb-2">Account Type</h3>
            <p class="capitalize">{{ userModel?.proAccount ? "Premium" : "Free" }}</p>
            <!-- Premium Upgrade Available -->
            <div v-if="userModel?.proAccount == false" class="p-2 bg-white dark:bg-gray-800 mt-2 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                Premium Upgrade Available!
              </h2>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Unlock advanced features and improve your experience.
              </p>
              <BuyPremiumBtn />
            </div>
          </div>
        </div>
      </div>

      <!-- Password Change Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 max-w-md ">
        <h3 class="text-xl font-semibold mb-4">Change Password</h3>
        <form @submit.prevent="handlePasswordChange">
          <div class="mb-4">
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current
              Password</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input type="text" v-model="oldPassword" id="currentPassword"
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required />
            </div>
          </div>
          <div class="mb-4">
            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New
              Password</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input type="password" v-model="newPassword" id="newPassword"
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required />
            </div>
          </div>
          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm
              New Password</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input type="password" v-model="confirmNewPassword" id="confirmPassword"
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required />
            </div>
          </div>
          <button type="submit"
            class="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            <i class="ri-lock-unlock-line mr-2"></i>
            Change Password
          </button>
        </form>
      </div>
      <!-- Spacer to see Nav Bar -->
      <div class="min-h-16"></div>
    </div>
  </div>
</template>

<script setup>
import DarkModeToggle from "@/components/Basics/DarkModeToggle.vue";
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
import LanguageSelector from '@/components/Basics/LanguageSelector.vue';
import { ref, onMounted } from 'vue';
import { MyUtils } from "@/utils/Utils";
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { MyToast } from '@/utils/toast';

const router = useRouter();
const authStore = useAuthStore();
const userModel = ref({})

const oldPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');



const isLoading = ref(false);
const error = ref(null); // Create an error state

const getMyAccount = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await authStore.getMyAccount();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  userModel.value = response.user;
  console.log(userModel.value)
};


onMounted(() => {
  getMyAccount();
});



// Handle password change
const handlePasswordChange = async () => {

  if (newPassword.value !== confirmNewPassword.value) {
    MyToast.error("New password and confirm password do not match.");
    return;
  }

  const payload = { oldPassword: oldPassword.value, newPassword: newPassword.value };

  const response = await authStore.changePassword(payload);

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  MyToast.success("Password Changed");
  authStore.logout();
  router.push('/signin');

};
</script>
