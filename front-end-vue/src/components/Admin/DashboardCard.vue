<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i :class="[icon, iconColorClass]" class="text-3xl"></i>
      </div>
      <div class="ml-5 w-0 flex-1">
        <dl>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {{ title }}
          </dt>
          <dd>
            <div class="text-lg font-medium text-gray-900 dark:text-white">
              {{ formattedValue }}
            </div>
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  }
});

const iconColorClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  };
  return colorMap[props.color] || colorMap.blue;
});

const formattedValue = computed(() => {
  return new Intl.NumberFormat().format(props.value);
});
</script>