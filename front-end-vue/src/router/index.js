import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import UserBaseLayout from '@/Views/UserBaseLayout.vue'
import MyAccount from '@/Views/Users/MyAccount.vue'

import Home from '@/Views/Users/Home.vue'
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Landing page is now accessible at "/"
    { path: '/land', component: LandingPage },
    { path: '/SignUp', component: SignUp },
    { path: '/SignIn', component: SignIn },
    {
      path: '/',
      component: UserBaseLayout,
      children: [
        { path: 'home', component: Home },
        { path: 'myaccount', component: MyAccount },
        { path: 'createBot', component: CreateBotUser },
        { path: 'explore', component: Explore },
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
        { path: 'settings', component: AdminSettings },
      ],
    },
    // },
    { path: '/:pathMatch(.*)*', redirect: '/explore' }, // Redirect unknown routes to the landing page if not logged in else to home
  ],
})

// router.beforeEach((to, from) => {
//   const authStore = useAuthStore()
//   const publicPaths = ['/land', '/SignUp', '/SignIn']
//   const adminRoutes = [
//     '/admin',
//     '/admin/dashboard',
//     '/admin/users',
//     '/admin/bots',
//     '/admin/bot/:id',
//     '/admin/createBot',
//     '/admin/settings',
//   ]

//   // Handle public routes
//   if (publicPaths.includes(to.path)) {
//     // Redirect authenticated users away from public routes
//     return authStore.token ? '/home' : true
//   }

//   // Check authentication for non-public routes
//   if (!authStore.token) {
//     return '/SignIn'
//   }

//   // Restrict admin routes to admins only
//   if (adminRoutes.some((route) => to.path.startsWith(route))) {
//     if (authStore.role !== 'admin') {
//       return '/home' // Redirect non-admin users to the home page
//     }
//   }

//   return true
// })

export default router
