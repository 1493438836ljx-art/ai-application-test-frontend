<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  VideoPlay,
  VideoPause,
  Delete,
  Search,
  Timer,
  CircleCheck,
  CircleClose,
  View,
  Edit,
  Clock,
  User,
  Calendar,
  Setting,
  More,
  Document,
  DataAnalysis,
  Operation,
  CopyDocument,
  MoreFilled,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// Tab 切换
const activeTab = ref('tasks')

// 从路由参数获取项目信息
const projectName = computed(() => route.query.projectName || '测试项目')

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const selectedStatus = ref('all')

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待执行' },
  { value: 'running', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '执行失败' },
]

// 任务列表
const tasks = ref([
  {
    id: 'task-001',
    name: '对话能力测试任务',
    description: '基于对话能力测评集的全量测试',
    workflowId: 'wf-001',
    workflowName: '对话测试工作流',
    status: 'completed',
    progress: 100,
    totalCases: 1500,
    passedCases: 1420,
    failedCases: 80,
    createdAt: '2024-02-20 10:30',
    startedAt: '2024-02-20 10:35',
    finishedAt: '2024-02-20 11:45',
    creator: 'zhangsan 00123456',
  },
  {
    id: 'task-002',
    name: '代码生成测试任务',
    description: 'Python代码生成能力评估',
    workflowId: 'wf-002',
    workflowName: '代码测试工作流',
    status: 'running',
    progress: 65,
    totalCases: 800,
    passedCases: 480,
    failedCases: 40,
    createdAt: '2024-02-21 14:00',
    startedAt: '2024-02-21 14:05',
    finishedAt: null,
    creator: 'lisi 00234567',
  },
  {
    id: 'task-003',
    name: '文本摘要测试任务',
    description: '文本摘要质量评估',
    workflowId: 'wf-003',
    workflowName: '摘要测试工作流',
    status: 'pending',
    progress: 0,
    totalCases: 600,
    passedCases: 0,
    failedCases: 0,
    createdAt: '2024-02-22 09:00',
    startedAt: null,
    finishedAt: null,
    creator: 'wangwu 00345678',
  },
  {
    id: 'task-004',
    name: '多模态理解测试',
    description: '图像理解能力综合测试',
    workflowId: 'wf-004',
    workflowName: '多模态测试工作流',
    status: 'failed',
    progress: 30,
    totalCases: 450,
    passedCases: 100,
    failedCases: 35,
    createdAt: '2024-02-22 16:30',
    startedAt: '2024-02-22 16:35',
    finishedAt: '2024-02-22 17:10',
    creator: 'zhaoliu 00456789',
  },
])

// 筛选后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (task) =>
        task.name.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword) ||
        task.workflowName.toLowerCase().includes(keyword)
    )
  }

  // 状态过滤
  if (selectedStatus.value !== 'all') {
    result = result.filter((task) => task.status === selectedStatus.value)
  }

  return result
})

// 获取状态配置
const getStatusConfig = (status) => {
  const configs = {
    pending: {
      text: '待执行',
      type: 'info',
      color: '#909399',
      icon: Clock,
    },
    running: {
      text: '执行中',
      type: 'warning',
      color: '#e6a23c',
      icon: VideoPlay,
    },
    completed: {
      text: '已完成',
      type: 'success',
      color: '#67c23a',
      icon: CircleCheck,
    },
    failed: {
      text: '执行失败',
      type: 'danger',
      color: '#f56c6c',
      icon: CircleClose,
    },
  }
  return configs[status] || configs.pending
}

// 创建任务对话框
const createDialogVisible = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  workflowId: '',
})

// 可选的工作流列表
const workflowOptions = [
  { value: 'wf-new', label: '新建工作流' },
  { value: 'wf-001', label: '对话测试工作流' },
  { value: 'wf-002', label: '代码测试工作流' },
  { value: 'wf-003', label: '摘要测试工作流' },
]

// ============ 工作流列表相关 ============

// 工作流搜索关键词
const workflowSearchKeyword = ref('')

// 工作流状态筛选
const workflowStatusFilter = ref('')

// 工作流分页
const workflowCurrentPage = ref(1)
const workflowPageSize = ref(10)

// 工作流列表数据
const workflowList = ref([
  {
    id: 'wf-001',
    name: '对话测试工作流',
    description: '基于对话能力测评集的全量测试工作流',
    status: 'active',
    nodeCount: 5,
    lastModified: '2024-02-20 10:30',
    version: 'v1.2',
    creator: 'zhangsan 00123456',
  },
  {
    id: 'wf-002',
    name: '代码测试工作流',
    description: 'Python代码生成能力评估工作流',
    status: 'active',
    nodeCount: 8,
    lastModified: '2024-02-21 14:00',
    version: 'v2.0',
    creator: 'lisi 00234567',
  },
  {
    id: 'wf-003',
    name: '摘要测试工作流',
    description: '文本摘要质量评估工作流',
    status: 'draft',
    nodeCount: 6,
    lastModified: '2024-02-22 09:00',
    version: 'v1.0',
    creator: 'wangwu 00345678',
  },
  {
    id: 'wf-004',
    name: '多模态测试工作流',
    description: '支持文本、图像、音频多模态数据处理的测试流程',
    status: 'inactive',
    nodeCount: 12,
    lastModified: '2024-02-22 16:30',
    version: 'v1.5',
    creator: 'zhaoliu 00456789',
  },
  {
    id: 'wf-005',
    name: '报告生成工作流',
    description: '自动生成测评报告的工作流程',
    status: 'active',
    nodeCount: 4,
    lastModified: '2024-02-23 11:00',
    version: 'v1.0',
    creator: 'sunqi 00567890',
  },
])

// 工作流状态配置
const workflowStatusConfig = {
  active: { label: '已发布', type: 'success', color: '#67c23a' },
  draft: { label: '草稿', type: 'warning', color: '#e6a23c' },
  inactive: { label: '已停用', type: 'info', color: '#909399' },
}

// 获取工作流状态配置
const getWorkflowStatusConfig = (status) =>
  workflowStatusConfig[status] || { label: status, type: 'info', color: '#909399' }

// 筛选后的工作流完整列表
const allFilteredWorkflowList = computed(() => {
  let result = workflowList.value

  if (workflowSearchKeyword.value) {
    const keyword = workflowSearchKeyword.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword)
    )
  }

  if (workflowStatusFilter.value) {
    result = result.filter((item) => item.status === workflowStatusFilter.value)
  }

  return result
})

// 工作流总数
const filteredWorkflowTotal = computed(() => allFilteredWorkflowList.value.length)

// 分页后的工作流列表
const filteredWorkflowList = computed(() => {
  const start = (workflowCurrentPage.value - 1) * workflowPageSize.value
  const end = start + workflowPageSize.value
  return allFilteredWorkflowList.value.slice(start, end)
})

// 工作流分页大小变化
const handleWorkflowSizeChange = (val) => {
  workflowPageSize.value = val
  workflowCurrentPage.value = 1
}

// 工作流页码变化
const handleWorkflowPageChange = (val) => {
  workflowCurrentPage.value = val
}

// 新建工作流
const createWorkflow = () => {
  router.push({
    path: '/workflow/new',
    query: {
      projectName: projectName.value,
    },
  })
}

// 编辑工作流
const editWorkflow = (id) => {
  router.push({
    path: `/workflow/${id}`,
    query: {
      projectName: projectName.value,
    },
  })
}

// 复制工作流
const copyWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要复制工作流"${item.name}"吗？`, '确认复制', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const newWorkflow = {
      ...item,
      id: `wf-${Date.now()}`,
      name: `${item.name} (副本)`,
      status: 'draft',
      lastModified: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    workflowList.value.unshift(newWorkflow)
    ElMessage.success('复制成功')
  } catch {
    // 用户取消
  }
}

// 删除工作流
const deleteWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除工作流"${item.name}"吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const index = workflowList.value.findIndex((w) => w.id === item.id)
    if (index > -1) {
      workflowList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 运行工作流
const runWorkflow = (item) => {
  router.push({
    path: `/workflow/${item.id}`,
    query: {
      projectName: projectName.value,
      autoRun: 'true',
    },
  })
}

// 工作流下拉菜单命令
const handleWorkflowCommand = (command, item) => {
  switch (command) {
    case 'edit':
      editWorkflow(item.id)
      break
    case 'copy':
      copyWorkflow(item)
      break
    case 'delete':
      deleteWorkflow(item)
      break
    case 'run':
      runWorkflow(item)
      break
  }
}

// 打开创建任务对话框
const openCreateDialog = () => {
  createForm.name = ''
  createForm.description = ''
  createForm.workflowId = ''
  createDialogVisible.value = true
}

// 提交创建任务
const submitCreateTask = () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }

  if (!createForm.workflowId) {
    ElMessage.warning('请选择工作流')
    return
  }

  // 如果选择新建工作流，跳转到工作流编辑器
  if (createForm.workflowId === 'wf-new') {
    createDialogVisible.value = false
    // 跳转到工作流编辑器创建新工作流，并传递任务信息
    router.push({
      path: `/workflow/new`,
      query: {
        projectName: projectName.value,
        taskName: createForm.name,
        taskDescription: createForm.description,
        fromTask: 'true',
      },
    })
    return
  }

  // 创建任务
  const newTask = {
    id: `task-${Date.now()}`,
    name: createForm.name,
    description: createForm.description,
    workflowId: createForm.workflowId,
    workflowName: workflowOptions.find((w) => w.value === createForm.workflowId)?.label || '',
    status: 'pending',
    progress: 0,
    totalCases: 0,
    passedCases: 0,
    failedCases: 0,
    createdAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    startedAt: null,
    finishedAt: null,
    creator: '当前用户 00123456',
  }

  tasks.value.unshift(newTask)
  createDialogVisible.value = false
  ElMessage.success('任务创建成功')
}

// 查看任务详情（跳转到工作流编排页面）
const viewTaskDetail = (task) => {
  router.push({
    path: `/workflow/${task.workflowId}`,
    query: {
      projectName: projectName.value,
      taskId: task.id,
      taskName: task.name,
    },
  })
}

// 执行任务
const executeTask = (task) => {
  if (task.status === 'running') {
    ElMessage.info('任务正在执行中')
    return
  }

  ElMessageBox.confirm(`确定要执行任务"${task.name}"吗？`, '确认执行', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      task.status = 'running'
      task.startedAt = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      ElMessage.success('任务开始执行')

      // 模拟执行进度
      const interval = setInterval(() => {
        if (task.progress >= 100) {
          clearInterval(interval)
          task.status = 'completed'
          task.finishedAt = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          task.passedCases = Math.floor(task.totalCases * 0.95)
          task.failedCases = task.totalCases - task.passedCases
          ElMessage.success(`任务"${task.name}"执行完成`)
        } else {
          task.progress += 10
          if (task.totalCases === 0) {
            task.totalCases = 500
          }
          task.passedCases = Math.floor((task.totalCases * task.progress) / 100 * 0.95)
          task.failedCases = Math.floor((task.totalCases * task.progress) / 100) - task.passedCases
        }
      }, 1000)
    })
    .catch(() => {
      // 用户取消
    })
}

// 停止任务
const stopTask = (task) => {
  ElMessageBox.confirm(`确定要停止任务"${task.name}"吗？`, '确认停止', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      task.status = 'failed'
      task.finishedAt = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      ElMessage.warning(`任务"${task.name}"已停止`)
    })
    .catch(() => {
      // 用户取消
    })
}

// 删除任务
const deleteTask = (task) => {
  ElMessageBox.confirm(`确定要删除任务"${task.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = tasks.value.findIndex((t) => t.id === task.id)
      if (index > -1) {
        tasks.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      // 用户取消
    })
}

// 查看报告
const viewReport = (task) => {
  router.push({
    path: '/app/result',
    query: {
      taskId: task.id,
      taskName: task.name,
    },
  })
}
</script>

<template>
  <div class="test-execution">
    <!-- 头部 -->
    <div class="management-header">
      <div class="header-left">
        <h2 class="panel-title">测试执行</h2>
        <p class="panel-subtitle">执行测试任务并监控进度</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          创建任务
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs-wrapper">
      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="任务列表" name="tasks">
          <template #label>
            <span class="tab-label">
              <el-icon><Operation /></el-icon>
              任务列表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="工作流列表" name="workflows">
          <template #label>
            <span class="tab-label">
              <el-icon><DataAnalysis /></el-icon>
              工作流列表
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 任务列表内容 -->
    <div v-show="activeTab === 'tasks'" class="tab-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务名称或描述..."
            :prefix-icon="Search"
            clearable
            style="width: 300px"
          />
          <el-select
            v-model="selectedStatus"
            placeholder="任务状态"
            style="width: 140px; margin-left: 12px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="toolbar-right">
          <div class="stats-info">
            <span class="stat-item">
              <el-icon><DataAnalysis /></el-icon>
              共 {{ tasks.length }} 个任务
            </span>
            <span class="stat-divider">|</span>
            <span class="stat-item running">
              <el-icon><VideoPlay /></el-icon>
              执行中 {{ tasks.filter((t) => t.status === 'running').length }}
            </span>
            <span class="stat-item completed">
              <el-icon><CircleCheck /></el-icon>
              已完成 {{ tasks.filter((t) => t.status === 'completed').length }}
            </span>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="content-area">
        <el-table :data="filteredTasks" style="width: 100%" stripe>
        <el-table-column label="任务名称" prop="name" min-width="200">
          <template #default="{ row }">
            <div class="task-name">
              <el-icon :size="18" class="task-icon"><Operation /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="关联工作流" prop="workflowName" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="" size="small">{{ row.workflowName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="getStatusConfig(row.status).type" size="small">
                <el-icon class="status-icon">
                  <component :is="getStatusConfig(row.status).icon" />
                </el-icon>
                {{ getStatusConfig(row.status).text }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="180" align="center">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress"
                :status="row.status === 'failed' ? 'exception' : row.status === 'completed' ? 'success' : ''"
                :stroke-width="8"
              />
              <span class="progress-text" v-if="row.totalCases > 0">
                {{ row.passedCases + row.failedCases }}/{{ row.totalCases }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="通过/失败" width="100" align="center">
          <template #default="{ row }">
            <div class="case-stats" v-if="row.totalCases > 0">
              <span class="passed">{{ row.passedCases }}</span>
              <span class="divider">/</span>
              <span class="failed">{{ row.failedCases }}</span>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="creator" width="150" align="center">
          <template #default="{ row }">
            <div class="creator-cell">
              <el-icon><User /></el-icon>
              <span>{{ row.creator }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="150" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ row.createdAt }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link :icon="View" @click="viewTaskDetail(row)">
                详情
              </el-button>
              <el-button
                v-if="row.status === 'pending' || row.status === 'failed'"
                type="success"
                link
                :icon="VideoPlay"
                @click="executeTask(row)"
              >
                执行
              </el-button>
              <el-button
                v-if="row.status === 'running'"
                type="warning"
                link
                :icon="VideoPause"
                @click="stopTask(row)"
              >
                停止
              </el-button>
              <el-button
                v-if="row.status === 'completed'"
                type="info"
                link
                :icon="Document"
                @click="viewReport(row)"
              >
                报告
              </el-button>
              <el-button type="danger" link :icon="Delete" @click="deleteTask(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="filteredTasks.length > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredTasks.length"
          :page-sizes="[10, 20, 50, 100]"
          :default-page-size="10"
        />
      </div>
      </div>
    </div>

    <!-- 工作流列表内容 -->
    <div v-show="activeTab === 'workflows'" class="tab-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="workflowSearchKeyword"
            placeholder="搜索工作流名称或描述..."
            :prefix-icon="Search"
            clearable
            style="width: 300px"
          />
          <el-select
            v-model="workflowStatusFilter"
            placeholder="工作流状态"
            clearable
            style="width: 140px; margin-left: 12px"
          >
            <el-option label="已发布" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="已停用" value="inactive" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="createWorkflow">
            新建工作流
          </el-button>
        </div>
      </div>

      <!-- 工作流列表 -->
      <div class="content-area">
        <div v-if="filteredWorkflowList.length === 0" class="empty-state">
          <el-empty description="暂无工作流数据">
            <el-button type="primary" :icon="Plus" @click="createWorkflow">
              创建第一个工作流
            </el-button>
          </el-empty>
        </div>

        <div v-else class="workflow-grid">
          <div
            v-for="item in filteredWorkflowList"
            :key="item.id"
            class="workflow-card"
            @click="editWorkflow(item.id)"
          >
            <div class="card-header">
              <div class="card-title-row">
                <h3 class="card-title">{{ item.name }}</h3>
                <el-dropdown trigger="click" @command="(cmd) => handleWorkflowCommand(cmd, item)" @click.stop>
                  <el-button text :icon="MoreFilled" class="more-btn" @click.stop />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :icon="Edit" command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item :icon="VideoPlay" command="run">运行</el-dropdown-item>
                      <el-dropdown-item :icon="CopyDocument" command="copy">复制</el-dropdown-item>
                      <el-dropdown-item :icon="Delete" command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <el-tag :type="getWorkflowStatusConfig(item.status).type" size="small">
                {{ getWorkflowStatusConfig(item.status).label }}
              </el-tag>
            </div>

            <p class="card-description">{{ item.description }}</p>

            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">节点数量</span>
                <span class="stat-value">{{ item.nodeCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">版本</span>
                <span class="stat-value">{{ item.version }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">创建人</span>
                <span class="stat-value">{{ item.creator }}</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="footer-time">
                <el-icon :size="14"><Clock /></el-icon>
                <span>{{ item.lastModified }}</span>
              </div>
              <div class="footer-actions">
                <el-button size="small" text :icon="VideoPlay" @click.stop="runWorkflow(item)">
                  运行
                </el-button>
                <el-button size="small" text :icon="Setting" @click.stop="editWorkflow(item.id)">
                  配置
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="filteredWorkflowTotal > 0">
          <el-pagination
            v-model:current-page="workflowCurrentPage"
            v-model:page-size="workflowPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredWorkflowTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleWorkflowSizeChange"
            @current-change="handleWorkflowPageChange"
          />
        </div>
      </div>
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建测试任务"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px" label-position="left">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="请输入任务名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="选择工作流" required>
          <el-select
            v-model="createForm.workflowId"
            placeholder="请选择工作流"
            style="width: 100%"
          >
            <el-option
              v-for="option in workflowOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <div class="form-tip">
            <el-icon><Setting /></el-icon>
            选择"新建工作流"将跳转到工作流编排页面创建新工作流
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateTask">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.test-execution {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.panel-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item.running {
  color: #e6a23c;
}

.stat-item.completed {
  color: #67c23a;
}

.stat-divider {
  color: #dcdfe6;
}

.content-area {
  flex: 1;
  padding: 20px 28px;
  overflow-y: auto;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon {
  color: #6366f1;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-icon {
  margin-right: 4px;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-cell :deep(.el-progress) {
  width: 100%;
}

.progress-text {
  font-size: 12px;
  color: #909399;
}

.case-stats {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
}

.case-stats .passed {
  color: #67c23a;
  font-weight: 500;
}

.case-stats .divider {
  color: #dcdfe6;
  margin: 0 2px;
}

.case-stats .failed {
  color: #f56c6c;
  font-weight: 500;
}

.no-data {
  color: #c0c4cc;
}

.creator-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
}

.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Tab 切换相关样式 */
.tabs-wrapper {
  padding: 0 28px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.content-tabs {
  --el-tabs-header-height: 48px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* 工作流列表样式 */
.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  text-align: center;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.workflow-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #6366f1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  padding: 4px;
  color: #9ca3af;
}

.more-btn:hover {
  color: #6366f1;
  background: #f3f4f6;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.card-stats {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.footer-actions .el-button {
  color: #6366f1;
}

.footer-actions .el-button:hover {
  background: #eef2ff;
}
</style>
