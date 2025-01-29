import { defineStore } from 'pinia'
import MyHttpService from '@/stores/MyHttpService'
import { ref } from 'vue'
import { computed } from 'vue'
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(localStorage.getItem('role') || '')
  const proAccount = ref(localStorage.getItem('proAccount') === 'true')

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function setUser(response) {
    token.value = response.token
    username.value = response.username
    role.value = response.role
    proAccount.value = response.proAccount || false

    // Save to localStorage
    localStorage.setItem('token', response.token)
    localStorage.setItem('username', response.username)
    localStorage.setItem('role', response.role)
    localStorage.setItem('proAccount', response.proAccount.toString()) // Store boolean as string
  }

  function clearUser() {
    token.value = null
    username.value = ''
    role.value = ''
    proAccount.value = false

    // Remove from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('proAccount')
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

  async function buyProSubscription(tx_ref, amount) {
    try {
      const response = await MyHttpService.post('/auth/buyProSubscription', {
        useJWT: true,
        body: { tx_ref, amount },
      })
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Buy Pro Subscription' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error Buying Pro Subscription' }
    }
  }

  async function deleteAccount() {
    try {
      const response = await MyHttpService.post(`/auth/deleteAccount`, {
        useJWT: true,
      })
      console.log(response)
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Delete Account' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }
  return {
    token,
    isAuthenticated,
    proAccount,
    role,
    username,
    deleteAccount,
    setUser,
    clearUser,
    login,
    signUp,
    logout,
    getMyAccount,
    changePassword,
    buyProSubscription,
  }
})
