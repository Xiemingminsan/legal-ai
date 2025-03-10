// stores/languageStore.js
import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'

const translations = {
  currentLanguage: 'en',

  Username: {
    en: ' Username or Email',
    am: ' የተጠቃሚ ስም ወይም ኢሜይል',
  },
  email: {
    en: 'Email',
    am: 'ኢሜይል',
  },
  usernameonly: {
    en: ' Username',
    am: ' የተጠቃሚ ስም',
  },
  first_name: {
    en: ' First Name',
    am: ' የመጀመሪያ ስም',
  },
  last_name: {
    en: ' Last Name',
    am: ' የአባት ስም',
  },
  password: {
    en: 'Password',
    am: 'የይለፍ ቃል',
  },
  remember: {
    en: 'Remember me',
    am: 'አስታውሰኝ',
  },
  forgot: {
    en: 'Forgot your password?',
    am: 'የይለፍ ቃልዎን ረስተዋል?',
  },
  confirmpass: {
    en: 'Confirm Password',
    am: 'የይለፍ ቃል አረጋግጥ',
  },
  signingin: {
    en: 'Signing in...',
    am: 'እየገባ ነው...',
  },
  signin: {
    en: 'Sign in',
    am: 'ግባ',
  },
  noaccount: {
    en: "Don't have an account?",
    am: 'አካውንትዎ የለህም?',
  },
  signup: {
    en: 'Sign up',
    am: 'አዲስ አካውንት ይፍጠሩ',
  },
  haveaccount: {
    en: 'Already have an account?',
    am: 'መለያ አለህ?',
  },
  emailerror: {
    en: "Email must include an '@' symbol.",
    am: "ኢሜል የ'@' ምልክት ማካተት አለበት።",
  },
  reset: {
    en: 'Reset Password',
    am: 'የይለፍ ቃልዎን ያስታውሱ',
  },
  or: {
    en: 'or',
    am: 'ወይም',
  },
  return: {
    en: 'Return to Sign in',
    am: 'ተመለስ',
  },
  send: {
    en: 'Send reset instructions',
    am: 'የይለፍ ቃልዎን ለማስታወስ ይህን ይንኩ',
  },
  resetSent: {
    en: 'Reset instructions sent',
    am: 'የይለፍ ቃልዎን ለማስታወስ ተሳክቷል',
  },
  instructions: {
    en: 'Check your email for instructions on how to reset your password.',
    am: 'የይለፍ ቃልዎን ለማስታወስ የኢሜይልዎን ለመረዳት ይህን ይንኩ',
  },
  process: {
    en: 'Processing...',
    am: 'እየገባ ነው...',
  },
  close: {
    en: 'Close',
    am: 'ዝጋ',
  },
  proceed: {
    en: 'Proceed',
    am: 'ቀጥል',
  },
  userGeneratedBotWarning: {
    en: 'This is a user-generated bot. It may rely on less reliable data to operate. Use with caution.',
    am: 'ይህ በተጠቃሚ የተፈጥረ ቦት ነው። ሊስተምም በታመን ውሂብ ላይ ሊተመን ይችላል። በጥንቃቄ ተጠቀም።',
  },
  chatNow: {
    en: 'Chat Now',
    am: 'አሁን እንቅስቃሴ ተናጋሪ',
  },
  tryIt: {
    en: 'Try it',
    am: 'ይሞክሩ',
  }
  ,
  invalid_email: {
    en: 'Invalid email',
    am: 'ኢሜይል የተሳሳተ ነው',
  },

  myAccount: {
    en: 'My Account',
    am: 'የኔ ምንባብ',
  },
  accountType: {
    en: 'Account Type',
    am: 'የመለያ አይነት',
  },
  premiumUpgradeAvailable: {
    en: 'Premium Upgrade Available!',
    am: 'ፕሪሚየም ማሻሻያ እንደምትገኝ!',
  },
  unlockAdvancedFeatures: {
    en: 'Unlock advanced features and improve your experience.',
    am: 'የምትገኙ አስተዳደራዊ ባለሞያ ባህሪዎችን ክፈቱ እና ተሞክሮዎትን ማሻሻል ያሳሰቡት።',
  },
  currentPassword: {
    en: 'Current Password',
    am: 'አሁን ያለው ማስተከል',
  },
  newPassword: {
    en: 'New Password',
    am: 'አዲስ የፓስወርድ',
  },
  confirmNewPassword: {
    en: 'Confirm New Password',
    am: 'አዲስ ፓስወርድ ያረጋግጡ',
  },
  changePassword: {
    en: 'Change Password',
    am: 'ፓስወርድ ለውጥ',
  },
  paymentHistory: {
    en: 'Payment History',
    am: 'የክፍያ ታሪክ',
  },
  month: {
    en: 'Month',
    am: 'ወር',
  },
  settings: {
    en: 'Settings',
    am: 'ቅንብሮች',
  },
  changeLanguage: {
    en: 'Change Language',
    am: 'ቋንቋ ለውጥ',
  },
  changeTheme: {
    en: 'Change Theme',
    am: 'ቲም ለውጥ',
  },
  next: {
    en: 'Next',
    am: 'ቀጣይ',
  },
  previous: {
    en: 'Previous',
    am: 'ወደኋላ',
  },
  submit: {
    en: 'Submit',
    am: 'አስገባ',
  },
  deleteAccount: {
    en: 'Delete Account',
    am: 'መለያን ይሰርዙ',
  },
  step: {
    en: 'Step',
    am: 'ደረጃ',
  },
  of: {
    en: 'of',
    am: 'ከ',
  },
  dateOfBirth: {
    en: 'Date of Birth',
    am: 'የልደት ቀን',
  },
  gender: {
    en: 'Gender',
    am: 'ጾታ',
  },
  male: {
    en: 'Male',
    am: 'ወንድ',
  },
  female: {
    en: 'Female',
    am: 'ሴት',
  },
  username_required: {
    en: 'Username is required',
    am: 'የተጠቃሚ ስም አስፈላጊ ነው',
  },
  first_name_required: {
    en: 'First name is required',
    am: 'መጀመሪያ ስም አስፈላጊ ነው',
  },
  last_name_required: {
    en: 'Last name is required',
    am: 'አባት ስም አስፈላጊ ነው',
  },
  home: {
    en: 'Home',
    am: 'ዋና ገጽ',
  },
  explore: {
    en: 'Explore',
    am: 'ያስሱ',
  },
  createBot: {
    en: 'Create Bot',
    am: 'ቦት ፍጠር',
  },
  legalAIDisclaimer: {
    en: 'Using AI for legal matters in Ethiopia cannot guarantee 100% accuracy or reliability due to the complexities and nuances of local laws and regulations.',
    am: 'በኢትዮጵያ ላይ ለሕጋዊ ጉዳዮች አይአይ መጠቀም የአካባቢውን ሕጎች እና ደንቦች በዝርዝርነት እና በተወሰነ ሁኔታ ስላልተከበበ በመሆኑ መተንሰርና ስርዓት የሞላ እውነተኛነትን ማስረጃ ማድረግ አይቻልም።',
  },
  
  chats: {
    en: 'Chats',
    am: 'ቻቶች',
  },
  contracts: {
    en: 'Contracts',
    am: 'ኮንትራቶች',
  },
  explore_bots: {
    en: 'Explore Bots',
    am: 'ቦቶችን ያስሱ',
  },

  primary_bots: {
    en: 'Primary Bots',
    am: 'ዋና ቦቶች',
  },

  offical_bots: {
    en: 'Official bots Managed by Et Legal Bot',
    am: 'በኢት Legal Bot የሚተዳደሩ ኦፊሴላዊ ቦቶች',
  },

  deleteAccountConfirmation: {
    en: 'Are you sure you want to delete this Account?',
    am: 'እባኮት ይህን መለያ ማስወገድ ትፈልጋለህ?',
  },
  cancel: {
    en: 'Cancel',
    am: 'ሰርዝ',
  },
  delete: {
    en: 'Delete',
    am: 'ሰርዝ',
  }
  ,
  public_bots: {
    en: 'Public Bots',
    am: 'የህዝብ ቦቶች',
  },
  comunity_bots: {
    en: 'Community-created bots available to everyone',
    am: 'በማህበረሰብ የተፈጠሩ ቦቶች ለሁሉም ይገኛሉ',
  },

  private_bots: {
    en: 'Private Bots',
    am: 'የግል ቦቶች',
  },

  private_bots_text: {
    en: 'Your personal collection of AI assistants',
    am: 'የእርስዎ የግል የ AI ረዳቶች ስብስብ',
  },
  no_private_avail: {
    en: 'No private bots yet',
    am: 'እስካሁን ምንም የግል ቦቶች የሉም',
  },
  no_private_long_text: {
    en: 'Create your own custom AI assistant to help with specific tasks or knowledge domains.',
    am: 'የራስዎን ብጁ AI ረዳት ይፍጠሩ በተወሰኑ ተግባራት ወይም የእውቀት ጎራዎች እገዛ',
  },

  upgrade_to_pre: {
    en: 'Upgrade to Premium',
    am: 'ወደ ፕሪሚየም ያሻሽሉ።',
  },
  premium: {
    en: 'Premium',
    am: 'ፕሪሚየም',
  },
  get_all_prem: {
    en: 'Get access to all premium features.',
    am: 'ሁሉንም የፕሪሚየም ባህሪያት መዳረሻ ያግኙ።',
  },

  birr_month: {
    en: 'Birr / Month',
    am: 'ብር / ወር',
  },
  premium_features: {
    en: 'Premium Features:',
    am: 'የፕሪሚየም ባህሪዎች',
  },

  message: {
    en: 'Messages',
    am: 'መልክት',
  },

  unlimitedLegalDocs: {
    en: 'Unlimited legal document generation',
    am: 'ያልተገደበ ሕጋዊ ሰነዶች ምርት',
  },
  prioritySupport: {
    en: 'Priority customer support',
    am: 'አማካይ ደንበኛ ድጋፍ',
  },
  accessToPremiumTemplates: {
    en: 'Access to premium legal templates',
    am: 'ወላጅ ሕጋዊ ተአምራቾች ተይዟል',
  },
  advancedLegalAnalysis: {
    en: 'Advanced AI-powered legal analysis',
    am: 'ልምድ በማስተናገድ በአስተዳደር ሕጋዊ ትንታኔ',
  },
  customizableStorage: {
    en: 'Customizable legal document storage',
    am: 'እቅድ ማስተናገድ ሕጋዊ ሰነዶች አንቀጽ',
  },
  account: {
    en: 'Account',
    am: 'መለያ',
  },
  feed: {
    en: 'Feed',
    am: 'መግለጫ',
  },
  stories: {
    en: 'Stories',
    am: 'ታሪኮች',
  },
  readMore: {
    en: 'Read More',
    am: 'ተጨማሪ አንብብ',
  },
  readLess: {
    en: 'Read Less',
    am: 'ያነሰ አንብብ',
  },
  create: {
    en: 'Create New Post',
    am: 'አዲስ ለጥፍ',
  },
  post: {
    en: 'Post',
    am: 'ለጥፍ',
  },
  story: {
    en: 'Story',
    am: 'ታሪክ',
  },
  uploadMedia: {
    en: 'Upload Media (up to 4 media)',
    am: 'ሚዲያ ስቀል (እስከ 4 ሚዲያ)',
  },
  upload: {
    en: 'Upload',
    am: 'ስቀል',
  },
  camera: {
    en: 'Camera',
    am: 'ካሜራ',
  },
  caption: {
    en: 'Caption',
    am: 'መግለጫ ጽሑፍ',
  },
  hashtag: {
    en: 'Hashtag',
    am: 'ሃሽታግ',
  },
  submitPost: {
    en: 'Submit Post',
    am: 'ልጥፍ አስገባ',
  },
  all: {
    en: 'All',
    am: 'ሁሉም',
  },
  personal: {
    en: 'Personal',
    am: 'ግልጽ',
  },
  group: {
    en: 'Group',
    am: 'ቡድን',
  },
  Noprofile: {
    en: 'No Profile',
    am: 'ምንም መረጃ የለም',
  },
  language: {
    en: 'Language',
    am: 'ቋንቋ',
  },
  theme: {
    en: 'Theme',
    am: 'ትም',
  },

  unlockPremiumFeatures: {
    en: 'Unlock Premium Features',
    am: 'የፕሪሚየም ዝግጅቶችን ክፈት',
  },
  upgradeToPro: {
    en: 'Upgrade to a Pro account to create and manage your own bots. Enjoy exclusive features and take your experience to the next level!',
    am: 'የራስዎን ቦቶች ለመፍጠር እና ለማስተዳደር ወደ ፕሮ መለያ ያድሱ። ልዩ ባህሪዎችን ይጠቀሙ እና ተሞክሮዎን ወደ ሌላ ደረጃ ያድርጉ!',
  },
  proAccountBenefit: {
    en: 'With a Pro account, you can create a customized bot for your own personal use!',
    am: 'በፕሮ መለያ የራስዎን አገልግሎት የሚያገለግል ቦት መፍጠር ይችላሉ!',
  },
  contractGenerator: {
    en: 'Contract Generator',
    am: 'የውል መፍጠሪያ',
  },
  birr: {
    en: 'Birr',
    am: 'ብር',
  },
  startChatting: {
    en: 'Start chatting by typing a message below',
    am: 'በታች መልእክት በመጻፍ መነሻ ይነጋገሩ',
  },
  selectChat: {
    en: 'Select a chat to start messaging',
    am: 'ለመልእክት መጀመሪያ ያስመልከቱ ቻትን ይምረጡ',
  },
  noChatsAvailable: {
    en: 'No chats available.',
    am: 'ምንም ቻቶች አልተገኙም።',
  }
  ,
  Logout: {
    en: 'Logout',
    am: 'ውጣ',
  },
  switchPublic: {
    en: 'Switch to Public',
    am: 'ወደ ሰርተው ቀላል',
  },
  switchPrivate: {
    en: 'Switch to Private',
    am: 'ወደ ግልጽ ቀላል',
  },
  followers: {
    en: 'Followers',
    am: 'ተከታዮች',
  },
  following: {
    en: 'Following',
    am: 'መከታተያ',
  },
  updateBio: {
    en: 'Update Bio',
    am: 'ባዮ አስተካክል',
  },
  noPosts: {
    en: 'No posts available',
    am: 'ምንም ለጥፍ የለም',
  },
  noLiked: {
    en: 'No liked posts available',
    am: 'ምንም ተወዳጆች የለም',
  },
  nofollowing: {
    en: 'No following yet',
    am: 'ምንም መከታተያ የለም',
  },
  nofollowers: {
    en: 'No followers yet',
    am: 'ምንም ተከታዮች የለም',
  },
  tabsposts: {
    en: 'Posts',
    am: 'ልጥፍዎች',
  },
  tabsliked: {
    en: 'Liked',
    am: 'ተወዳጆች',
  },
  tabsfollowing: {
    en: 'Following',
    am: 'መከታተያ',
  },
  tabsfollowers: {
    en: 'Followers',
    am: 'ተከታዮች',
  },
  loadingPosts: {
    en: 'Loading stories and posts...',
    am: 'ለጥፍ በመጫን ላይ...',
  },
  loadProfile: {
    en: 'Loading profile...',
    am: 'መለያ በመጫን ላይ...',
  },
}

export const useLanguageStore = defineStore('language', () => {
  // Try to get the language from localStorage, default to 'en'
  const currentLanguage = ref(localStorage.getItem('language') || 'en')

  // Function to switch between languages
  const switchLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'en' ? 'am' : 'en'
    // Set the language in localStorage whenever it's switched
    localStorage.setItem('language', currentLanguage.value)
    console.log(currentLanguage.value)
  }

  // Computed property to get the translation for a key
  const t = computed(() => (key) => translations[key]?.[currentLanguage.value] || key)

  // On mounted, check for any saved language in localStorage
  onMounted(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage) {
      currentLanguage.value = savedLanguage
    }
  })

  return {
    currentLanguage,
    switchLanguage,
    t,
    translations, // Returning the translations object as well
  }
})
