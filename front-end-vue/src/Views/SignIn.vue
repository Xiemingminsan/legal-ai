<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-900 dark:to-gray-700">
    <div class="absolute top-0 w-full">
      <NavBarLandingPage :hideNavLinks="true" />
    </div>

    <div class="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 max-w-md w-full">
      <div class="flex justify-center mb-8">
        <img src="/logo.png" alt="Legal Bot Ethio AI Logo" class="h-20">
      </div>
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Sign In</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="usernameOrEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username
            or Email</label>
          <div class="relative">
            <i class="ri-user-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input v-model="usernameOrEmail" id="usernameOrEmail" type="text" required
              class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your username or email">
          </div>
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div class="relative">
            <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input v-model="password" id="password" :type="showPassword ? 'text' : 'password'" required
              class="pl-10 pr-10 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your password">
            <button type="button" @click="toggleShowPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-gray-400"></i>
            </button>
          </div>
        </div>
        <button v-if="!isLoading" type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out">
          <i class="ri-login-box-line mr-2"></i>
          Sign In
        </button>
        <div v-else class="flex justify-center">
          <div class="h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </form>
      <div class="mt-5 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an Account?
          <router-link to="/signup"
            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Sign Up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NavBarLandingPage from '@/components/LandingPage/NavBarLandingPage.vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { MyToast } from '@/utils/toast';

const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(false);
const showPassword = ref(false);



const usernameOrEmail = ref('');
const password = ref('');

// Function to handle login
const handleLogin = async () => {
  isLoading.value = true;

  const credentials = { usernameOrEmail: usernameOrEmail.value, password: password.value };

  const response = await authStore.login(credentials);
  isLoading.value = false;
  if (response.error) {
    MyToast.error(response.error);
    return;
  }

  router.push('/explore'); // Redirect to the homepage on success
  MyToast.success("Logged In Successfully");
};




const toggleShowPassword = () => {
  showPassword.value = !showPassword.value;
};

</script>

<style></style>
