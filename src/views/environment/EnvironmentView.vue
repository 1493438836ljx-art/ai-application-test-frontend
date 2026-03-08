<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Connection,
  Setting,
  CircleCheck,
  CircleClose,
  More,
  CopyDocument,
  Refresh,
  VideoPlay,
  Rank,
  Document,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editingId = ref('')

// 对话框标题
const dialogTitle = computed(() => (isEditMode.value ? '编辑环境配置' : '新建环境配置'))

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  baseUrl: '',
  authType: 'none',
  authConfig: {
    apiKey: '',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer',
    username: '',
    password: '',
  },
  headers: [],
  status: 'active',
})

// 认证类型选项
const authTypes = [
  { value: 'none', label: '无认证' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'custom', label: '自定义 Header' },
]

// 接口配置对话框
const apiDialogVisible = ref(false)
const apiFormRef = ref()
const isEditApiMode = ref(false)
const editingApiId = ref('')

// 接口表单数据
const apiFormData = reactive({
  name: '',
  method: 'POST',
  path: '',
  description: '',
  timeout: 30000,
  retries: 3,
  // 查询参数
  queryParams: [],
  // 请求体配置
  bodyType: 'json', // json, form, raw
  bodyTemplate: '{\n  "input": "{{input}}"\n}',
  // 响应映射（变量提取）
  responseMappings: [],
  status: 'active',
})

// HTTP 方法选项
const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// Body 类型选项
const bodyTypes = [
  { value: 'none', label: '无 Body' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form Data' },
  { value: 'raw', label: 'Raw Text' },
]

// 响应映射来源选项
const mappingSources = [
  { value: 'body', label: 'Body' },
  { value: 'header', label: 'Header' },
]

// 添加响应映射
const addResponseMapping = () => {
  apiFormData.responseMappings.push({
    source: 'body',
    varName: '',
    jsonPath: '',
  })
}

// 删除响应映射
const removeResponseMapping = (index) => {
  apiFormData.responseMappings.splice(index, 1)
}

// 环境配置列表
const environments = ref([
  {
    id: '1',
    name: '智能客服系统',
    description: '客服机器人 AI 应用，支持多轮对话和意图识别',
    baseUrl: 'https://api.customer-service.example.com',
    authType: 'bearer',
    authConfig: {
      apiKey: 'eyJhbGciOiJSUzI1NiIs****************',
      apiKeyHeader: 'Authorization',
      apiKeyPrefix: 'Bearer',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-App-Id', value: 'cs-app-001' },
    ],
    apis: [
      {
        id: 'api-1',
        name: '意图识别',
        method: 'POST',
        path: '/v1/intent/recognize',
        description: '识别用户输入的意图',
        timeout: 5000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "query": "{{input}}",\n  "context": "{{context}}"\n}',
        responseMappings: [
          { source: 'body', varName: 'intent', jsonPath: '$.data.intent' },
          { source: 'body', varName: 'confidence', jsonPath: '$.data.confidence' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-2',
        name: '对话生成',
        method: 'POST',
        path: '/v1/chat/generate',
        description: '根据意图生成回复',
        timeout: 10000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "intent": "{{last_output.intent}}",\n  "query": "{{input}}"\n}',
        responseMappings: [
          { source: 'body', varName: 'reply', jsonPath: '$.data.reply' },
        ],
        order: 2,
        status: 'active',
      },
      {
        id: 'api-3',
        name: '情感分析',
        method: 'POST',
        path: '/v1/sentiment/analyze',
        description: '分析用户情感倾向',
        timeout: 3000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "text": "{{input}}"\n}',
        responseMappings: [
          { source: 'body', varName: 'sentiment', jsonPath: '$.data.sentiment' },
        ],
        order: 3,
        status: 'active',
      },
    ],
    uiSteps: [
      {
        id: 'step-1',
        name: '打开登录页面',
        type: 'navigate',
        value: 'https://customer-service.example.com/login',
        description: '导航到客服系统登录页面',
        order: 1,
        status: 'active',
      },
      {
        id: 'step-2',
        name: '输入用户名',
        type: 'input',
        selector: '#username',
        selectorType: 'css',
        value: 'test_user',
        description: '在用户名输入框中输入测试账号',
        order: 2,
        status: 'active',
      },
      {
        id: 'step-3',
        name: '输入密码',
        type: 'input',
        selector: '#password',
        selectorType: 'css',
        value: 'test_password',
        description: '在密码输入框中输入测试密码',
        order: 3,
        status: 'active',
      },
      {
        id: 'step-4',
        name: '点击登录按钮',
        type: 'click',
        selector: '.login-btn',
        selectorType: 'css',
        description: '点击登录按钮提交表单',
        order: 4,
        status: 'active',
      },
      {
        id: 'step-5',
        name: '等待页面加载',
        type: 'wait',
        waitTime: 2000,
        description: '等待登录后的页面完全加载',
        order: 5,
        status: 'active',
      },
      {
        id: 'step-6',
        name: '验证登录成功',
        type: 'assert_text',
        selector: '.welcome-message',
        selectorType: 'css',
        value: '欢迎',
        assertType: 'contains',
        description: '验证页面显示欢迎信息',
        order: 6,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-02-26 15:30',
    testResult: 'success',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-26',
  },
  {
    id: '2',
    name: '文档问答系统',
    description: '基于 RAG 的文档问答 AI 应用',
    baseUrl: 'https://api.doc-qa.example.com',
    authType: 'api_key',
    authConfig: {
      apiKey: 'sk-doc-**********************',
      apiKeyHeader: 'X-API-Key',
      apiKeyPrefix: '',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
    ],
    apis: [
      {
        id: 'api-4',
        name: '文档检索',
        method: 'POST',
        path: '/v1/retrieve',
        description: '检索相关文档片段',
        timeout: 8000,
        retries: 2,
        queryParams: [
          { key: 'top_k', value: '5', description: '返回文档数量' },
        ],
        bodyType: 'json',
        bodyTemplate: '{\n  "query": "{{input}}",\n  "doc_type": "all"\n}',
        responseMappings: [
          { source: 'body', varName: 'documents', jsonPath: '$.data.documents' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-5',
        name: '答案生成',
        method: 'POST',
        path: '/v1/generate',
        description: '基于检索结果生成答案',
        timeout: 15000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "query": "{{input}}",\n  "documents": "{{last_output.documents}}"\n}',
        responseMappings: [
          { source: 'body', varName: 'answer', jsonPath: '$.data.answer' },
        ],
        order: 2,
        status: 'active',
      },
    ],
    uiSteps: [
      {
        id: 'step-7',
        name: '打开问答页面',
        type: 'navigate',
        value: 'https://doc-qa.example.com/qa',
        description: '打开文档问答系统',
        order: 1,
        status: 'active',
      },
      {
        id: 'step-8',
        name: '输入问题',
        type: 'input',
        selector: '#question-input',
        selectorType: 'css',
        value: '{{input}}',
        description: '输入测试问题',
        order: 2,
        status: 'active',
      },
      {
        id: 'step-9',
        name: '点击提交',
        type: 'click',
        selector: '//button[contains(text(), "提交")]',
        selectorType: 'xpath',
        description: '点击提交按钮',
        order: 3,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-02-26 14:20',
    testResult: 'success',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-26',
  },
  {
    id: '3',
    name: '智能推荐引擎',
    description: '商品推荐 AI 应用，支持个性化推荐和相似推荐',
    baseUrl: 'https://api.recommend.example.com',
    authType: 'basic',
    authConfig: {
      username: 'rec_user',
      password: '********',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-Version', value: '2.0' },
    ],
    apis: [
      {
        id: 'api-6',
        name: '用户画像',
        method: 'GET',
        path: '/v1/user/profile',
        description: '获取用户画像信息',
        timeout: 3000,
        retries: 2,
        queryParams: [
          { key: 'user_id', value: '{{env.user_id}}', description: '用户ID' },
        ],
        bodyType: 'none',
        bodyTemplate: '',
        responseMappings: [
          { source: 'body', varName: 'profile', jsonPath: '$.data' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-7',
        name: '个性化推荐',
        method: 'POST',
        path: '/v1/recommend/personal',
        description: '生成个性化推荐列表',
        timeout: 5000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "user_profile": "{{last_output.profile}}",\n  "count": 10\n}',
        responseMappings: [
          { source: 'body', varName: 'recommendations', jsonPath: '$.data.items' },
        ],
        order: 2,
        status: 'active',
      },
      {
        id: 'api-8',
        name: '相似商品',
        method: 'POST',
        path: '/v1/recommend/similar',
        description: '查找相似商品',
        timeout: 4000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "item_id": "{{env.item_id}}",\n  "count": 5\n}',
        responseMappings: [],
        order: 3,
        status: 'inactive',
      },
    ],
    uiSteps: [],
    status: 'inactive',
    lastTestTime: '2024-02-25 10:00',
    testResult: 'failed',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-25',
  },
])

// 环境列表分页
const envCurrentPage = ref(1)
const envPageSize = ref(10)

// 环境列表分页数据
const paginatedEnvironments = computed(() => {
  const start = (envCurrentPage.value - 1) * envPageSize.value
  return environments.value.slice(start, start + envPageSize.value)
})

// 环境列表总数
const envTotal = computed(() => {
  return environments.value.length
})

// 环境列表分页处理
const handleEnvPageChange = (page) => {
  envCurrentPage.value = page
}

const handleEnvSizeChange = (size) => {
  envPageSize.value = size
  envCurrentPage.value = 1
}

// 当前选中的环境（用于接口管理）
const currentEnvironment = ref(null)

// 详情页 Tab
const detailActiveTab = ref('api')

// API 接口分页
const apiCurrentPage = ref(1)
const apiPageSize = ref(10)

// UI 步骤分页
const uiStepCurrentPage = ref(1)
const uiStepPageSize = ref(10)

// API 接口分页数据
const paginatedApis = computed(() => {
  if (!currentEnvironment.value || !currentEnvironment.value.apis) return []
  const apis = [...currentEnvironment.value.apis].sort((a, b) => a.order - b.order)
  const start = (apiCurrentPage.value - 1) * apiPageSize.value
  return apis.slice(start, start + apiPageSize.value)
})

// UI 步骤分页数据
const paginatedUiSteps = computed(() => {
  if (!currentEnvironment.value || !currentEnvironment.value.uiSteps) return []
  const steps = [...currentEnvironment.value.uiSteps].sort((a, b) => a.order - b.order)
  const start = (uiStepCurrentPage.value - 1) * uiStepPageSize.value
  return steps.slice(start, start + uiStepPageSize.value)
})

// API 接口总数
const apiTotal = computed(() => {
  return currentEnvironment.value?.apis?.length || 0
})

// UI 步骤总数
const uiStepTotal = computed(() => {
  return currentEnvironment.value?.uiSteps?.length || 0
})

// API 分页处理
const handleApiPageChange = (page) => {
  apiCurrentPage.value = page
}

const handleApiSizeChange = (size) => {
  apiPageSize.value = size
  apiCurrentPage.value = 1
}

// UI 步骤分页处理
const handleUiStepPageChange = (page) => {
  uiStepCurrentPage.value = page
}

const handleUiStepSizeChange = (size) => {
  uiStepPageSize.value = size
  uiStepCurrentPage.value = 1
}

// UI 自动化步骤类型
const uiStepTypes = [
  { value: 'navigate', label: '打开页面' },
  { value: 'click', label: '点击元素' },
  { value: 'input', label: '输入文本' },
  { value: 'select', label: '选择下拉框' },
  { value: 'wait', label: '等待' },
  { value: 'assert_text', label: '断言文本' },
  { value: 'assert_element', label: '断言元素' },
  { value: 'screenshot', label: '截图' },
  { value: 'scroll', label: '滚动' },
  { value: 'hover', label: '悬停' },
]

// UI 步骤对话框
const uiStepDialogVisible = ref(false)
const uiStepFormRef = ref()
const isEditUiStepMode = ref(false)
const editingUiStepId = ref('')

// UI 步骤表单数据
const uiStepFormData = reactive({
  name: '',
  type: 'click',
  selector: '',
  selectorType: 'css', // css, xpath
  value: '',
  waitTime: 1000,
  assertType: 'equals', // equals, contains, matches
  description: '',
  status: 'active',
})

// UI 步骤表单验证规则
const uiStepFormRules = {
  name: [{ required: true, message: '请输入步骤名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择步骤类型', trigger: 'change' }],
}

// 获取 UI 步骤类型标签
const getUiStepTypeLabel = (type) => {
  const found = uiStepTypes.find(t => t.value === type)
  return found ? found.label : type
}

// 获取 UI 步骤类型颜色
const getUiStepTypeColor = (type) => {
  const colors = {
    navigate: '',
    click: 'success',
    input: 'warning',
    select: 'warning',
    wait: 'info',
    assert_text: 'danger',
    assert_element: 'danger',
    screenshot: '',
    scroll: 'info',
    hover: 'success',
  }
  return colors[type] || ''
}

// 打开新建 UI 步骤对话框
const openCreateUiStepDialog = () => {
  if (!currentEnvironment.value) return
  isEditUiStepMode.value = false
  editingUiStepId.value = ''
  resetUiStepForm()
  uiStepDialogVisible.value = true
}

// 打开编辑 UI 步骤对话框
const openEditUiStepDialog = (step) => {
  isEditUiStepMode.value = true
  editingUiStepId.value = step.id
  uiStepFormData.name = step.name
  uiStepFormData.type = step.type
  uiStepFormData.selector = step.selector || ''
  uiStepFormData.selectorType = step.selectorType || 'css'
  uiStepFormData.value = step.value || ''
  uiStepFormData.waitTime = step.waitTime || 1000
  uiStepFormData.assertType = step.assertType || 'equals'
  uiStepFormData.description = step.description || ''
  uiStepFormData.status = step.status || 'active'
  uiStepDialogVisible.value = true
}

// 重置 UI 步骤表单
const resetUiStepForm = () => {
  uiStepFormData.name = ''
  uiStepFormData.type = 'click'
  uiStepFormData.selector = ''
  uiStepFormData.selectorType = 'css'
  uiStepFormData.value = ''
  uiStepFormData.waitTime = 1000
  uiStepFormData.assertType = 'equals'
  uiStepFormData.description = ''
  uiStepFormData.status = 'active'
  uiStepFormRef.value?.resetFields()
}

// 提交 UI 步骤表单
const handleUiStepSubmit = async () => {
  if (!uiStepFormRef.value || !currentEnvironment.value) return

  await uiStepFormRef.value.validate((valid) => {
    if (valid) {
      // 验证必填字段
      if (needsSelector(uiStepFormData.type) && !uiStepFormData.selector.trim()) {
        ElMessage.warning('请输入元素选择器')
        return
      }
      if (needsValue(uiStepFormData.type) && !uiStepFormData.value.trim()) {
        ElMessage.warning('请输入值')
        return
      }

      const steps = currentEnvironment.value.uiSteps || []

      if (isEditUiStepMode.value) {
        const index = steps.findIndex(s => s.id === editingUiStepId.value)
        if (index !== -1) {
          steps[index] = {
            ...steps[index],
            name: uiStepFormData.name,
            type: uiStepFormData.type,
            selector: uiStepFormData.selector,
            selectorType: uiStepFormData.selectorType,
            value: uiStepFormData.value,
            waitTime: uiStepFormData.waitTime,
            assertType: uiStepFormData.assertType,
            description: uiStepFormData.description,
            status: uiStepFormData.status,
          }
          ElMessage.success('步骤更新成功')
        }
      } else {
        const newStep = {
          id: `step-${Date.now()}`,
          name: uiStepFormData.name,
          type: uiStepFormData.type,
          selector: uiStepFormData.selector,
          selectorType: uiStepFormData.selectorType,
          value: uiStepFormData.value,
          waitTime: uiStepFormData.waitTime,
          assertType: uiStepFormData.assertType,
          description: uiStepFormData.description,
          order: steps.length + 1,
          status: uiStepFormData.status,
        }
        steps.push(newStep)
        currentEnvironment.value.uiSteps = steps
        ElMessage.success('步骤创建成功')
      }
      uiStepDialogVisible.value = false
    }
  })
}

// 判断步骤类型是否需要选择器
const needsSelector = (type) => {
  return ['click', 'input', 'select', 'assert_text', 'assert_element', 'hover'].includes(type)
}

// 判断步骤类型是否需要值
const needsValue = (type) => {
  return ['input', 'select', 'assert_text'].includes(type)
}

// 判断步骤类型是否需要等待时间
const needsWaitTime = (type) => {
  return ['wait'].includes(type)
}

// 移动 UI 步骤顺序
const moveUiStepOrder = (step, direction) => {
  if (!currentEnvironment.value || !currentEnvironment.value.uiSteps) return

  const steps = currentEnvironment.value.uiSteps
  const index = steps.findIndex(s => s.id === step.id)
  if (index === -1) return

  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= steps.length) return

  const temp = steps[index].order
  steps[index].order = steps[newIndex].order
  steps[newIndex].order = temp

  steps.sort((a, b) => a.order - b.order)
  ElMessage.success('顺序已调整')
}

// 切换 UI 步骤状态
const toggleUiStepStatus = (step) => {
  step.status = step.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${step.status === 'active' ? '启用' : '禁用'}步骤「${step.name}」`)
}

// 删除 UI 步骤
const handleDeleteUiStep = (step) => {
  ElMessageBox.confirm(`确定要删除步骤「${step.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (!currentEnvironment.value) return
    const index = currentEnvironment.value.uiSteps.findIndex(s => s.id === step.id)
    if (index !== -1) {
      currentEnvironment.value.uiSteps.splice(index, 1)
      currentEnvironment.value.uiSteps.forEach((s, i) => {
        s.order = i + 1
      })
      ElMessage.success('删除成功')
    }
  })
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  baseUrl: [
    { required: true, message: '请输入 Base URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的 URL', trigger: 'blur' },
  ],
}

// 接口表单验证规则
const apiFormRules = {
  name: [
    { required: true, message: '请输入接口名称', trigger: 'blur' },
  ],
  path: [
    { required: true, message: '请输入接口路径', trigger: 'blur' },
  ],
}

// 获取认证类型标签
const getAuthTypeLabel = (type) => {
  const found = authTypes.find(t => t.value === type)
  return found ? found.label : type
}

// 获取状态标签类型
const getStatusType = (status) => {
  return status === 'active' ? 'success' : 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return status === 'active' ? '已启用' : '已禁用'
}

// 获取测试结果图标
const getTestResultIcon = (result) => {
  return result === 'success' ? CircleCheck : CircleClose
}

// 获取测试结果颜色
const getTestResultColor = (result) => {
  return result === 'success' ? '#67c23a' : '#f56c6c'
}

// 获取方法标签颜色
const getMethodColor = (method) => {
  const colors = {
    GET: '#67c23a',
    POST: '#409eff',
    PUT: '#e6a23c',
    PATCH: '#909399',
    DELETE: '#f56c6c',
  }
  return colors[method] || '#909399'
}

// 添加请求头
const addHeader = () => {
  formData.headers.push({ key: '', value: '' })
}

// 删除请求头
const removeHeader = (index) => {
  formData.headers.splice(index, 1)
}

// 添加参数
const addParam = () => {
  apiFormData.queryParams.push({ key: '', value: '', description: '' })
}

// 删除参数
const removeParam = (index) => {
  apiFormData.queryParams.splice(index, 1)
}

// 打开新建环境对话框
const openCreateDialog = () => {
  isEditMode.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

// 打开编辑环境对话框
const openEditDialog = (env) => {
  isEditMode.value = true
  editingId.value = env.id
  formData.name = env.name
  formData.description = env.description
  formData.baseUrl = env.baseUrl
  formData.authType = env.authType
  formData.authConfig = { ...env.authConfig }
  formData.headers = env.headers ? env.headers.map(h => ({ ...h })) : []
  formData.status = env.status
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.baseUrl = ''
  formData.authType = 'none'
  formData.authConfig = {
    apiKey: '',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer',
    username: '',
    password: '',
  }
  formData.headers = []
  formData.status = 'active'
  formRef.value?.resetFields()
}

// 提交环境表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEditMode.value) {
        const index = environments.value.findIndex(e => e.id === editingId.value)
        if (index !== -1) {
          environments.value[index] = {
            ...environments.value[index],
            name: formData.name,
            description: formData.description,
            baseUrl: formData.baseUrl,
            authType: formData.authType,
            authConfig: { ...formData.authConfig },
            headers: [...formData.headers],
            status: formData.status,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
          ElMessage.success('环境配置更新成功')
        }
      } else {
        const newEnv = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          baseUrl: formData.baseUrl,
          authType: formData.authType,
          authConfig: { ...formData.authConfig },
          headers: [...formData.headers],
          apis: [],
          status: formData.status,
          testResult: 'pending',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        environments.value.unshift(newEnv)
        ElMessage.success('环境配置创建成功')
      }
      dialogVisible.value = false
    }
  })
}

// 取消环境表单
const handleCancel = () => {
  dialogVisible.value = false
}

// 测试连接
const testConnection = async (env) => {
  ElMessage.info(`正在测试「${env.name}」的连接...`)

  setTimeout(() => {
    const index = environments.value.findIndex(e => e.id === env.id)
    if (index !== -1) {
      const success = Math.random() > 0.3
      environments.value[index].testResult = success ? 'success' : 'failed'
      environments.value[index].lastTestTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

      if (success) {
        ElMessage.success(`「${env.name}」连接测试成功`)
      } else {
        ElMessage.error(`「${env.name}」连接测试失败，请检查配置`)
      }
    }
  }, 1500)
}

// 切换状态
const toggleStatus = (env) => {
  const index = environments.value.findIndex(e => e.id === env.id)
  if (index !== -1) {
    environments.value[index].status = env.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`已${environments.value[index].status === 'active' ? '启用' : '禁用'}「${env.name}」`)
  }
}

// 删除环境
const handleDelete = (env) => {
  ElMessageBox.confirm(`确定要删除环境「${env.name}」吗？删除后无法恢复。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = environments.value.findIndex(e => e.id === env.id)
    if (index !== -1) {
      environments.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// ========== 接口管理 ==========

// 打开接口管理面板
const openApiPanel = (env) => {
  currentEnvironment.value = env
}

// 关闭接口管理面板
const closeApiPanel = () => {
  currentEnvironment.value = null
}

// 打开新建接口对话框
const openCreateApiDialog = () => {
  if (!currentEnvironment.value) return
  isEditApiMode.value = false
  editingApiId.value = ''
  resetApiForm()
  apiDialogVisible.value = true
}

// 打开编辑接口对话框
const openEditApiDialog = (api) => {
  isEditApiMode.value = true
  editingApiId.value = api.id
  apiFormData.name = api.name
  apiFormData.method = api.method
  apiFormData.path = api.path
  apiFormData.description = api.description || ''
  apiFormData.timeout = api.timeout || 30000
  apiFormData.retries = api.retries || 3
  apiFormData.queryParams = api.queryParams ? api.queryParams.map(q => ({ ...q })) : []
  apiFormData.bodyType = api.bodyType || 'json'
  apiFormData.bodyTemplate = api.bodyTemplate || '{\n  "input": "{{input}}"\n}'
  apiFormData.responseMappings = api.responseMappings ? api.responseMappings.map(m => ({ ...m })) : []
  apiFormData.status = api.status || 'active'
  apiDialogVisible.value = true
}

// 重置接口表单
const resetApiForm = () => {
  apiFormData.name = ''
  apiFormData.method = 'POST'
  apiFormData.path = ''
  apiFormData.description = ''
  apiFormData.timeout = 30000
  apiFormData.retries = 3
  apiFormData.queryParams = []
  apiFormData.bodyType = 'json'
  apiFormData.bodyTemplate = '{\n  "input": "{{input}}"\n}'
  apiFormData.responseMappings = []
  apiFormData.status = 'active'
  apiFormRef.value?.resetFields()
}

// 提交接口表单
const handleApiSubmit = async () => {
  if (!apiFormRef.value || !currentEnvironment.value) return

  await apiFormRef.value.validate((valid) => {
    if (valid) {
      // 验证 Params 参数名
      const emptyParam = apiFormData.queryParams.find(p => !p.key || !p.key.trim())
      if (emptyParam) {
        ElMessage.warning('Params 参数名不能为空')
        return
      }

      const apis = currentEnvironment.value.apis || []

      if (isEditApiMode.value) {
        const index = apis.findIndex(a => a.id === editingApiId.value)
        if (index !== -1) {
          apis[index] = {
            ...apis[index],
            name: apiFormData.name,
            method: apiFormData.method,
            path: apiFormData.path,
            description: apiFormData.description,
            timeout: apiFormData.timeout,
            retries: apiFormData.retries,
            queryParams: [...apiFormData.queryParams],
            bodyType: apiFormData.bodyType,
            bodyTemplate: apiFormData.bodyTemplate,
            responseMappings: [...apiFormData.responseMappings],
            status: apiFormData.status,
          }
          ElMessage.success('接口更新成功')
        }
      } else {
        const newApi = {
          id: `api-${Date.now()}`,
          name: apiFormData.name,
          method: apiFormData.method,
          path: apiFormData.path,
          description: apiFormData.description,
          timeout: apiFormData.timeout,
          retries: apiFormData.retries,
          queryParams: [...apiFormData.queryParams],
          bodyType: apiFormData.bodyType,
          bodyTemplate: apiFormData.bodyTemplate,
          responseMappings: [...apiFormData.responseMappings],
          order: apis.length + 1,
          status: apiFormData.status,
        }
        apis.push(newApi)
        currentEnvironment.value.apis = apis
        ElMessage.success('接口创建成功')
      }
      apiDialogVisible.value = false
    }
  })
}

// 移动接口顺序
const moveApiOrder = (api, direction) => {
  if (!currentEnvironment.value || !currentEnvironment.value.apis) return

  const apis = currentEnvironment.value.apis
  const index = apis.findIndex(a => a.id === api.id)
  if (index === -1) return

  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= apis.length) return

  // 交换顺序
  const temp = apis[index].order
  apis[index].order = apis[newIndex].order
  apis[newIndex].order = temp

  // 重新排序数组
  apis.sort((a, b) => a.order - b.order)
  ElMessage.success('顺序已调整')
}

// 删除接口
const handleDeleteApi = (api) => {
  ElMessageBox.confirm(`确定要删除接口「${api.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    if (!currentEnvironment.value) return
    const index = currentEnvironment.value.apis.findIndex(a => a.id === api.id)
    if (index !== -1) {
      currentEnvironment.value.apis.splice(index, 1)
      // 重新排序
      currentEnvironment.value.apis.forEach((a, i) => {
        a.order = i + 1
      })
      ElMessage.success('删除成功')
    }
  })
}

// 切换接口状态
const toggleApiStatus = (api) => {
  api.status = api.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${api.status === 'active' ? '启用' : '禁用'}接口「${api.name}」`)
}
</script>

<template>
  <div class="environment-page">
    <!-- 环境列表视图 -->
    <template v-if="!currentEnvironment">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>环境管理</h2>
          <span class="env-count">共 {{ environments.length }} 个环境配置</span>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建环境</el-button>
      </div>

      <!-- 提示信息 -->
      <el-alert
        title="环境配置说明"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          配置 AI 应用的推理接口环境，支持多个接口按顺序调用。每个环境可包含多个 API 接口，系统将按配置的顺序依次调用。
        </template>
      </el-alert>

      <!-- 环境配置列表 -->
      <div class="env-grid" v-if="envTotal > 0">
        <el-card v-for="env in paginatedEnvironments" :key="env.id" class="env-card" shadow="hover">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="env-icon">
              <el-icon :size="24"><Connection /></el-icon>
            </div>
            <div class="title-area">
              <div class="title-row">
                <h3 class="env-name">{{ env.name }}</h3>
                <el-tag :type="getStatusType(env.status)" size="small">
                  {{ getStatusText(env.status) }}
                </el-tag>
              </div>
              <div class="env-meta">
                <span class="meta-item">
                  <el-icon><Rank /></el-icon>
                  {{ env.apis?.length || 0 }} 个接口
                </span>
                <span class="meta-item">{{ getAuthTypeLabel(env.authType) }}</span>
              </div>
            </div>
            <el-dropdown trigger="click" class="card-dropdown" @click.stop>
              <el-button class="more-btn" :icon="More" circle size="small" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openApiPanel(env)">
                    <el-icon><Setting /></el-icon>
                    管理接口
                  </el-dropdown-item>
                  <el-dropdown-item @click="testConnection(env)">
                    <el-icon><Refresh /></el-icon>
                    测试连接
                  </el-dropdown-item>
                  <el-dropdown-item @click="toggleStatus(env)">
                    <el-icon><VideoPlay /></el-icon>
                    {{ env.status === 'active' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="openEditDialog(env)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(env)">
                    <span style="color: #f56c6c">
                      <el-icon><Delete /></el-icon>
                      删除
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <p class="env-description">{{ env.description }}</p>
            <div class="info-row">
              <span class="info-label">Base URL</span>
              <span class="info-value url-text" :title="env.baseUrl">{{ env.baseUrl }}</span>
            </div>

            <!-- 接口预览 -->
            <div class="api-preview" v-if="env.apis && env.apis.length > 0">
              <div class="preview-title">调用顺序</div>
              <div class="api-flow">
                <template v-for="(api, index) in env.apis.slice(0, 3)" :key="api.id">
                  <div class="api-node" :class="{ disabled: api.status !== 'active' }">
                    <span class="api-order">{{ api.order }}</span>
                    <span class="api-name">{{ api.name }}</span>
                  </div>
                  <span v-if="index < Math.min(env.apis.length, 3) - 1" class="flow-arrow">→</span>
                </template>
                <span v-if="env.apis.length > 3" class="flow-more">+{{ env.apis.length - 3 }}</span>
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <div class="test-info">
              <el-icon :color="getTestResultColor(env.testResult)">
                <component :is="getTestResultIcon(env.testResult)" />
              </el-icon>
              <span class="test-time">{{ env.lastTestTime || '未测试' }}</span>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="openApiPanel(env)">管理接口</el-button>
              <el-button type="primary" size="small" @click="openEditDialog(env)">编辑</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="envTotal > 0">
        <el-pagination
          v-model:current-page="envCurrentPage"
          v-model:page-size="envPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="envTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleEnvSizeChange"
          @current-change="handleEnvPageChange"
        />
      </div>

      <!-- 空状态 -->
      <el-empty v-if="envTotal === 0" description="暂无环境配置，点击上方按钮创建" />
    </template>

    <!-- 接口管理视图 -->
    <template v-else>
      <div class="api-panel">
        <!-- 返回按钮和标题 -->
        <div class="panel-header">
          <div class="header-left">
            <el-button :icon="ArrowUp" @click="closeApiPanel" circle style="transform: rotate(-90deg)" />
            <div class="header-info">
              <h2>{{ currentEnvironment.name }}</h2>
              <p class="header-desc">{{ currentEnvironment.description }}</p>
            </div>
          </div>
        </div>

        <!-- Base URL 信息 -->
        <el-alert
          :title="`Base URL: ${currentEnvironment.baseUrl}`"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        />

        <!-- Tab 切换 -->
        <el-tabs v-model="detailActiveTab" class="detail-tabs">
          <el-tab-pane label="API 接口" name="api">
            <div class="tab-header">
              <span>配置 AI 应用的推理接口，支持多接口按顺序调用</span>
              <el-button type="primary" :icon="Plus" @click="openCreateApiDialog">添加接口</el-button>
            </div>
            <!-- 接口列表 -->
            <div class="api-list" v-if="currentEnvironment.apis && currentEnvironment.apis.length > 0">
              <el-card v-for="api in paginatedApis" :key="api.id" class="api-card" shadow="hover">
                <div class="api-card-content">
                  <div class="api-order-badge">{{ api.order }}</div>
                  <div class="api-info">
                    <div class="api-header">
                      <el-tag :color="getMethodColor(api.method)" effect="dark" size="small" class="method-tag">
                        {{ api.method }}
                      </el-tag>
                      <span class="api-name">{{ api.name }}</span>
                      <el-tag :type="getStatusType(api.status)" size="small">
                        {{ getStatusText(api.status) }}
                      </el-tag>
                    </div>
                    <div class="api-path">{{ api.path }}</div>
                    <div class="api-desc" v-if="api.description">{{ api.description }}</div>
                    <div class="api-meta">
                      <span>超时: {{ api.timeout }}ms</span>
                      <span>重试: {{ api.retries }}次</span>
                    </div>
                  </div>
                  <div class="api-actions">
                    <el-button-group>
                      <el-button size="small" :icon="ArrowUp" @click="moveApiOrder(api, 'up')" :disabled="api.order === 1" />
                      <el-button size="small" :icon="ArrowDown" @click="moveApiOrder(api, 'down')" :disabled="api.order === currentEnvironment.apis.length" />
                    </el-button-group>
                    <el-button size="small" @click="toggleApiStatus(api)">
                      {{ api.status === 'active' ? '禁用' : '启用' }}
                    </el-button>
                    <el-button size="small" @click="openEditApiDialog(api)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteApi(api)">删除</el-button>
                  </div>
                </div>
              </el-card>
              <!-- 分页 -->
              <div class="pagination-wrapper" v-if="apiTotal > 0">
                <el-pagination
                  v-model:current-page="apiCurrentPage"
                  v-model:page-size="apiPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="apiTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleApiSizeChange"
                  @current-change="handleApiPageChange"
                />
              </div>
            </div>
            <el-empty v-else description="暂无接口配置，点击上方按钮添加" />
          </el-tab-pane>

          <el-tab-pane label="UI 自动化" name="ui">
            <div class="tab-header">
              <span>配置 UI 自动化测试步骤，模拟用户操作测试应用</span>
              <el-button type="primary" :icon="Plus" @click="openCreateUiStepDialog">添加步骤</el-button>
            </div>
            <!-- UI 步骤列表 -->
            <div class="ui-steps-list" v-if="currentEnvironment.uiSteps && currentEnvironment.uiSteps.length > 0">
              <el-card v-for="step in paginatedUiSteps" :key="step.id" class="ui-step-card" shadow="hover">
                <div class="ui-step-content">
                  <div class="ui-step-order">{{ step.order }}</div>
                  <div class="ui-step-info">
                    <div class="ui-step-header">
                      <el-tag :type="getUiStepTypeColor(step.type)" size="small">
                        {{ getUiStepTypeLabel(step.type) }}
                      </el-tag>
                      <span class="ui-step-name">{{ step.name }}</span>
                      <el-tag :type="getStatusType(step.status)" size="small">
                        {{ getStatusText(step.status) }}
                      </el-tag>
                    </div>
                    <div class="ui-step-detail" v-if="step.selector">
                      <span class="detail-label">选择器:</span>
                      <code>{{ step.selector }}</code>
                    </div>
                    <div class="ui-step-detail" v-if="step.value">
                      <span class="detail-label">值:</span>
                      <span>{{ step.value }}</span>
                    </div>
                    <div class="ui-step-detail" v-if="step.description">
                      <span class="detail-label">描述:</span>
                      <span>{{ step.description }}</span>
                    </div>
                  </div>
                  <div class="ui-step-actions">
                    <el-button-group>
                      <el-button size="small" :icon="ArrowUp" @click="moveUiStepOrder(step, 'up')" :disabled="step.order === 1" />
                      <el-button size="small" :icon="ArrowDown" @click="moveUiStepOrder(step, 'down')" :disabled="step.order === currentEnvironment.uiSteps.length" />
                    </el-button-group>
                    <el-button size="small" @click="toggleUiStepStatus(step)">
                      {{ step.status === 'active' ? '禁用' : '启用' }}
                    </el-button>
                    <el-button size="small" @click="openEditUiStepDialog(step)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteUiStep(step)">删除</el-button>
                  </div>
                </div>
              </el-card>
              <!-- 分页 -->
              <div class="pagination-wrapper" v-if="uiStepTotal > 0">
                <el-pagination
                  v-model:current-page="uiStepCurrentPage"
                  v-model:page-size="uiStepPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="uiStepTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleUiStepSizeChange"
                  @current-change="handleUiStepPageChange"
                />
              </div>
            </div>
            <el-empty v-else description="暂无 UI 自动化步骤，点击上方按钮添加" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- 新建/编辑环境对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="环境名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入环境名称，如：智能客服系统"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入环境描述"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="Base URL" prop="baseUrl">
          <el-input
            v-model="formData.baseUrl"
            placeholder="请输入 API Base URL，如：https://api.example.com"
          >
            <template #prepend>
              <el-icon><Connection /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="认证方式">
          <el-select v-model="formData.authType" style="width: 100%">
            <el-option
              v-for="auth in authTypes"
              :key="auth.value"
              :label="auth.label"
              :value="auth.value"
            />
          </el-select>
        </el-form-item>

        <!-- API Key 认证配置 -->
        <template v-if="formData.authType === 'api_key' || formData.authType === 'bearer' || formData.authType === 'custom'">
          <el-form-item label="Header 名称">
            <el-input v-model="formData.authConfig.apiKeyHeader" placeholder="如：Authorization、X-API-Key" />
          </el-form-item>
          <el-form-item label="前缀">
            <el-input v-model="formData.authConfig.apiKeyPrefix" placeholder="如：Bearer（可选）" />
          </el-form-item>
          <el-form-item label="API Key">
            <el-input v-model="formData.authConfig.apiKey" type="password" show-password placeholder="请输入 API Key" />
          </el-form-item>
        </template>

        <!-- Basic Auth 配置 -->
        <template v-if="formData.authType === 'basic'">
          <el-form-item label="用户名">
            <el-input v-model="formData.authConfig.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="formData.authConfig.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
        </template>

        <!-- 自定义请求头 -->
        <el-form-item label="自定义请求头">
          <div class="headers-config">
            <div v-for="(header, index) in formData.headers" :key="index" class="header-row">
              <el-input v-model="header.key" placeholder="Header Key" style="width: 150px" />
              <el-input v-model="header.value" placeholder="Header Value" style="flex: 1" />
              <el-button :icon="Delete" circle @click="removeHeader(index)" />
            </div>
            <el-button type="primary" link @click="addHeader">
              <el-icon><Plus /></el-icon>
              添加请求头
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑接口对话框 -->
    <el-dialog
      v-model="apiDialogVisible"
      :title="isEditApiMode ? '编辑接口' : '添加接口'"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="apiFormRef"
        :model="apiFormData"
        :rules="apiFormRules"
        label-width="100px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="接口名称" prop="name">
              <el-input v-model="apiFormData.name" placeholder="如：意图识别" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="方法" prop="method">
              <el-select v-model="apiFormData.method" style="width: 100%">
                <el-option v-for="m in httpMethods" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select v-model="apiFormData.status" style="width: 100%">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="接口路径" prop="path">
          <el-input v-model="apiFormData.path" placeholder="如：/v1/intent/recognize">
            <template #prepend>{{ currentEnvironment?.baseUrl }}</template>
          </el-input>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="apiFormData.description" placeholder="接口功能描述" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="超时时间">
              <el-input-number v-model="apiFormData.timeout" :min="1000" :max="120000" :step="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重试次数">
              <el-input-number v-model="apiFormData.retries" :min="0" :max="10" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <span>Params</span>
          <el-tooltip content="URL 查询参数，会拼接到 URL 后面，如 ?key1=value1&key2=value2" placement="top">
            <el-icon style="margin-left: 4px; cursor: help;"><Setting /></el-icon>
          </el-tooltip>
        </el-divider>

        <el-form-item label="">
          <div class="params-config">
            <div v-for="(param, index) in apiFormData.queryParams" :key="index" class="param-row">
              <el-input v-model="param.key" placeholder="参数名" style="width: 120px" />
              <el-input v-model="param.value" placeholder="值（支持 {{变量}}）" style="flex: 1" />
              <el-input v-model="param.description" placeholder="说明（可选）" style="width: 120px" />
              <el-button :icon="Delete" circle @click="removeParam(index)" />
            </div>
            <el-button type="primary" link @click="addParam">
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">
          <span>Body</span>
          <el-tooltip content="请求体内容，POST/PUT/PATCH 请求时发送" placement="top">
            <el-icon style="margin-left: 4px; cursor: help;"><Setting /></el-icon>
          </el-tooltip>
        </el-divider>

        <el-form-item label="Body 类型">
          <el-radio-group v-model="apiFormData.bodyType">
            <el-radio-button v-for="bt in bodyTypes" :key="bt.value" :value="bt.value">
              {{ bt.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Body 内容" v-if="apiFormData.bodyType !== 'none'">
          <div class="body-template-config">
            <el-input
              v-model="apiFormData.bodyTemplate"
              type="textarea"
              :rows="6"
              :placeholder="apiFormData.bodyType === 'json' ? 'JSON 格式的请求体，支持 {{变量}} 占位符' : '请求体内容'"
            />
            <div class="variable-help">
              <span class="help-label">占位符：可来自数据集的列名</span><code v-pre>{{d.colName}}</code><span class="help-label">、环境变量</span><code v-pre>{{env.name}}</code><span class="help-label">、已执行接口的响应输出</span><code v-pre>{{last_output}}</code>
            </div>
          </div>
        </el-form-item>

        <el-divider content-position="left">
          <span>响应映射</span>
          <el-tooltip content="从响应中提取变量，供后续接口使用" placement="top">
            <el-icon style="margin-left: 4px; cursor: help;"><Setting /></el-icon>
          </el-tooltip>
        </el-divider>

        <el-form-item label="">
          <div class="response-mappings-config">
            <div v-for="(mapping, index) in apiFormData.responseMappings" :key="index" class="mapping-row">
              <el-select v-model="mapping.source" style="width: 90px">
                <el-option v-for="s in mappingSources" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
              <el-input v-model="mapping.varName" placeholder="变量名" style="width: 120px" />
              <el-input v-model="mapping.jsonPath" placeholder="JsonPath 表达式，如 $.data.result" style="flex: 1" />
              <el-button :icon="Delete" circle @click="removeResponseMapping(index)" />
            </div>
            <el-button type="primary" link @click="addResponseMapping">
              <el-icon><Plus /></el-icon>
              添加映射
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="apiDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApiSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑 UI 步骤对话框 -->
    <el-dialog
      v-model="uiStepDialogVisible"
      :title="isEditUiStepMode ? '编辑步骤' : '添加步骤'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="uiStepFormRef"
        :model="uiStepFormData"
        :rules="uiStepFormRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="步骤名称" prop="name">
          <el-input v-model="uiStepFormData.name" placeholder="如：点击登录按钮" />
        </el-form-item>

        <el-form-item label="步骤类型" prop="type">
          <el-select v-model="uiStepFormData.type" style="width: 100%">
            <el-option
              v-for="t in uiStepTypes"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>

        <!-- 选择器配置（部分步骤类型需要） -->
        <template v-if="needsSelector(uiStepFormData.type)">
          <el-form-item label="选择器类型">
            <el-radio-group v-model="uiStepFormData.selectorType">
              <el-radio value="css">CSS</el-radio>
              <el-radio value="xpath">XPath</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="元素选择器">
            <el-input
              v-model="uiStepFormData.selector"
              :placeholder="uiStepFormData.selectorType === 'css' ? '如：#login-btn, .submit-button' : '如：//button[@id=&quot;login&quot;]'"
            />
          </el-form-item>
        </template>

        <!-- 值配置（部分步骤类型需要） -->
        <template v-if="needsValue(uiStepFormData.type)">
          <el-form-item :label="uiStepFormData.type === 'input' ? '输入内容' : (uiStepFormData.type === 'select' ? '选择值' : '期望值')">
            <el-input v-model="uiStepFormData.value" placeholder="请输入值" />
          </el-form-item>
          <el-form-item label="断言方式" v-if="uiStepFormData.type === 'assert_text'">
            <el-select v-model="uiStepFormData.assertType" style="width: 100%">
              <el-option label="等于" value="equals" />
              <el-option label="包含" value="contains" />
              <el-option label="匹配正则" value="matches" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 等待时间配置 -->
        <template v-if="needsWaitTime(uiStepFormData.type)">
          <el-form-item label="等待时间">
            <el-input-number v-model="uiStepFormData.waitTime" :min="100" :max="60000" :step="100" style="width: 100%" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">毫秒</span>
          </el-form-item>
        </template>

        <!-- 导航类型需要 URL -->
        <template v-if="uiStepFormData.type === 'navigate'">
          <el-form-item label="目标 URL">
            <el-input v-model="uiStepFormData.value" placeholder="如：https://example.com/login" />
          </el-form-item>
        </template>

        <!-- 滚动类型需要方向 -->
        <template v-if="uiStepFormData.type === 'scroll'">
          <el-form-item label="滚动方向">
            <el-select v-model="uiStepFormData.value" style="width: 100%">
              <el-option label="向上" value="up" />
              <el-option label="向下" value="down" />
              <el-option label="到顶部" value="top" />
              <el-option label="到底部" value="bottom" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item label="描述说明">
          <el-input
            v-model="uiStepFormData.description"
            type="textarea"
            :rows="2"
            placeholder="步骤的详细说明（可选）"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="uiStepFormData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uiStepDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUiStepSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.environment-page {
  padding: 24px;
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
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.env-count {
  font-size: 14px;
  color: #909399;
}

.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.env-card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.env-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
  position: relative;
}

.env-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.title-area {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.env-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.env-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-dropdown {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.env-card:hover .card-dropdown {
  opacity: 1;
}

.more-btn {
  border: none;
  background: transparent;
}

.card-content {
  margin-bottom: 16px;
}

.env-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  width: 70px;
  flex-shrink: 0;
  font-size: 12px;
  color: #909399;
}

.info-value {
  flex: 1;
  font-size: 12px;
  color: #606266;
}

.url-text {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.preview-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.api-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.api-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
}

.api-node.disabled {
  background: #f4f4f5;
  color: #909399;
}

.api-order {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.api-node.disabled .api-order {
  background: #909399;
}

.api-name {
  color: #303133;
}

.flow-arrow {
  color: #c0c4cc;
  font-size: 14px;
}

.flow-more {
  font-size: 12px;
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.test-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* 接口管理面板 */
.api-panel {
  min-height: calc(100vh - 200px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.panel-header .header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.panel-header .header-info h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.panel-header .header-desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-card {
  border-radius: 8px;
}

.api-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.api-order-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.api-info {
  flex: 1;
  min-width: 0;
}

.api-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.method-tag {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
}

.api-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.api-path {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.api-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.api-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.api-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Headers 配置 */
.headers-config {
  width: 100%;
}

.header-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

/* Params 配置 */
.params-config {
  width: 100%;
}

.param-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

/* Body Template 配置 */
.body-template-config {
  width: 100%;
}

/* 响应映射配置 */
.response-mappings-config {
  width: 100%;
}

.mapping-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

/* 变量帮助提示 */
.variable-help {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.variable-help .help-label {
  color: #909399;
}

.variable-help code {
  background: #e4e7ed;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  color: #409eff;
  margin: 0 2px;
}

/* Tab 样式 */
.detail-tabs {
  margin-top: 16px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

/* UI 步骤列表样式 */
.ui-steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ui-step-card {
  border-radius: 8px;
}

.ui-step-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.ui-step-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.ui-step-info {
  flex: 1;
  min-width: 0;
}

.ui-step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.ui-step-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.ui-step-detail {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ui-step-detail .detail-label {
  color: #909399;
  flex-shrink: 0;
}

.ui-step-detail code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #409eff;
}

.ui-step-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
