import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import MembersView from '@/views/MembersView.vue'
import InviteAcceptView from '@/views/InviteAcceptView.vue'
import AddOrgView from '@/views/AddOrgView.vue'
import AppDetailView from '@/views/AppDetailView.vue'
import AddAppView from '@/views/AddAppView.vue'
import AddDeeplinkView from '@/views/AddDeeplinkView.vue'
import LaunchHistoryView from '@/views/LaunchHistoryView.vue'
import DebugView from '@/views/DebugView.vue'
import TesterView from '@/views/TesterView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/org/:orgSlug',
      name: 'org',
      component: HomeView,
    },
    {
      path: '/org/:orgSlug/app/:appSlug',
      name: 'app-detail',
      component: AppDetailView,
    },
    {
      path: '/org/:orgSlug/app/:appSlug/add-deeplink',
      name: 'add-deeplink',
      component: AddDeeplinkView,
    },
    {
      path: '/org/:orgSlug/app/:appSlug/deeplink/:deeplinkId/edit',
      name: 'edit-deeplink',
      component: AddDeeplinkView,
    },
    {
      path: '/org/:orgSlug/add-app',
      name: 'add-app',
      component: AddAppView,
    },
    {
      path: '/org/:orgSlug/app/:appSlug/edit-app',
      name: 'edit-app',
      component: AddAppView,
    },
    {
      path: '/org/:orgSlug/members',
      name: 'members',
      component: MembersView,
    },
    {
      // Requires sign-in but NOT membership — accepting is how you become one.
      path: '/invite/:token',
      name: 'invite-accept',
      component: InviteAcceptView,
    },
    {
      path: '/add-org',
      name: 'add-org',
      component: AddOrgView,
    },
    {
      path: '/launch-history',
      name: 'launch-history',
      component: LaunchHistoryView,
    },
    {
      path: '/debug',
      name: 'debug',
      component: DebugView,
    },
    {
      path: '/tester',
      name: 'tester',
      component: TesterView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: LoginView,
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.init()

  const isAuthPage = to.name === 'login' || to.name === 'signup'
  if (isAuthPage) {
    return authStore.isAuthenticated ? {name: 'home'} : true
  }
  return authStore.isAuthenticated
      ? true
      : {name: 'login', query: {redirect: to.fullPath}}
})

export default router
