import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页 - 独立页面，不使用 MainLayout
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/home/DashboardView.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/dashboard',
      redirect: '/',
    },
    // 集成验证 - 独立页面
    {
      path: '/integration',
      name: 'integration',
      component: () => import('@/views/integration/IntegrationView.vue'),
      meta: { title: '集成验证' },
    },
    // 创建项目 - 独立页面
    {
      path: '/integration/create-project',
      name: 'create-project',
      component: () => import('@/views/integration/CreateProjectView.vue'),
      meta: { title: '创建项目' },
    },
    // 个人中心 - 独立页面
    {
      path: '/personal',
      name: 'personal',
      redirect: '/personal/training',
    },
    {
      path: '/personal/:tab',
      name: 'personal-center',
      component: () => import('@/views/personal/PersonalCenterView.vue'),
      meta: { title: '个人中心' },
    },
    // 项目空间 - 独立页面
    {
      path: '/project-space',
      name: 'project-space',
      component: () => import('@/views/project/ProjectSpaceView.vue'),
      meta: { title: '项目空间' },
    },
    // 个人中心 - 独立页面
    {
      path: '/personal',
      name: 'personal',
      redirect: '/personal/training',
    },
    {
      path: '/personal/:tab',
      name: 'personal-center',
      component: () => import('@/views/personal/PersonalCenterView.vue'),
      meta: { title: '个人中心' },
    },
    {
      path: '/app',
      component: MainLayout,
      redirect: '/app/workflow',
      children: [
        {
          path: 'dashboard',
          redirect: '/',
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
          path: 'dictionary/:id',
          name: 'dictionary-detail',
          component: () => import('@/views/dataset/DictionaryDetailView.vue'),
          meta: { title: '数据字典详情' },
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
          path: 'plugin/:id',
          name: 'plugin-detail',
          component: () => import('@/views/plugin/PluginDetailView.vue'),
          meta: { title: '插件详情' },
        },
        {
          path: 'result',
          name: 'result',
          component: () => import('@/views/result/ResultView.vue'),
          meta: { title: '报告管理' },
        },
        {
          path: 'result/:id',
          name: 'result-detail',
          component: () => import('@/views/result/ResultDetailView.vue'),
          meta: { title: '报告详情' },
        },
        {
          path: 'workflow',
          name: 'workflow',
          component: () => import('@/views/workflow/WorkflowView.vue'),
          meta: { title: '工作流管理' },
        },
        {
          path: 'task',
          name: 'task',
          component: () => import('@/views/task/TaskView.vue'),
          meta: { title: '任务管理' },
        },
      ],
    },
    // 工作流编辑器 - 全屏模式，不使用 MainLayout
    {
      path: '/workflow/:id',
      name: 'workflow-editor',
      component: () => import('@/views/workflow/WorkflowEditorView.vue'),
      meta: { title: '工作流编辑器' },
    },
  ],
})

export default router
