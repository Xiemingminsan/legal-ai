// src/utils.js

export const MyUtils = {
  // Date formatter function
  dateFormatter(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    const minutes = 60;
    const hours = 60 * minutes;
    const days = 24 * hours;

    if (diffInSeconds < minutes) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < hours) {
      const diffMinutes = Math.floor(diffInSeconds / minutes);
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < days) {
      const diffHours = Math.floor(diffInSeconds / hours);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffInSeconds / days);
      if (diffDays <= 30) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }
      const months = 30 * days;
      const diffMonths = Math.floor(diffInSeconds / months);
      if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      }
      const years = 12 * months;
      const diffYears = Math.floor(diffInSeconds / years);
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    }
  }
};
