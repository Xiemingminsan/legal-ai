<template>
  <div class="flex">
    <UserNavBar /> <!-- Include NavBar  -->
    <main class="flex-1 overflow-hidden lg:ml-64 min-h-screen bg-gradient-to-br from-[#ffffff] to-[#f3eeee] dark:from-gray-800 dark:to-gray-900">
      <router-view></router-view> 
    </main>
  </div>
</template>

<script>
import UserNavBar from '@/components/User/UserNavBar.vue';

export default {
  name: 'UserBaseLayout',
  components: {
    UserNavBar, // Register NavBar to be used inside this layout
  },
};


</script>

<style scoped>
/* Add any custom styles here */
</style>
