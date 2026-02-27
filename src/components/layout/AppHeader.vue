<script setup>
import { Bell, User } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据路由获取页面标题
const getPageTitle = () => {
  const titleMap = {
    '/dashboard': '首页',
    '/dataset': '测评集管理',
    '/prompt': 'Prompt管理',
    '/environment': '环境管理',
    '/plugin': '插件管理',
    '/execution': '测试执行',
    '/result': '测试结果',
  }
  return titleMap[route.path] || 'AI应用测试平台'
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="page-title">{{ getPageTitle() }}</h1>
    </div>
    <div class="header-right">
      <el-badge :value="3" :max="99" class="notification-badge">
        <el-button :icon="Bell" circle />
      </el-badge>
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" src="">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">管理员</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人设置</el-dropdown-item>
            <el-dropdown-item divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #606266;
}
</style>
