import { useAuthStore } from "@/stores/authStore";

export default class MyHttpService {
  static API_BASE_URL = "http://localhost:5000/api"; // Replace with your backend URL

  static loadImage(imageUrl) {
    return `http://localhost:3000/Uploads/${imageUrl}`;
  }

  static delay(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static prepareQuery(params = {}) {
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : "";
  }

  static async request(
    method,
    endpoint,
    { query = {}, body = null, useJWT = false, delay = 0 } = {}
  ) {
    // Delay the request if specified
    await this.delay(delay);

    // Prepare query parameters
    const queryString = this.prepareQuery(query);

    // Set headers
    const headers = {};

    // If the body is FormData, don't manually set Content-Type
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Attach JWT if needed
    if (useJWT) {
      const jwt = localStorage.getItem("jwt");
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }
    }

    try {
      // Make the fetch request
      const response = await fetch(`${this.API_BASE_URL}${endpoint}${queryString}`, {
        method: method,
        headers: headers,
        body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : null, // Ensure body is FormData or JSON
      });

      // Handle different response statuses
      if (response.status === 410) {
        const authStore = useAuthStore();
        authStore.logout(); // Automatically log out the user
        return { error: "Session expired. Please log in again." };
      }

      if (response.status === 400) {
        const data = await response.json();
        return { error: data.message || "Bad Request" };
      }

      if (response.status === 500) {
        return { error: "Server Internal Error" };
      }

      // Parse and return JSON for successful responses
      if (response.ok) {
        return response.json();
      }

      return { error: `Unexpected Error: ${response.status}` };
    } catch (error) {
      // Handle network errors or other issues
      console.log(error.message);
      return { error: "Unknown Error Occurred" };
    }
  }

  // Convenience method for GET requests
  static get(endpoint, { query = {}, useJWT = false, delay = 0 } = {}) {
    return this.request("GET", endpoint, { query, useJWT, delay });
  }

  // Convenience method for POST requests
  static post(endpoint, { body = {}, query = {}, useJWT = false, delay = 0 } = {}) {
    return this.request("POST", endpoint, { body, query, useJWT, delay });
  }

  // Convenience method for PUT requests
  static patch(endpoint, { body = {}, useJWT = false, delay = 0 } = {}) {
    return this.request("PATCH", endpoint, { body, useJWT, delay });
  }

  // Convenience method for DELETE requests
  static delete(endpoint, { useJWT = false, delay = 0 } = {}) {
    return this.request("DELETE", endpoint, { useJWT, delay });
  }
}
