<template>
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>

      <!-- Search and Filter Section -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div class="max-w-[200px]">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search users..."
                class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
              <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select
              v-model="sortBy"
              class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="recent">Most Recent</option>
              <option value="old">Oldest</option>
            </select>
            <select
              v-model="accountTypeFilter"
              class="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Accounts</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <button
              @click="applyFilters"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <i class="ri-filter-3-line mr-2"></i>
              Filter
            </button>
          </div>
        </div>
      </div>

      <!-- User Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Full Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in filteredUsers" :key="user._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ user.fullname }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': user.proAccount,
                      'bg-gray-100 text-gray-800': !user.proAccount
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ user.proAccount ? 'Premium' : 'Free' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ formatDate(user.createdAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="suspendUser(user._id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:underline"
                  >
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
import { ref, computed } from 'vue';

// Mock user data (replace with actual API call)
const users = ref([
  { _id: '1', username: 'john_doe', fullname: 'John Doe', email: 'john@example.com', proAccount: false, createdAt: '2023-05-01T10:00:00Z' },
  { _id: '2', username: 'jane_smith', fullname: 'Jane Smith', email: 'jane@example.com', proAccount: true, createdAt: '2023-05-02T11:30:00Z' },
  { _id: '3', username: 'bob_johnson', fullname: 'Bob Johnson', email: 'bob@example.com', proAccount: false, createdAt: '2023-05-03T09:15:00Z' },
  { _id: '4', username: 'alice_brown', fullname: 'Alice Brown', email: 'alice@example.com', proAccount: true, createdAt: '2023-05-04T14:45:00Z' },
  { _id: '5', username: 'charlie_wilson', fullname: 'Charlie Wilson', email: 'charlie@example.com', proAccount: false, createdAt: '2023-05-05T16:20:00Z' },
]);

const searchQuery = ref('');
const sortBy = ref('recent');
const accountTypeFilter = ref('all');

const filteredUsers = computed(() => {
  let result = users.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.fullname.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
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

const applyFilters = () => {
  // This function is called when the Filter button is clicked
  // You can add additional logic here if needed
  console.log('Filters applied:', { searchQuery: searchQuery.value, sortBy: sortBy.value, accountTypeFilter: accountTypeFilter.value });
};

const suspendUser = (userId) => {
  // Implement user suspension logic here
  console.log('Suspending user:', userId);
  // You would typically make an API call to suspend the user
  // and then update the local state
};
</script>

<style>
@import 'remixicon/fonts/remixicon.css';
</style>
