import { defineStore } from 'pinia'
import MyHttpService from '@/stores/MyHttpService'
import { ref } from 'vue'
import { computed } from 'vue'
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const username = ref('')
  const role = ref('')
  const proAccount = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function setUser(response) {
    token.value = response.token
    username.value = response.username
    role.value = response.role
    proAccount.value = response.proAccount || false
    localStorage.setItem('token', response.token)
  }

  function clearUser() {
    token.value = null
    username.value = null
    role.value = null
    proAccount.value = false
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

  async function getMyAccount() {
    try {
      console.log(token.value)
      const response = await MyHttpService.get('/auth/getMyAccount', { useJWT: true })
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Error Fetching Account' }
      }

      return response
    } catch (err) {
      console.error(err)
      return { error: 'Internal Error Fetching Account' }
    }
  }

  async function changePassword(payload) {
    try {
      const response = await MyHttpService.post('/auth/changePassword', {
        body: payload,
        useJWT: true,
      })
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Changing Password Failed' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error Changing Password' }
    }
  }

  return {
    token,
    isAuthenticated,
    proAccount,
    setUser,
    clearUser,
    login,
    signUp,
    logout,
    getMyAccount,
    changePassword,
  }
})
