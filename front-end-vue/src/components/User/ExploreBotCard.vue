<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.01] relative border-2"
    @click="handleBotSelect">
    <div v-if="isPremium" class="absolute top-2 right-2 px-2 py-1 rounded-full z-10">
      <BuyPremiumBtn />
    </div>
    <div class="aspect-square">
      <img :src="'/' + bot.icon" :alt="bot.name" class="w-full h-full object-cover" />
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ bot.description }}</p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';

export default defineComponent({
  name: 'BotCard',
  components: {
    BuyPremiumBtn
  },
  props: {
    bot: {
      type: Object,
      required: true
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const router = useRouter();

    const handleBotSelect = () => {
      router.push(`/chat/${props.bot.id}`);
    };

    return {
      handleBotSelect
    };
  }
});
</script>

