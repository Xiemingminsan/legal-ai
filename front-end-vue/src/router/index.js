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
    // {
    //   path: '/admin',
    //   component: AdminBaseLayout,
    //   children: [{ path: 'adminHome', component: AdminHome }],
    // },
    // { path: '/:pathMatch(.*)*', redirect: '/' }, // Redirect unknown routes to the landing page
  ],
})

// // Router Navigation Guards
// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore()

//   // If the user is not authenticated and is not trying to go to SignUp/SignIn routes
//   if (!authStore.isAuthenticated && ['/SignUp', '/SignIn'].indexOf(to.path) === -1) {
//     // If the user is already at the landing page, do not redirect
//     if (to.path !== '/') {
//       return next('/')
//     }
//   }

//   // If the user is authenticated but is trying to access admin routes and doesn't have the "admin" role
//   if (authStore.isAuthenticated && authStore.role !== 'admin' && to.path.startsWith('/admin')) {
//     return next('/home') // Redirect to home if user is not an admin
//   }

//   // Otherwise, allow navigation to the requested route
//   next()
// })

export default router
