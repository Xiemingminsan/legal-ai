// src/utils.js

export const MyUtils = {
  // Date formatter function
  dateFormatter(date) {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((now - targetDate) / 1000)

    const minutes = 60
    const hours = 60 * minutes
    const days = 24 * hours

    if (diffInSeconds < minutes) {
      return `${diffInSeconds} seconds ago`
    } else if (diffInSeconds < hours) {
      const diffMinutes = Math.floor(diffInSeconds / minutes)
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < days) {
      const diffHours = Math.floor(diffInSeconds / hours)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffDays = Math.floor(diffInSeconds / days)
      if (diffDays <= 30) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      }
      const months = 30 * days
      const diffMonths = Math.floor(diffInSeconds / months)
      if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
      }
      const years = 12 * months
      const diffYears = Math.floor(diffInSeconds / years)
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
    }
  },

  formatTimestamp(timestamp) {
    const now = new Date() // Current date and time
    const messageDate = new Date(timestamp) // Convert message timestamp to Date object

    const timeDiff = now - messageDate // Difference in milliseconds
    const oneDay = 24 * 60 * 60 * 1000 // Milliseconds in one day
    const oneMonth = 30 * oneDay // Approximate milliseconds in one month
    const oneYear = 365 * oneDay // Approximate milliseconds in one year

    // Format based on conditions
    if (timeDiff < oneDay) {
      // If today, show only time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (timeDiff < oneMonth) {
      // If within the same month, show day and month
      return messageDate.toLocaleDateString([], { day: '2-digit', month: 'short' })
    } else if (timeDiff < oneYear) {
      // If within the same year, show month and year
      return messageDate.toLocaleDateString([], { month: 'short', year: '2-digit' })
    } else {
      // If more than a year has passed, show only year
      return messageDate.toLocaleDateString([], { year: '2-digit' })
    }
  },
}
