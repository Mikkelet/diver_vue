import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AddOrgView from '@/views/AddOrgView.vue'
import AppDetailView from '@/views/AppDetailView.vue'
import AddAppView from '@/views/AddAppView.vue'
import AddDeeplinkView from '@/views/AddDeeplinkView.vue'
import LaunchHistoryView from '@/views/LaunchHistoryView.vue'
import DebugView from '@/views/DebugView.vue'

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
  ],
})

export default router
