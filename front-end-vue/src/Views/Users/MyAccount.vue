<template>
  <div class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="container mx-auto px-4 py-8 flex flex-col justify-center items-center">
      <h1 class="text-3xl font-bold mb-8 hidden md:block text-left ">My Account</h1>


      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center mt-52">
        <LoadingSpinner />
      </div>

      <!-- Error state -->
      <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getMyAccount" />

      <!-- User Profile Section -->
      <div v-else class="w-full flex flex-col justify-center items-center">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 w-full lg:w-[60%]">
          <div class="flex flex-row items-center justify-between mb-6 ">
            <div class="flex flex-row">
              <img src="https://ui-avatars.com/api/?name=Abel+Derbe&background=random" alt="Profile Avatar"
                class="w-24 h-24 rounded-full mb-4 sm:mb-0 sm:mr-6" />
              <div class="text-center sm:text-left ml-2 ">
                <h2 class="text-2xl font-semibold">{{ userModel?.fullname }}.</h2>
                <p class="text-gray-600 dark:text-gray-400">{{ userModel.username }}</p>
                <p class="text-sm hidden sm:block text-gray-500 dark:text-gray-500">
                  Joined {{ MyUtils.dateFormatter(userModel?.createdAt) }}
                </p>
              </div>
            </div>
            <button @click="logout" class="lg:hidden flex items-center text-red-500 hover:text-red-700">
              <i class="ri-logout-box-line text-xl"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="hidden md:block">
              <h3 class="text-lg font-semibold mb-2">Email</h3>
              <p>{{ userModel.email }}</p>
            </div>
            <div class="p-2">
              <h3 class="text-lg font-semibold mb-2 ">Account Type</h3>
              <p class="capitalize">{{ userModel?.proAccount ? "Premium" : "Free" }}</p>
              <!-- Premium Upgrade Available -->
              <div v-if="userModel?.proAccount == false"
                class="p-2 bg-white dark:bg-gray-800 mt-2 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  Premium Upgrade Available!
                </h2>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  Unlock advanced features and improve your experience.
                </p>
                <BuyPremiumBtn />
              </div>
            </div>
          </div>
        </div>



        <!-- tabbed view area -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8  lg:min-w-[60%] lg:max-w-[60%] w-full">
          <div class="flex justify-around border-b border-gray-200 dark:border-gray-700 mb-6">
            <!-- Tabs -->
            <button :class="[
              activeTab === 'changePassword' ? 'border-sky-500 text-sky-500' : 'border-transparent text-gray-500',
              'flex flex-col items-center pb-2 border-b-2 font-medium text-sm'
            ]" @click="activeTab = 'changePassword'">
              <i class="ri-lock-line text-xl"></i>
            </button>
            <button :class="[
              activeTab === 'paymentHistory' ? 'border-sky-500 text-sky-500' : 'border-transparent text-gray-500',
              'flex flex-col items-center pb-2 border-b-2 font-medium text-sm'
            ]" @click="activeTab = 'paymentHistory'">
              <i class="ri-history-line text-xl"></i>
            </button>
            <button :class="[
              activeTab === 'settings' ? 'border-sky-500 text-sky-500' : 'border-transparent text-gray-500',
              'flex flex-col items-center pb-2 border-b-2 font-medium text-sm'
            ]" @click="activeTab = 'settings'">
              <i class="ri-settings-3-line text-xl"></i>
            </button>
          </div>

          <!-- Tab Content -->
          <div v-if="activeTab === 'changePassword'">
            <!-- Password Change Section -->
            <form @submit.prevent="handlePasswordChange">
              <div class="mb-4">
                <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <div class="relative">
                  <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input type="text" v-model="oldPassword" id="currentPassword"
                    class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required />
                </div>
              </div>
              <div class="mb-4">
                <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div class="relative">
                  <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input type="password" v-model="newPassword" id="newPassword"
                    class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div class="relative">
                  <i class="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input type="password" v-model="confirmNewPassword" id="confirmPassword"
                    class="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required />
                </div>
              </div>
              <button type="submit"
                class="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                <i class="ri-lock-unlock-line mr-2"></i>
                Change Password
              </button>
            </form>
          </div>

          <div v-else-if="activeTab === 'paymentHistory'">
            <!-- Payment History Section -->
            <h3 class="text-xl font-semibold mb-4">Payment History</h3>
            <ul class="space-y-4">
              <ul class="space-y-2">
                <div class="overflow-y-auto max-h-44">

                  <li v-for="payment in userModel.paymentHistory" :key="payment._id"
                    class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                    <div class="flex items-center space-x-3">
                      <span class="text-lg font-semibold text-green-600 dark:text-green-400">
                        ${{ payment.amount.toFixed(2) }}
                      </span>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ MyUtils.formatTimestamp(payment.start_date) }}
                        <b>(1 Month)</b>
                      </span>
                    </div>
                    <span class="text-xs text-gray-400 dark:text-gray-500 truncate  flex items-center space-x-2">


                      <a :href="`https://chapa.co/payment/${payment.tx_ref}`" target="_blank"
                        class="text-blue-500 hover:text-blue-700">
                        <i class="ri-check-line text-green-500 text-xl rounded-full bg-gray-100 font-bold mr-2"></i>
                        <!-- Transaction Reference (tx_ref) -->
                        <span>{{ payment.tx_ref }}</span>
                      </a>

                    </span>
                  </li>
                </div>

              </ul>
            </ul>
          </div>

          <div v-else-if="activeTab === 'settings'">
            <!-- Settings Section -->
            <h3 class="text-xl font-semibold mb-4">Settings</h3>
            <div class=" flex flex-col gap-3">
              <span class="flex gap-5 justify-between w-[220px]">Change Language
                <LanguageSelector />
              </span>
              <span class="flex gap-5 justify-between w-[220px]">Change Theme
                <DarkModeToggle />
              </span>

              <div>
                <!-- Delete Button -->
                <button
                  class="flex items-center bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  @click="confirmDelete">
                  <i class="ri-delete-bin-line mr-2"></i>
                  Delete Account
                </button>

                <!-- Confirmation Popup -->
                <div v-if="showConfirmation"
                  class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <p class="text-lg mb-4">Are you sure you want to delete this Account?</p>
                    <div class="flex justify-end space-x-4">
                      <button
                        class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        @click="cancelDelete">
                        Cancel
                      </button>
                      <button
                        class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        @click="deleteFunction">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Add settings fields or options here -->
          </div>
        </div>
      </div>

      <!-- Spacer to see Nav Bar -->
      <div class="min-h-16"></div>
    </div>
  </div>
</template>

<script setup>
import DarkModeToggle from "@/components/Basics/DarkModeToggle.vue";
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
import LanguageSelector from '@/components/Basics/LanguageSelector.vue';
import ErrorRetryComp from "@/components/Basics/ErrorRetryComp.vue";
import { ref, onMounted } from 'vue';
import { MyUtils } from "@/utils/Utils";
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { MyToast } from '@/utils/toast';
import LoadingSpinner from "@/components/Basics/LoadingSpinner.vue";

const router = useRouter();
const authStore = useAuthStore();
const userModel = ref({})



const activeTab = ref("changePassword");
const oldPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');


const isLoading = ref(false);
const error = ref(null); // Create an error state

const getMyAccount = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await authStore.getMyAccount();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  userModel.value = response.user;
  console.log(userModel.value)
};


onMounted(() => {
  getMyAccount();
});

// Logout function
const logout = () => {
  authStore.logout();
  router.push("/signin");
};

// Handle password change
const handlePasswordChange = async () => {

  if (newPassword.value !== confirmNewPassword.value) {
    MyToast.error("New password and confirm password do not match.");
    return;
  }

  const payload = { oldPassword: oldPassword.value, newPassword: newPassword.value };

  const response = await authStore.changePassword(payload);

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }
  MyToast.success("Password Changed");
  authStore.logout();
  router.push('/signin');

};



const showConfirmation = ref(false);

// Function to show the confirmation popup
const confirmDelete = () => {
  showConfirmation.value = true;
};

// Function to cancel the delete action
const cancelDelete = () => {
  showConfirmation.value = false;
};

// Function to handle the delete action
const deleteFunction = () => {
  const response = authStore.deleteAccount();

  if (response.error) {
    MyToast.error(response.error);
    return;
  }

  MyToast.success("Account Deleted");
  authStore.logout();
  router.push('/signin');

};

</script>
