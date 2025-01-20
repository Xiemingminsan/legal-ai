<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 landingpage">
    <NavBarLandingPage />
    <LandingPageMainContent />
    <LandingaPageFooter />
  </div>
</template>

<script setup>
import NavBarLandingPage from '@/components/LandingPage/NavBarLandingPage.vue';
import LandingPageMainContent from '@/components/LandingPage/LandingPageMainContent.vue'
import LandingaPageFooter from '@/components/LandingPage/LandingaPageFooter.vue'
</script>

<style scoped>
.landingpage {
  scroll-behavior: smooth;
}
</style>
