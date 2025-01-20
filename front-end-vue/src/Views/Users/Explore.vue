<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8 text-right pr-5 sm:pr-20">Explore Bots
      <i class="ri-robot-line animate-pulse "></i>
    </h1>
    <section class="mb-12">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Primary Bots</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExploreBotCard v-for="bot in primaryBots" :key="bot.id" :bot="bot" />
      </div>
    </section>

    <section>
      <h2 class="inline text-2xl font-semibold text-gray-800 dark:text-gray-200">Custom Bots</h2>
      <div class="inline-block ml-2 w-min bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
        Premium
      </div>
      <div class="mb-4"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        <ExploreBotCard v-for="bot in userGeneratedBots" :key="bot.id" :bot="bot" :is-premium="true" />
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import ExploreBotCard from '@/components/User/ExploreBotCard.vue';

const primaryBots = ref([
  {
    id: 'family-law',
    name: 'Family Law Expert',
    image: 'https://via.assets.so/game.png?id=12&q=98&w=360&h=380',
    description: 'Specialized in divorce, child custody, and family-related legal matters.'
  },
  {
    id: 'business-law',
    name: 'Business Law Advisor',
    image: 'https://via.assets.so/game.png?id=13&q=98&w=360&h=380',
    description: 'Expert in corporate law, contracts, and business regulations.'
  },
  {
    id: 'criminal-law',
    name: 'Criminal Law Consultant',
    image: 'https://via.assets.so/game.png?id=14&q=98&w=360&h=380',
    description: 'Focused on criminal defense strategies and legal rights in criminal cases.'
  }
]);

const userGeneratedBots = ref([
  {
    id: 'property-law',
    name: 'Property Law Helper',
    image: 'https://via.assets.so/game.png?id=15&q=98&w=360&h=380',
    description: 'Assists with real estate transactions and property disputes.'
  },
  {
    id: 'employment-law',
    name: 'Employment Rights Bot',
    image: 'https://via.assets.so/game.png?id=16&q=98&w=360&h=380',
    description: 'Guides on workplace rights, contracts, and employment issues.'
  },
  {
    id: 'immigration-law',
    name: 'Immigration Law Guide',
    image: 'https://via.assets.so/game.png?id=17&q=98&w=360&h=380',
    description: 'Helps navigate immigration processes and regulations.'
  },
  {
    id: 'intellectual-property',
    name: 'IP Law Assistant',
    image: 'https://via.assets.so/game.png?id=18&q=98&w=360&h=380',
    description: 'Specializes in patents, trademarks, and copyright issues.'
  }
]);
</script>


<style scoped>
/* Add your styles here */
</style>
