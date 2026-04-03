<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  UserFilled,
  Bell,
  ArrowDown,
  School,
  Folder,
  Tickets,
  Clock,
  User,
  Grid,
  ArrowDownBold,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SkillLibraryView from '@/views/skill/SkillLibraryView.vue'
import SkillDetailView from '@/views/skill/SkillDetailView.vue'

// Skill详情相关状态
const showSkillDetail = ref(false)
const currentSkillId = ref(null)

// 查看Skill详情
const handleViewSkillDetail = (skillId) => {
  currentSkillId.value = skillId
  showSkillDetail.value = true
}

// 返回Skill列表
const handleBackToSkillList = () => {
  showSkillDetail.value = false
  currentSkillId.value = null
}

// Icon component map for dynamic rendering
const iconComponents = {
  School,
  Folder,
  Tickets,
  Clock,
  User,
  Grid,
}

const router = useRouter()
const route = useRoute()

// Top menu items
const menuItems = [
  { label: '首页', path: '/' },
  { label: '集成验证', path: '/integration' },
  { label: '方案体验', path: '/experience' },
  { label: '在线实训', path: '/training' },
]

// Left sidebar menu items with icons and children
const sidebarMenus = [
  { key: 'training', label: '我的实训', icon: School },
  { key: 'projects', label: '我的项目', icon: Folder },
  { key: 'tickets', label: '我的工单', icon: Tickets },
  { key: 'todos', label: '我的代办', icon: Clock },
  { key: 'account', label: '我的账号', icon: User },
  {
    key: 'capabilities',
    label: '基础能力库',
    icon: Grid,
    children: [
      { key: 'feature-library', label: '特性库' },
      { key: 'skill-library', label: 'Skill库' },
    ],
  },
]

// Expanded menu keys (for sub-menu toggle)
const expandedMenus = ref(['capabilities'])

// Toggle sub-menu expansion
const toggleSubMenu = (key) => {
  const index = expandedMenus.value.indexOf(key)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(key)
  }
}

// Check if menu is expanded
const isMenuExpanded = (key) => {
  return expandedMenus.value.includes(key)
}

// Active menu from route params, default to 'training'
const activeMenu = computed(() => {
  return route.params.tab || 'training'
})

// Active menu label - also check sub-menus
const activeMenuLabel = computed(() => {
  // First check top-level menus
  const menu = sidebarMenus.find((m) => m.key === activeMenu.value)
  if (menu) return menu.label

  // Then check sub-menus
  for (const parent of sidebarMenus) {
    if (parent.children) {
      const child = parent.children.find((c) => c.key === activeMenu.value)
      if (child) return child.label
    }
  }
  return '我的实训'
})

// Top menu click handler
const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

// Sidebar menu click handler
const handleSidebarMenuClick = (item) => {
  router.push(`/personal/${item.key}`)
}

// Sub-menu click handler
const handleSubMenuClick = (child) => {
  router.push(`/personal/${child.key}`)
  // 切换菜单时重置Skill详情状态
  if (child.key !== 'skill-library') {
    showSkillDetail.value = false
    currentSkillId.value = null
  }
}

// User dropdown command handler
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
    <!-- Top Navigation Bar -->
    <header class="top-header">
      <div class="header-content">
        <!-- Left: Logo and Menu -->
        <div class="header-left">
          <div class="logo-section">
            <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
          </div>
          <nav class="header-menu">
            <div
              v-for="item in menuItems"
              :key="item.label"
              class="menu-item"
              :class="{ active: item.label === '首页' }"
              @click="handleMenuClick(item)"
            >
              {{ item.label }}
            </div>
          </nav>
        </div>

        <!-- Right: Action Buttons -->
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

    <!-- Main Content Area -->
    <div class="main-container">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <template v-for="item in sidebarMenus" :key="item.key">
            <div
              class="sidebar-menu-item"
              :class="{ active: activeMenu === item.key && !item.children }"
              @click="item.children ? toggleSubMenu(item.key) : handleSidebarMenuClick(item)"
            >
              <el-icon v-if="item.icon" class="menu-icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
              <el-icon v-if="item.children" class="arrow-icon" :class="{ expanded: isMenuExpanded(item.key) }">
                <ArrowDown />
              </el-icon>
            </div>
            <!-- Sub-menu items -->
            <div v-if="item.children && isMenuExpanded(item.key)" class="sub-menu">
              <div
                v-for="child in item.children"
                :key="child.key"
                class="sub-menu-item"
                :class="{ active: activeMenu === child.key }"
                @click="handleSubMenuClick(child)"
              >
                <span>{{ child.label }}</span>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Right Content Area -->
      <main class="content-area">
        <div class="content-wrapper" :class="{ 'no-padding': activeMenu === 'skill-library' }">
          <template v-if="activeMenu === 'skill-library'">
            <SkillLibraryView
              v-if="!showSkillDetail"
              @view-detail="handleViewSkillDetail"
            />
            <SkillDetailView
              v-else
              :skill-id="currentSkillId"
              @back="handleBackToSkillList"
            />
          </template>
          <template v-else>
            <h2 class="content-title">{{ activeMenuLabel }}</h2>
            <div class="content-placeholder">
              <p>{{ activeMenuLabel }}内容区域</p>
              <p class="placeholder-hint">此功能模块正在开发中...</p>
            </div>
          </template>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer class="page-footer">
      <div class="footer-content">
        <p>Copyright © Huawei Technologies Co., Ltd. 2011-2026 Support.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Page Layout */
.personal-center-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* Top Navigation Bar */
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

/* Menu Styles */
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

/* Right Header Actions */
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

/* Main Container */
.main-container {
  flex: 1;
  display: flex;
  background: #f5f7fa;
}

/* Left Sidebar */
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.sidebar-menu {
  padding: 16px 0;
}

.sidebar-menu-item {
  padding: 14px 24px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-menu-item .menu-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar-menu-item:hover {
  background: #f5f7fa;
  color: #3b82f6;
}

.sidebar-menu-item.active {
  color: #3b82f6;
  background: #eff6ff;
  border-left-color: #3b82f6;
  font-weight: 500;
}

/* Arrow icon for expandable menu */
.sidebar-menu-item .arrow-icon {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.sidebar-menu-item .arrow-icon.expanded {
  transform: rotate(180deg);
}

/* Sub-menu styles */
.sub-menu {
  background: #fafafa;
  overflow: hidden;
}

.sub-menu-item {
  padding: 12px 24px 12px 56px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.sub-menu-item:hover {
  color: #3b82f6;
  background: #f5f5f5;
}

.sub-menu-item.active {
  color: #3b82f6;
  background: #eff6ff;
  font-weight: 500;
}

.sub-menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #3b82f6;
}

/* Right Content Area */
.content-area {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.content-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: calc(100vh - 56px - 72px - 48px);
}

.content-wrapper.no-padding {
  padding: 24px;
  background: #f5f7fa;
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #999;
}

.content-placeholder p {
  margin: 0;
  font-size: 16px;
}

.placeholder-hint {
  margin-top: 12px !important;
  font-size: 14px !important;
  color: #bbb;
}

/* Footer */
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

/* Responsive */
@media (max-width: 768px) {
  .header-menu {
    display: none;
  }

  .header-right {
    gap: 16px;
  }

  .sidebar {
    width: 180px;
  }

  .sidebar-menu-item {
    padding: 12px 16px;
  }
}
</style>
