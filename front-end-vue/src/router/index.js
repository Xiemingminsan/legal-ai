import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import UserBaseLayout from '@/Views/UserBaseLayout.vue'
import MyAccount from '@/Views/Users/MyAccount.vue'

import Explore from '@/Views/Users/Explore.vue'
import RecentChatsBar from '@/components/User/Chat/RecentChatsBar.vue'
import LandingPage from '@/Views/LandingPage.vue'
import SignUp from '@/Views/SignUp.vue'
import SignIn from '@/Views/SignIn.vue'
import AdminBaseLayout from '@/Views/AdminBaseLayout.vue'
import AdminDashboard from '@/Views/Admin/AdminDashboard.vue'
import UserManagement from '@/Views/Admin/UserManagement.vue'
import AdminBotsListing from '@/Views/Admin/AdminBotsListing.vue'
import AdminBotDetails from '@/Views/Admin/AdminBotDetails.vue'
import CreateNewBot from '@/Views/Admin/CreateNewBot.vue'
import AdminSettings from '@/Views/Admin/AdminSettings.vue'
import CreateBotUser from '@/Views/Users/CreateBotUser.vue'
import SharedChats from '@/components/User/Chat/SharedChats.vue'
import ContractGeneration from '@/Views/Users/ContractGeneration.vue'
import ContractManagment from '@/Views/Admin/ContractManagment.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/land', component: LandingPage },
    { path: '/signup', component: SignUp },
    { path: '/signin', component: SignIn },
    {
      path: '/',
      component: UserBaseLayout,
      children: [
        { path: 'myaccount', component: MyAccount },
        { path: 'createBot', component: CreateBotUser },
        { path: 'explore', component: Explore },
        { path: 'contracts', component: ContractGeneration },

        {
          path: 'chats',
          component: RecentChatsBar,
          props: (route) => ({ conversationId: route.query.conversationId }),
        },
        { path: 'sharedChats/:id', component: SharedChats },
      ],
    },
    {
      path: '/admin',
      component: AdminBaseLayout,
      children: [
        { path: 'dashboard', component: AdminDashboard },
        { path: 'users', component: UserManagement },
        { path: 'bots', component: AdminBotsListing },
        { path: 'bot/:id', component: AdminBotDetails },
        { path: 'createBot', component: CreateNewBot },
        { path: 'contracts', component: ContractManagment },

        { path: 'settings', component: AdminSettings },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/land' },
  ],
})

// Uncomment and use this navigation guard for protection
router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  const publicPaths = ['/land', '/signup', '/signin']
  const adminRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/bots',
    '/admin/bot/:id',
    '/admin/createBot',
    '/admin/contracts',
    '/admin/settings',
  ]

  // Handle public routes
  if (publicPaths.includes(to.path)) {
    return authStore.token ? '/chats' : true
  }

  // Check authentication for non-public routes
  if (!authStore.token) {
    return '/signin'
  }

  // Restrict admin routes to admins only
  if (adminRoutes.some((route) => to.path.startsWith(route))) {
    if (authStore.role !== 'admin') {
      return '/chats'
    }
  }

  return true
})

export default router
