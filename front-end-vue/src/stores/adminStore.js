import { defineStore } from 'pinia'
import MyHttpService from '@/stores/MyHttpService'
import { ref } from 'vue'
import { computed } from 'vue'
export const useAdminStore = defineStore('adminStore', () => {
  // State
  async function getServerHealth() {
    try {
      const response = await MyHttpService.get('/admin/getServerHealth', { useJWT: true })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Server Health Report' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function getAllUsers() {
    try {
      const response = await MyHttpService.get('/admin/getAllUsers', { useJWT: true })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Users' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function updateSystemPrompt(prompt) {
    try {
      const response = await MyHttpService.post('/admin/updateSystemPrompt', {
        useJWT: true,
        body: { prompt: prompt },
      })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Set System Prompt' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function suspendUser(userId) {
    try {
      const response = await MyHttpService.post('/admin/suspendUser', {
        useJWT: true,
        body: { userId: userId },
      })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Suspend User' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      //@todo update that user account status or remove from table
      return { error: 'Internal Error' }
    }
  }

  return {
    getServerHealth,
    updateSystemPrompt,
    getAllUsers,
    suspendUser,
  }
})
