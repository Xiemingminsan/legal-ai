<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard title="Total Users" :value="totalUsers" icon="ri-user-line" color="blue" />
      <DashboardCard title="Active Cases" :value="activeCases" icon="ri-file-list-3-line" color="green" />
      <DashboardCard title="Total AI Bots" :value="aiConsultations" icon="ri-robot-line" color="purple" />
      <DashboardCard title="Files Uploaded" :value="totalFilesUploaded" icon="ri-file-upload-line" color="orange" />
    </div>

    <!-- Files Uploaded Graph -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Files Uploaded (Last 10 Days)</h2>
        <select v-model="chartPeriod"
          class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md px-2 py-1">
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Trending Recent Bots</h2>
        <div class="space-y-4">
          <div v-for="bot in trendingBots" :key="bot.id" class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <img :src="bot.avatar || '/bot.png'" alt="/bot.png" class="h-10 w-10 rounded-full">
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ bot.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ bot.usersInteracted }} users interacted
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
              <tr v-for="user in recentUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"> <i
                    class="ri-user-fill text-blue-500 text-lg mr-3"></i>{{ user.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"><i
                    class="ri-mail-fill text-green-500 text-lg mr-3"></i>{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"> <i
                    class="ri-calendar-line text-yellow-500 text-lg mr-3"></i>{{ formatDate(user.signUpDate) }}</td>
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

// Summary metrics
const totalUsers = ref(1234);
const activeCases = ref(56);
const aiConsultations = ref(789);
const totalFilesUploaded = ref(3456);

// Files Uploaded Graph
const fileUploadChart = ref(null);
const chartPeriod = ref('10');
const fileUploadData = ref([
  { date: '2023-05-01', count: 15 },
  { date: '2023-05-02', count: 20 },
  { date: '2023-05-03', count: 18 },
  { date: '2023-05-04', count: 25 },
  { date: '2023-05-05', count: 22 },
  { date: '2023-05-06', count: 30 },
  { date: '2023-05-07', count: 28 },
  { date: '2023-05-08', count: 35 },
  { date: '2023-05-09', count: 32 },
  { date: '2023-05-10', count: 40 },
]);

// User Activity
const trendingBots = ref([
  {
    id: 1,
    name: "Legal Advisor Bot",
    avatar: "",
    usersInteracted: 543,
  },
  {
    id: 2,
    name: "Tax Helper Bot",
    avatar: "",
    usersInteracted: 321,
  },
  // Add more bots here
]);




// Recent User Sign-ups
const recentUsers = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', signUpDate: '2023-05-10T14:30:00Z' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', signUpDate: '2023-05-09T09:15:00Z' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', signUpDate: '2023-05-08T16:45:00Z' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', signUpDate: '2023-05-07T11:20:00Z' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', signUpDate: '2023-05-06T13:10:00Z' },
]);

let chart;

onMounted(() => {
  createChart();
});

watch(chartPeriod, () => {
  if (chart) {
    chart.destroy();
  }
  createChart();
});

const createChart = () => {
  const ctx = fileUploadChart.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fileUploadData.value.map(item => item.date),
      datasets: [{
        label: 'Files Uploaded',
        data: fileUploadData.value.map(item => item.count),
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

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};


const viewUserDetails = (userId) => {
  console.log(`Viewing details for user ${userId}`);
  // Implement user details view logic
};

const sendWelcomeEmail = (userId) => {
  console.log(`Sending welcome email to user ${userId}`);
  // Implement welcome email sending logic
};
</script>
