<template>
  <div class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">My Account</h1>

      <!-- User Profile Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-row items-center justify-between mb-6">
          <div class="flex flex-row">
            <img src="https://ui-avatars.com/api/?name=Abel+Derbe&background=random" alt="Profile Avatar"
              class="w-24 h-24 rounded-full mb-4 sm:mb-0 sm:mr-6" />
            <div class="text-center sm:text-left ml-2">
              <h2 class="text-2xl font-semibold">Abel Derbe</h2>
              <p class="text-gray-600 dark:text-gray-400">@abel_ak</p>
              <p class="text-sm hidden sm:block text-gray-500 dark:text-gray-500">
                Joined on 2023-01-15
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
            <p>abel@gmail.com</p>
          </div>
          <div class="p-2">
            <h3 class="text-lg font-semibold mb-2">Account Type</h3>
            <p class="capitalize">free</p>
            <!-- Premium Upgrade Available -->
            <div v-if="accountType === 'free'" class="p-2 bg-white dark:bg-gray-800 mt-2 rounded-lg shadow-md">
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 class="text-xl font-semibold mb-4">Change Password</h3>
        <form @submit.prevent="handlePasswordChange">
          <div class="mb-4">
            <label for="currentPassword" class="block text-sm font-medium mb-1">
              Current Password
            </label>
            <input type="password" id="currentPassword"
              class="w-full lg:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700"
              required />
          </div>
          <div class="mb-4">
            <label for="newPassword" class="block text-sm font-medium mb-1">
              New Password
            </label>
            <input type="password" id="newPassword"
              class="w-full lg:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700"
              required />
          </div>
          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium mb-1">
              Confirm New Password
            </label>
            <input type="password" id="confirmPassword"
              class="w-full lg:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700"
              required />
          </div>
          <button type="submit"
            class="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition duration-300">
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

// import BuyPremiumBtn from ""

// Placeholder data
const user = {
  username: "abel_ak",
  name: "Abel Derbe",
  email: "abel@gmail.com",
  accountType: "free",
  dateJoined: "2023-01-15",
};

const accountType = "free";

// Handle password change (placeholder)
const handlePasswordChange = () => {
  console.log("Password change submitted");
};
</script>
