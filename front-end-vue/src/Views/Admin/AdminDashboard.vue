<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center mt-48">
    <LoadingSpinner />
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getDashboardData" />

  <!-- if Page Loadded -->
  <div v-else class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard title="Total Users" :value="headerData.totalUsers" icon="ri-user-line" color="blue" />
      <DashboardCard title="Active Cases" value="NaN Bruh" icon="ri-file-list-3-line" color="green" />
      <DashboardCard title="Total AI Bots" :value="headerData.totalBots" icon="ri-robot-line" color="purple" />
      <DashboardCard title="Files Uploaded" :value="headerData.totalDocuments" icon="ri-file-upload-line"
        color="orange" />
    </div>

    <!-- Files Uploaded Graph -->
    <div class="bg-white max-h-300px overflow-hidden dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Files Uploaded Analystics</h2>
        <select v-model="chartPeriod"
          class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md px-2 py-1">
          <option disabled value="">Pick Days</option>
          <option value="10">Last 10 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="60">Last 60 Days</option>
        </select>
      </div>
      <canvas ref="fileUploadChart"></canvas>
    </div>

    <!-- User Activity and Recent Sign-ups -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Trending Recent Bots -->
      <div class="bg-white dark:bg-gray-800  h-full p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Trending Recent Bots</h2>
        <div class="space-y-4">
          <div v-for="bot in trendingBots" :key="bot._id" class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <img :src="bot._id?.icon || '/bot.png'" class="h-10 w-10 rounded-full">
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ bot._id?.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ bot.usersInteractedCount }} users interacted
              </p>
            </div>
            <div class="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
              with in the last 3 days
            </div>
          </div>
        </div>
      </div>


      <!-- Recent User Sign-ups -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent User Sign-ups</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name</th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email</th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Signed Up</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in recentSignups" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"> <i
                    class="ri-user-fill text-blue-500 text-lg mr-3"></i>{{ user.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"><i
                    class="ri-mail-fill text-green-500 text-lg mr-3"></i>{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"> <i
                    class="ri-calendar-line text-yellow-500 text-lg mr-3"></i>{{ formatDate(user.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import DashboardCard from '@/components/Admin/DashboardCard.vue';
import Chart from 'chart.js/auto';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';


const adminStore = useAdminStore();
let chart;

const isLoading = ref(false);
const error = ref(null);
const headerData = ref({})
const uploadsLast60Days = ref([])
const recentSignups = ref([])
const trendingBots = ref([])

// Files Uploaded Graph
const fileUploadChart = ref(null);
const chartPeriod = ref('');


const getDashboardData = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getDashboardData();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  headerData.value = response.headerData;
  uploadsLast60Days.value = response.uploadsLast60Days;
  recentSignups.value = response.recentSignups;
  trendingBots.value = response.trendingBots;
};


onMounted(() => {
  getDashboardData();
  if (chart) {
    chart.destroy();
  }
  console.log("Mount Changingg")
  createChart();
});





watch(chartPeriod, () => {
  if (chart) {
    chart.destroy();
  }
  console.log("Changingg")
  createChart();
});

const createChart = () => {
  const ctx = fileUploadChart.value.getContext('2d');

  // Filter data based on the selected period
  const filteredData = getFilteredData(chartPeriod.value);

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredData.map(item => item.date),
      datasets: [{
        label: 'Files Uploaded',
        data: filteredData.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Files'
          },
          ticks: {
            stepSize: 1, // Forces integer ticks
            callback: function (value) {
              return value % 1 === 0 ? value : ''; // Ensure integer display
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
};

// Function to filter data based on selected period
const getFilteredData = (period) => {
  const daysMap = {
    '10': 10,
    '30': 30,
    '60': 60
  };
  const days = daysMap[period] || 10; // Default to 10 if no match
  return uploadsLast60Days.value.slice(-days);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

</script>
