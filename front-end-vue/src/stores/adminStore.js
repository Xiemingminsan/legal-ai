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

  async function getAllBots() {
    try {
      const response = await MyHttpService.get('/admin/getAllBots', { useJWT: true })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Bots' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function getBot(botId) {
    try {
      const response = await MyHttpService.get('/admin/getBot', {
        useJWT: true,
        query: { botId: botId },
      })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Bot Details' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function deleteBot(botId) {
    try {
      const response = await MyHttpService.post('/admin/deleteBot', {
        useJWT: true,
        body: { botId: botId },
      })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Delete Bot' }
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

      return { error: 'Internal Error' }
    }
  }

  async function getDashboardData() {
    try {
      const response = await MyHttpService.get('/admin/getDashboardData', {
        useJWT: true,
      })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Dasboard Data' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  return {
    getServerHealth,
    getDashboardData,
    updateSystemPrompt,
    deleteBot,
    getBot,
    getAllBots,
    getAllUsers,
    suspendUser,
  }
})
