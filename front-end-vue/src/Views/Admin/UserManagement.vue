<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>

    <!-- Search and Filter Section -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        <div class="max-w-[200px]">
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="Search users..."
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <select v-model="sortBy"
            class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="recent">Most Recent</option>
            <option value="old">Oldest</option>
          </select>
          <select v-model="accountTypeFilter"
            class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="all">All Accounts</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center h-[400px]">
      <LoadingSpinner />
    </div>

    <!-- Error state -->
    <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getServerHealth" />

    <!-- if Page Loadded -->
    <!-- User Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Username</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Full Name</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Account Type</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created At</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in filteredUsers" :key="user._id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{
                user.username }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ user.fullname }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <span :class="{
                  'bg-green-100 text-green-800': user.proAccount,
                  'bg-gray-100 text-gray-800': !user.proAccount
                }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ user.proAccount ? 'Premium' : 'Free' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{
                formatDate(user.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="suspendUser(user._id)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:underline">
                  <i class="ri-user-unfollow-line mr-1"></i>
                  Suspend
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';

const adminStore = useAdminStore();

const isLoading = ref(false);
const error = ref(null);

const users = ref([])

const getAllUsers = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getAllUsers();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  users.value = response;

  console.log(users.value)
};

onMounted(() => {
  getAllUsers();
});



const searchQuery = ref('');
const sortBy = ref('recent');
const accountTypeFilter = ref('all');

const filteredUsers = computed(() => {
  let result = users.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      (user.username && user.username.toLowerCase().includes(query)) ||
      (user.fullname && user.fullname.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  }


  // Apply account type filter
  if (accountTypeFilter.value !== 'all') {
    result = result.filter(user =>
      (accountTypeFilter.value === 'premium' && user.proAccount) ||
      (accountTypeFilter.value === 'free' && !user.proAccount)
    );
  }

  // Apply sorting
  result.sort((a, b) => {
    if (sortBy.value === 'recent') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  return result;
});

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};





const suspendUser = async (userId) => {
  console.log(userId)
  const response = await adminStore.suspendUser(userId);

  if (response.error) {
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  users.value = users.value.filter(user => user._id !== userId);
  MyToast.success(response.msg);
};

</script>
