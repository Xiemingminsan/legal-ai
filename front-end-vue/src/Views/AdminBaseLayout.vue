<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside class="w-16 sm:w-24 md:w-32 lg:w-64 bg-white dark:bg-gray-800 shadow-md">
      <div class="flex flex-col h-full  ">
        <!-- Logo and Admin Icon -->
        <div class="p-4 relative flex m-auto ">
          <img src="/logo.png" alt="Legal Bot Ethio AI Logo" class="w-24 h-auto hidden md:block">
          <div class="absolute bottom-3 right-0 bg-blue-500 rounded-full p-2 m-2">
            <i class="ri-admin-line text-white text-xl"></i>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-grow px-4 pb-4 mt-5">
          <ul class="space-y-2">
            <li v-for="item in menuItems" :key="item.name">
              <router-link :to="item.href"
                class="flex items-center p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                :class="{
                  'bg-sky-500 text-white': isActive(item.href),
                  'hover:bg-gray-300 dark:hover:bg-gray-600': !isActive(item.href)
                }">
                <i :class="item.icon" class="mr-3 text-lg"></i>
                <span class="hidden lg:inline">{{ item.name }}</span>
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Dark Mode Toggle -->
        <DarkModeToggle class="m-4" />
        <!-- Logout Button -->
        <div class="p-4 border-t border-gray-500">
          <button @click="logout"
            class="flex items-center justify-center w-full p-2 text-white bg-sky-500 rounded-lg hover:bg-sky-400 transition-colors duration-200">
            <i class="ri-logout-box-line mr-2"></i>
            <span class="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-grow p-8 overflow-auto">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DarkModeToggle from '@/components/Basics/DarkModeToggle.vue';
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const router = useRouter();

const menuItems = ref([
  { name: 'Dashboard', icon: 'ri-dashboard-line', href: '/admin/dashboard' },
  { name: 'Users', icon: 'ri-user-line', href: '/admin/users' },
  { name: 'Bots', icon: 'ri-file-list-3-line', href: '/admin/bots' },
  { name: 'Create Bot', icon: 'ri-bar-chart-box-line', href: '/admin/createBot' },
  { name: 'Settings', icon: 'ri-settings-line', href: '/admin/settings' },
]);

const logout = () => {
  authStore.logout();
  router.push("/signin");
};
const isActive = (href) => {
  return window.location.pathname === href; // Checks if the current route matches the href
};
</script>
