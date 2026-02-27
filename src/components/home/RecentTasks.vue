<script setup>
import { View, VideoPause } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info',
  }
  return map[status]
}

const getStatusText = (status) => {
  const map = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }
  return map[status]
}

const handleView = (task) => {
  ElMessage.info(`查看任务: ${task.name}`)
}

const handleStop = (task) => {
  ElMessage.warning(`中止任务: ${task.name}`)
}
</script>

<template>
  <el-card class="recent-tasks" :body-style="{ padding: '0' }">
    <template #header>
      <div class="card-header">
        <span>近期任务</span>
        <router-link to="/result">
          <el-button type="primary" link>查看全部</el-button>
        </router-link>
      </div>
    </template>
    <el-table :data="tasks" style="width: 100%">
      <el-table-column prop="name" label="任务名称" min-width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="150">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress"
            :status="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'exception' : ''"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            :icon="View"
            link
            size="small"
            @click="handleView(row)"
          >
            查看
          </el-button>
          <el-button
            v-if="row.status === 'running'"
            type="danger"
            :icon="VideoPause"
            link
            size="small"
            @click="handleStop(row)"
          >
            中止
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.recent-tasks {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding: 0 20px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}
</style>
