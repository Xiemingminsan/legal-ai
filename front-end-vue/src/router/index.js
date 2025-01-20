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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/land', component: LandingPage },
    { path: '/SignUp', component: SignUp },
    { path: '/SignIn', component: SignIn },

    // { path: "/signup", component: SignUp, meta: { requiresAuth: false } },
    // { path: "/forgot-password", component: ForgotPassword, meta: { requiresAuth: false } },
    // {
    //   path: "/reset-password/:token",
    //   component: ResetPassword,
    //   props: true,
    //   meta: { requiresAuth: false },
    // },
    {
      path: '/',
      component: UserBaseLayout,
      children: [
        { path: 'home', component: Home },
        { path: 'myaccount', component: MyAccount },
        { path: 'explore', component: Explore },
        { path: 'chats', component: RecentChatsBar },
      ],
    },
    // { path: "/:pathMatch(.*)*", redirect: "/signin" }, // Redirect unknown routes to SignIn
  ],
})

export default router
