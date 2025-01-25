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
      console.log(formData);
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

  async function getExploreBots() {
    try {
      const response = await MyHttpService.get('/bots/', { useJWT: true })

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

  async function getRecentChats() {
    try {
      const response = await MyHttpService.get('/chat/conversations', { useJWT: true })
      console.log(response)
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Recent Chats' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function getConversation(chatId) {
    try {
      const response = await MyHttpService.get(`/chat/conversation/${chatId}`, { useJWT: true })
      console.log(response)
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Conversation' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function askAi(formBody) {
    try {
      const response = await MyHttpService.post(`/chat/ask-ai`, { useJWT: true, body: formBody })
      console.log(response)
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Get Conversation' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  async function createNewChat(botId) {
    try {
      const response = await MyHttpService.post(`/chat/new`, {
        useJWT: true,
        body: { botId: botId },
      })
      console.log(response)
      // If response contains error, return that immediately
      if (response.error) {
        return { error: response.error || 'Unable To Create Chat' }
      }

      return response
    } catch (err) {
      console.error(err) // Log the error in the console

      return { error: 'Internal Error' }
    }
  }

  return {
    getAllValidDocuments,
    getRecentChats,
    getExploreBots,
    getConversation,
    createNewChat,
    askAi,
    createBot,
  }
})
