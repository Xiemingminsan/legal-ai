import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";
import MyHttpService from "@/stores/MyHttpService"; // Ensure this points to your MyHttpService configuration

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: localStorage.getItem("accessToken")
      ? jwtDecode(localStorage.getItem("accessToken"))?.user
      : null,
    token: localStorage.getItem("accessToken") || null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => {
      if (state.token) {
        return jwtDecode(state.token)?.user || null;
      }
      return null;
    },
    getError: (state) => state.error,
    userRole: (state) => {
      if (state.token) {
        return jwtDecode(state.token)?.user?.is_admin || null;
      }
      return null;
    },
  },

  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem("accessToken", token);
    },

    clearToken() {
      this.token = null;
      localStorage.removeItem("accessToken");
    },

    isTokenValid() {
      if (!this.token) return false;

      const { exp } = jwtDecode(this.token);
      return exp * 1000 > Date.now();
    },

    async login(credentials) {
      this.isLoading = true;
      this.error = null;

      try {
        // Send login credentials to the backend
        const response = await MyHttpService.post("/login", { body: credentials });

        if (response.error) {
          throw new Error(response.error);
        }
        console.log(response.is_admin+"Is admin")
        // Save the token and decode user information
        const accessToken = response.accessToken;
        this.setToken(accessToken);
        this.user = jwtDecode(accessToken);

        localStorage.setItem("isAdmin", response.is_admin);

        // Store the accessToken and userId in localStorage
        console.log("Access Token:", accessToken);

        localStorage.setItem("jwt", accessToken);

        return true;
      } catch (error) {
        this.error = error.response?.message || "Login failed";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async register(userData) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await MyHttpService.post("/register", { body: userData });
      } catch (error) {
        this.error = error.response?.data?.message || "Registration failed";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async forgotPassword(email) {
      this.isLoading = true;
      this.error = null;
      try {
        // Call the API to send a reset password email
        const response = await MyHttpService.post("/forgot-password", {
          body: { email: email },
        });

        if (response.error) {
          throw new Error(response.error);
        }
        return true; // Return true if reset email was sent successfully
      } catch (error) {
        this.error =
          error.response?.data?.message || "Failed to send reset password email";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async resetPassword(data) {
      this.isLoading = true;
      this.error = null;

      const { password, token } = data; // Destructure from `data` passed as an argument.

      try {
        // Call the API to reset the password
        const response = await MyHttpService.post(`/reset-password/${token}`, {
          body: { password: password },
        });

        if (response.error) {
          throw new Error(response.error);
        }

        console.log("Password reset successful:", response);
        return true; // Return true if the password reset was successful
      } catch (error) {
        console.error("Reset password error:", error);
        this.error = error.response?.data?.message || "Failed to reset password";
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async checkUniqueness(data) {
      try {
        // Determine the endpoint and payload based on the data type
        const endpoint = data.type === "email" ? "/check-email" : "/check-username";
        const payload =
          data.type === "email" ? { email: data.email } : { user_name: data.user_name };

        // Send the request to the server
        const response = await MyHttpService.post(endpoint, { body: payload }); // Ensure payload is passed correctly

        console.log(payload, endpoint);

        // Return the uniqueness status from the response (assumed structure)
        return response; // Expected structure: { isUnique: true/false }
      } catch (error) {
        console.error("Error checking uniqueness:", error);
        return false; // Assume not unique if there's an error
      }
    },

    logout() {
      this.clearToken();
      this.user = null;
      localStorage.setItem("isAdmin", false);
    },
  },
});
