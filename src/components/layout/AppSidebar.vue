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
  ChatDotRound,
  Share,
  Collection,
  ArrowRight,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import AiChat from '@/components/chat/AiChat.vue'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { index: '1', title: '首页', icon: 'HomeFilled', route: '/' },
  { index: '2', title: '工作流', icon: 'Share', route: '/app/workflow' },
  { index: '3', title: '任务管理', icon: 'VideoPlay', route: '/app/task' },
  {
    index: '4',
    title: '数据准备',
    icon: 'Collection',
    children: [
      { index: '4-1', title: '测评集管理', icon: 'FolderOpened', route: '/app/dataset' },
      { index: '4-2', title: '插件管理', icon: 'Connection', route: '/app/plugin' },
    ],
  },
  { index: '5', title: '环境管理', icon: 'Setting', route: '/app/environment' },
  { index: '6', title: '报告管理', icon: 'DataAnalysis', route: '/app/result' },
]

const iconComponents = {
  HomeFilled,
  FolderOpened,
  Document,
  Setting,
  Connection,
  VideoPlay,
  DataAnalysis,
  Share,
  Collection,
  ArrowRight,
}

const iconColors = {
  HomeFilled: '#6366f1',
  FolderOpened: '#8b5cf6',
  Document: '#ec4899',
  Setting: '#f59e0b',
  Connection: '#10b981',
  VideoPlay: '#3b82f6',
  DataAnalysis: '#06b6d4',
  Share: '#f97316',
  Collection: '#14b8a6',
  ArrowRight: '#9ca3af',
}

const getIcon = (iconName) => iconComponents[iconName]
const getIconColor = (iconName) => iconColors[iconName]

// 展开的子菜单索引
const expandedMenus = ref([])

const toggleSubmenu = (index) => {
  const idx = expandedMenus.value.indexOf(index)
  if (idx > -1) {
    expandedMenus.value.splice(idx, 1)
  } else {
    expandedMenus.value.push(index)
  }
}

const isExpanded = (index) => expandedMenus.value.includes(index)

const activeIndex = computed(() => {
  // 递归查找匹配的菜单项
  const findActiveItem = (items) => {
    for (const item of items) {
      if (item.route && (route.path === item.route || route.path.startsWith(item.route + '/'))) {
        return item.index
      }
      if (item.children) {
        const childActive = findActiveItem(item.children)
        if (childActive) return childActive
      }
    }
    return null
  }
  return findActiveItem(menuItems) || '1'
})

// 计算需要展开的父菜单
const activeParentIndex = computed(() => {
  for (const item of menuItems) {
    if (item.children) {
      const childActive = item.children.some(
        (child) => route.path === child.route || route.path.startsWith(child.route + '/'),
      )
      if (childActive) return item.index
    }
  }
  return null
})

// 自动展开包含当前路由的父菜单
const initExpandedMenus = () => {
  if (activeParentIndex.value && !expandedMenus.value.includes(activeParentIndex.value)) {
    expandedMenus.value.push(activeParentIndex.value)
  }
}
initExpandedMenus()

const handleSelect = (index) => {
  // 查找菜单项（支持嵌套）
  const findItem = (items) => {
    for (const item of items) {
      if (item.index === index) return item
      if (item.children) {
        const found = findItem(item.children)
        if (found) return found
      }
    }
    return null
  }

  const item = findItem(menuItems)
  if (item && item.route) {
    router.push(item.route)
  }
}

// AI聊天框状态
const chatVisible = ref(false)

const openChat = () => {
  chatVisible.value = true
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
      <template v-for="item in menuItems" :key="item.index">
        <!-- 有子菜单的情况 -->
        <div v-if="item.children" class="nav-group">
          <div
            class="nav-item has-children"
            :class="{ active: activeParentIndex === item.index, expanded: isExpanded(item.index) }"
            @click="toggleSubmenu(item.index)"
          >
            <div class="nav-indicator"></div>
            <div class="nav-icon-wrapper" :style="{ background: `${getIconColor(item.icon)}15` }">
              <el-icon :size="20" :color="getIconColor(item.icon)">
                <component :is="getIcon(item.icon)" />
              </el-icon>
            </div>
            <span class="nav-title">{{ item.title }}</span>
            <el-icon class="expand-arrow" :size="14" :class="{ rotated: isExpanded(item.index) }">
              <ArrowRight />
            </el-icon>
          </div>
          <Transition name="submenu">
            <div v-show="isExpanded(item.index)" class="submenu">
              <div
                v-for="child in item.children"
                :key="child.index"
                class="nav-item submenu-item"
                :class="{ active: activeIndex === child.index }"
                @click="handleSelect(child.index)"
              >
                <div class="nav-indicator"></div>
                <div class="nav-icon-wrapper" :style="{ background: `${getIconColor(child.icon)}15` }">
                  <el-icon :size="18" :color="getIconColor(child.icon)">
                    <component :is="getIcon(child.icon)" />
                  </el-icon>
                </div>
                <span class="nav-title">{{ child.title }}</span>
              </div>
            </div>
          </Transition>
        </div>
        <!-- 无子菜单的情况 -->
        <div
          v-else
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
      </template>
    </nav>

    <div class="sidebar-footer">
      <Transition name="ai-btn" mode="out-in">
        <div v-if="!chatVisible" class="ai-assistant-btn" @click="openChat">
          <div class="ai-icon">
            <div class="icon-pulse"></div>
            <el-icon :size="20"><ChatDotRound /></el-icon>
          </div>
          <div class="ai-info">
            <span class="ai-title">AI 助手</span>
            <span class="ai-desc">随时为您解答</span>
          </div>
          <div class="ai-badge">
            <span class="badge-dot"></span>
          </div>
          <div class="ai-sparkle">
            <span class="sparkle"></span>
            <span class="sparkle"></span>
            <span class="sparkle"></span>
          </div>
        </div>
        <div v-else class="ai-assistant-btn active" @click="chatVisible = false">
          <div class="ai-icon">
            <el-icon :size="20"><ChatDotRound /></el-icon>
          </div>
          <div class="ai-info">
            <span class="ai-title">关闭助手</span>
            <span class="ai-desc">点击收起面板</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- AI聊天框 -->
    <AiChat v-model:visible="chatVisible" />
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
  background: linear-gradient(135deg, #ebf5ff 0%, #dbeafe 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.nav-item.active .nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #3b82f6, #60a5fa);
  border-radius: 0 4px 4px 0;
}

.nav-item.active .nav-icon-wrapper {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
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
  color: #2563eb;
  font-weight: 600;
}

/* 子菜单展开箭头 */
.expand-arrow {
  margin-left: auto;
  transition: transform 0.3s ease;
  color: #9ca3af;
}

.expand-arrow.rotated {
  transform: rotate(90deg);
  color: #3b82f6;
}

/* 子菜单容器 */
.submenu {
  margin-top: 4px;
  padding-left: 12px;
  overflow: hidden;
}

.submenu-item {
  padding-left: 10px;
}

.submenu-item .nav-icon-wrapper {
  width: 32px;
  height: 32px;
}

.submenu-item .nav-title {
  font-size: 13px;
}

/* 子菜单展开动画 */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 200px;
  transform: translateY(0);
}

/* 有子菜单的菜单项 */
.nav-item.has-children {
  cursor: pointer;
}

.nav-item.has-children.expanded {
  background: #f3f4f6;
}

.nav-item.has-children.expanded .nav-title {
  color: #374151;
}

.sidebar-footer {
  padding: 16px;
  position: relative;
  z-index: 1;
  border-top: 1px solid #f0f0f0;
}

.ai-assistant-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1px solid rgba(199, 210, 254, 0.6);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.ai-assistant-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ai-assistant-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
}

.ai-assistant-btn:hover::before {
  opacity: 1;
}

.ai-assistant-btn:hover .ai-icon {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ai-assistant-btn:hover .ai-title {
  color: #fff;
}

.ai-assistant-btn:hover .ai-desc {
  color: rgba(255, 255, 255, 0.85);
}

.ai-assistant-btn:active {
  transform: translateY(0) scale(0.98);
}

.ai-assistant-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: transparent;
}

.ai-assistant-btn.active .ai-title {
  color: #fff;
}

.ai-assistant-btn.active .ai-desc {
  color: rgba(255, 255, 255, 0.85);
}

.ai-assistant-btn.active .ai-icon {
  background: rgba(255, 255, 255, 0.2);
}

.ai-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.icon-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
}

.ai-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.ai-title {
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
  transition: color 0.3s ease;
}

.ai-desc {
  font-size: 12px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.ai-badge {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
  }
}

.ai-sparkle {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
}

.ai-assistant-btn:hover .sparkle {
  animation: sparkle 0.6s ease-out forwards;
}

.sparkle:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.sparkle:nth-child(2) {
  top: 60%;
  right: 15%;
  animation-delay: 0.1s;
}

.sparkle:nth-child(3) {
  bottom: 25%;
  left: 30%;
  animation-delay: 0.2s;
}

@keyframes sparkle {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0) translateY(-10px);
  }
}

/* AI按钮切换动画 */
.ai-btn-enter-active,
.ai-btn-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-btn-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.ai-btn-leave-to {
  opacity: 0;
  transform: scale(0.9);
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
