import { defineStore } from 'pinia'
import MyHttpService from '@/stores/MyHttpService'
import { ref } from 'vue'
import { computed } from 'vue'
export const useUserStore = defineStore('userStore', () => {
  // State

  async function getAllValidDocuments() {
    try {
      const response = await MyHttpService.get('/documents', { useJWT: true })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Documents' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function createBot(formData) {
    try {
      const response = await MyHttpService.post('/bots/add', { useJWT: true, body: formData })

      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Create Bot' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  return {
    getAllValidDocuments,
    createBot,
  }
})
