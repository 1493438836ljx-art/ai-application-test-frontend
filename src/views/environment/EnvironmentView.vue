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
  Collection,
  ArrowRight,
  DataAnalysis,
  QuestionFilled,
  InfoFilled,
  UploadFilled,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import JsonEditor from '@/components/JsonEditor.vue'

const router = useRouter()

// 数据字典列表（模拟数据，实际应该从共享状态或API获取）
const dataDictionaries = ref([
  {
    id: 'dict-1',
    name: '通用对话测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'input', label: '输入', type: 'string' },
      { key: 'expectedOutput', label: '期望输出', type: 'string' },
    ],
  },
  {
    id: 'dict-2',
    name: '代码生成测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
    ],
  },
  {
    id: 'dict-3',
    name: '文本摘要测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'originalText', label: '原文', type: 'string' },
      { key: 'expectedSummary', label: '期望摘要', type: 'string' },
    ],
  },
])

// 根据字典ID获取字典名称
const getDictionaryName = (dictionaryId) => {
  if (!dictionaryId) return ''
  const dict = dataDictionaries.value.find(d => d.id === dictionaryId)
  return dict ? dict.name : ''
}

// 跳转到数据字典详情
const goToDictionaryDetail = (id) => {
  router.push(`/dictionary/${id}`)
}

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
  dictionaryId: '', // 关联的数据字典ID
  status: 'active',
})

// 接口配置对话框
const apiDialogVisible = ref(false)
const apiFormRef = ref()
const isEditApiMode = ref(false)
const editingApiId = ref('')
const apiConfigActiveTab = ref('params') // 右侧配置面板的当前标签页
const bodyJsonEditorRef = ref() // Body JSON 编辑器引用
const wsJsonEditorRef = ref() // WebSocket JSON 编辑器引用

// 接口表单数据
const apiFormData = reactive({
  name: '',
  method: 'POST',
  protocol: 'https', // 协议类型：https, http, ws
  path: '', // 接口路径（主机+路径，如：api.example.com/v1/chat）
  description: '',
  timeout: 30000,
  retries: 3,
  // 查询参数
  queryParams: [],
  // 请求体配置
  bodyType: 'json', // none, json, form, raw
  bodyTemplate: '{\n  "input": "{{input}}"\n}',
  formDataFields: [], // Form Data 键值对
  rawText: '', // Raw Text 内容
  // 响应映射（变量提取）
  responseMappings: [],
  // 执行次数配置
  executionMode: 'single', // single: 单次, withDataset: 随数据集, custom: 自定义
  executionCount: 1,
  // 指标采集配置
  metricsCollection: {
    ttft: false, // 首Token时间（Time of First Token）
    tpot: false, // 每个输出Token时间（Time Per Output Token）
    e2eLatency: false, // 端到端延迟（E2E Latency）
  },
  // WebSocket 配置
  wsConfig: {
    messageTemplate: '{\n  "input": "{{input}}"\n}',
    messageType: 'text', // text, json, file
    file: null, // 文件对象（当 messageType 为 file 时使用）
  },
  status: 'active',
})

// 协议选项
const protocolOptions = [
  { value: 'https', label: 'https' },
  { value: 'http', label: 'http' },
  { value: 'ws', label: 'ws' },
]

// WebSocket 文件上传相关
const wsFileUploadRef = ref()
const wsFileList = ref([])

// WebSocket 文件上传处理
const handleWsFileChange = (file, fileList) => {
  wsFileList.value = fileList
  if (file && file.raw) {
    apiFormData.wsConfig.file = file.raw
  }
}

const handleWsFileRemove = (file, fileList) => {
  wsFileList.value = fileList
  apiFormData.wsConfig.file = null
}

// 指标采集选项
const metricsOptions = [
  {
    value: 'ttft',
    label: '首Token时间（TTFT）',
    description: 'Time of First Token：从客户端发送请求到接收到返回的第一个Token所花费的时间',
  },
  {
    value: 'tpot',
    label: '每个输出Token时间（TPOT）',
    description: '模型生成每个输出Token所需要的平均时间，单位：毫秒/Token',
  },
  {
    value: 'e2eLatency',
    label: '端到端延迟（E2E Latency）',
    description: '从发送请求到接收完整响应的总耗时',
  },
]

// 指标采集 checkbox group 计算属性
const metricsCheckGroup = computed({
  get: () => {
    const result = []
    if (apiFormData.metricsCollection.ttft) result.push('ttft')
    if (apiFormData.metricsCollection.tpot) result.push('tpot')
    if (apiFormData.metricsCollection.e2eLatency) result.push('e2eLatency')
    return result
  },
  set: (val) => {
    apiFormData.metricsCollection.ttft = val.includes('ttft')
    apiFormData.metricsCollection.tpot = val.includes('tpot')
    apiFormData.metricsCollection.e2eLatency = val.includes('e2eLatency')
  },
})

// 执行次数选项
const executionModeOptions = [
  { value: 'single', label: '单次' },
  { value: 'withDataset', label: '随数据集' },
  { value: 'custom', label: '自定义' },
]

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
    appendToDataset: false,
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
    dictionaryId: 'dict-1',
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
    plugins: [
      {
        id: 'plugin-1',
        name: '响应延迟采集',
        type: 'metric',
        description: '采集接口响应延迟数据',
        config: {
          metricType: 'latency',
          unit: 'ms',
          aggregation: 'avg',
        },
        order: 1,
        status: 'active',
      },
      {
        id: 'plugin-2',
        name: 'Token 用量统计',
        type: 'metric',
        description: '统计 Token 使用量',
        config: {
          metricType: 'tokens',
          unit: 'tokens',
          aggregation: 'sum',
        },
        order: 2,
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
    dictionaryId: 'dict-2',
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
    plugins: [
      {
        id: 'plugin-3',
        name: '调用成本统计',
        type: 'metric',
        description: '统计 API 调用成本',
        config: {
          metricType: 'cost',
          unit: 'USD',
          aggregation: 'sum',
        },
        order: 1,
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
    dictionaryId: 'dict-3',
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
    plugins: [],
    status: 'inactive',
    lastTestTime: '2024-02-25 10:00',
    testResult: 'failed',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-25',
  },
  {
    id: '4',
    name: '智能写作助手',
    description: 'AI 写作辅助应用，支持内容生成、润色和风格转换',
    baseUrl: 'https://api.writing-assistant.example.com',
    authType: 'bearer',
    authConfig: {
      apiKey: 'eyJhbGciOiJSUzI1NiIs****************',
      apiKeyHeader: 'Authorization',
      apiKeyPrefix: 'Bearer',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-App-Id', value: 'write-app-001' },
    ],
    dictionaryId: 'dict-1',
    apis: [
      {
        id: 'api-9',
        name: '内容生成',
        method: 'POST',
        path: '/v1/generate',
        description: '根据提示生成内容',
        timeout: 10000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "prompt": "{{input}}",\n  "style": "professional"\n}',
        responseMappings: [
          { source: 'body', varName: 'content', jsonPath: '$.data.content' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-10',
        name: '文本润色',
        method: 'POST',
        path: '/v1/polish',
        description: '优化和润色输入文本',
        timeout: 8000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "text": "{{input}}",\n  "level": "medium"\n}',
        responseMappings: [
          { source: 'body', varName: 'polished', jsonPath: '$.data.polished_text' },
        ],
        order: 2,
        status: 'active',
      },
    ],
    plugins: [
      {
        id: 'plugin-4',
        name: '写作质量评分',
        type: 'metric',
        description: '评估生成内容的质量',
        config: {
          metricType: 'quality_score',
          unit: 'score',
          aggregation: 'avg',
        },
        order: 1,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-03-01 09:15',
    testResult: 'success',
    createdAt: '2024-02-20',
    updatedAt: '2024-03-01',
  },
  {
    id: '5',
    name: '图像识别系统',
    description: 'AI 图像分析应用，支持物体检测、场景识别和 OCR',
    baseUrl: 'https://api.vision.example.com',
    authType: 'api_key',
    authConfig: {
      apiKey: 'sk-vision-**********************',
      apiKeyHeader: 'X-API-Key',
      apiKeyPrefix: '',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
    ],
    dictionaryId: 'dict-2',
    apis: [
      {
        id: 'api-11',
        name: '物体检测',
        method: 'POST',
        path: '/v1/detect',
        description: '检测图像中的物体',
        timeout: 15000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "image_url": "{{input}}",\n  "confidence": 0.5\n}',
        responseMappings: [
          { source: 'body', varName: 'objects', jsonPath: '$.data.objects' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-12',
        name: 'OCR 文字识别',
        method: 'POST',
        path: '/v1/ocr',
        description: '识别图像中的文字',
        timeout: 12000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "image_url": "{{input}}",\n  "language": "auto"\n}',
        responseMappings: [
          { source: 'body', varName: 'text', jsonPath: '$.data.text' },
        ],
        order: 2,
        status: 'active',
      },
    ],
    plugins: [
      {
        id: 'plugin-5',
        name: '识别准确率统计',
        type: 'metric',
        description: '统计图像识别的准确率',
        config: {
          metricType: 'accuracy',
          unit: '%',
          aggregation: 'avg',
        },
        order: 1,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-03-02 14:30',
    testResult: 'success',
    createdAt: '2024-02-25',
    updatedAt: '2024-03-02',
  },
  {
    id: '6',
    name: '语音识别服务',
    description: '语音转文字 AI 应用，支持多语言识别和实时转写',
    baseUrl: 'https://api.asr.example.com',
    authType: 'bearer',
    authConfig: {
      apiKey: 'eyJhbGciOiJSUzI1NiIs****************',
      apiKeyHeader: 'Authorization',
      apiKeyPrefix: 'Bearer',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
    ],
    dictionaryId: 'dict-3',
    apis: [
      {
        id: 'api-13',
        name: '语音转文字',
        method: 'POST',
        path: '/v1/transcribe',
        description: '将音频转换为文字',
        timeout: 30000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "audio_url": "{{input}}",\n  "language": "zh-CN"\n}',
        responseMappings: [
          { source: 'body', varName: 'transcript', jsonPath: '$.data.transcript' },
        ],
        order: 1,
        status: 'active',
      },
    ],
    plugins: [
      {
        id: 'plugin-6',
        name: 'WER 统计',
        type: 'metric',
        description: '统计词错误率',
        config: {
          metricType: 'wer',
          unit: '%',
          aggregation: 'avg',
        },
        order: 1,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-03-03 11:00',
    testResult: 'success',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-03',
  },
  {
    id: '7',
    name: '代码审查助手',
    description: 'AI 代码审查应用，支持代码质量分析和安全漏洞检测',
    baseUrl: 'https://api.code-review.example.com',
    authType: 'api_key',
    authConfig: {
      apiKey: 'sk-code-**********************',
      apiKeyHeader: 'X-API-Key',
      apiKeyPrefix: '',
    },
    headers: [
      { key: 'Content-Type', value: 'application/json' },
    ],
    dictionaryId: 'dict-2',
    apis: [
      {
        id: 'api-14',
        name: '代码质量分析',
        method: 'POST',
        path: '/v1/analyze',
        description: '分析代码质量',
        timeout: 20000,
        retries: 2,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "code": "{{input}}",\n  "language": "auto"\n}',
        responseMappings: [
          { source: 'body', varName: 'issues', jsonPath: '$.data.issues' },
        ],
        order: 1,
        status: 'active',
      },
      {
        id: 'api-15',
        name: '安全漏洞检测',
        method: 'POST',
        path: '/v1/security',
        description: '检测代码中的安全漏洞',
        timeout: 25000,
        retries: 3,
        queryParams: [],
        bodyType: 'json',
        bodyTemplate: '{\n  "code": "{{input}}",\n  "scan_depth": "deep"\n}',
        responseMappings: [
          { source: 'body', varName: 'vulnerabilities', jsonPath: '$.data.vulnerabilities' },
        ],
        order: 2,
        status: 'active',
      },
    ],
    plugins: [
      {
        id: 'plugin-7',
        name: '问题数量统计',
        type: 'metric',
        description: '统计检测到的问题数量',
        config: {
          metricType: 'issue_count',
          unit: 'count',
          aggregation: 'sum',
        },
        order: 1,
        status: 'active',
      },
    ],
    status: 'active',
    lastTestTime: '2024-03-05 16:45',
    testResult: 'success',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-05',
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


// API 接口分页数据
const paginatedApis = computed(() => {
  if (!currentEnvironment.value || !currentEnvironment.value.apis) return []
  const apis = [...currentEnvironment.value.apis].sort((a, b) => a.order - b.order)
  const start = (apiCurrentPage.value - 1) * apiPageSize.value
  return apis.slice(start, start + apiPageSize.value)
})

// API 接口总数
const apiTotal = computed(() => {
  return currentEnvironment.value?.apis?.length || 0
})

// API 分页处理
const handleApiPageChange = (page) => {
  apiCurrentPage.value = page
}

const handleApiSizeChange = (size) => {
  apiPageSize.value = size
  apiCurrentPage.value = 1
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
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

// 获取状态标签类型
const getStatusType = (status) => {
  return status === 'active' ? 'success' : 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return status === 'active' ? '已启用' : '已禁用'
}

// 获取接口完整 URL
const getApiFullUrl = (api) => {
  const protocol = api.protocol || 'https'
  const path = api.path || ''
  if (!path) return ''
  return `${protocol}://${path}`
}

// 获取测试结果图标
const getTestResultIcon = (result) => {
  return result === 'success' ? CircleCheck : CircleClose
}

// 获取测试结果颜色
const getTestResultColor = (result) => {
  return result === 'success' ? '#67c23a' : '#f56c6c'
}

// 获取测试结果文字
const getTestResultText = (result) => {
  if (result === 'success') return '连接正常'
  if (result === 'failed') return '连接失败'
  return '未测试'
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

// 添加参数
const addParam = () => {
  apiFormData.queryParams.push({ key: '', value: '', description: '' })
}

// 删除参数
const removeParam = (index) => {
  apiFormData.queryParams.splice(index, 1)
}

// 添加 Form Data 字段
const addFormDataField = () => {
  apiFormData.formDataFields.push({ key: '', value: '', type: 'text', description: '' })
}

// 删除 Form Data 字段
const removeFormDataField = (index) => {
  apiFormData.formDataFields.splice(index, 1)
}

// 格式化 JSON
// 格式化 Body JSON
const formatBodyJson = () => {
  if (bodyJsonEditorRef.value) {
    bodyJsonEditorRef.value.formatJson()
    ElMessage.success('JSON 格式化成功')
  }
}

// 格式化 WebSocket JSON 消息
const formatWsJson = () => {
  if (wsJsonEditorRef.value) {
    wsJsonEditorRef.value.formatJson()
    ElMessage.success('JSON 格式化成功')
  }
}

// WebSocket 消息类型切换时清除表单验证
const handleWsMessageTypeChange = () => {
  // 清除表单验证，避免触发接口路径的必填性校验
  apiFormRef.value?.clearValidate()
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
  formData.dictionaryId = env.dictionaryId || ''
  formData.status = env.status
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.dictionaryId = ''
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
            dictionaryId: formData.dictionaryId,
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
          dictionaryId: formData.dictionaryId,
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

// 测试连接（卡片上的快速测试）
const testConnection = async (env) => {
  ElMessage.info(`正在测试「${env.name}」的连接...`)

  // 生成测试日志
  const logs = []
  const addTestLog = (level, message) => {
    const now = new Date()
    const time = now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0')
    const levelMap = {
      info: 'INFO',
      success: 'SUCCESS',
      warning: 'WARN',
      error: 'ERROR',
    }
    logs.push({
      time,
      level,
      levelText: levelMap[level] || level.toUpperCase(),
      message,
    })
  }

  addTestLog('info', `开始连通性测试 - 环境: ${env.name}`)

  const apis = env.apis || []
  if (apis.length === 0) {
    addTestLog('warning', '该环境暂无配置接口')
  } else {
    addTestLog('info', `共发现 ${apis.length} 个接口配置`)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < apis.length; i++) {
      const api = apis[i]
      if (api.status !== 'active') {
        addTestLog('warning', `[${i + 1}/${apis.length}] 跳过已禁用接口: ${api.name}`)
        continue
      }

      addTestLog('info', `[${i + 1}/${apis.length}] 测试接口: ${api.name}`)
      addTestLog('info', `  请求方法: ${api.method}`)
      addTestLog('info', `  请求地址: ${getApiFullUrl(api)}`)
      addTestLog('info', '  正在发送请求...')

      const isSuccess = Math.random() > 0.3
      if (isSuccess) {
        const responseTime = Math.floor(100 + Math.random() * 500)
        addTestLog('success', `  响应成功 (${responseTime}ms)`)
        if (api.responseMappings && api.responseMappings.length > 0) {
          addTestLog('info', `  提取变量: ${api.responseMappings.map(m => m.varName).join(', ')}`)
        }
        successCount++
      } else {
        addTestLog('error', '  响应失败: 连接超时')
        failCount++
      }
    }

    addTestLog('info', '─'.repeat(50))
    addTestLog('info', `测试完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
  }

  // 延迟更新状态
  setTimeout(() => {
    const index = environments.value.findIndex(e => e.id === env.id)
    if (index !== -1) {
      const allSuccess = logs.filter(l => l.level === 'error').length === 0 && logs.filter(l => l.level === 'success').length > 0
      const testStatus = allSuccess ? 'success' : 'failed'
      environments.value[index].testResult = testStatus
      environments.value[index].lastTestTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      // 保存测试日志和状态
      environments.value[index].connectivityLogs = logs
      environments.value[index].connectivityTestStatus = testStatus

      if (allSuccess) {
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
  // 恢复该环境的测试日志
  if (env.connectivityLogs && env.connectivityLogs.length > 0) {
    connectivityLogs.value = [...env.connectivityLogs]
    showConnectivityLog.value = true
    connectivityTestStatus.value = env.connectivityTestStatus || 'idle'
  } else {
    connectivityLogs.value = []
    showConnectivityLog.value = false
    connectivityTestStatus.value = 'idle'
  }
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
  apiFormData.protocol = api.protocol || 'https'
  apiFormData.path = api.path || ''
  apiFormData.description = api.description || ''
  apiFormData.timeout = api.timeout || 30000
  apiFormData.retries = api.retries || 3
  apiFormData.queryParams = api.queryParams ? api.queryParams.map(q => ({ ...q })) : []
  apiFormData.bodyType = api.bodyType || 'json'
  apiFormData.bodyTemplate = api.bodyTemplate || '{\n  "input": "{{input}}"\n}'
  apiFormData.formDataFields = api.formDataFields ? api.formDataFields.map(f => ({ ...f })) : []
  apiFormData.rawText = api.rawText || ''
  apiFormData.responseMappings = api.responseMappings ? api.responseMappings.map(m => ({ ...m, appendToDataset: m.appendToDataset || false })) : []
  apiFormData.executionMode = api.executionMode || 'single'
  apiFormData.executionCount = api.executionCount || 1
  // 加载指标采集配置
  apiFormData.metricsCollection = api.metricsCollection ? {
    ttft: api.metricsCollection.ttft || false,
    tpot: api.metricsCollection.tpot || false,
    e2eLatency: api.metricsCollection.e2eLatency || false,
  } : {
    ttft: false,
    tpot: false,
    e2eLatency: false,
  }
  // 加载 WebSocket 配置
  apiFormData.wsConfig = api.wsConfig ? {
    messageTemplate: api.wsConfig.messageTemplate || '{\n  "input": "{{input}}"\n}',
    messageType: api.wsConfig.messageType || 'text',
    file: api.wsConfig.file || null,
  } : {
    messageTemplate: '{\n  "input": "{{input}}"\n}',
    messageType: 'text',
    file: null,
  }
  // 加载文件列表（如果有）
  if (api.wsConfig && api.wsConfig.file) {
    wsFileList.value = [{ name: api.wsConfig.file.name || '已上传文件', raw: api.wsConfig.file }]
  } else {
    wsFileList.value = []
  }
  apiFormData.status = api.status || 'active'
  apiDialogVisible.value = true
}

// 重置接口表单
const resetApiForm = () => {
  apiFormData.name = ''
  apiFormData.method = 'POST'
  apiFormData.protocol = 'https'
  apiFormData.path = ''
  apiFormData.description = ''
  apiFormData.timeout = 30000
  apiFormData.retries = 3
  apiFormData.queryParams = []
  apiFormData.bodyType = 'json'
  apiFormData.bodyTemplate = '{\n  "input": "{{input}}"\n}'
  apiFormData.formDataFields = []
  apiFormData.rawText = ''
  apiFormData.responseMappings = []
  apiFormData.executionMode = 'single'
  apiFormData.executionCount = 1
  apiFormData.metricsCollection = {
    ttft: false,
    tpot: false,
    e2eLatency: false,
  }
  apiFormData.wsConfig = {
    messageTemplate: '{\n  "input": "{{input}}"\n}',
    messageType: 'text',
    file: null,
  }
  wsFileList.value = [] // 清空文件列表
  apiFormData.status = 'active'
  apiConfigActiveTab.value = 'params' // 重置标签页
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

      // 验证自定义执行次数
      if (apiFormData.executionMode === 'custom' && (!apiFormData.executionCount || apiFormData.executionCount < 1)) {
        ElMessage.warning('请输入有效的执行次数')
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
            protocol: apiFormData.protocol,
            path: apiFormData.path,
            description: apiFormData.description,
            timeout: apiFormData.timeout,
            retries: apiFormData.retries,
            queryParams: [...apiFormData.queryParams],
            bodyType: apiFormData.bodyType,
            bodyTemplate: apiFormData.bodyTemplate,
            formDataFields: [...apiFormData.formDataFields],
            rawText: apiFormData.rawText,
            responseMappings: [...apiFormData.responseMappings],
            executionMode: apiFormData.executionMode,
            executionCount: apiFormData.executionCount,
            metricsCollection: { ...apiFormData.metricsCollection },
            wsConfig: { ...apiFormData.wsConfig },
            status: apiFormData.status,
          }
          ElMessage.success('接口更新成功')
        }
      } else {
        const newApi = {
          id: `api-${Date.now()}`,
          name: apiFormData.name,
          method: apiFormData.method,
          protocol: apiFormData.protocol,
          path: apiFormData.path,
          description: apiFormData.description,
          timeout: apiFormData.timeout,
          retries: apiFormData.retries,
          queryParams: [...apiFormData.queryParams],
          bodyType: apiFormData.bodyType,
          bodyTemplate: apiFormData.bodyTemplate,
          formDataFields: [...apiFormData.formDataFields],
          rawText: apiFormData.rawText,
          responseMappings: [...apiFormData.responseMappings],
          executionMode: apiFormData.executionMode,
          executionCount: apiFormData.executionCount,
          metricsCollection: { ...apiFormData.metricsCollection },
          wsConfig: { ...apiFormData.wsConfig },
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

// ========== 连通性测试 ==========
const isConnectivityTesting = ref(false)
const showConnectivityLog = ref(false)
const connectivityTestStatus = ref('idle') // idle, running, success, failed
const connectivityLogs = ref([])
const logContainerRef = ref(null)

// 添加日志
const addLog = (level, message) => {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0')
  const levelMap = {
    info: 'INFO',
    success: 'SUCCESS',
    warning: 'WARN',
    error: 'ERROR',
  }
  const logItem = {
    time,
    level,
    levelText: levelMap[level] || level.toUpperCase(),
    message,
  }
  connectivityLogs.value.push(logItem)
  // 同步保存到当前环境对象
  if (currentEnvironment.value) {
    if (!currentEnvironment.value.connectivityLogs) {
      currentEnvironment.value.connectivityLogs = []
    }
    currentEnvironment.value.connectivityLogs.push(logItem)
  }
  // 滚动到底部
  setTimeout(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  }, 10)
}

// 清空日志
const clearConnectivityLogs = () => {
  connectivityLogs.value = []
  // 同步清空当前环境对象的日志
  if (currentEnvironment.value) {
    currentEnvironment.value.connectivityLogs = []
    currentEnvironment.value.connectivityTestStatus = 'idle'
  }
  showConnectivityLog.value = false
  connectivityTestStatus.value = 'idle'
}

// 运行连通性测试
const runConnectivityTest = async () => {
  if (!currentEnvironment.value) return

  isConnectivityTesting.value = true
  showConnectivityLog.value = true
  connectivityTestStatus.value = 'running'
  connectivityLogs.value = []
  // 清空当前环境的日志
  currentEnvironment.value.connectivityLogs = []

  addLog('info', `开始连通性测试 - 环境: ${currentEnvironment.value.name}`)

  const apis = currentEnvironment.value.apis || []
  if (apis.length === 0) {
    addLog('warning', '该环境暂无配置接口')
    connectivityTestStatus.value = 'failed'
    currentEnvironment.value.connectivityLogs = [...connectivityLogs.value]
    currentEnvironment.value.connectivityTestStatus = 'failed'
    isConnectivityTesting.value = false
    return
  }

  addLog('info', `共发现 ${apis.length} 个接口配置`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < apis.length; i++) {
    const api = apis[i]
    if (api.status !== 'active') {
      addLog('warning', `[${i + 1}/${apis.length}] 跳过已禁用接口: ${api.name}`)
      continue
    }

    addLog('info', `[${i + 1}/${apis.length}] 测试接口: ${api.name}`)
    addLog('info', `  请求方法: ${api.method}`)
    addLog('info', `  请求地址: ${getApiFullUrl(api)}`)

    // 模拟请求延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    addLog('info', '  正在发送请求...')

    // 模拟请求过程
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // 模拟结果
    const isSuccess = Math.random() > 0.2
    if (isSuccess) {
      const responseTime = Math.floor(100 + Math.random() * 500)
      addLog('success', `  响应成功 (${responseTime}ms)`)
      if (api.responseMappings && api.responseMappings.length > 0) {
        addLog('info', `  提取变量: ${api.responseMappings.map(m => m.varName).join(', ')}`)
      }
      successCount++
    } else {
      addLog('error', '  响应失败: 连接超时')
      failCount++
    }
  }

  await new Promise(resolve => setTimeout(resolve, 300))
  addLog('info', '─'.repeat(50))
  addLog('info', `测试完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)

  // 更新环境测试状态
  const index = environments.value.findIndex(e => e.id === currentEnvironment.value.id)
  const allSuccess = failCount === 0 && successCount > 0
  const testStatus = allSuccess ? 'success' : 'failed'
  if (index !== -1) {
    environments.value[index].testResult = testStatus
    environments.value[index].lastTestTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    // 保存测试日志和状态到环境对象
    environments.value[index].connectivityLogs = [...connectivityLogs.value]
    environments.value[index].connectivityTestStatus = testStatus
    currentEnvironment.value.testResult = environments.value[index].testResult
    currentEnvironment.value.lastTestTime = environments.value[index].lastTestTime
    currentEnvironment.value.connectivityLogs = environments.value[index].connectivityLogs
    currentEnvironment.value.connectivityTestStatus = environments.value[index].connectivityTestStatus
  }

  connectivityTestStatus.value = testStatus
  isConnectivityTesting.value = false

  if (failCount === 0 && successCount > 0) {
    ElMessage.success('连通性测试通过')
  } else if (successCount === 0) {
    ElMessage.error('连通性测试失败')
  } else {
    ElMessage.warning(`连通性测试部分失败: ${failCount} 个接口失败`)
  }
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
              </div>
              <div class="dictionary-info" v-if="env.dictionaryId">
                <el-icon><Collection /></el-icon>
                <span class="dictionary-name" @click.stop="goToDictionaryDetail(env.dictionaryId)">{{ getDictionaryName(env.dictionaryId) }}</span>
              </div>
            </div>
            <el-dropdown trigger="click" class="card-dropdown" @click.stop>
              <el-button class="more-btn" :icon="More" circle size="small" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openApiPanel(env)">
                    <el-icon><Setting /></el-icon>
                    查看详情
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
            <div class="connection-status" :class="env.testResult">
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">{{ getTestResultText(env.testResult) }}</span>
              </div>
              <span class="test-time" v-if="env.lastTestTime">{{ env.lastTestTime }}</span>
            </div>
            <div class="card-actions">
              <el-button text type="primary" size="small" @click="openApiPanel(env)">查看详情</el-button>
              <el-button text type="primary" size="small" @click="openEditDialog(env)">编辑</el-button>
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
          <!-- 连通性测试 -->
          <div class="connectivity-test">
            <div class="connectivity-status" :class="currentEnvironment.testResult">
              <span class="status-dot"></span>
              <span class="status-label">{{ getTestResultText(currentEnvironment.testResult) }}</span>
              <span class="status-time" v-if="currentEnvironment.lastTestTime">{{ currentEnvironment.lastTestTime }}</span>
            </div>
            <el-tooltip content="调试已配置的接口是否执行成功" placement="top">
              <el-button
                type="primary"
                :icon="VideoPlay"
                :loading="isConnectivityTesting"
                @click="runConnectivityTest"
              >
                {{ isConnectivityTesting ? '测试中...' : '连通性测试' }}
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 实时日志面板 -->
        <el-card v-if="showConnectivityLog" class="connectivity-log-card" shadow="never">
          <template #header>
            <div class="log-card-header">
              <div class="log-title">
                <el-icon><Document /></el-icon>
                <span>测试日志</span>
                <el-tag v-if="connectivityTestStatus === 'running'" type="warning" size="small" effect="dark">
                  执行中
                </el-tag>
                <el-tag v-else-if="connectivityTestStatus === 'success'" type="success" size="small" effect="dark">
                  成功
                </el-tag>
                <el-tag v-else-if="connectivityTestStatus === 'failed'" type="danger" size="small" effect="dark">
                  失败
                </el-tag>
              </div>
              <div class="log-actions">
                <el-button size="small" text @click="clearConnectivityLogs">
                  <el-icon><Delete /></el-icon>
                  清空日志
                </el-button>
              </div>
            </div>
          </template>
          <div class="connectivity-log-content" ref="logContainerRef">
            <div v-if="connectivityLogs.length === 0" class="empty-log">
              暂无日志，点击"连通性测试"按钮开始测试
            </div>
            <div v-else class="log-list">
              <div
                v-for="(log, index) in connectivityLogs"
                :key="index"
                class="log-item"
                :class="log.level"
              >
                <span class="log-time">{{ log.time }}</span>
                <span class="log-level">{{ log.levelText }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 关联的数据字典 -->
        <el-card class="dictionary-card" v-if="currentEnvironment.dictionaryId" shadow="never">
          <div class="dictionary-content">
            <div class="dictionary-header">
              <el-icon class="dictionary-icon"><Collection /></el-icon>
              <span class="dictionary-label">关联的数据字典</span>
            </div>
            <div class="dictionary-info" @click="goToDictionaryDetail(currentEnvironment.dictionaryId)">
              <span class="dictionary-name">{{ getDictionaryName(currentEnvironment.dictionaryId) }}</span>
              <el-icon class="dictionary-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>

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
                    <div class="api-path">{{ getApiFullUrl(api) }}</div>
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

        <el-form-item label="数据字典">
          <el-select v-model="formData.dictionaryId" placeholder="选择关联的数据字典" clearable style="width: 100%">
            <el-option
              v-for="dict in dataDictionaries"
              :key="dict.id"
              :label="dict.name"
              :value="dict.id"
            />
          </el-select>
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
      width="1200px"
      :close-on-click-modal="false"
      class="api-config-dialog"
      destroy-on-close
    >
      <div class="api-config-container">
        <!-- 左侧配置面板 -->
        <div class="config-left-panel">
          <!-- 基本信息 -->
          <div class="config-section">
            <div class="section-header">
              <div class="section-icon">
                <el-icon><Setting /></el-icon>
              </div>
              <span class="section-title">基本信息</span>
            </div>
            <div class="section-content">
              <el-form
                ref="apiFormRef"
                :model="apiFormData"
                :rules="apiFormRules"
                label-width="90px"
                label-position="left"
              >
                <el-form-item label="接口名称" prop="name">
                  <el-input v-model="apiFormData.name" placeholder="如：意图识别" clearable />
                </el-form-item>
                <el-row :gutter="20" class="method-status-row">
                  <el-col :span="12">
                    <el-form-item label="请求方法" prop="method">
                      <el-select v-model="apiFormData.method" style="width: 100%">
                        <el-option v-for="m in httpMethods" :key="m" :label="m" :value="m" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="状态">
                      <el-select v-model="apiFormData.status" style="width: 100%">
                        <el-option label="启用" value="active" />
                        <el-option label="禁用" value="inactive" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="接口路径" prop="path">
                  <div class="url-input-group">
                    <el-select v-model="apiFormData.protocol" class="protocol-select" placeholder="协议">
                      <el-option v-for="p in protocolOptions" :key="p.value" :label="p.label" :value="p.value" />
                    </el-select>
                    <el-input
                      v-model="apiFormData.path"
                      placeholder="api.example.com/v1/chat"
                      class="url-input"
                      clearable
                    />
                  </div>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input v-model="apiFormData.description" type="textarea" :rows="2" placeholder="接口功能描述" resize="none" />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- 执行配置 -->
          <div class="config-section">
            <div class="section-header">
              <div class="section-icon execution-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <span class="section-title">执行配置</span>
            </div>
            <div class="section-content">
              <div class="execution-config-grid">
                <!-- 超时时间 -->
                <div class="config-item">
                  <div class="config-item-header">
                    <span class="config-item-label">超时时间</span>
                    <el-tooltip content="请求超时时间，超过该时间将终止请求" placement="top">
                      <el-icon class="config-item-help"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                  <div class="config-item-input">
                    <el-input-number
                      v-model="apiFormData.timeout"
                      :min="1000"
                      :max="120000"
                      :step="1000"
                      style="width: 100%"
                      controls-position="right"
                    />
                    <span class="input-unit">ms</span>
                  </div>
                </div>

                <!-- 重试次数 -->
                <div class="config-item">
                  <div class="config-item-header">
                    <span class="config-item-label">重试次数</span>
                    <el-tooltip content="请求失败后的自动重试次数" placement="top">
                      <el-icon class="config-item-help"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                  <div class="config-item-input">
                    <el-input-number
                      v-model="apiFormData.retries"
                      :min="0"
                      :max="10"
                      style="width: 100%"
                      controls-position="right"
                    />
                    <span class="input-unit">次</span>
                  </div>
                </div>

                <!-- 执行次数 -->
                <div class="config-item full-width">
                  <div class="config-item-header">
                    <span class="config-item-label">执行次数</span>
                    <el-tooltip content="该接口在测试中的执行次数配置" placement="top">
                      <el-icon class="config-item-help"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                  <div class="config-item-input execution-mode-input">
                    <el-select v-model="apiFormData.executionMode" style="width: 140px">
                      <el-option v-for="opt in executionModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                    <template v-if="apiFormData.executionMode === 'custom'">
                      <el-input-number
                        v-model="apiFormData.executionCount"
                        :min="1"
                        :max="1000"
                        style="width: 100px"
                        controls-position="right"
                      />
                      <span class="input-unit">次</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 指标采集 -->
          <div class="config-section">
            <div class="section-header">
              <div class="section-icon metrics-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <span class="section-title">指标采集</span>
              <el-tooltip content="选择需要采集的性能指标，系统会在测试执行时自动记录" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="section-content">
              <div class="metrics-collection-config">
                <el-checkbox-group v-model="metricsCheckGroup">
                  <div v-for="metric in metricsOptions" :key="metric.value" class="metric-item" :class="{ active: metricsCheckGroup.includes(metric.value) }">
                    <div class="metric-header">
                      <el-checkbox :value="metric.value">
                        <span class="metric-label">{{ metric.label }}</span>
                      </el-checkbox>
                    </div>
                    <div class="metric-description">{{ metric.description }}</div>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧配置面板 -->
        <div class="config-right-panel">
          <!-- WebSocket 配置 -->
          <template v-if="apiFormData.protocol === 'ws'">
            <div class="ws-config-panel">
              <div class="ws-config-content">
                <div class="ws-config-section">
                  <div class="ws-section-title">
                    <el-icon><Edit /></el-icon>
                    <span>消息配置</span>
                  </div>
                  <div class="ws-section-desc">配置发送到 WebSocket 服务器的消息类型和内容</div>

                  <!-- 消息类型选择 -->
                  <div class="message-type-selector">
                    <span class="type-label">消息类型：</span>
                    <el-radio-group
                      v-model="apiFormData.wsConfig.messageType"
                      size="small"
                      @change="handleWsMessageTypeChange"
                    >
                      <el-radio-button value="text">Text</el-radio-button>
                      <el-radio-button value="json">JSON</el-radio-button>
                      <el-radio-button value="file">File</el-radio-button>
                    </el-radio-group>
                  </div>

                  <!-- Text 类型输入 -->
                  <template v-if="apiFormData.wsConfig.messageType === 'text'">
                    <el-input
                      v-model="apiFormData.wsConfig.messageTemplate"
                      type="textarea"
                      :rows="10"
                      placeholder="输入纯文本内容，支持 {{变量}} 占位符"
                      class="ws-textarea ws-text-textarea"
                      resize="none"
                    />
                  </template>

                  <!-- JSON 类型输入 -->
                  <template v-else-if="apiFormData.wsConfig.messageType === 'json'">
                    <div class="ws-json-editor-wrapper">
                      <JsonEditor
                        ref="wsJsonEditorRef"
                        v-model="apiFormData.wsConfig.messageTemplate"
                        placeholder='{"key": "value"}'
                      />
                      <div class="ws-json-editor-actions">
                        <el-button size="small" @click="formatWsJson">
                          <el-icon><Document /></el-icon>
                          格式化
                        </el-button>
                      </div>
                    </div>
                  </template>

                  <!-- File 类型上传 -->
                  <template v-else-if="apiFormData.wsConfig.messageType === 'file'">
                    <div class="file-upload-area">
                      <el-upload
                        ref="wsFileUploadRef"
                        class="ws-file-uploader"
                        drag
                        :auto-upload="false"
                        :limit="1"
                        :on-change="handleWsFileChange"
                        :on-remove="handleWsFileRemove"
                        :file-list="wsFileList"
                      >
                        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                        <div class="el-upload__text">
                          将文件拖到此处，或<em>点击上传</em>
                        </div>
                        <template #tip>
                          <div class="el-upload__tip">
                            支持上传任意类型文件
                          </div>
                        </template>
                      </el-upload>
                    </div>
                  </template>

                  <div class="variable-help" v-if="apiFormData.wsConfig.messageType !== 'file'">
                    <div class="help-title">
                      <el-icon><InfoFilled /></el-icon>
                      可用占位符
                    </div>
                    <div class="help-items">
                      <div class="help-item">
                        <code v-pre>{{dict.colName}}</code>
                        <span>数据集列名</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{env.name}}</code>
                        <span>环境变量</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{out.varName}}</code>
                        <span>已执行接口的响应</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="ws-config-section">
                  <div class="ws-section-title">
                    <el-icon><Connection /></el-icon>
                    <span>响应映射</span>
                  </div>
                  <div class="ws-section-desc">从 WebSocket 响应中提取变量，供后续接口使用</div>
                  <div class="response-mappings-config ws-mappings">
                    <div class="config-table-header">
                      <span style="width: 120px">变量名</span>
                      <span style="flex: 1">JsonPath 表达式</span>
                      <span style="width: 80px; text-align: center">追加数据集</span>
                      <span style="width: 40px"></span>
                    </div>
                    <div v-if="apiFormData.responseMappings.length === 0" class="empty-config">
                      <el-empty description="暂无映射" :image-size="60" />
                    </div>
                    <div v-for="(mapping, index) in apiFormData.responseMappings" :key="index" class="config-row">
                      <el-input v-model="mapping.varName" placeholder="变量名" style="width: 120px" size="small" clearable />
                      <el-input v-model="mapping.jsonPath" placeholder="如 $.data.result" style="flex: 1" size="small" clearable />
                      <el-checkbox v-model="mapping.appendToDataset" style="width: 80px; justify-content: center" />
                      <el-button :icon="Delete" circle size="small" class="delete-btn" @click="removeResponseMapping(index)" />
                    </div>
                    <el-button type="primary" link class="add-btn" @click="addResponseMapping">
                      <el-icon><Plus /></el-icon>
                      添加映射
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- HTTP/HTTPS 配置 -->
          <template v-else>
            <el-tabs v-model="apiConfigActiveTab" class="config-tabs">
            <!-- Params Tab -->
            <el-tab-pane name="params">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon"><Document /></el-icon>
                  <span>Params</span>
                  <el-badge v-if="apiFormData.queryParams.length > 0" :value="apiFormData.queryParams.length" type="primary" class="tab-badge" />
                </span>
              </template>
              <div class="tab-content">
                <div class="tab-description">
                  <el-icon class="description-icon"><InfoFilled /></el-icon>
                  <span>URL 查询参数，会拼接到 URL 后面，如 <code>?key1=value1&key2=value2</code></span>
                </div>
                <div class="params-config">
                  <div class="config-table-header">
                    <span style="width: 140px">参数名</span>
                    <span style="flex: 1">值（支持变量）</span>
                    <span style="width: 140px">说明</span>
                    <span style="width: 40px"></span>
                  </div>
                  <div v-if="apiFormData.queryParams.length === 0" class="empty-config">
                    <el-empty description="暂无参数" :image-size="60" />
                  </div>
                  <div v-for="(param, index) in apiFormData.queryParams" :key="index" class="config-row">
                    <el-input v-model="param.key" placeholder="参数名" style="width: 140px" clearable />
                    <el-input v-model="param.value" placeholder="值，支持 {{变量}}" style="flex: 1" clearable />
                    <el-input v-model="param.description" placeholder="说明" style="width: 140px" clearable />
                    <el-button :icon="Delete" circle size="small" class="delete-btn" @click="removeParam(index)" />
                  </div>
                  <el-button type="primary" link class="add-btn" @click="addParam">
                    <el-icon><Plus /></el-icon>
                    添加参数
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <!-- Body Tab -->
            <el-tab-pane name="body">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon"><Edit /></el-icon>
                  <span>Body</span>
                </span>
              </template>
              <div class="tab-content">
                <div class="body-type-selector">
                  <span class="label">Content-Type：</span>
                  <el-radio-group v-model="apiFormData.bodyType" size="small">
                    <el-radio-button v-for="bt in bodyTypes" :key="bt.value" :value="bt.value">
                      {{ bt.label }}
                    </el-radio-button>
                  </el-radio-group>
                </div>

                <!-- JSON 编辑器 -->
                <div class="body-editor" v-if="apiFormData.bodyType === 'json'">
                  <div class="json-editor-wrapper">
                    <JsonEditor
                      ref="bodyJsonEditorRef"
                      v-model="apiFormData.bodyTemplate"
                      placeholder='{"key": "value"}'
                    />
                    <div class="json-editor-actions">
                      <el-button size="small" @click="formatBodyJson">
                        <el-icon><Document /></el-icon>
                        格式化
                      </el-button>
                    </div>
                  </div>
                  <div class="variable-help">
                    <div class="help-title">
                      <el-icon><InfoFilled /></el-icon>
                      可用占位符
                    </div>
                    <div class="help-items">
                      <div class="help-item">
                        <code v-pre>{{dict.colName}}</code>
                        <span>数据集列名</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{env.name}}</code>
                        <span>环境变量</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{out.varName}}</code>
                        <span>已执行接口的响应</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Form Data 编辑器 -->
                <div class="body-editor form-data-editor" v-else-if="apiFormData.bodyType === 'form'">
                  <div class="form-data-config">
                    <div class="config-table-header">
                      <span style="width: 100px">参数名</span>
                      <span style="width: 100px">类型</span>
                      <span style="flex: 1">值（支持变量）</span>
                      <span style="width: 120px">说明</span>
                      <span style="width: 40px"></span>
                    </div>
                    <div v-if="apiFormData.formDataFields.length === 0" class="empty-config">
                      <el-empty description="暂无表单字段" :image-size="60" />
                    </div>
                    <div v-for="(field, index) in apiFormData.formDataFields" :key="index" class="config-row">
                      <el-input v-model="field.key" placeholder="参数名" style="width: 100px" size="small" clearable />
                      <el-select v-model="field.type" style="width: 100px" size="small">
                        <el-option label="文本" value="text" />
                        <el-option label="文件" value="file" />
                      </el-select>
                      <el-input
                        v-model="field.value"
                        :placeholder="field.type === 'file' ? '文件路径或变量' : '值，支持 {{变量}}'"
                        style="flex: 1"
                        size="small"
                        clearable
                        :disabled="field.type === 'file'"
                      />
                      <el-input v-model="field.description" placeholder="说明" style="width: 120px" size="small" clearable />
                      <el-button :icon="Delete" circle size="small" class="delete-btn" @click="removeFormDataField(index)" />
                    </div>
                    <el-button type="primary" link class="add-btn" @click="addFormDataField">
                      <el-icon><Plus /></el-icon>
                      添加字段
                    </el-button>
                  </div>
                  <div class="variable-help">
                    <div class="help-title">
                      <el-icon><InfoFilled /></el-icon>
                      可用占位符
                    </div>
                    <div class="help-items">
                      <div class="help-item">
                        <code v-pre>{{dict.colName}}</code>
                        <span>数据集列名</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{env.name}}</code>
                        <span>环境变量</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{out.varName}}</code>
                        <span>已执行接口的响应</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Raw Text 编辑器 -->
                <div class="body-editor" v-else-if="apiFormData.bodyType === 'raw'">
                  <el-input
                    v-model="apiFormData.rawText"
                    type="textarea"
                    :rows="14"
                    placeholder="输入纯文本内容，支持 {{变量}} 占位符"
                    class="body-textarea raw-textarea"
                    resize="none"
                  />
                  <div class="variable-help">
                    <div class="help-title">
                      <el-icon><InfoFilled /></el-icon>
                      可用占位符
                    </div>
                    <div class="help-items">
                      <div class="help-item">
                        <code v-pre>{{dict.colName}}</code>
                        <span>数据集列名</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{env.name}}</code>
                        <span>环境变量</span>
                      </div>
                      <div class="help-item">
                        <code v-pre>{{out.varName}}</code>
                        <span>已执行接口的响应</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 无 Body -->
                <div v-else class="empty-body">
                  <el-empty description="当前请求方法不需要 Body" :image-size="60" />
                </div>
              </div>
            </el-tab-pane>

            <!-- 响应映射 Tab -->
            <el-tab-pane name="response">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon"><Connection /></el-icon>
                  <span>响应映射</span>
                  <el-badge v-if="apiFormData.responseMappings.length > 0" :value="apiFormData.responseMappings.length" type="primary" class="tab-badge" />
                </span>
              </template>
              <div class="tab-content">
                <div class="tab-description">
                  <el-icon class="description-icon"><InfoFilled /></el-icon>
                  <span>从响应中提取变量，供后续接口使用</span>
                </div>
                <div class="response-mappings-config">
                  <div class="config-table-header">
                    <span style="width: 90px">来源</span>
                    <span style="width: 120px">变量名</span>
                    <span style="flex: 1">JsonPath 表达式</span>
                    <span style="width: 80px; text-align: center">追加数据集</span>
                    <span style="width: 40px"></span>
                  </div>
                  <div v-if="apiFormData.responseMappings.length === 0" class="empty-config">
                    <el-empty description="暂无映射" :image-size="60" />
                  </div>
                  <div v-for="(mapping, index) in apiFormData.responseMappings" :key="index" class="config-row">
                    <el-select v-model="mapping.source" style="width: 90px" size="small">
                      <el-option v-for="s in mappingSources" :key="s.value" :label="s.label" :value="s.value" />
                    </el-select>
                    <el-input v-model="mapping.varName" placeholder="变量名" style="width: 120px" size="small" clearable />
                    <el-input v-model="mapping.jsonPath" placeholder="如 $.data.result" style="flex: 1" size="small" clearable />
                    <el-checkbox v-model="mapping.appendToDataset" style="width: 80px; justify-content: center" />
                    <el-button :icon="Delete" circle size="small" class="delete-btn" @click="removeResponseMapping(index)" />
                  </div>
                  <el-button type="primary" link class="add-btn" @click="addResponseMapping">
                    <el-icon><Plus /></el-icon>
                    添加映射
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
          </template>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="apiDialogVisible = false" size="default">取消</el-button>
          <el-button type="primary" @click="handleApiSubmit" size="default">
            {{ isEditApiMode ? '保存修改' : '创建接口' }}
          </el-button>
        </div>
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

/* 数据字典链接样式（卡片中） */
.dictionary-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dictionary-info:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

.dictionary-info .dictionary-name {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.dictionary-info:hover .dictionary-name {
  color: #5a67d8;
  text-decoration: underline;
}

/* 数据字典卡片样式（详情页） */
.dictionary-card {
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.dictionary-card :deep(.el-card__body) {
  padding: 0;
}

.dictionary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.dictionary-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dictionary-icon {
  font-size: 18px;
  color: #667eea;
}

.dictionary-label {
  font-size: 14px;
  color: #606266;
}

.dictionary-card .dictionary-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 0;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dictionary-card .dictionary-info:hover {
  background: #e8f4ff;
}

.dictionary-card .dictionary-info .dictionary-name {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.dictionary-card .dictionary-info:hover .dictionary-name {
  color: #337ecc;
}

.dictionary-card .dictionary-arrow {
  font-size: 14px;
  color: #409eff;
  transition: transform 0.2s ease;
}

.dictionary-card .dictionary-info:hover .dictionary-arrow {
  transform: translateX(4px);
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

/* 连接状态样式 */
.connection-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connection-status.success .status-dot {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
  animation: pulse-success 2s infinite;
}

.connection-status.failed .status-dot {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.5);
}

.connection-status.pending .status-dot {
  background: #c0c4cc;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
}

.connection-status.success .status-text {
  color: #67c23a;
}

.connection-status.failed .status-text {
  color: #f56c6c;
}

.connection-status.pending .status-text {
  color: #909399;
}

.test-time {
  font-size: 11px;
  color: #a0a0a0;
  padding-left: 18px;
}

@keyframes pulse-success {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
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

.mapping-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.mapping-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

/* 执行配置样式 */
.execution-config {
  display: flex;
  align-items: center;
}

.execution-unit {
  margin-left: 8px;
  color: #606266;
  font-size: 14px;
}

/* API 配置对话框样式 */
.api-config-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.api-config-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
}

.api-config-dialog :deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.api-config-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
}

.api-config-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #fff;
}

.api-config-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.api-config-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
}

.api-config-container {
  display: flex;
  min-height: 580px;
  max-height: 70vh;
}

.config-left-panel {
  width: 540px;
  border-right: 1px solid #ebeef5;
  padding: 28px;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

/* URL 输入组样式 */
.url-input-group {
  display: flex;
  width: 100%;
}

.protocol-select {
  width: 80px;
  flex-shrink: 0;
  margin-right: 8px;
}

.protocol-select :deep(.el-input__wrapper) {
  border-radius: 8px 0 0 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.protocol-select :deep(.el-input__inner) {
  color: #fff;
  font-weight: 600;
}

.protocol-select :deep(.el-select__caret) {
  color: #fff;
}

.url-input {
  flex: 1;
}

.url-input :deep(.el-input__wrapper) {
  border-radius: 0 8px 8px 0;
}

/* WebSocket 配置面板样式 */
.ws-config-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.ws-config-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.ws-config-section {
  margin-bottom: 28px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.ws-config-section:last-child {
  margin-bottom: 0;
}

.ws-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.ws-section-title .el-icon {
  color: #10b981;
}

.ws-section-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.ws-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

/* Text 类型输入框样式 - 与 Raw Text 保持一致 */
.ws-text-textarea :deep(.el-textarea__inner) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #fafbfc;
  padding: 16px;
}

/* JSON 类型编辑器样式 */
.ws-json-editor-wrapper {
  display: flex;
  flex-direction: column;
}

.ws-json-textarea :deep(.el-textarea__inner) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px;
}

.ws-json-textarea :deep(.el-textarea__inner::placeholder) {
  color: #6c7086;
}

.ws-json-editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.ws-mappings {
  margin-top: 12px;
}

/* 消息类型选择器样式 */
.message-type-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.message-type-selector .type-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.message-type-selector .el-radio-group {
  display: flex;
  gap: 0;
}

/* 文件上传区域样式 */
.file-upload-area {
  margin-top: 12px;
}

.ws-file-uploader {
  width: 100%;
}

.ws-file-uploader :deep(.el-upload) {
  width: 100%;
}

.ws-file-uploader :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.ws-file-uploader :deep(.el-upload-dragger:hover) {
  border-color: #10b981;
  background: #ecfdf5;
}

.ws-file-uploader :deep(.el-icon--upload) {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.ws-file-uploader :deep(.el-upload__text) {
  color: #6b7280;
  font-size: 14px;
}

.ws-file-uploader :deep(.el-upload__text em) {
  color: #10b981;
  font-style: normal;
}

.ws-file-uploader :deep(.el-upload__tip) {
  color: #9ca3af;
  font-size: 12px;
  margin-top: 8px;
}

/* 请求方法和状态行的间距 */
.method-status-row {
  margin-bottom: 8px;
}

.config-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.config-right-panel .config-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-right-panel .config-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background: #f8fafc;
  border-bottom: 1px solid #ebeef5;
}

.config-right-panel .config-tabs :deep(.el-tabs__nav-wrap)::after {
  display: none;
}

.config-right-panel .config-tabs :deep(.el-tabs__item) {
  padding: 0 20px;
  height: 52px;
  line-height: 52px;
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  transition: all 0.2s ease;
}

.config-right-panel .config-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
}

.config-right-panel .config-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

.config-right-panel .config-tabs :deep(.el-tabs__active-bar) {
  background-color: #667eea;
  height: 3px;
  border-radius: 3px;
}

.config-right-panel .config-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.config-right-panel .config-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  margin-left: 4px;
}

.tab-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-description {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #475569;
  border: 1px solid #bae6fd;
}

.description-icon {
  color: #0ea5e9;
  font-size: 16px;
}

.tab-description code {
  background: #0ea5e9;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  color: #fff;
  font-size: 12px;
}

/* 配置区块样式 */
.config-section {
  margin-bottom: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.config-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid #ebeef5;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
}

.section-icon.execution-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-icon.metrics-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.help-icon {
  margin-left: auto;
  color: #9ca3af;
  cursor: help;
  transition: color 0.2s ease;
}

.help-icon:hover {
  color: #667eea;
}

.section-content {
  padding: 24px 20px;
}

.section-content :deep(.el-form-item) {
  margin-bottom: 24px;
}

.section-content :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.section-content :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4b5563;
}

.section-content :deep(.el-input__wrapper),
.section-content :deep(.el-textarea__inner),
.section-content :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.section-content :deep(.el-input__wrapper:hover),
.section-content :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.section-content :deep(.el-input__wrapper.is-focus),
.section-content :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2), 0 0 0 1px #667eea inset !important;
}

/* 配置表格样式 */
.config-table-header {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  margin-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.config-row:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.config-row :deep(.el-input__wrapper) {
  background: #fff;
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.config-row :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

.empty-config {
  padding: 30px 0;
}

.add-btn {
  margin-top: 12px;
  font-weight: 500;
}

.delete-btn {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fecaca;
  border-color: #fca5a5;
  color: #dc2626;
}

/* Body 编辑器样式 */
.body-type-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
}

.body-type-selector .label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  flex-shrink: 0;
}

.body-type-selector :deep(.el-radio-button__inner) {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-weight: 500;
  padding: 8px 16px;
}

.body-type-selector :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.body-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* JSON 编辑器样式 */
.json-editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-textarea :deep(.el-textarea__inner) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px;
}

.json-textarea :deep(.el-textarea__inner::placeholder) {
  color: #6c7086;
}

.json-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* Raw Text 编辑器样式 */
.raw-textarea :deep(.el-textarea__inner) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #fafbfc;
  padding: 16px;
}

/* Form Data 编辑器样式 */
.form-data-editor {
  gap: 16px;
}

.form-data-config {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.body-textarea :deep(.el-textarea__inner) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #fafbfc;
  padding: 16px;
}

.body-textarea :deep(.el-textarea__inner:hover) {
  border-color: #667eea;
}

.body-textarea :deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.variable-help {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 10px;
  border: 1px solid #fcd34d;
}

.help-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 12px;
}

.help-title .el-icon {
  color: #f59e0b;
}

.help-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.help-item code {
  background: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  color: #d97706;
  border: 1px solid #fcd34d;
  font-weight: 500;
}

.help-item span {
  color: #78350f;
}

.empty-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 指标采集配置样式 */
.metrics-collection-config {
  width: 100%;
}

.metrics-collection-config .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  background: #f9fafb;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: all 0.25s ease;
  cursor: pointer;
}

.metric-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.metric-item.active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #10b981;
}

.metric-header {
  display: flex;
  align-items: center;
}

.metric-item .el-checkbox {
  display: flex;
  align-items: center;
}

.metric-item :deep(.el-checkbox__label) {
  padding-left: 8px;
}

.metric-item .metric-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.metric-item.active .metric-label {
  color: #059669;
}

.metric-item .metric-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
  padding-left: 28px;
}

.metric-item.active .metric-description {
  color: #047857;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  min-width: 100px;
  border-radius: 8px;
  font-weight: 500;
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.2s ease;
}

.dialog-footer .el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 执行配置样式 */
.execution-config {
  display: flex;
  align-items: center;
}

.execution-unit {
  margin-left: 10px;
  color: #6b7280;
  font-size: 14px;
}

/* 执行配置网格布局 */
.execution-config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.execution-config-grid .config-item.full-width {
  grid-column: 1 / -1;
}

.config-item {
  background: #f9fafb;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.config-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.config-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.config-item-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.config-item-help {
  color: #9ca3af;
  cursor: help;
  font-size: 14px;
  transition: color 0.2s ease;
}

.config-item-help:hover {
  color: #667eea;
}

.config-item-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-item-input .input-suffix {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
}

.execution-mode-input {
  flex-wrap: wrap;
}

.execution-mode-input .input-unit {
  color: #6b7280;
  font-size: 13px;
  margin-left: 4px;
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

/* 插件列表样式 */
.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-card {
  border-radius: 8px;
}

.plugin-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.plugin-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.plugin-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.plugin-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.plugin-config {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.plugin-config .config-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.plugin-config .config-label {
  color: #909399;
}

.plugin-actions {
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

/* 连通性测试样式 */
.connectivity-test {
  display: flex;
  align-items: center;
  gap: 16px;
}

.connectivity-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.connectivity-status .status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connectivity-status.success .status-dot {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
  animation: pulse-success 2s infinite;
}

.connectivity-status.failed .status-dot {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.5);
}

.connectivity-status.pending .status-dot {
  background: #c0c4cc;
}

.connectivity-status .status-label {
  font-size: 14px;
  font-weight: 500;
}

.connectivity-status.success .status-label {
  color: #67c23a;
}

.connectivity-status.failed .status-label {
  color: #f56c6c;
}

.connectivity-status.pending .status-label {
  color: #909399;
}

.connectivity-status .status-time {
  font-size: 12px;
  color: #909399;
  padding-left: 8px;
  border-left: 1px solid #dcdfe6;
}

/* 连通性日志卡片 */
.connectivity-log-card {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.connectivity-log-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.connectivity-log-card :deep(.el-card__body) {
  padding: 0;
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.log-title .el-icon {
  color: #409eff;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connectivity-log-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px 16px;
  background: #1e1e1e;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.empty-log {
  color: #6b7280;
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 12px;
  line-height: 1.6;
  padding: 2px 0;
}

.log-time {
  color: #6b7280;
  flex-shrink: 0;
  min-width: 80px;
}

.log-level {
  flex-shrink: 0;
  min-width: 60px;
  font-weight: 600;
  text-align: center;
  padding: 0 4px;
  border-radius: 2px;
}

.log-item.info .log-level {
  color: #60a5fa;
}

.log-item.success .log-level {
  color: #34d399;
}

.log-item.warning .log-level {
  color: #fbbf24;
}

.log-item.error .log-level {
  color: #f87171;
}

.log-message {
  color: #e5e7eb;
  word-break: break-all;
}

.log-item.success .log-message {
  color: #86efac;
}

.log-item.error .log-message {
  color: #fca5a5;
}
</style>
