<template>
  <button @click="toggleDarkMode" @keydown.space.prevent="toggleDarkMode"
    class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400"
    :class="isDarkMode ? 'bg-gray-700' : 'bg-sky-100'" role="switch" :aria-checked="isDarkMode"
    aria-label="Toggle dark mode">
    <span
      class="inline-block w-4 h-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
      :class="isDarkMode ? 'translate-x-6' : 'translate-x-1'">
      <SunIcon v-if="!isDarkMode" class="h-4 w-4 text-yellow-500" />
      <MoonIcon v-else class="h-4 w-4 text-sky-500" />
    </span>
  </button>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { SunIcon, MoonIcon } from 'lucide-vue-next'

const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  updateTheme()
  saveToCookies()
}

const updateTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Save the theme setting in cookies
const saveToCookies = () => {
  document.cookie = `darkMode=${isDarkMode.value}; path=/; max-age=${60 * 60 * 24 * 365}` // expires in 1 year
}

// Get the stored theme setting from cookies
const getFromCookies = () => {
  const cookies = document.cookie.split('; ')
  const darkModeCookie = cookies.find(row => row.startsWith('darkMode='))
  return darkModeCookie ? darkModeCookie.split('=')[1] === 'true' : null
}

// Initialize theme based on stored value or system preference
onMounted(() => {
  const storedTheme = getFromCookies()
  if (storedTheme !== null) {
    isDarkMode.value = storedTheme
  } else {
    // Fallback to system preference if no stored value
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  updateTheme()
})

// Watch for system preference changes
watch(
  () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  (isDark) => {
    if (getFromCookies() === null) { // Only change if there's no stored value
      isDarkMode.value = isDark
      updateTheme()
    }
  }
)
</script>
