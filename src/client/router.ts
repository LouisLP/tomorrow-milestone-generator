import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'challenge-list',
      component: () => import('./features/challenges/pages/ChallengeListPage.vue'),
      meta: { titleKey: 'challenges.list.title' },
    },
    {
      path: '/challenges/new',
      name: 'challenge-new',
      component: () => import('./features/challenges/pages/NewChallengePage.vue'),
      meta: { titleKey: 'challenges.new.title' },
    },
    {
      path: '/challenges/:id',
      name: 'challenge-detail',
      component: () => import('./features/challenges/pages/ChallengeDetailPage.vue'),
      props: true,
      meta: { titleKey: 'challenges.detail.title' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('./features/challenges/pages/NotFoundPage.vue'),
      meta: { titleKey: 'challenges.notFound.title' },
    },
  ],
})
