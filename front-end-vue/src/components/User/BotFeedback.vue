<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 my-4">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">{{ t('Leave a feedback') }}</h3>
    
    <!-- Feedback Stats -->
    <div v-if="isLoading" class="flex justify-center my-4">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="botFeedback.stats" class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="flex items-center">
          <span class="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {{ botFeedback.stats.averageRating }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">/5</span>
        </div>
        
        <div class="flex items-center">
          <template v-for="i in 5" :key="i">
            <i :class="[
              i <= Math.round(botFeedback.stats.averageRating) 
                ? 'ri-star-fill text-yellow-400' 
                : 'ri-star-line text-gray-300 dark:text-gray-600'
            ]"></i>
          </template>
        </div>
        
        <span class="text-sm text-gray-500 dark:text-gray-400">
          ({{ botFeedback.stats.totalRatings }} {{ t('reviews') }})
        </span>
      </div>
    </div>
    
    <!-- Leave Feedback Section -->
    <div v-if="!submittingFeedback && showRatingForm" class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h4 class="text-md font-medium text-gray-800 dark:text-white mb-3">{{ t('leave_review') }}</h4>
      
      <div class="flex items-center gap-2 mb-4">
        <template v-for="i in 5" :key="i">
          <button @click="setRating(i)" class="focus:outline-none">
            <i :class="[
              i <= userRating 
                ? 'ri-star-fill text-yellow-400' 
                : 'ri-star-line text-gray-300 dark:text-gray-600',
              'text-2xl hover:scale-110 transition-transform'
            ]"></i>
          </button>
        </template>
      </div>
      
      <textarea 
        v-model="userComment" 
        :placeholder="t('feedback_placeholder')"
        rows="3" 
        class="w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 mb-3"
      ></textarea>
      
      <div class="flex justify-end gap-2">
        <button 
          @click="cancelReview" 
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          {{ t('cancel') }}
        </button>
        <button 
          @click="submitFeedback" 
          :disabled="!userRating"
          :class="[
            'px-4 py-2 text-sm text-white rounded-md transition-colors',
            userRating ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'
          ]"
        >
          {{ t('submit') }}
        </button>
      </div>
    </div>
    
    <div v-else-if="submittingFeedback" class="flex justify-center my-4">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <button 
      v-else
      @click="showRatingForm = true" 
      class="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <i class="ri-star-line"></i>
      <span>{{ t('rate_this_bot') }}</span>
    </button>
    
    <!-- Recent Reviews Section -->
    <div v-if="botFeedback.feedback && botFeedback.feedback.length > 0" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h4 class="text-md font-medium text-gray-800 dark:text-white mb-3">{{ t('recent_reviews') }}</h4>
      
      <div class="space-y-4 max-h-80 overflow-y-auto">
        <div 
          v-for="feedback in botFeedback.feedback.slice(0, 5)" 
          :key="feedback._id"
          class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center">
                <template v-for="i in 5" :key="i">
                  <i :class="[
                    i <= feedback.rating 
                      ? 'ri-star-fill text-yellow-400' 
                      : 'ri-star-line text-gray-300 dark:text-gray-600',
                    'text-sm'
                  ]"></i>
                </template>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ feedback.userId?.username || 'Anonymous' }}
              </p>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(feedback.createdAt) }}
            </span>
          </div>
          <p v-if="feedback.comment" class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {{ feedback.comment }}
          </p>
        </div>
      </div>
      
      <div v-if="botFeedback.feedback.length > 5" class="mt-3 text-center">
        <button class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          {{ t('view_all_reviews') }} ({{ botFeedback.feedback.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { MyToast } from '@/utils/toast';
import MyHttpService from '@/stores/MyHttpService';
import { MyUtils } from '@/utils/Utils';

const { t } = useLanguageStore();

const props = defineProps({
  botId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['feedback-updated']);

// State
const isLoading = ref(false);
const submittingFeedback = ref(false);
const showRatingForm = ref(false);
const userRating = ref(0);
const userComment = ref('');
const botFeedback = ref({
  feedback: [],
  stats: {
    totalRatings: 0,
    averageRating: 0
  }
});

// Methods
console.log('Fetching feedback for bot:', props.botId);

const fetchFeedback = async () => {
  if (!props.botId) {
    console.warn('botId is undefined. Aborting fetch.');
    return;
  }
  console.log('Fetching feedback for bot:', props.botId);
  
  isLoading.value = true;
  try {
    const response = await MyHttpService.get(`/feedback/${props.botId}`, { useJWT: true });
    if (response.error) {
      MyToast.error(response.error);
      return;
    }
    botFeedback.value = response;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    MyToast.error('Failed to load feedback');
  } finally {
    isLoading.value = false;
  }
};

const setRating = (rating) => {
  userRating.value = rating;
};

const cancelReview = () => {
  showRatingForm.value = false;
  userRating.value = 0;
  userComment.value = '';
};

const submitFeedback = async () => {
  if (!userRating.value) return;
  
  submittingFeedback.value = true;
  try {
    const response = await MyHttpService.post(`/feedback/${props.botId}`, {
      useJWT: true,
      body: {
        rating: userRating.value,
        comment: userComment.value
      }
    });
    
    if (response.error) {
      MyToast.error(response.error);
      return;
    }
    
    MyToast.success(response.msg);
    showRatingForm.value = false;
    userRating.value = 0;
    userComment.value = '';
    
    // Refetch feedback and emit updated stats
    await fetchFeedback();
    emit('feedback-updated', botFeedback.value.stats);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    MyToast.error('Failed to submit feedback');
  } finally {
    submittingFeedback.value = false;
  }
};

const formatDate = (date) => {
  return MyUtils.dateFormatter(date);
};

// Lifecycle
onMounted(() => {
  fetchFeedback();
});
</script>
