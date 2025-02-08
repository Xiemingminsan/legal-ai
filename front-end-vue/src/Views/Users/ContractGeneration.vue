<template>



  <!-- Loading state -->
  <div v-if="isLoading" class="flex justify-center items-center h-[400px]">
    <LoadingSpinner />
  </div>

  <!-- Error state -->
  <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getContracts" />

  <!-- if Page Loadded -->
  <div v-else>
    <div v-if="!authStore.proAccount"
      class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
        <div class="mb-6">
          <i class="ri-vip-crown-2-line text-6xl text-yellow-500"></i>
        </div>
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Unlock Premium Features
        </h2>
        <p class="mb-6 text-gray-600 dark:text-gray-300">
          Upgrade to a Pro account to create and manage your own bots. Enjoy exclusive features and take your experience
          to the next level!
        </p>
        <div class="flex justify-center">
          <BuyPremiumBtn />
        </div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          With a Pro account, you can create customized bot for our own personal use!.
        </p>
      </div>
    </div>

    <div v-else class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white p-4 md:p-8">
      <h1 class="text-3xl font-bold mb-6 text-center">Contract Generator</h1>

      <!-- Contract Details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <h2 class="text-lg font-semibold mb-3">Contract Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <!-- Party A -->
          <div class="space-y-1">
            <label for="partyA" class="text-xs font-medium">Party A</label>
            <input type="text" id="partyA" v-model="contractDetails.partyA"
              class="w-full px-2  py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter Party A name" />
          </div>

          <!-- Party B -->
          <div class="space-y-1">
            <label for="partyB" class="text-xs font-medium">Party B</label>
            <input type="text" id="partyB" v-model="contractDetails.partyB"
              class="w-full px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter Party B name" />
          </div>

          <!-- Contract Type -->
          <div class="space-y-1">
            <label for="contractType" class="text-xs font-medium">Contract Type</label>
            <select id="contractType" v-model="contractDetails.type"
              class="w-full px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
              <option value="" disabled>Select contract type</option>
              <option v-for="contract in contracts" :key="contract._id" :value="contract._id">
                {{ contract.type }}
              </option>
            </select>
          </div>

          <!-- Start Date -->
          <div class="space-y-1">
            <label for="startDate" class="text-xs font-medium">Start Date</label>
            <input type="date" id="startDate" v-model="contractDetails.startDate"
              class="w-full px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <!-- Duration -->
          <div class="space-y-1">
            <label for="duration" class="text-xs font-medium">Duration</label>
            <select id="duration" v-model="contractDetails.duration"
              class="w-full px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
              <option value="1 month">1 month</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="2 years">2 years</option>
              <option value="3 years">3 years</option>
              <option value="4 years">4 years</option>
              <option value="5 years">5 years</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contract Preview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Contract Preview</h2>
        <div id="ContractPreview" class="border p-4 rounded-md dark:border-gray-600">
          <h3 class="text-3xl font-bold mb-2 text-center contractTitle">{{ contractDetails.title || 'Contract' }}</h3>
          <div class="flex flex-wrap justify-between mb-4 flexWrapper">
            <div class="w-full md:w-1/2 leftColumn">
              <p class="mb-2"><strong>Party A:</strong> {{ contractDetails.partyA || '[Party A]' }}</p>
              <p class="mb-2"><strong>Party B:</strong> {{ contractDetails.partyB || '[Party B]' }}</p>
            </div>
            <div class="w-full md:w-1/2 text-right rightColumn">
              <p class="mb-2"><strong>Duration:</strong> {{ contractDetails.duration || '[Duration]' }}</p>
              <p class="mb-4"><strong>Start Date:</strong> {{ contractDetails.startDate || '[Start Date]' }}</p>
            </div>
          </div>

          <textarea v-model="contractContent" rows="10"
            class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4 contractTextArea"
            placeholder="Contract terms and conditions will appear here"></textarea>

          <div class="signaturesArea grid grid-cols-2 gap-4 mt-4">
            <div class="signatureArea">
              <p class="font-medium">Party A Signature:</p>
              <div class="border-b border-gray-300 dark:border-gray-600 h-8 mt-2 signatureLine"></div>
            </div>
            <div class="signatureArea">
              <p class="font-medium">Party B Signature:</p>
              <div class="border-b border-gray-300 dark:border-gray-600 h-8 mt-2 signatureLine"></div>
            </div>
          </div>
          <p class="text-sm text-right mt-4 contractFooter">Contract Generated By <strong>legalBotEt</strong></p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center space-x-4 mt-6">
        <button @click="downloadPDF"
          class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md flex items-center">
          <i class="ri-file-download-line mr-2"></i> Download as PDF
        </button>
      </div>
    </div>

  </div>

</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import BuyPremiumBtn from '@/components/User/BuyPremiumBtn.vue';
const authStore = useAuthStore();
const userStore = useUserStore();
import { MyToast } from '@/utils/toast';


const contracts = ref([]);

const isLoading = ref(false);
const error = ref(null);


const contractDetails = ref({
  partyA: '',
  partyB: '',
  type: '',
  title: '',
  startDate: '',
  duration: '1 year'
})


const getContracts = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await userStore.getContracts();
  isLoading.value = false;

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  contracts.value = response;

  console.log(contracts.value)
};

onMounted(() => {
  getContracts();
});



const contractContent = ref('')

// Watch for changes in contract type and update the content
watch(() => contractDetails.value.type, (newTypeId) => {
  if (newTypeId) {
    const selectedContract = contracts.value.find(contract => contract._id === newTypeId);
    contractContent.value = selectedContract ? selectedContract.content : '';
    contractDetails.value.title = selectedContract ? selectedContract.type : '';
  }
});

const downloadPDF = () => {
  const element = document.querySelector('#ContractPreview');

  if (element) {
    // Get the text content of the div
    const contractText = element.innerHTML || element.innerText;

    // Create the final HTML with the existing CSS and the content
    const contentToPrint = `
      <html>
        <head>
          <style>
            ${contractPreviewCss}
          </style>
        </head>
        <body>
          <div id="contractPreview">${contractText}</div>
        </body>
      </html>
    `;

    // Open a new window for printing
    // const printWindow = window.open('', '', 'width=800,height=600');
    const printWindow = window.open('', '');

    printWindow.document.write(contentToPrint);
    printWindow.document.close();

    // Wait for the document to fully load, then trigger print
    printWindow.onload = function () {
      // printWindow.print();
    };
  } else {
    console.error('ContractPreview div not found');
  }
};




// Custom CSS string
const contractPreviewCss = `
      /* Custom CSS for Contract Preview */

      #ContractPreview {
        padding: 1rem; /* p-4 */
        border-radius: 0.375rem; /* rounded-md */
        background-color: #fff; /* Light background */
      }

      #ContractPreview .contractTitle {
        font-size: 1.875rem; /* text-3xl */
        font-weight: bold; /* font-bold */
        margin-bottom: 0.5rem; /* mb-2 */
        text-align: center; /* text-center */
      }

      #ContractPreview .flexWrapper {
        display: flex;
        justify-content: space-between; /* justify-between */
        margin-bottom: 1rem; /* mb-4 */
      }

      #ContractPreview .leftColumn,
      #ContractPreview .rightColumn {
        width: 50%;
        margin: 10px;
        padding-right: 0.5rem;
        padding-left: 0.5rem;
      }

      #ContractPreview .leftColumn {
        width: 50%; /* w-full md:w-1/2 */
      }

      #ContractPreview .rightColumn {
        width: 50%; /* w-full md:w-1/2 */
        text-align: right; /* text-right */
      }

      #ContractPreview p {
        margin-bottom: 0.5rem; /* mb-2 */
      }

      #ContractPreview .contractTextArea {
        width: 100%;
        padding: 0.5rem 1rem; /* px-3 py-2 */
        border-radius: 0.375rem; /* rounded-md */
        border: 1px solid #4b556366; /* dark:border-gray-600 */
        color: #fff; /* text color */
        margin-bottom: 1rem; /* mb-4 */
      }

      #ContractPreview .signaturesArea {
        display: flex;
        justify-content: space-between;
        gap: 70px;
      }

      #ContractPreview .signatureArea {
        width: 100%;
      }

      #ContractPreview .signatureLine {
        border-bottom: 1px solid #d1d5db; /* border-gray-300 */
        height: 2rem; /* h-8 */
        margin-top: 0.5rem; /* mt-2 */
      }

      #ContractPreview .contractFooter {
        font-size: 0.875rem; /* text-sm */
        text-align: right; /* text-right */
        margin-top: 1rem; /* mt-4 */
      }

      #ContractPreview .font-medium {
        font-weight: 500; /* font-medium */
      }

`;
</script>
