import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/home/DashboardView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'dataset',
          name: 'dataset',
          component: () => import('@/views/dataset/DatasetView.vue'),
          meta: { title: '测评集管理' },
        },
        {
          path: 'dataset/:id',
          name: 'dataset-detail',
          component: () => import('@/views/dataset/DatasetDetailView.vue'),
          meta: { title: '测评集详情' },
        },
        {
          path: 'prompt',
          name: 'prompt',
          component: () => import('@/views/prompt/PromptView.vue'),
          meta: { title: 'Prompt管理' },
        },
        {
          path: 'prompt/:id',
          name: 'prompt-detail',
          component: () => import('@/views/prompt/PromptDetailView.vue'),
          meta: { title: 'Prompt详情' },
        },
        {
          path: 'environment',
          name: 'environment',
          component: () => import('@/views/environment/EnvironmentView.vue'),
          meta: { title: '环境管理' },
        },
        {
          path: 'plugin',
          name: 'plugin',
          component: () => import('@/views/plugin/PluginView.vue'),
          meta: { title: '插件管理' },
        },
        {
          path: 'execution',
          name: 'execution',
          component: () => import('@/views/execution/ExecutionView.vue'),
          meta: { title: '测试执行' },
        },
        {
          path: 'result',
          name: 'result',
          component: () => import('@/views/result/ResultView.vue'),
          meta: { title: '测试结果' },
        },
      ],
    },
  ],
})

export default router
