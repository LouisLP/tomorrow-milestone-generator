import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'challenge-list',
      component: () => import('./features/challenges/pages/ChallengeListPage.vue'),
    },
    {
      path: '/challenges/new',
      name: 'challenge-new',
      component: () => import('./features/challenges/pages/NewChallengePage.vue'),
    },
    {
      path: '/challenges/:id',
      name: 'challenge-detail',
      component: () => import('./features/challenges/pages/ChallengeDetailPage.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('./features/challenges/pages/NotFoundPage.vue'),
    },
  ],
})
