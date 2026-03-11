<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  VideoPlay,
  VideoPause,
  Delete,
  Refresh,
  Search,
  Setting,
  Document,
  Timer,
  CircleCheck,
  CircleClose,
  More,
  CopyDocument,
  View,
  Stopwatch,
  DataAnalysis,
  Edit,
  List,
  Filter,
  Operation,
  ArrowDown,
  Clock,
  User,
  Calendar,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
} from '@element-plus/icons-vue'

// 任务类型枚举
const TaskType = {
  DATA_PROCESS: 'data_process',
  TEST_EXECUTE: 'test_execute',
  RESULT_EVAL: 'result_eval',
  COMBO_FULL: 'combo_full',
  COMBO_DATA_TEST: 'combo_data_test',
  COMBO_TEST_EVAL: 'combo_test_eval',
}

// 任务类型配置
const taskTypeConfig = {
  [TaskType.DATA_PROCESS]: {
    label: '数据处理',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    icon: Filter,
  },
  [TaskType.TEST_EXECUTE]: {
    label: '测试执行',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    icon: VideoPlay,
  },
  [TaskType.RESULT_EVAL]: {
    label: '结果评估',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    icon: DataAnalysis,
  },
  [TaskType.COMBO_FULL]: {
    label: '完整流程',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    icon: Operation,
  },
  [TaskType.COMBO_DATA_TEST]: {
    label: '数据+测试',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    icon: Operation,
  },
  [TaskType.COMBO_TEST_EVAL]: {
    label: '测试+评估',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    icon: Operation,
  },
}

// 状态颜色配置
const statusColorConfig = {
  pending: {
    gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    bgGradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    icon: Stopwatch,
  },
  running: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    icon: VideoPlay,
  },
  paused: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    icon: VideoPause,
  },
  completed: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    icon: CircleCheck,
  },
  failed: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    icon: CircleClose,
  },
}

// 任务类型选项（用于筛选）
const taskTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: TaskType.DATA_PROCESS, label: '数据处理' },
  { value: TaskType.TEST_EXECUTE, label: '测试执行' },
  { value: TaskType.RESULT_EVAL, label: '结果评估' },
  { value: 'combo', label: '组合任务' },
]

// 新建任务下拉选项
const newTaskOptions = [
  { label: '单独任务', options: [
    { value: TaskType.DATA_PROCESS, label: '数据处理' },
    { value: TaskType.TEST_EXECUTE, label: '测试执行' },
    { value: TaskType.RESULT_EVAL, label: '结果评估' },
  ]},
  { label: '组合任务', options: [
    { value: TaskType.COMBO_FULL, label: '完整流程（数据处理 + 测试执行 + 结果评估）' },
    { value: TaskType.COMBO_DATA_TEST, label: '数据+测试（数据处理 + 测试执行）' },
    { value: TaskType.COMBO_TEST_EVAL, label: '测试+评估（测试执行 + 结果评估）' },
  ]},
]

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const selectedStatus = ref('all')

// 任务类型筛选
const selectedTaskType = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待执行' },
  { value: 'running', label: '执行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
]

// 任务列表
const tasks = ref([
  {
    id: 'task-1',
    name: '智能客服系统 - 完整测试流程',
    type: TaskType.COMBO_FULL,
    status: 'running',
    progress: 45,
    createTime: '2024-03-01 14:00:00',
    startTime: '2024-03-01 14:30:00',
    endTime: null,
    executor: '张三',
    stages: [
      { type: TaskType.DATA_PROCESS, status: 'completed', progress: 100, config: { dataSource: '客服对话原始数据' } },
      { type: TaskType.TEST_EXECUTE, status: 'running', progress: 65, config: { environment: '智能客服系统', dataset: '处理后的数据集' } },
      { type: TaskType.RESULT_EVAL, status: 'pending', progress: 0, config: { criteria: '标准评估' } },
    ],
  },
  {
    id: 'task-2',
    name: '数据处理 - 文档问答数据清洗',
    type: TaskType.DATA_PROCESS,
    status: 'completed',
    progress: 100,
    createTime: '2024-03-01 10:00:00',
    startTime: '2024-03-01 10:00:00',
    endTime: '2024-03-01 10:30:00',
    executor: '李四',
    config: { dataSource: '文档问答原始数据', rules: '标准清洗规则' },
  },
  {
    id: 'task-3',
    name: '智能写作助手 - 单元测试',
    type: TaskType.TEST_EXECUTE,
    status: 'running',
    progress: 70,
    createTime: '2024-03-01 15:00:00',
    startTime: '2024-03-01 15:30:00',
    endTime: null,
    executor: '王五',
    config: { environment: '智能写作助手', dataset: '写作测试数据集', totalCases: 100, completedCases: 70, passedCases: 68, failedCases: 2 },
  },
  {
    id: 'task-4',
    name: '智能客服 - 结果评估',
    type: TaskType.RESULT_EVAL,
    status: 'pending',
    progress: 0,
    createTime: '2024-03-01 16:00:00',
    startTime: null,
    endTime: null,
    executor: '张三',
    config: { relatedTask: 'task-1', criteria: '响应准确率评估' },
  },
  {
    id: 'task-5',
    name: '推荐引擎 - 数据+测试流程',
    type: TaskType.COMBO_DATA_TEST,
    status: 'failed',
    progress: 35,
    createTime: '2024-03-01 09:00:00',
    startTime: '2024-03-01 09:15:00',
    endTime: '2024-03-01 09:45:00',
    executor: '王五',
    errorMessage: '环境连接超时',
    stages: [
      { type: TaskType.DATA_PROCESS, status: 'completed', progress: 100, config: { dataSource: '用户行为数据' } },
      { type: TaskType.TEST_EXECUTE, status: 'failed', progress: 30, config: { environment: '智能推荐引擎', dataset: '处理后数据' }, errorMessage: '环境连接超时' },
    ],
  },
  {
    id: 'task-6',
    name: '翻译系统 - 测试+评估流程',
    type: TaskType.COMBO_TEST_EVAL,
    status: 'completed',
    progress: 100,
    createTime: '2024-03-01 08:00:00',
    startTime: '2024-03-01 08:30:00',
    endTime: '2024-03-01 09:30:00',
    executor: '李四',
    stages: [
      { type: TaskType.TEST_EXECUTE, status: 'completed', progress: 100, config: { environment: '智能翻译系统', dataset: '文学翻译测试集' } },
      { type: TaskType.RESULT_EVAL, status: 'completed', progress: 100, config: { criteria: '翻译质量评估' } },
    ],
  },
])

// 环境选项
const environments = [
  { id: '1', name: '智能客服系统' },
  { id: '2', name: '文档问答系统' },
  { id: '3', name: '智能推荐引擎' },
  { id: '4', name: '智能写作助手' },
  { id: '5', name: '智能翻译系统' },
]

// 数据源选项
const dataSources = [
  { id: 'ds-1', name: '客服对话原始数据' },
  { id: 'ds-2', name: '文档问答原始数据' },
  { id: 'ds-3', name: '用户行为数据' },
  { id: 'ds-4', name: '创意写作数据' },
  { id: 'ds-5', name: '文学翻译数据' },
]

// 测试数据集选项
const testDatasets = [
  { id: 'td-1', name: '客服对话测试集' },
  { id: 'td-2', name: '文档问答测试集' },
  { id: 'td-3', name: '推荐系统测试集' },
  { id: 'td-4', name: '写作能力测试集' },
  { id: 'td-5', name: '翻译质量测试集' },
]

// 关联测试任务选项
const relatedTestTasks = computed(() => {
  return tasks.value.filter(t => t.type === TaskType.TEST_EXECUTE || t.type.includes('combo'))
})

// 新建任务对话框
const dialogVisible = ref(false)
const formRef = ref()
const newTaskType = ref(TaskType.TEST_EXECUTE)
const taskFormData = reactive({
  name: '',
  // 数据处理配置
  dataSourceId: '',
  processRules: '',
  // 测试执行配置
  environmentId: '',
  testDatasetId: '',
  // 结果评估配置
  relatedTaskId: '',
  evalCriteria: '',
  // 通用
  description: '',
})

// 表单验证规则
const formRules = computed(() => {
  const rules = {
    name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  }

  if (newTaskType.value === TaskType.DATA_PROCESS) {
    rules.dataSourceId = [{ required: true, message: '请选择数据源', trigger: 'change' }]
  } else if (newTaskType.value === TaskType.TEST_EXECUTE) {
    rules.environmentId = [{ required: true, message: '请选择测试环境', trigger: 'change' }]
    rules.testDatasetId = [{ required: true, message: '请选择测试数据集', trigger: 'change' }]
  } else if (newTaskType.value === TaskType.RESULT_EVAL) {
    rules.relatedTaskId = [{ required: true, message: '请选择关联的测试任务', trigger: 'change' }]
  } else if (newTaskType.value === TaskType.COMBO_FULL) {
    rules.dataSourceId = [{ required: true, message: '请选择数据源', trigger: 'change' }]
    rules.environmentId = [{ required: true, message: '请选择测试环境', trigger: 'change' }]
  } else if (newTaskType.value === TaskType.COMBO_DATA_TEST) {
    rules.dataSourceId = [{ required: true, message: '请选择数据源', trigger: 'change' }]
    rules.environmentId = [{ required: true, message: '请选择测试环境', trigger: 'change' }]
  } else if (newTaskType.value === TaskType.COMBO_TEST_EVAL) {
    rules.environmentId = [{ required: true, message: '请选择测试环境', trigger: 'change' }]
    rules.testDatasetId = [{ required: true, message: '请选择测试数据集', trigger: 'change' }]
  }

  return rules
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentTask = ref(null)
const detailActiveTab = ref('overview')

// 执行日志
const executionLogs = ref([
  { time: '14:30:00', level: 'info', message: '任务开始执行' },
  { time: '14:30:01', level: 'info', message: '加载数据处理配置' },
  { time: '14:30:02', level: 'success', message: '数据处理阶段完成，处理了 12,345 条数据' },
  { time: '14:30:03', level: 'info', message: '开始测试执行阶段' },
  { time: '14:30:05', level: 'success', message: '连接测试环境成功，环境版本: v2.5.1' },
  { time: '14:35:30', level: 'warning', message: '测试用例 #156 执行超时，正在重试...' },
  { time: '14:35:45', level: 'success', message: '测试用例 #156 重试成功' },
  { time: '14:35:46', level: 'info', message: '当前测试进度: 70/100 用例已完成' },
])

// 统计数据
const statsData = computed(() => {
  const pending = tasks.value.filter(t => t.status === 'pending').length
  const running = tasks.value.filter(t => t.status === 'running').length
  const completed = tasks.value.filter(t => t.status === 'completed').length
  const failed = tasks.value.filter(t => t.status === 'failed').length
  const total = tasks.value.length
  return {
    pending,
    running,
    completed,
    failed,
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
})

// 获取状态颜色配置
const getStatusColorConfig = (status) => statusColorConfig[status] || statusColorConfig.pending

// 任务步骤（用于新建任务表单）
const currentStep = ref(1)
const totalSteps = computed(() => {
  if (newTaskType.value === TaskType.COMBO_FULL) return 3
  if (newTaskType.value === TaskType.COMBO_DATA_TEST) return 2
  if (newTaskType.value === TaskType.COMBO_TEST_EVAL) return 2
  return 1
})

// 上一步
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// 下一步
const nextStep = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (valid && currentStep.value < totalSteps.value) {
    currentStep.value++
  }
}

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value

  // 状态筛选
  if (selectedStatus.value !== 'all') {
    result = result.filter(t => t.status === selectedStatus.value)
  }

  // 任务类型筛选
  if (selectedTaskType.value !== 'all') {
    if (selectedTaskType.value === 'combo') {
      result = result.filter(t => t.type.includes('combo'))
    } else {
      result = result.filter(t => t.type === selectedTaskType.value)
    }
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t => t.name.toLowerCase().includes(keyword))
  }

  return result
})

// 分页后的任务列表
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

// 任务总数
const total = computed(() => filteredTasks.value.length)

// 获取任务类型配置
const getTaskTypeConfig = (type) => taskTypeConfig[type] || { label: type, color: '#909399', icon: List }

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    running: 'primary',
    paused: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待执行',
    running: '执行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
  }
  return texts[status] || status
}

// 获取状态图标
const getStatusIcon = (status) => {
  const icons = {
    pending: Stopwatch,
    running: VideoPlay,
    paused: VideoPause,
    completed: CircleCheck,
    failed: CircleClose,
  }
  return icons[status] || Stopwatch
}

// 获取阶段名称
const getStageName = (type) => {
  const names = {
    [TaskType.DATA_PROCESS]: '数据处理',
    [TaskType.TEST_EXECUTE]: '测试执行',
    [TaskType.RESULT_EVAL]: '结果评估',
  }
  return names[type] || type
}

// 打开新建任务对话框
const openCreateDialog = (type) => {
  newTaskType.value = type
  currentStep.value = 1
  taskFormData.name = ''
  taskFormData.dataSourceId = ''
  taskFormData.processRules = ''
  taskFormData.environmentId = ''
  taskFormData.testDatasetId = ''
  taskFormData.relatedTaskId = ''
  taskFormData.evalCriteria = ''
  taskFormData.description = ''
  dialogVisible.value = true
}

// 提交新建任务
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const newTask = {
        id: `task-${Date.now()}`,
        name: taskFormData.name,
        type: newTaskType.value,
        status: 'pending',
        progress: 0,
        createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
        startTime: null,
        endTime: null,
        executor: '当前用户',
      }

      // 根据任务类型添加配置
      if (newTaskType.value === TaskType.DATA_PROCESS) {
        newTask.config = {
          dataSource: dataSources.find(d => d.id === taskFormData.dataSourceId)?.name,
          rules: taskFormData.processRules,
        }
      } else if (newTaskType.value === TaskType.TEST_EXECUTE) {
        newTask.config = {
          environment: environments.find(e => e.id === taskFormData.environmentId)?.name,
          dataset: testDatasets.find(d => d.id === taskFormData.testDatasetId)?.name,
          totalCases: 100,
          completedCases: 0,
          passedCases: 0,
          failedCases: 0,
        }
      } else if (newTaskType.value === TaskType.RESULT_EVAL) {
        newTask.config = {
          relatedTask: tasks.value.find(t => t.id === taskFormData.relatedTaskId)?.name,
          criteria: taskFormData.evalCriteria,
        }
      } else if (newTaskType.value === TaskType.COMBO_FULL) {
        newTask.stages = [
          { type: TaskType.DATA_PROCESS, status: 'pending', progress: 0, config: { dataSource: dataSources.find(d => d.id === taskFormData.dataSourceId)?.name } },
          { type: TaskType.TEST_EXECUTE, status: 'pending', progress: 0, config: { environment: environments.find(e => e.id === taskFormData.environmentId)?.name } },
          { type: TaskType.RESULT_EVAL, status: 'pending', progress: 0, config: { criteria: taskFormData.evalCriteria || '标准评估' } },
        ]
      } else if (newTaskType.value === TaskType.COMBO_DATA_TEST) {
        newTask.stages = [
          { type: TaskType.DATA_PROCESS, status: 'pending', progress: 0, config: { dataSource: dataSources.find(d => d.id === taskFormData.dataSourceId)?.name } },
          { type: TaskType.TEST_EXECUTE, status: 'pending', progress: 0, config: { environment: environments.find(e => e.id === taskFormData.environmentId)?.name } },
        ]
      } else if (newTaskType.value === TaskType.COMBO_TEST_EVAL) {
        newTask.stages = [
          { type: TaskType.TEST_EXECUTE, status: 'pending', progress: 0, config: { environment: environments.find(e => e.id === taskFormData.environmentId)?.name, dataset: testDatasets.find(d => d.id === taskFormData.testDatasetId)?.name } },
          { type: TaskType.RESULT_EVAL, status: 'pending', progress: 0, config: { criteria: taskFormData.evalCriteria || '标准评估' } },
        ]
      }

      tasks.value.unshift(newTask)
      ElMessage.success('任务创建成功')
      dialogVisible.value = false
    }
  })
}

// 启动任务
const startTask = (task) => {
  if (task.status === 'running') return
  task.status = 'running'
  task.startTime = task.startTime || new Date().toLocaleString('zh-CN').replace(/\//g, '-')
  ElMessage.success(`任务「${task.name}」已开始执行`)
}

// 暂停任务
const pauseTask = (task) => {
  if (task.status !== 'running') return
  task.status = 'paused'
  ElMessage.warning(`任务「${task.name}」已暂停`)
}

// 停止任务
const stopTask = (task) => {
  ElMessageBox.confirm(`确定要停止任务「${task.name}」吗？`, '停止确认', {
    confirmButtonText: '确定停止',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    task.status = 'failed'
    task.endTime = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
    ElMessage.success(`任务「${task.name}」已停止`)
  })
}

// 重新执行
const retryTask = (task) => {
  task.status = 'pending'
  task.progress = 0
  task.startTime = null
  task.endTime = null
  if (task.stages) {
    task.stages.forEach(s => {
      s.status = 'pending'
      s.progress = 0
    })
  }
  ElMessage.success(`任务「${task.name}」已重置，可重新执行`)
}

// 删除任务
const deleteTask = (task) => {
  ElMessageBox.confirm(`确定要删除任务「${task.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 查看详情
const viewDetail = (task) => {
  currentTask.value = task
  detailActiveTab.value = 'overview'
  detailDialogVisible.value = true
}

// 复制任务
const copyTask = (task) => {
  const newTask = {
    ...JSON.parse(JSON.stringify(task)),
    id: `task-${Date.now()}`,
    name: `${task.name} (副本)`,
    status: 'pending',
    progress: 0,
    startTime: null,
    endTime: null,
  }
  if (newTask.stages) {
    newTask.stages.forEach(s => {
      s.status = 'pending'
      s.progress = 0
    })
  }
  tasks.value.unshift(newTask)
  ElMessage.success('任务已复制')
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 判断是否为组合任务
const isComboTask = (type) => type.includes('combo')
</script>

<template>
  <div class="task-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>任务管理</h2>
        <span class="task-count">共 {{ tasks.length }} 个任务</span>
      </div>
      <el-dropdown trigger="click" @command="openCreateDialog">
        <el-button type="primary" :icon="Plus">
          新建任务
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-for="group in newTaskOptions" :key="group.label">
              <el-dropdown-item disabled class="dropdown-group-label">
                {{ group.label }}
              </el-dropdown-item>
              <el-dropdown-item
                v-for="option in group.options"
                :key="option.value"
                :command="option.value"
              >
                {{ option.label }}
              </el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card total-card">
        <div class="stat-icon total">
          <el-icon><Operation /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.total }}</div>
          <div class="stat-label">任务总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Stopwatch /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.pending }}</div>
          <div class="stat-label">待执行</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon running">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.running }}</div>
          <div class="stat-label">执行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon failed">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.failed }}</div>
          <div class="stat-label">失败</div>
        </div>
      </div>
      <div class="stat-card rate-card">
        <div class="stat-icon rate">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statsData.completionRate }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索任务名称"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
        @input="handleSearch"
      />
      <el-select v-model="selectedTaskType" placeholder="任务类型" style="width: 140px" @change="handleSearch">
        <el-option
          v-for="type in taskTypeOptions"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>
      <el-select v-model="selectedStatus" placeholder="状态筛选" style="width: 120px" @change="handleSearch">
        <el-option
          v-for="status in statusOptions"
          :key="status.value"
          :label="status.label"
          :value="status.value"
        />
      </el-select>
    </div>

    <!-- 任务列表 -->
    <div class="task-list" v-if="total > 0">
      <div v-for="task in paginatedTasks" :key="task.id" class="task-card" :class="[task.status, isComboTask(task.type) ? 'combo-task' : 'single-task']">
        <!-- 卡片渐变边框装饰 -->
        <div class="card-border" :style="{ background: getStatusColorConfig(task.status).gradient }"></div>

        <!-- 卡片头部 -->
        <div class="task-header">
          <div class="task-title">
            <div class="type-badge" :style="{ background: getTaskTypeConfig(task.type).gradient }">
              <el-icon><component :is="getTaskTypeConfig(task.type).icon" /></el-icon>
              <span>{{ getTaskTypeConfig(task.type).label }}</span>
            </div>
            <h3 class="task-name">{{ task.name }}</h3>
            <div class="status-badge" :class="task.status">
              <el-icon><component :is="getStatusColorConfig(task.status).icon" /></el-icon>
              <span>{{ getStatusText(task.status) }}</span>
            </div>
          </div>
          <div class="task-actions">
            <template v-if="task.status === 'pending'">
              <el-button type="primary" size="small" :icon="VideoPlay" @click="startTask(task)">启动</el-button>
            </template>
            <template v-if="task.status === 'running'">
              <el-button size="small" :icon="VideoPause" @click="pauseTask(task)">暂停</el-button>
              <el-button size="small" type="danger" @click="stopTask(task)">停止</el-button>
            </template>
            <template v-if="task.status === 'paused'">
              <el-button type="primary" size="small" :icon="VideoPlay" @click="startTask(task)">继续</el-button>
              <el-button size="small" type="danger" @click="stopTask(task)">停止</el-button>
            </template>
            <template v-if="task.status === 'completed' || task.status === 'failed'">
              <el-button size="small" :icon="Refresh" @click="retryTask(task)">重新执行</el-button>
            </template>
            <el-button size="small" :icon="View" @click="viewDetail(task)">详情</el-button>
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small" :icon="More" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="copyTask(task)">
                    <el-icon><CopyDocument /></el-icon>
                    复制任务
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="deleteTask(task)">
                    <span style="color: #f56c6c">
                      <el-icon><Delete /></el-icon>
                      删除
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 单独任务配置信息 -->
        <div class="task-info" v-if="!isComboTask(task.type) && task.config">
          <div class="info-item" v-if="task.config.dataSource">
            <el-icon><Document /></el-icon>
            <span class="info-label">数据源：</span>
            <span class="info-value">{{ task.config.dataSource }}</span>
          </div>
          <div class="info-item" v-if="task.config.environment">
            <el-icon><Setting /></el-icon>
            <span class="info-label">环境：</span>
            <span class="info-value">{{ task.config.environment }}</span>
          </div>
          <div class="info-item" v-if="task.config.dataset">
            <el-icon><Document /></el-icon>
            <span class="info-label">数据集：</span>
            <span class="info-value">{{ task.config.dataset }}</span>
          </div>
          <div class="info-item" v-if="task.config.relatedTask">
            <el-icon><Connection /></el-icon>
            <span class="info-label">关联任务：</span>
            <span class="info-value">{{ task.config.relatedTask }}</span>
          </div>
        </div>

        <!-- 组合任务时间轴进度 -->
        <div class="task-timeline" v-if="isComboTask(task.type) && task.stages">
          <div class="timeline">
            <div
              v-for="(stage, index) in task.stages"
              :key="index"
              class="timeline-item"
              :class="[stage.status, { 'last-item': index === task.stages.length - 1 }]"
            >
              <div class="timeline-dot">
                <el-icon v-if="stage.status === 'completed'"><CircleFilled /></el-icon>
                <el-icon v-else-if="stage.status === 'running'"><VideoPlay /></el-icon>
                <el-icon v-else-if="stage.status === 'failed'"><CircleClose /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="stage-name">{{ getStageName(stage.type) }}</span>
                  <span class="stage-status" :class="stage.status">{{ getStatusText(stage.status) }}</span>
                </div>
                <div class="timeline-progress">
                  <el-progress
                    :percentage="stage.progress"
                    :status="stage.status === 'completed' ? 'success' : stage.status === 'failed' ? 'exception' : ''"
                    :stroke-width="6"
                  />
                </div>
                <div class="stage-config" v-if="stage.config">
                  <span v-for="(value, key) in stage.config" :key="key" class="config-tag">
                    {{ key }}: {{ value }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 进度条 - 运行中任务 -->
        <div class="task-progress" v-if="task.status === 'running' && task.progress > 0">
          <div class="progress-label">
            <span>执行进度</span>
            <span class="progress-value">{{ task.progress }}%</span>
          </div>
          <el-progress
            :percentage="task.progress"
            :stroke-width="8"
            :show-text="false"
          />
        </div>

        <div class="task-footer">
          <div class="footer-info">
            <div class="info-row">
              <el-icon><User /></el-icon>
              <span>{{ task.executor }}</span>
            </div>
            <div class="footer-divider"></div>
            <div class="info-row">
              <el-icon><Calendar /></el-icon>
              <span>创建：{{ task.createTime }}</span>
            </div>
            <div class="footer-divider" v-if="task.startTime"></div>
            <div class="info-row" v-if="task.startTime">
              <el-icon><Clock /></el-icon>
              <span>开始：{{ task.startTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-if="total === 0" description="暂无任务，点击上方按钮创建" />

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`新建${getTaskTypeConfig(newTaskType).label}任务`"
      width="680px"
      :close-on-click-modal="false"
      class="task-dialog"
    >
      <!-- 步骤指示器 - 组合任务 -->
      <div v-if="totalSteps > 1" class="step-indicator">
        <div
          v-for="step in totalSteps"
          :key="step"
          class="step-item"
          :class="{ 'active': currentStep === step, 'completed': currentStep > step }"
        >
          <div class="step-number">{{ step }}</div>
          <div class="step-line"></div>
          <div class="step-label">
            <span v-if="newTaskType === TaskType.COMBO_FULL">
              {{ step === 1 ? '数据处理' : step === 2 ? '测试执行' : '结果评估' }}
            </span>
            <span v-else-if="newTaskType === TaskType.COMBO_DATA_TEST">
              {{ step === 1 ? '数据处理' : '测试执行' }}
            </span>
            <span v-else-if="newTaskType === TaskType.COMBO_TEST_EVAL">
              {{ step === 1 ? '测试执行' : '结果评估' }}
            </span>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="taskFormData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
        class="task-form"
      >
        <!-- 第一步：基本信息（所有任务） -->
        <div class="form-step" :class="{ 'hidden': currentStep !== 1 }">
          <div class="step-header">
            <div class="step-title">
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
          </div>

          <el-form-item label="任务名称" prop="name">
            <el-input v-model="taskFormData.name" placeholder="请输入任务名称" maxlength="100" show-word-limit />
          </el-form-item>

          <!-- 数据处理配置（第一步） -->
          <template v-if="newTaskType === TaskType.DATA_PROCESS || newTaskType === TaskType.COMBO_FULL || newTaskType === TaskType.COMBO_DATA_TEST">
            <div class="config-section">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>数据处理配置</span>
              </div>
              <el-form-item label="数据源" prop="dataSourceId">
                <el-select v-model="taskFormData.dataSourceId" placeholder="请选择数据源" style="width: 100%">
                  <el-option
                    v-for="ds in dataSources"
                    :key="ds.id"
                    :label="ds.name"
                    :value="ds.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="处理规则">
                <el-input v-model="taskFormData.processRules" type="textarea" :rows="3" placeholder="请输入数据处理规则（可选）" />
              </el-form-item>
            </div>
          </template>

          <!-- 测试执行配置（单独任务的第二步或组合任务第一步时） -->
          <template v-if="newTaskType === TaskType.TEST_EXECUTE">
            <div class="config-section">
              <div class="section-title">
                <el-icon><VideoPlay /></el-icon>
                <span>测试执行配置</span>
              </div>
              <el-form-item label="测试环境" prop="environmentId">
                <el-select v-model="taskFormData.environmentId" placeholder="请选择测试环境" style="width: 100%">
                  <el-option
                    v-for="env in environments"
                    :key="env.id"
                    :label="env.name"
                    :value="env.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="测试数据集" prop="testDatasetId">
                <el-select v-model="taskFormData.testDatasetId" placeholder="请选择测试数据集" style="width: 100%">
                  <el-option
                    v-for="ds in testDatasets"
                    :key="ds.id"
                    :label="ds.name"
                    :value="ds.id"
                  />
                </el-select>
              </el-form-item>
            </div>
          </template>

          <!-- 结果评估配置（单独任务） -->
          <template v-if="newTaskType === TaskType.RESULT_EVAL">
            <div class="config-section">
              <div class="section-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>结果评估配置</span>
              </div>
              <el-form-item label="关联任务" prop="relatedTaskId">
                <el-select v-model="taskFormData.relatedTaskId" placeholder="请选择关联的测试任务" style="width: 100%">
                  <el-option
                    v-for="task in relatedTestTasks"
                    :key="task.id"
                    :label="task.name"
                    :value="task.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="评估标准">
                <el-input v-model="taskFormData.evalCriteria" type="textarea" :rows="3" placeholder="请输入评估标准（可选）" />
              </el-form-item>
            </div>
          </template>
        </div>

        <!-- 第二步：测试执行配置（组合任务） -->
        <div class="form-step" v-if="totalSteps > 1" :class="{ 'hidden': currentStep !== 2 }">
          <div class="step-header">
            <div class="step-title">
              <el-icon><VideoPlay /></el-icon>
              <span>测试执行配置</span>
            </div>
          </div>
          <el-form-item label="测试环境" prop="environmentId">
            <el-select v-model="taskFormData.environmentId" placeholder="请选择测试环境" style="width: 100%">
              <el-option
                v-for="env in environments"
                :key="env.id"
                :label="env.name"
                :value="env.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="newTaskType === TaskType.COMBO_TEST_EVAL" label="测试数据集" prop="testDatasetId">
            <el-select v-model="taskFormData.testDatasetId" placeholder="请选择测试数据集" style="width: 100%">
              <el-option
                v-for="ds in testDatasets"
                :key="ds.id"
                :label="ds.name"
                :value="ds.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <!-- 第三步：结果评估配置（组合任务） -->
        <div class="form-step" v-if="totalSteps > 2" :class="{ 'hidden': currentStep !== 3 }">
          <div class="step-header">
            <div class="step-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>结果评估配置</span>
            </div>
          </div>
          <el-form-item label="评估标准">
            <el-input v-model="taskFormData.evalCriteria" type="textarea" :rows="3" placeholder="请输入评估标准（可选）" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="currentStep > 1 && totalSteps > 1" @click="prevStep">上一步</el-button>
        <el-button
          v-if="currentStep < totalSteps && totalSteps > 1"
          type="primary"
          @click="nextStep"
        >下一步</el-button>
        <el-button
          v-if="currentStep === totalSteps"
          type="primary"
          @click="handleSubmit"
        >创建任务</el-button>
        <el-button
          v-if="totalSteps === 1"
          type="primary"
          @click="handleSubmit"
        >创建任务</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="900px"
      :close-on-click-modal="false"
      class="detail-dialog"
    >
      <template v-if="currentTask">
        <!-- 详情头部 -->
        <div class="detail-header" :style="{ background: getStatusColorConfig(currentTask.status).bgGradient }">
          <div class="header-left">
            <div class="task-type-badge" :style="{ background: getTaskTypeConfig(currentTask.type).gradient }">
              <el-icon><component :is="getTaskTypeConfig(currentTask.type).icon" /></el-icon>
              <span>{{ getTaskTypeConfig(currentTask.type).label }}</span>
            </div>
            <h3 class="detail-task-name">{{ currentTask.name }}</h3>
          </div>
          <div class="header-right">
            <div class="status-badge" :class="currentTask.status">
              <el-icon><component :is="getStatusColorConfig(currentTask.status).icon" /></el-icon>
              <span>{{ getStatusText(currentTask.status) }}</span>
            </div>
          </div>
        </div>

        <el-tabs v-model="detailActiveTab" class="detail-tabs">
          <el-tab-pane label="执行概览" name="overview">
            <div class="overview-content">
              <!-- 基本信息卡片 -->
              <div class="info-cards">
                <div class="info-card">
                  <div class="info-icon">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="info-text">
                    <span class="info-label">创建时间</span>
                    <span class="info-value">{{ currentTask.createTime }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-icon">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="info-text">
                    <span class="info-label">开始时间</span>
                    <span class="info-value">{{ currentTask.startTime || '-' }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-icon">
                    <el-icon><Stopwatch /></el-icon>
                  </div>
                  <div class="info-text">
                    <span class="info-label">结束时间</span>
                    <span class="info-value">{{ currentTask.endTime || '-' }}</span>
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-icon">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="info-text">
                    <span class="info-label">执行人</span>
                    <span class="info-value">{{ currentTask.executor }}</span>
                  </div>
                </div>
              </div>

              <!-- 执行进度 -->
              <div class="progress-section">
                <div class="section-header">
                  <h4>执行进度</h4>
                  <span class="progress-percent">{{ currentTask.progress }}%</span>
                </div>
                <el-progress
                  :percentage="currentTask.progress"
                  :stroke-width="12"
                  :show-text="false"
                />
              </div>

              <!-- 组合任务阶段详情 -->
              <div class="stage-detail" v-if="isComboTask(currentTask.type) && currentTask.stages">
                <div class="section-header">
                  <h4>执行阶段</h4>
                </div>
                <div class="stage-list">
                  <div class="stage-card" v-for="(stage, index) in currentTask.stages" :key="index" :class="stage.status">
                    <div class="stage-card-header">
                      <div class="stage-left">
                        <span class="stage-number">{{ index + 1 }}</span>
                        <span class="stage-name">{{ getStageName(stage.type) }}</span>
                      </div>
                      <div class="stage-status-badge" :class="stage.status">
                        <el-icon><component :is="getStatusColorConfig(stage.status).icon" /></el-icon>
                        <span>{{ getStatusText(stage.status) }}</span>
                      </div>
                    </div>
                    <el-progress
                      :percentage="stage.progress"
                      :status="stage.status === 'completed' ? 'success' : stage.status === 'failed' ? 'exception' : ''"
                      :stroke-width="8"
                    />
                    <div class="stage-config" v-if="stage.config">
                      <span v-for="(value, key) in stage.config" :key="key" class="config-tag">
                        {{ key }}: {{ value }}
                      </span>
                    </div>
                    <div class="stage-error" v-if="stage.errorMessage">
                      <el-alert :title="stage.errorMessage" type="error" :closable="false" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 单独任务配置 -->
              <div class="task-config" v-if="!isComboTask(currentTask.type) && currentTask.config">
                <div class="section-header">
                  <h4>任务配置</h4>
                </div>
                <el-descriptions :column="2" border>
                  <el-descriptions-item v-for="(value, key) in currentTask.config" :key="key" :label="key">
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 错误信息 -->
              <div class="error-info" v-if="currentTask.errorMessage">
                <el-alert :title="currentTask.errorMessage" type="error" :closable="false" />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="执行日志" name="logs">
            <div class="log-container">
              <div class="log-toolbar">
                <div class="log-stats">
                  <span class="log-stat info">{{ executionLogs.filter(l => l.level === 'info').length }} INFO</span>
                  <span class="log-stat success">{{ executionLogs.filter(l => l.level === 'success').length }} SUCCESS</span>
                  <span class="log-stat warning">{{ executionLogs.filter(l => l.level === 'warning').length }} WARNING</span>
                  <span class="log-stat error">{{ executionLogs.filter(l => l.level === 'error').length }} ERROR</span>
                </div>
              </div>
              <div class="log-list">
                <div v-for="(log, index) in executionLogs" :key="index" class="log-item" :class="log.level">
                  <span class="log-time">{{ log.time }}</span>
                  <div class="log-level-badge" :class="log.level">
                    <el-icon v-if="log.level === 'info'"><InfoFilled /></el-icon>
                    <el-icon v-else-if="log.level === 'success'"><SuccessFilled /></el-icon>
                    <el-icon v-else-if="log.level === 'warning'"><WarningFilled /></el-icon>
                    <el-icon v-else><CircleClose /></el-icon>
                    <span>{{ log.level.toUpperCase() }}</span>
                  </div>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ==================== 页面布局 ==================== */
.task-management-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.task-count {
  font-size: 14px;
  color: #6b7280;
}

/* ==================== 统计卡片 ==================== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-card.total-card .stat-icon.total,
.stat-card.rate-card .stat-icon.rate {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%);
}

.stat-icon.running {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* ==================== 筛选栏 ==================== */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* ==================== 任务卡片 ==================== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #e5e7eb;
}

.task-card.pending::before {
  background: linear-gradient(90deg, #9ca3af 0%, #d1d5db 100%);
}

.task-card.running::before {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.task-card.paused::before {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.task-card.completed::before {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.task-card.failed::before {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.task-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-border {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.task-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.running {
  background: #eff6ff;
  color: #3b82f6;
}

.status-badge.paused {
  background: #fffbeb;
  color: #f59e0b;
}

.status-badge.completed {
  background: #ecfdf5;
  color: #10b981;
}

.status-badge.failed {
  background: #fef2f2;
  color: #ef4444;
}

.status-badge.running .el-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.task-actions {
  display: flex;
  gap: 6px;
}

/* ==================== 任务信息 ==================== */
.task-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
}

.info-item .el-icon {
  color: #9ca3af;
}

.info-label {
  color: #9ca3af;
}

/* ==================== 时间轴样式 ==================== */
.task-timeline {
  margin-bottom: 16px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 100%);
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item.last-item::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.timeline-dot .el-icon {
  font-size: 8px;
  color: #9ca3af;
}

.timeline-item.completed .timeline-dot {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-color: #10b981;
}

.timeline-item.completed .timeline-dot .el-icon {
  color: #fff;
  font-size: 10px;
}

.timeline-item.running .timeline-dot {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-color: #3b82f6;
  animation: pulse 1.5s infinite;
}

.timeline-item.running .timeline-dot .el-icon {
  color: #fff;
  font-size: 10px;
}

.timeline-item.failed .timeline-dot {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  border-color: #ef4444;
}

.timeline-item.failed .timeline-dot .el-icon {
  color: #fff;
  font-size: 10px;
}

.timeline-item.pending .timeline-dot span {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
}

.timeline-content {
  padding-top: 2px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.stage-status {
  font-size: 12px;
  color: #9ca3af;
}

.stage-status.completed {
  color: #10b981;
}

.stage-status.running {
  color: #3b82f6;
}

.stage-status.failed {
  color: #ef4444;
}

.timeline-progress {
  margin-bottom: 8px;
}

.stage-config {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.config-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
}

/* ==================== 进度条 ==================== */
.task-progress {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}

.progress-value {
  font-weight: 600;
  color: #1f2937;
}

/* ==================== 任务底部 ==================== */
.task-footer {
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.footer-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-row .el-icon {
  font-size: 14px;
}

.footer-divider {
  width: 1px;
  height: 12px;
  background: #e5e7eb;
  margin: 0 12px;
}

/* ==================== 分页样式 ==================== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}

/* ==================== 下拉分组样式 ==================== */
.dropdown-group-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
  cursor: default !important;
}

.dropdown-group-label:hover {
  background: transparent !important;
}

/* ==================== 新建任务对话框 ==================== */
.task-dialog .step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step-line {
  position: absolute;
  top: 16px;
  left: 50%;
  width: calc(100% + 16px);
  height: 2px;
  background: #e5e7eb;
}

.step-item:last-child .step-line {
  display: none;
}

.step-item.active .step-number {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step-item.completed .step-number {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: #fff;
}

.step-label {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.step-item.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.form-step {
  transition: all 0.3s ease;
}

.form-step.hidden {
  display: none;
}

.step-header {
  margin-bottom: 20px;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.step-title .el-icon {
  color: #3b82f6;
}

.config-section {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.section-title .el-icon {
  color: #6366f1;
}

/* ==================== 详情对话框 ==================== */
.detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  margin: -24px -24px 24px -24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.detail-task-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.header-right .status-badge {
  padding: 6px 14px;
  font-size: 13px;
}

.detail-tabs {
  padding: 0 24px;
}

.detail-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.detail-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
}

.overview-content {
  padding: 0 0 24px 0;
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: #9ca3af;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

/* 进度区域 */
.progress-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.progress-percent {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
}

/* 阶段详情 */
.stage-detail {
  margin-bottom: 20px;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stage-card.completed {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.stage-card.running {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
}

.stage-card.failed {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%);
}

.stage-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stage-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.stage-card.completed .stage-number {
  background: #10b981;
  color: #fff;
}

.stage-card.running .stage-number {
  background: #3b82f6;
  color: #fff;
}

.stage-card.failed .stage-number {
  background: #ef4444;
  color: #fff;
}

.stage-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.stage-status-badge.completed {
  background: #d1fae5;
  color: #10b981;
}

.stage-status-badge.running {
  background: #dbeafe;
  color: #3b82f6;
}

.stage-status-badge.failed {
  background: #fee2e2;
  color: #ef4444;
}

.stage-config {
  margin-top: 10px;
}

.config-tag {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
  margin-right: 6px;
  margin-bottom: 4px;
}

.stage-error {
  margin-top: 10px;
}

/* 任务配置 */
.task-config {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

/* 错误信息 */
.error-info {
  margin-bottom: 20px;
}

/* ==================== 日志容器 ==================== */
.log-container {
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.log-toolbar {
  padding: 10px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  align-items: center;
  gap: 16px;
}

.log-stats {
  display: flex;
  gap: 12px;
}

.log-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.log-stat.info {
  background: #374151;
  color: #9ca3af;
}

.log-stat.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.log-stat.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.log-stat.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.log-list {
  max-height: 350px;
  overflow-y: auto;
  padding: 12px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace;
  font-size: 12px;
  border-bottom: 1px solid #2d2d2d;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-time {
  color: #6b7280;
  flex-shrink: 0;
}

.log-level-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.log-level-badge.info {
  background: #374151;
  color: #9ca3af;
}

.log-level-badge.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.log-level-badge.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.log-level-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.log-message {
  color: #e5e7eb;
  line-height: 1.5;
  word-break: break-word;
}

/* 滚动条样式 */
.log-list::-webkit-scrollbar {
  width: 8px;
}

.log-list::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-list::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.log-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
