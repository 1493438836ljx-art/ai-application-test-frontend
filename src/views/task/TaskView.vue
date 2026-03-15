<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Clock,
  MoreFilled,
  VideoPlay,
  VideoPause,
  Delete,
  View,
  Refresh,
  Document,
} from '@element-plus/icons-vue'

const router = useRouter()

// 可选的工作流列表（已发布的）
const availableWorkflows = ref([
  { id: '1', name: '智能问答工作流' },
  { id: '3', name: '报告生成工作流' },
])

// 任务列表数据
const taskList = ref([
  {
    id: '1',
    name: 'GPT-4 对话能力测试',
    workflowId: '1',
    workflowName: '智能问答工作流',
    status: 'running',
    progress: 60,
    createdAt: '2024-01-15 14:30',
    completedAt: null,
  },
  {
    id: '2',
    name: 'Claude 代码生成评测',
    workflowId: '1',
    workflowName: '智能问答工作流',
    status: 'completed',
    progress: 100,
    createdAt: '2024-01-14 09:15',
    completedAt: '2024-01-14 10:30',
  },
  {
    id: '3',
    name: '周报自动生成',
    workflowId: '3',
    workflowName: '报告生成工作流',
    status: 'failed',
    progress: 45,
    createdAt: '2024-01-13 16:45',
    completedAt: null,
  },
  {
    id: '4',
    name: '多模态数据处理',
    workflowId: '1',
    workflowName: '智能问答工作流',
    status: 'pending',
    progress: 0,
    createdAt: '2024-01-12 11:20',
    completedAt: null,
  },
])

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const statusFilter = ref('')

// 新建任务对话框
const createDialogVisible = ref(false)
const newTaskForm = ref({
  name: '',
  workflowId: '',
})

// 筛选后的列表
const filteredList = computed(() => {
  let result = taskList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.workflowName.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value)
  }

  return result
})

// 状态标签配置
const statusConfig = {
  running: { label: '运行中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  failed: { label: '失败', type: 'danger' },
  pending: { label: '等待中', type: 'info' },
}

// 获取状态配置
const getStatusConfig = (status) => statusConfig[status] || { label: status, type: 'info' }

// 打开新建任务对话框
const openCreateDialog = () => {
  newTaskForm.value = {
    name: '',
    workflowId: '',
  }
  createDialogVisible.value = true
}

// 创建任务
const createTask = () => {
  if (!newTaskForm.value.name.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!newTaskForm.value.workflowId) {
    ElMessage.warning('请选择工作流')
    return
  }

  const workflow = availableWorkflows.value.find((w) => w.id === newTaskForm.value.workflowId)
  const newTask = {
    id: Date.now().toString(),
    name: newTaskForm.value.name,
    workflowId: newTaskForm.value.workflowId,
    workflowName: workflow ? workflow.name : '',
    status: 'pending',
    progress: 0,
    createdAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    completedAt: null,
  }

  taskList.value.unshift(newTask)
  createDialogVisible.value = false
  ElMessage.success('任务创建成功')
}

// 运行任务
const runTask = (item) => {
  if (item.status === 'running') {
    ElMessage.warning('任务正在运行中')
    return
  }
  item.status = 'running'
  ElMessage.info(`正在运行任务: ${item.name}`)
}

// 停止任务
const stopTask = (item) => {
  if (item.status !== 'running') {
    ElMessage.warning('任务未在运行')
    return
  }
  item.status = 'failed'
  ElMessage.info(`已停止任务: ${item.name}`)
}

// 删除任务
const deleteTask = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${item.name}"吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const index = taskList.value.findIndex((t) => t.id === item.id)
    if (index > -1) {
      taskList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 查看结果
const viewResult = (item) => {
  router.push(`/result/${item.id}`)
}

// 重新运行
const rerunTask = (item) => {
  item.status = 'running'
  item.progress = 0
  ElMessage.info(`正在重新运行任务: ${item.name}`)
}

// 下拉菜单命令
const handleCommand = (command, item) => {
  switch (command) {
    case 'run':
      runTask(item)
      break
    case 'stop':
      stopTask(item)
      break
    case 'rerun':
      rerunTask(item)
      break
    case 'view':
      viewResult(item)
      break
    case 'delete':
      deleteTask(item)
      break
  }
}

onMounted(() => {
  // 加载任务列表数据
})
</script>

<template>
  <div class="task-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">任务管理</h1>
        <p class="page-desc">基于已发布的工作流创建可执行的任务</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog"> 新建任务 </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称或工作流"
          :prefix-icon="Search"
          clearable
          style="width: 320px"
        />
      </div>
      <div class="filter-options">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="运行中" value="running" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
          <el-option label="等待中" value="pending" />
        </el-select>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div v-if="filteredList.length === 0" class="empty-state">
        <el-empty description="暂无任务数据">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog"> 创建第一个任务 </el-button>
        </el-empty>
      </div>

      <div v-else class="task-table-wrapper">
        <el-table :data="filteredList" style="width: 100%" row-class-name="task-row">
          <el-table-column label="任务名称" min-width="200">
            <template #default="{ row }">
              <div class="task-name">
                <span class="name-text">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关联工作流" min-width="160">
            <template #default="{ row }">
              <span class="workflow-name">{{ row.workflowName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusConfig(row.status).type" size="small">
                {{ getStatusConfig(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="180">
            <template #default="{ row }">
              <div class="progress-wrapper">
                <el-progress
                  :percentage="row.progress"
                  :status="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'exception' : ''"
                  :stroke-width="6"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon :size="14"><Clock /></el-icon>
                <span>{{ row.createdAt }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                <el-button text :icon="MoreFilled" class="more-btn" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.status !== 'running'"
                      :icon="VideoPlay"
                      command="run"
                    >
                      运行
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'running'"
                      :icon="VideoPause"
                      command="stop"
                    >
                      停止
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'completed' || row.status === 'failed'"
                      :icon="Refresh"
                      command="rerun"
                    >
                      重新运行
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'completed'"
                      :icon="View"
                      command="view"
                    >
                      查看结果
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Delete" command="delete" divided>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="filteredList.length > 0" class="pagination-wrapper">
      <el-pagination
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredList.length"
        :page-sizes="[10, 20, 50, 100]"
      />
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建任务" width="500px">
      <el-form :model="newTaskForm" label-width="80px">
        <el-form-item label="任务名称" required>
          <el-input v-model="newTaskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="工作流" required>
          <el-select v-model="newTaskForm.workflowId" placeholder="请选择工作流" style="width: 100%">
            <el-option
              v-for="workflow in availableWorkflows"
              :key="workflow.id"
              :label="workflow.name"
              :value="workflow.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.task-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
}

.filter-options {
  display: flex;
  gap: 12px;
}

.task-list {
  min-height: 400px;
}

.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
}

.task-table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.task-row {
  cursor: pointer;
}

.task-row:hover {
  background: #f9fafb;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-weight: 500;
  color: #1f2937;
}

.workflow-name {
  color: #6b7280;
}

.progress-wrapper {
  padding: 0 8px;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.more-btn {
  padding: 4px 8px;
  color: #9ca3af;
}

.more-btn:hover {
  color: #6366f1;
  background: #f3f4f6;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
