import type { RouteRecordRaw } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/config-center',
    name: 'configCenter',
    component: AppLayout,
    redirect: '/config-center/layoutConfig',
    meta: {
      title: 'configCenter',
      roles: ['tenant'],
    },
    children: [
      {
        path: 'layoutConfig',
        name: 'config_layoutConfig',
        component: () => import('@/views/config/frontendCustom/MerchantList.vue'),
        meta: {
          title: 'layoutConfig',
          parentTitle: 'layoutConfig',
          roles: ['tenant'],
          group: 'systemConfig',
          keepAlive: true,
          isNew: true,
        },
      },
      {
        path: 'layoutConfig/edit/:tenantId',
        name: 'config_layoutConfig_edit',
        component: () => import('@/views/config/frontendCustom/P0BEditor.vue'),
        meta: {
          title: 'layoutConfigEdit',
          parentTitle: 'layoutConfig',
          roles: ['tenant'],
          group: 'systemConfig',
          keepAlive: false,
        },
      },
      {
        path: 'frontendCustom',
        redirect: { name: 'config_layoutConfig' },
        meta: { title: 'layoutConfig', roles: ['tenant'], hidden: true },
      },
      {
        path: 'frontendCustom/edit/:tenantId',
        redirect: (to) => ({
          name: 'config_layoutConfig_edit',
          params: { tenantId: to.params.tenantId },
          query: to.query,
        }),
        meta: { title: 'layoutConfigEdit', roles: ['tenant'], hidden: true },
      },
    ],
  },
];

export default routes;
