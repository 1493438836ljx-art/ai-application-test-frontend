<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Folder,
  SetUp,
  Coin,
  VideoPlay,
  Document,
  ArrowLeft,
  FolderOpened,
  Cpu,
  ArrowDown,
  ArrowRight,
} from '@element-plus/icons-vue'
import DatasetManagement from '@/components/project/DatasetManagement.vue'
import PluginManagement from '@/components/project/PluginManagement.vue'
import TestExecution from '@/components/project/TestExecution.vue'

const route = useRoute()
const router = useRouter()

// 从路由参数获取项目信息
const projectName = computed(() => route.query.projectName || '测试项目')

// 左侧菜单项
const menuItems = [
  {
    index: 'project',
    title: '项目管理',
    icon: 'Folder',
    description: '项目基本信息与配置管理',
  },
  {
    index: 'environment',
    title: '环境准备',
    icon: 'SetUp',
    description: '测试环境搭建与配置',
  },
  {
    index: 'data',
    title: '数据准备',
    icon: 'Coin',
    description: '测试数据集管理与准备',
    expandable: true,
    children: [
      {
        index: 'dataset',
        title: '测评集管理',
        icon: 'FolderOpened',
        description: '管理测试数据集和字典',
      },
      {
        index: 'plugin',
        title: '插件管理',
        icon: 'Cpu',
        description: '管理测试插件和工具',
      },
    ],
  },
  {
    index: 'test',
    title: '测试执行',
    icon: 'VideoPlay',
    description: '测试任务执行与监控',
  },
  {
    index: 'report',
    title: '报告管理',
    icon: 'Document',
    description: '测试报告生成与查看',
  },
]

const iconComponents = {
  Folder,
  SetUp,
  Coin,
  VideoPlay,
  Document,
  FolderOpened,
  Cpu,
}

const iconColors = {
  Folder: '#6366f1',
  SetUp: '#10b981',
  Coin: '#f59e0b',
  VideoPlay: '#3b82f6',
  Document: '#ec4899',
  FolderOpened: '#8b5cf6',
  Cpu: '#06b6d4',
}

const getIcon = (iconName) => iconComponents[iconName]
const getIconColor = (iconName) => iconColors[iconName]

// 当前选中的菜单
const activeMenu = ref('project')

// 展开的子菜单
const expandedMenus = ref([])

// 菜单点击处理
const handleMenuSelect = (index, hasChildren = false) => {
  if (hasChildren) {
    // 切换展开状态
    const idx = expandedMenus.value.indexOf(index)
    if (idx > -1) {
      expandedMenus.value.splice(idx, 1)
    } else {
      expandedMenus.value.push(index)
    }
  } else {
    activeMenu.value = index
  }
}

// 子菜单点击处理
const handleSubMenuSelect = (parentIndex, childIndex) => {
  activeMenu.value = childIndex
}

// 检查菜单是否展开
const isMenuExpanded = (index) => expandedMenus.value.includes(index)

// 检查父菜单是否有激活的子菜单
const hasActiveChild = (parentItem) => {
  if (!parentItem.children) return false
  return parentItem.children.some((child) => child.index === activeMenu.value)
}

// 返回上一页
const goBack = () => {
  router.push('/integration')
}
</script>

<template>
  <div class="project-space">
    <!-- 左侧菜单 -->
    <aside class="space-sidebar">
      <div class="sidebar-header">
        <div class="back-btn" @click="goBack">
          <el-icon :size="18"><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <div class="project-info">
          <div class="project-icon">
            <el-icon :size="24"><Folder /></el-icon>
          </div>
          <div class="project-name">{{ projectName }}</div>
        </div>
      </div>

      <nav class="space-menu">
        <div v-for="item in menuItems" :key="item.index">
          <!-- 主菜单项 -->
          <div
            class="menu-item"
            :class="{
              active: activeMenu === item.index,
              'has-children': item.expandable,
              expanded: isMenuExpanded(item.index) || hasActiveChild(item),
            }"
            @click="handleMenuSelect(item.index, item.expandable)"
          >
            <div class="menu-indicator"></div>
            <div class="menu-icon-wrapper" :style="{ background: `${getIconColor(item.icon)}15` }">
              <el-icon :size="20" :color="getIconColor(item.icon)">
                <component :is="getIcon(item.icon)" />
              </el-icon>
            </div>
            <div class="menu-content">
              <span class="menu-title">{{ item.title }}</span>
              <span class="menu-desc">{{ item.description }}</span>
            </div>
            <div class="menu-arrow" v-if="item.expandable">
              <el-icon :size="14">
                <ArrowDown v-if="isMenuExpanded(item.index) || hasActiveChild(item)" />
                <ArrowRight v-else />
              </el-icon>
            </div>
            <div class="menu-arrow" v-else>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          <!-- 子菜单 -->
          <div
            v-if="item.expandable && item.children"
            class="sub-menu"
            :class="{
              expanded: isMenuExpanded(item.index) || hasActiveChild(item),
            }"
          >
            <div
              v-for="child in item.children"
              :key="child.index"
              class="sub-menu-item"
              :class="{ active: activeMenu === child.index }"
              @click="handleSubMenuSelect(item.index, child.index)"
            >
              <div class="sub-menu-indicator"></div>
              <div
                class="sub-menu-icon-wrapper"
                :style="{ background: `${getIconColor(child.icon)}15` }"
              >
                <el-icon :size="18" :color="getIconColor(child.icon)">
                  <component :is="getIcon(child.icon)" />
                </el-icon>
              </div>
              <div class="sub-menu-content">
                <span class="sub-menu-title">{{ child.title }}</span>
                <span class="sub-menu-desc">{{ child.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="status-badge">
          <span class="status-dot"></span>
          <span>项目进行中</span>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="space-content">
      <!-- 项目管理 -->
      <div v-if="activeMenu === 'project'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">项目管理</h2>
          <p class="panel-subtitle">管理项目基本信息和配置</p>
        </div>
        <div class="panel-body">
          <div class="placeholder-content">
            <el-icon :size="48" color="#c0c4cc"><Folder /></el-icon>
            <p>项目管理功能开发中...</p>
          </div>
        </div>
      </div>

      <!-- 环境准备 -->
      <div v-if="activeMenu === 'environment'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">环境准备</h2>
          <p class="panel-subtitle">搭建和配置测试环境</p>
        </div>
        <div class="panel-body">
          <div class="placeholder-content">
            <el-icon :size="48" color="#c0c4cc"><SetUp /></el-icon>
            <p>环境准备功能开发中...</p>
          </div>
        </div>
      </div>

      <!-- 数据准备 -->
      <div v-if="activeMenu === 'data'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">数据准备</h2>
          <p class="panel-subtitle">管理测试数据集</p>
        </div>
        <div class="panel-body">
          <div class="placeholder-content">
            <el-icon :size="48" color="#c0c4cc"><Coin /></el-icon>
            <p>请在左侧选择具体的子菜单：测评集管理或插件管理</p>
          </div>
        </div>
      </div>

      <!-- 测评集管理 -->
      <div v-if="activeMenu === 'dataset'" class="content-panel">
        <DatasetManagement />
      </div>

      <!-- 插件管理 -->
      <div v-if="activeMenu === 'plugin'" class="content-panel">
        <PluginManagement />
      </div>

      <!-- 测试执行 -->
      <div v-if="activeMenu === 'test'" class="content-panel">
        <TestExecution />
      </div>

      <!-- 报告管理 -->
      <div v-if="activeMenu === 'report'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">报告管理</h2>
          <p class="panel-subtitle">生成和查看测试报告</p>
        </div>
        <div class="panel-body">
          <div class="placeholder-content">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p>报告管理功能开发中...</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.project-space {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

/* 左侧边栏样式 */
.space-sidebar {
  width: 280px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 菜单样式 */
.space-menu {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  margin-bottom: 8px;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.menu-item.active .menu-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 0 4px 4px 0;
}

.menu-indicator {
  display: none;
}

.menu-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.menu-item.active .menu-icon-wrapper {
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: color 0.25s ease;
}

.menu-item.active .menu-title {
  color: #4f46e5;
  font-weight: 600;
}

.menu-desc {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-arrow {
  color: #d1d5db;
  transition: all 0.25s ease;
}

.menu-item.active .menu-arrow {
  color: #6366f1;
  transform: translateX(2px);
}

/* 子菜单样式 */
.sub-menu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.sub-menu.expanded {
  max-height: 200px;
}

.sub-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 10px 28px;
  margin-left: 20px;
  border-left: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 4px;
}

.sub-menu-item:first-child {
  margin-top: 8px;
}

.sub-menu-item:hover {
  background: #f3f4f6;
  border-left-color: #6366f1;
}

.sub-menu-item.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-left-color: #6366f1;
}

.sub-menu-item.active .sub-menu-indicator {
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.sub-menu-indicator {
  width: 6px;
  height: 6px;
  background: #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.sub-menu-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sub-menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sub-menu-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.sub-menu-item.active .sub-menu-title {
  color: #4f46e5;
  font-weight: 600;
}

.sub-menu-desc {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部状态 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 20px;
  font-size: 13px;
  color: #059669;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: status-pulse 2s ease-in-out infinite;
}

@keyframes status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
  }
}

/* 右侧内容区样式 */
.space-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.content-panel {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  min-height: calc(100vh - 48px);
  overflow: hidden;
}

.panel-header {
  padding: 24px 28px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.panel-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.panel-body {
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.placeholder-content {
  text-align: center;
  color: #9ca3af;
}

.placeholder-content p {
  margin-top: 16px;
  font-size: 14px;
}

/* 滚动条样式 */
.space-menu::-webkit-scrollbar {
  width: 4px;
}

.space-menu::-webkit-scrollbar-track {
  background: transparent;
}

.space-menu::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.space-menu::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
