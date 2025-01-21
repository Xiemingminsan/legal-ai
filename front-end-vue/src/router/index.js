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
    // Landing page is now accessible at "/"
    { path: '/', component: LandingPage },
    { path: '/SignUp', component: SignUp },
    { path: '/SignIn', component: SignIn },
    {
      path: '/user',
      component: UserBaseLayout,
      children: [
        { path: 'home', component: Home },
        { path: 'myaccount', component: MyAccount },
        { path: 'explore', component: Explore },
        { path: 'chats', component: RecentChatsBar },
      ],
    },
    // {
    //   path: '/admin',
    //   component: AdminBaseLayout,
    //   children: [{ path: 'adminHome', component: AdminHome }],
    // },
    { path: '/:pathMatch(.*)*', redirect: '/' }, // Redirect unknown routes to the landing page
  ],
})

// Router Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // If the user is not authenticated and is not trying to go to SignUp/SignIn routes
  if (!authStore.isAuthenticated && ['/SignUp', '/SignIn'].indexOf(to.path) === -1) {
    // If the user is already at the landing page, do not redirect
    if (to.path !== '/') {
      return next('/')
    }
  }

  // If the user is authenticated but is trying to access admin routes and doesn't have the "admin" role
  if (authStore.isAuthenticated && authStore.role !== 'admin' && to.path.startsWith('/admin')) {
    return next('/user/home') // Redirect to home if user is not an admin
  }

  // Otherwise, allow navigation to the requested route
  next()
})

export default router
