<script setup>
import { Plus, Upload, EditPen, Tools } from '@element-plus/icons-vue'

const actions = [
  { label: '新建测试任务', icon: 'Plus', route: '/execution' },
  { label: '导入测评集', icon: 'Upload', route: '/dataset' },
  { label: '创建Prompt', icon: 'EditPen', route: '/prompt' },
  { label: '配置环境', icon: 'Tools', route: '/environment' },
]

const iconComponents = {
  Plus,
  Upload,
  EditPen,
  Tools,
}

const getIcon = (iconName) => iconComponents[iconName]
</script>

<template>
  <el-card class="quick-actions" :body-style="{ padding: '20px' }">
    <template #header>
      <div class="card-header">
        <span>快捷操作</span>
      </div>
    </template>
    <div class="actions-grid">
      <router-link
        v-for="action in actions"
        :key="action.label"
        :to="action.route || '#'"
        class="action-item"
      >
        <el-button type="primary" :icon="getIcon(action.icon)" size="large">
          {{ action.label }}
        </el-button>
      </router-link>
    </div>
  </el-card>
</template>

<style scoped>
.quick-actions {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.actions-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-item {
  text-decoration: none;
}

.action-item .el-button {
  min-width: 160px;
}
</style>
