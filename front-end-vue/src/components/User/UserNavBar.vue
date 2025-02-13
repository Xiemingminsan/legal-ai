<template>
  <div>
    <!-- Sidebar for desktop -->
    <div
      class="hidden lg:flex lg:w-64 lg:h-screen lg:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed top-0 left-0 transition-colors duration-100">
      <!-- Logo section -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-col items-center justify-between h-full p-1">
          <div class="border rounded-xl overflow-hidden">
            <img src="@/assets/logo.png" alt="Logo" class="w-[120px]" />
          </div>
        </div>
      </div>

      <!-- Navigation links -->
      <nav class="flex-1 p-4">
        <ul class="flex flex-col space-y-2">
          <ul class="flex flex-col space-y-2">
            <li v-for="item in [
              { name: t('explore'), path: '/explore', icon: 'ri-compass-line' },
              { name: t('contracts'), path: '/contracts', icon: 'ri-file-list-line' },
              { name: t('createBot'), path: '/createBot', icon: 'ri-add-box-line' },
              { name: t('chats'), path: '/chats', icon: 'ri-message-2-line' },
              { name: t('account'), path: '/myaccount', icon: 'ri-user-line' }
            ]" :key="item.path">
              <router-link :to="item.path"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                :class="{ 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400': isActive(item.path) }">
                <i :class="[
                  item.icon,
                  'text-2xl',
                  isActive(item.path) ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400'
                ]"></i>
                <span class="text-lg font-semibold">{{ item.name }}</span>
              </router-link>
            </li>

          </ul>
        </ul>
      </nav>

      <!-- Dark Mode Toggle and Change Language -->
      <div class="flex items-center space-x-4 m-3">
        <LanguageSelector />
        <DarkModeToggle />
      </div>

      <!-- Logout button -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="logout"
          class="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
          <i class="ri-logout-box-line text-2xl text-gray-500 dark:text-gray-400"></i>
          <span class="text-lg font-semibold">{{ t('Logout') }}</span>
        </button>
      </div>
    </div>

    <!-- Floating bottom navbar for mobile -->
    <div v-if="showNavBarFlag" class="lg:hidden sm:block fixed bottom-4 left-4 right-4 z-50">
      <nav
        class="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <ul class="flex justify-around items-center">
          <li v-for="item in [
            { name: t('Explore'), path: '/explore', icon: 'ri-compass-line' },
            { name: t('contracts'), path: '/contracts', icon: 'ri-file-list-line' },
            { name: t('createBot'), path: '/createBot', icon: 'ri-add-box-line' },
            { name: t('chats'), path: '/chats', icon: 'ri-message-2-line' },
            { name: t('Account'), path: '/myaccount', icon: 'ri-user-line' }
          ]" :key="item.path">
            <router-link :to="item.path"
              class="flex flex-col items-center p-3 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              :class="{ 'text-sky-600 dark:text-sky-400': isActive(item.path) }">
              <i :class="[
                item.icon,
                'text-2xl font-light mb-1',
                isActive(item.path) ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400'
              ]"></i>

            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
// import { computed } from 'vue';
import DarkModeToggle from '@/components/Basics/DarkModeToggle.vue';
import LanguageSelector from '@/components/Basics/LanguageSelector.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { computed } from 'vue';

const authStore = useAuthStore();

const router = useRouter();

import { navBarState } from '@/utils/Utils';
const showNavBarFlag = computed(() => navBarState.showNavbar);


const { t } = useLanguageStore(); // Translation function

// Vue Router hook
const route = useRoute();

// Check if route is active
const isActive = (path) => {
  return route.path === path;
};

// Logout function
const logout = () => {
  authStore.logout();
  router.push("/signin");
};
</script>
