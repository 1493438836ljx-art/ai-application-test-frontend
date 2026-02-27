<script setup>
import {
  HomeFilled,
  FolderOpened,
  Document,
  Setting,
  Connection,
  VideoPlay,
  DataAnalysis,
  Monitor,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { index: '1', title: '首页', icon: 'HomeFilled', route: '/dashboard' },
  { index: '2', title: '测评集管理', icon: 'FolderOpened', route: '/dataset' },
  { index: '3', title: 'Prompt管理', icon: 'Document', route: '/prompt' },
  { index: '4', title: '环境管理', icon: 'Setting', route: '/environment' },
  { index: '5', title: '插件管理', icon: 'Connection', route: '/plugin' },
  { index: '6', title: '测试执行', icon: 'VideoPlay', route: '/execution' },
  { index: '7', title: '测试结果', icon: 'DataAnalysis', route: '/result' },
]

const iconComponents = {
  HomeFilled,
  FolderOpened,
  Document,
  Setting,
  Connection,
  VideoPlay,
  DataAnalysis,
}

const iconColors = {
  HomeFilled: '#6366f1',
  FolderOpened: '#8b5cf6',
  Document: '#ec4899',
  Setting: '#f59e0b',
  Connection: '#10b981',
  VideoPlay: '#3b82f6',
  DataAnalysis: '#06b6d4',
}

const getIcon = (iconName) => iconComponents[iconName]
const getIconColor = (iconName) => iconColors[iconName]

const activeIndex = computed(() => {
  const item = menuItems.find((m) => m.route === route.path)
  return item ? item.index : '1'
})

const handleSelect = (index) => {
  const item = menuItems.find((m) => m.index === index)
  if (item) {
    router.push(item.route)
  }
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-glow"></div>
    <div class="logo">
      <div class="logo-icon">
        <el-icon :size="24"><Monitor /></el-icon>
      </div>
      <span class="logo-text">AI应用测试平台</span>
    </div>

    <nav class="nav-menu">
      <div
        v-for="item in menuItems"
        :key="item.index"
        class="nav-item"
        :class="{ active: activeIndex === item.index }"
        @click="handleSelect(item.index)"
      >
        <div class="nav-indicator"></div>
        <div class="nav-icon-wrapper" :style="{ background: `${getIconColor(item.icon)}15` }">
          <el-icon :size="20" :color="getIconColor(item.icon)">
            <component :is="getIcon(item.icon)" />
          </el-icon>
        </div>
        <span class="nav-title">{{ item.title }}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">
          <span>AI</span>
        </div>
        <div class="user-info">
          <span class="user-name">管理员</span>
          <span class="user-role">系统管理</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
}

.sidebar-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
  pointer-events: none;
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid #f0f0f0;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.nav-menu {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  background: transparent;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.nav-item.active .nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 0 4px 4px 0;
}

.nav-item.active .nav-icon-wrapper {
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.nav-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: color 0.25s ease;
}

.nav-item:hover .nav-title {
  color: #374151;
}

.nav-item.active .nav-title {
  color: #4f46e5;
  font-weight: 600;
}

.sidebar-footer {
  padding: 16px;
  position: relative;
  z-index: 1;
  border-top: 1px solid #f0f0f0;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.25s ease;
}

.user-card:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.user-role {
  font-size: 12px;
  color: #9ca3af;
}

/* 自定义滚动条 */
.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
