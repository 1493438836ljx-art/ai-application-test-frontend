# 个人中心页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建个人中心页面，包含双栏布局（左侧垂直菜单 + 右侧内容区），从 IntegrationView 下拉菜单可导航进入。

**Architecture:** 独立页面组件 PersonalCenterView.vue，使用 Vue Router 管理子路由状态，左侧菜单通过路由参数高亮选中项，右侧内容区根据路由显示对应占位内容。

**Tech Stack:** Vue 3, Vue Router, Element Plus

---

## 文件结构

```
src/
├── views/
│   ├── personal/
│   │   └── PersonalCenterView.vue    # 新建：个人中心主页面
│   └── integration/
│       └── IntegrationView.vue       # 修改：添加路由跳转
└── router/
    └── index.js                       # 修改：添加个人中心路由
```

---

### Task 1: 添加个人中心路由配置

**Files:**
- Modify: `src/router/index.js`

- [ ] **Step 1: 在 router/index.js 中添加个人中心路由**

在 `router/index.js` 文件的 `// 集成验证 - 独立页面` 注释之后，添加个人中心路由配置：

```javascript
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
```

- [ ] **Step 2: 验证路由配置语法正确**

运行: `npm run lint`
预期: 无语法错误

- [ ] **Step 3: 提交路由更改**

```bash
git add src/router/index.js
git commit -m "feat(router): add personal center routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 创建个人中心页面组件

**Files:**
- Create: `src/views/personal/PersonalCenterView.vue`

- [ ] **Step 1: 创建 PersonalCenterView.vue 文件**

创建文件 `src/views/personal/PersonalCenterView.vue`，内容如下：

```vue
<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  UserFilled,
  Bell,
  ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 顶部菜单项
const menuItems = [
  { label: '首页', path: '/' },
  { label: '集成验证', path: '/integration' },
  { label: '方案体验', path: '/experience' },
  { label: '在线实训', path: '/training' },
]

// 左侧菜单项
const sidebarMenus = [
  { key: 'training', label: '我的实训' },
  { key: 'projects', label: '我的项目' },
  { key: 'tickets', label: '我的工单' },
  { key: 'todos', label: '我的代办' },
  { key: 'account', label: '我的账号' },
  { key: 'skills', label: '基础能力库' },
]

// 当前选中的菜单
const activeMenu = computed(() => route.params.tab || 'training')

// 当前菜单标签
const activeMenuLabel = computed(() => {
  const menu = sidebarMenus.find((m) => m.key === activeMenu.value)
  return menu ? menu.label : ''
})

// 菜单点击
const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

// 侧边栏菜单点击
const handleSidebarMenuClick = (key) => {
  router.push(`/personal/${key}`)
}

// 用户下拉菜单命令
const handleUserCommand = (command) => {
  if (command === 'logout') {
    ElMessage.info('退出登录')
  } else {
    router.push(`/personal/${command}`)
  }
}
</script>

<template>
  <div class="personal-center-page">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="header-content">
        <!-- 左侧 Logo 和菜单 -->
        <div class="header-left">
          <div class="logo-section">
            <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
          </div>
          <!-- 菜单项 -->
          <nav class="header-menu">
            <div
              v-for="item in menuItems"
              :key="item.label"
              class="menu-item"
              :class="{ active: item.path === '/integration' }"
              @click="handleMenuClick(item)"
            >
              {{ item.label }}
            </div>
          </nav>
        </div>

        <!-- 右侧功能区 -->
        <div class="header-right">
          <div class="header-action">
            <span class="lang-switch">EN</span>
          </div>
          <div class="header-action">
            <el-icon :size="18"><Bell /></el-icon>
          </div>
          <div class="header-action">
            <span>帮助</span>
          </div>
          <el-dropdown trigger="hover" @command="handleUserCommand">
            <div class="header-action user-dropdown">
              <el-icon :size="18"><UserFilled /></el-icon>
              <span>17721884685</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="training">我的实训</el-dropdown-item>
                <el-dropdown-item command="projects">我的项目</el-dropdown-item>
                <el-dropdown-item command="tickets">我的工单</el-dropdown-item>
                <el-dropdown-item command="todos">我的代办</el-dropdown-item>
                <el-dropdown-item command="account">我的账号</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主体内容区 -->
    <div class="main-container">
      <!-- 左侧菜单 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <div
            v-for="menu in sidebarMenus"
            :key="menu.key"
            class="menu-item"
            :class="{ active: activeMenu === menu.key }"
            @click="handleSidebarMenuClick(menu.key)"
          >
            {{ menu.label }}
          </div>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <main class="content-area">
        <div class="content-header">
          <h2 class="content-title">{{ activeMenuLabel }}</h2>
        </div>
        <div class="content-body">
          <div class="placeholder-content">
            <p>{{ activeMenuLabel }}内容区域，待后续开发</p>
          </div>
        </div>
      </main>
    </div>

    <!-- 底部版权 -->
    <footer class="page-footer">
      <div class="footer-content">
        <p>Copyright © Huawei Technologies Co., Ltd. 2011-2026 Support.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 页面整体布局 */
.personal-center-page {
  min-height: 100vh;
  height: auto;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 顶部导航栏 */
.top-header {
  background: #fff;
  height: 56px;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 32px;
  object-fit: contain;
}

/* 菜单样式 */
.header-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.menu-item {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s ease;
}

.menu-item:hover {
  color: #e63946;
}

.menu-item.active {
  color: #e63946;
  font-weight: 500;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e63946;
}

/* 右侧功能区 */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-action {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.header-action:hover {
  color: #e63946;
}

.user-dropdown {
  gap: 4px;
}

/* 主体内容区 */
.main-container {
  flex: 1;
  display: flex;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
}

/* 左侧菜单 */
.sidebar {
  width: 220px;
  flex-shrink: 0;
}

.sidebar-menu {
  background: #fff;
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sidebar-menu .menu-item {
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.sidebar-menu .menu-item:hover {
  background: #eef1f6;
}

.sidebar-menu .menu-item.active {
  color: #e63946;
  background: #fff5f5;
}

.sidebar-menu .menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #e63946;
}

/* 右侧内容区 */
.content-area {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.content-body {
  flex: 1;
  padding: 24px;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #999;
  font-size: 14px;
}

/* 底部版权 */
.page-footer {
  background: #f8f9fa;
  padding: 24px;
  flex-shrink: 0;
  border-top: 1px solid #e8e8e8;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-menu {
    display: none;
  }

  .header-right {
    gap: 16px;
  }

  .main-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
```

- [ ] **Step 2: 创建 personal 目录**

运行: 确保目录存在，Vue 组件会自动创建

- [ ] **Step 3: 验证组件语法正确**

运行: `npm run lint`
预期: 无语法错误

- [ ] **Step 4: 提交组件更改**

```bash
git add src/views/personal/PersonalCenterView.vue
git commit -m "feat(personal): add PersonalCenterView component

Add personal center page with two-column layout:
- Left sidebar with vertical menu
- Right content area with placeholder
- Top navigation bar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: 修改 IntegrationView 添加路由跳转

**Files:**
- Modify: `src/views/integration/IntegrationView.vue`

- [ ] **Step 1: 修改 handleUserCommand 函数**

在 `src/views/integration/IntegrationView.vue` 中，找到 `handleUserCommand` 函数（约第 110-117 行），替换为：

```javascript
// 用户下拉菜单命令
const handleUserCommand = (command) => {
  const routeMap = {
    training: '/personal/training',
    projects: '/personal/projects',
    tickets: '/personal/tickets',
    todos: '/personal/todos',
    account: '/personal/account',
  }

  if (command === 'logout') {
    ElMessage.info('退出登录')
  } else if (routeMap[command]) {
    router.push(routeMap[command])
  }
}
```

- [ ] **Step 2: 验证修改语法正确**

运行: `npm run lint`
预期: 无语法错误

- [ ] **Step 3: 提交更改**

```bash
git add src/views/integration/IntegrationView.vue
git commit -m "feat(integration): add navigation to personal center

Update user dropdown menu to navigate to personal center pages.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 功能验证

**Files:**
- 无文件修改

- [ ] **Step 1: 启动开发服务器**

运行: `npm run dev`
预期: 服务器启动在 http://localhost:5173

- [ ] **Step 2: 使用 Playwright 验证页面功能**

1. 访问 http://localhost:5173/integration
2. 点击右上角用户下拉菜单中的"我的项目"
3. 验证页面跳转到 /personal/projects
4. 验证左侧菜单"我的项目"高亮
5. 点击左侧其他菜单项，验证内容区切换

- [ ] **Step 3: 清理临时文件**

```bash
rm -rf ./tmp
```

- [ ] **Step 4: 最终提交（如有遗漏）**

```bash
git status
# 如有未提交的更改，进行提交
```
