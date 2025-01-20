<template>
  <div
    class="h-[100vh] flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-900 dark:to-gray-700">
    <div class="absolute top-0 w-full">
      <NavBarLandingPage />
    </div>
    <div class="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 max-w-md w-full">
      <div class="flex justify-center mb-8">
        <img src="/logo.png" alt="Legal Bot Ethio AI Logo" class="h-20">
      </div>
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Sign Up</h2>
      <form @submit.prevent="handleSubmit">
        <div v-if="step === 1">
          <div class="mb-4">
            <label for="username"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <div class="relative">
              <i class="ri-user-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input v-model="username" id="username" type="text" required
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Choose a username">
            </div>
          </div>
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <div class="relative">
              <i class="ri-user-smile-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input v-model="name" id="name" type="text" required
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your full name">
            </div>
          </div>
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div class="relative">
              <i class="ri-mail-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input v-model="email" id="email" type="email" required
                class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your email">
            </div>
          </div>
          <div class="mb-4">
            <label for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input v-model="password" id="password" :type="showPassword ? 'text' : 'password'" required
                class="pl-10 pr-10 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Choose a password">
              <button type="button" @click="toggleShowPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-gray-400"></i>
              </button>
            </div>
          </div>
          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm
              Password</label>
            <div class="relative">
              <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                required
                class="pl-10 pr-10 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Confirm your password">
              <button type="button" @click="toggleShowConfirmPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <i :class="showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-gray-400"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="step === 2">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How familiar are you with
              Ethiopian law?</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="radio" v-model="lawFamiliarity" value="Beginner" class="mr-2">
                <span>Beginner</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="lawFamiliarity" value="Intermediate" class="mr-2">
                <span>Intermediate</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="lawFamiliarity" value="Expert" class="mr-2">
                <span>Expert</span>
              </label>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How would you rate your
              general understanding of legal processes?</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="radio" v-model="legalProcessUnderstanding" value="Low" class="mr-2">
                <span>Low</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="legalProcessUnderstanding" value="Moderate" class="mr-2">
                <span>Moderate</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="legalProcessUnderstanding" value="High" class="mr-2">
                <span>High</span>
              </label>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How comfortable are you with
              legal terminology?</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="radio" v-model="legalTerminologyComfort" value="Not Comfortable" class="mr-2">
                <span>Not Comfortable</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="legalTerminologyComfort" value="Somewhat Comfortable" class="mr-2">
                <span>Somewhat Comfortable</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="legalTerminologyComfort" value="Very Comfortable" class="mr-2">
                <span>Very Comfortable</span>
              </label>
            </div>
          </div>
        </div>
        <button v-if="step === 1" @click="nextStep" type="button"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out">
          <i class="ri-arrow-right-line mr-2"></i>
          Next
        </button>
        <button v-else-if="step === 2" type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out">
          <i class="ri-user-add-line mr-2"></i>
          Sign Up
        </button>
        <div class="mt-5 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already Have an Account?
            <router-link to="/signIn"
              class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Sign In
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NavBarLandingPage from '@/components/LandingPage/NavBarLandingPage.vue';

const step = ref(1);
const username = ref('');
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const lawFamiliarity = ref('');
const legalProcessUnderstanding = ref('');
const legalTerminologyComfort = ref('');

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value;
};

const toggleShowConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

const nextStep = () => {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match');
    return;
  }
  step.value = 2;
};

const handleSubmit = () => {
  // Handle form submission
  console.log('Sign up submitted', {
    username: username.value,
    name: name.value,
    email: email.value,
    password: password.value,
    lawFamiliarity: lawFamiliarity.value,
    legalProcessUnderstanding: legalProcessUnderstanding.value,
    legalTerminologyComfort: legalTerminologyComfort.value
  });
};
</script>
