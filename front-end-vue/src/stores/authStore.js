import { defineStore } from 'pinia'
import MyHttpService from '@/stores/MyHttpService'
import { ref } from 'vue'
import { computed } from 'vue'
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const username = ref('')
  const role = ref('')

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function setUser(response) {
    token.value = response.token
    username.value = response.username
    role.value = response.role
    localStorage.setItem('token', response.token)
  }

  function clearUser() {
    token.value = null
    username.value = null
    role.value = null
    localStorage.removeItem('token')
  }

  async function login(credentials) {
    try {
      const response = await MyHttpService.post('/auth/login', { body: credentials })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Login failed' }
      }

      setUser(response)

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function signUp(userData) {
    try {
      const response = await MyHttpService.post('/auth/signup', { body: userData })
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Sign Up failed' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error Sigining Up' }
    }
  }

  function logout() {
    clearUser()
  }

  return {
    token,
    isAuthenticated,
    setUser,
    clearUser,
    login,
    signUp,
    logout,
  }
})
