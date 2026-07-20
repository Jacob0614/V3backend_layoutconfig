import { createRouter, createWebHashHistory } from 'vue-router';
import { staticRoutes } from './modules/_aggregate';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', redirect: '/config-center/layoutConfig', meta: { roles: ['tenant'] } }, ...staticRoutes],
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

export default router;
