<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Contract Management

      <button @click="openCreateModal"
        class="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none">
        <i class="ri-add-line"></i> Create New Contract
      </button>
    </h1>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center h-[400px]">
      <LoadingSpinner />
    </div>

    <!-- Error state -->
    <ErrorRetryComp v-else-if="error" :errorMessage="error" :onRetry="getContractsAdmin" />

    <!-- if Page Loadded -->
    <!-- Contracts Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">


      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contract Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Edit
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Delete
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="contract in contracts" :key="contract._id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ contract.type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="openEditModal(contract)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline">
                  <i class="ri-edit-line mr-1"></i>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="deleteContract(contract._id)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:underline">
                  <i class="ri-delete-bin-line mr-1"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Contract Modal -->
        <AdminContractForm :showModal="showModal" :contractData="selectedContract" :isEditing="isEditing"
          @close="closeModal" @save="saveContract" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminContractForm from '@/components/Admin/AdminContractForm.vue';
import { useAdminStore } from '@/stores/adminStore';
import { MyToast } from '@/utils/toast';
import ErrorRetryComp from '@/components/Basics/ErrorRetryComp.vue';
import LoadingSpinner from '@/components/Basics/LoadingSpinner.vue';

const adminStore = useAdminStore();

const isLoading = ref(false);
const error = ref(null);

const showModal = ref(false);
const isEditing = ref(false);
const selectedContract = ref(null);

const contracts = ref([]);


const getContractsAdmin = async () => {
  isLoading.value = true;
  error.value = null; // Reset the error before the request

  const response = await adminStore.getContractsAdmin();
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
  getContractsAdmin();
});



const openCreateModal = () => {
  isEditing.value = false;
  selectedContract.value = null;
  showModal.value = true;
};

const openEditModal = (contract) => {
  isEditing.value = true;
  selectedContract.value = contract;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};




const saveContract = async (contractData) => {
  if (isEditing.value) {


    const response = await adminStore.editContract(contractData);

    if (response.error) {
      MyToast.error(response.error); // Optionally show a toast message
      return;
    }

    MyToast.success('Contract Edited successfully');

    const index = contracts.value.findIndex(c => c._id === response.contract._id);
    if (index !== -1)
      contracts.value[index] = response.contract;


  } else {


    const response = await adminStore.createContract(contractData);

    if (response.error) {
      MyToast.error(response.error); // Optionally show a toast message
      return;
    }

    MyToast.success('Contract created successfully');

    contracts.value.push(response.contract);
  }
};



const deleteContract = async (contractId) => {


  const response = await adminStore.deleteContract(contractId);

  if (response.error) {
    error.value = response.error; // Set the error message
    MyToast.error(response.error); // Optionally show a toast message
    return;
  }

  MyToast.success('Contract Deleted Successfully');

  contracts.value = contracts.value.filter(contract => contract._id !== contractId);

};

</script>
