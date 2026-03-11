<script setup>
import { ref, reactive, computed, onMounted, nextTick, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  FolderOpened,
  Calendar,
  Edit,
  Plus,
  Upload,
  Delete,
  DataAnalysis,
  Document,
  ChatDotRound,
  Cpu,
  Check,
  MagicStick,
  Loading,
  Setting,
  List,
  Collection,
  QuestionFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()

// 测评集数据（模拟）
const dataset = ref(null)

// 数据字典列表（模拟）
const dataDictionaries = ref([
  {
    id: 'dict-1',
    name: '通用对话测试',
    description: '用于测试模型的基础对话能力，包含多轮对话、意图识别等测试场景',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'input', label: '输入', type: 'string' },
      { key: 'expectedOutput', label: '期望输出', type: 'string' },
      { key: 'category', label: '分类', type: 'enum', enumOptions: ['问候', '询问', '建议', '闲聊', '投诉', '咨询'] },
      { key: 'difficulty', label: '难度', type: 'enum', enumOptions: ['简单', '中等', '困难'] },
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'dict-2',
    name: '代码生成测试',
    description: '用于测试模型的代码生成能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
  },
  {
    id: 'dict-3',
    name: '文本摘要测试',
    description: '用于测试模型的文本摘要能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'originalText', label: '原文', type: 'string' },
      { key: 'expectedSummary', label: '期望摘要', type: 'string' },
    ],
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
])

// 获取关联的数据字典
const getDictionary = (dictionaryId) => {
  if (!dictionaryId) return null
  return dataDictionaries.value.find(d => d.id === dictionaryId)
}

// 预置标签列表
const presetTags = [
  '对话',
  '通用',
  '代码',
  '编程',
  '文档',
  '理解',
  '数据',
  '分析',
  '数学',
  '推理',
  '翻译',
  '多语言',
  '写作',
  '创意',
  '知识',
  '问答',
  '情感',
  'NLP',
  '摘要',
  '生成',
  '检索',
  'SQL',
  '数据库',
  '分类',
  'NER',
  '状态',
  '纠错',
  '阅读',
  '补全',
  '关键词',
  '相似度',
  '匹配',
  '图像',
  '多模态',
  '逻辑',
  '常识',
  'API',
  '工具',
]

// 测试类型选项
const testTypeOptions = [
  { value: 'objective', label: '客观题' },
  { value: 'subjective', label: '主观题' },
]

// 获取测试类型文本
const getTestTypeText = (testType) => {
  return testType === 'subjective' ? '主观题' : '客观题'
}

// 获取测试类型标签类型
const getTestTypeTagType = (testType) => {
  return testType === 'subjective' ? 'warning' : ''
}

// 图标选项
const iconOptions = [
  { value: 'ChatDotRound', label: '对话' },
  { value: 'Cpu', label: '代码' },
  { value: 'Document', label: '文档' },
  { value: 'DataAnalysis', label: '数据分析' },
]

// 图标映射
const iconMap = {
  ChatDotRound,
  Cpu,
  Document,
  DataAnalysis,
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || ChatDotRound
}

// 测试数据列表（模拟）
const testData = ref([])

// 选中的单元格
const selectedCell = ref(null)

// 表格编辑模式
const isTableEditMode = ref(false)

// 备份数据（用于取消编辑时恢复）
const backupTestData = ref([])
const backupColumns = ref([])

// 进入编辑模式
const enterEditMode = () => {
  // 备份当前数据
  backupTestData.value = JSON.parse(JSON.stringify(testData.value))
  backupColumns.value = JSON.parse(JSON.stringify(columns.value))
  isTableEditMode.value = true
}

// 保存编辑
const saveEdit = () => {
  isTableEditMode.value = false
  backupTestData.value = []
  backupColumns.value = []
  selectedCell.value = null
  editingCell.value = null
  ElMessage.success('保存成功')
}

// 取消编辑
const cancelEdit = () => {
  // 恢复备份数据
  testData.value = JSON.parse(JSON.stringify(backupTestData.value))
  columns.value = JSON.parse(JSON.stringify(backupColumns.value))
  isTableEditMode.value = false
  backupTestData.value = []
  backupColumns.value = []
  selectedCell.value = null
  editingCell.value = null
  ElMessage.info('已取消编辑')
}

// ========== 一键生成数据功能 ==========
const generateDialogVisible = ref(false)
const generateForm = reactive({
  count: 10,
  constraints: {}, // 每列的约束信息，key 为列 key，value 为约束描述
})

// 生成进度
const generateProgress = ref(0)
const isGenerating = ref(false)
const generateStatusText = ref('')

// 显示生成对话框
const showGenerateDialog = () => {
  generateDialogVisible.value = true
}

// 生成随机数据（带进度模拟）
const generateRandomData = async () => {
  const { count, constraints } = generateForm

  // 关闭对话框
  generateDialogVisible.value = false

  // 初始化进度状态
  isGenerating.value = true
  generateProgress.value = 0
  generateStatusText.value = '正在启动 AI Agent...'

  const startId = testData.value.length + 1

  // 模拟AI Agent爬取进度
  const statusMessages = [
    '正在启动 AI Agent...',
    '正在分析数据源...',
    '正在爬取数据...',
    '正在处理数据格式...',
    '正在验证数据质量...',
    '正在保存数据...',
  ]

  for (let i = 0; i < count; i++) {
    // 更新状态文本
    const statusIndex = Math.floor((i / count) * statusMessages.length)
    generateStatusText.value = statusMessages[Math.min(statusIndex, statusMessages.length - 1)]

    const row = {}

    // 根据列定义生成数据
    columns.value.forEach(col => {
      // 优先使用用户填写的约束信息
      const constraint = constraints[col.key]
      if (constraint && constraint.trim()) {
        // 如果有约束信息，使用约束描述作为基础生成数据
        row[col.key] = generateDataFromConstraint(constraint, col, startId + i)
      } else if (col.key === 'id') {
        row[col.key] = `${startId + i}`
      } else if (col.enumOptions && col.enumOptions.length > 0) {
        // 如果列有枚举选项，随机选择一个
        row[col.key] = col.enumOptions[Math.floor(Math.random() * col.enumOptions.length)]
      } else if (col.key === 'input' || col.key.toLowerCase().includes('input')) {
        row[col.key] = `测试输入内容 ${startId + i}`
      } else if (col.key === 'expectedOutput' || col.key.toLowerCase().includes('output')) {
        row[col.key] = `期望输出内容 ${startId + i}`
      } else {
        row[col.key] = ''
      }
    })

    testData.value.push(row)

    // 更新进度
    generateProgress.value = Math.round(((i + 1) / count) * 100)

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // 更新数据集统计
  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }

  // 跳转到最后一页
  currentPage.value = Math.ceil(testData.value.length / pageSize.value)

  // 完成生成
  generateStatusText.value = '生成完成！'
  setTimeout(() => {
    isGenerating.value = false
    generateProgress.value = 0
    generateStatusText.value = ''
    ElMessage.success(`已生成 ${count} 条数据`)
  }, 500)
}

// 重置生成表单
const resetGenerateForm = () => {
  generateForm.count = 10
  generateForm.constraints = {}
  // 根据当前列定义初始化约束信息
  columns.value.forEach(col => {
    generateForm.constraints[col.key] = ''
  })
}

// 编辑中的单元格
const editingCell = ref(null)

// 编辑内容
const editContent = ref('')

// 列定义（响应式，支持编辑、支持枚举值）
const columns = ref([
  { key: 'id', label: 'ID', width: 80 },
  { key: 'input', label: '输入', width: 300 },
  { key: 'expectedOutput', label: '期望输出', width: 300 },
  { key: 'category', label: '分类', width: 100, enumOptions: ['问候', '询问', '建议', '闲聊', '投诉', '咨询'] },
  { key: 'difficulty', label: '难度', width: 80, enumOptions: ['简单', '中等', '困难'] },
])

// 编辑表头单元格（'label' 或 'key'）
const editingHeaderCell = ref(null)
const editHeaderContent = ref('')

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTarget = ref(null) // { type: 'cell' | 'header', row?: number, col: number }

// 选中表头单元格
const selectHeaderCell = (type, index) => {
  // 可以在这里添加选中逻辑
}

// 开始编辑表头
const startHeaderEdit = (type, index) => {
  const col = columns.value[index]
  if (!col) return

  editingHeaderCell.value = { type, index }
  editHeaderContent.value = type === 'label' ? col.label : col.key
}

// 保存表头编辑
const saveHeaderEdit = () => {
  if (!editingHeaderCell.value) return

  const { type, index } = editingHeaderCell.value
  const col = columns.value[index]
  if (!col) return

  if (type === 'label') {
    col.label = editHeaderContent.value
  } else {
    // 更新 key 需要同时更新数据
    const oldKey = col.key
    const newKey = editHeaderContent.value
    col.key = newKey

    // 更新测试数据中的 key
    testData.value.forEach(row => {
      if (row[oldKey] !== undefined) {
        row[newKey] = row[oldKey]
        if (oldKey !== newKey) {
          delete row[oldKey]
        }
      }
    })
  }

  editingHeaderCell.value = null
  editHeaderContent.value = ''
  ElMessage.success('保存成功')
}

// 取消表头编辑
const cancelHeaderEdit = () => {
  editingHeaderCell.value = null
  editHeaderContent.value = ''
}

// ========== 列配置功能 ==========
const columnConfigDialogVisible = ref(false)
const columnConfigForm = reactive({
  colIndex: -1,
  label: '',
  key: '',
  isEnum: false,
  enumOptions: [],
})
const newEnumOption = ref('')

// 打开列配置对话框
const openColumnConfig = () => {
  if (!contextMenuTarget.value) return

  const { col } = contextMenuTarget.value
  const colDef = columns.value[col]
  if (!colDef) {
    hideContextMenu()
    return
  }

  columnConfigForm.colIndex = col
  columnConfigForm.label = colDef.label
  columnConfigForm.key = colDef.key
  columnConfigForm.isEnum = !!(colDef.enumOptions && colDef.enumOptions.length > 0)
  columnConfigForm.enumOptions = colDef.enumOptions ? [...colDef.enumOptions] : []

  hideContextMenu()
  columnConfigDialogVisible.value = true
}

// 添加枚举选项
const addEnumOption = () => {
  const option = newEnumOption.value.trim()
  if (!option) return
  if (columnConfigForm.enumOptions.includes(option)) {
    ElMessage.warning('该选项已存在')
    return
  }
  columnConfigForm.enumOptions.push(option)
  newEnumOption.value = ''
}

// 删除枚举选项
const removeEnumOption = (index) => {
  columnConfigForm.enumOptions.splice(index, 1)
}

// 保存列配置
const saveColumnConfig = () => {
  const { colIndex, label, key, isEnum, enumOptions } = columnConfigForm

  if (!label.trim()) {
    ElMessage.warning('列名不能为空')
    return
  }

  if (!key.trim()) {
    ElMessage.warning('列ID不能为空')
    return
  }

  if (isEnum && enumOptions.length === 0) {
    ElMessage.warning('枚举类型至少需要一个选项')
    return
  }

  const colDef = columns.value[colIndex]
  if (!colDef) return

  const oldKey = colDef.key
  const newKey = key.trim()

  // 更新列定义
  colDef.label = label.trim()
  colDef.key = newKey
  colDef.enumOptions = isEnum ? [...enumOptions] : undefined

  // 如果 key 变化了，更新数据
  if (oldKey !== newKey) {
    testData.value.forEach(row => {
      if (row[oldKey] !== undefined) {
        row[newKey] = row[oldKey]
        delete row[oldKey]
      }
    })
  }

  // 如果是枚举类型且选项变化了，检查数据是否需要更新
  if (isEnum && enumOptions.length > 0) {
    testData.value.forEach(row => {
      if (row[newKey] && !enumOptions.includes(row[newKey])) {
        // 如果当前值不在新的枚举选项中，设置为第一个选项
        row[newKey] = enumOptions[0]
      }
    })
  }

  columnConfigDialogVisible.value = false
  ElMessage.success('列配置已保存')
}

// 加载测评集数据
const loadDataset = () => {
  const id = route.params.id
  // 模拟数据 - 与列表页保持一致
  const mockDatasets = {
    '1': {
      id: '1',
      name: '通用对话测评集',
      icon: 'ChatDotRound',
      iconType: 'preset',
      testType: 'objective',
      tags: ['对话', '通用'],
      description:
        '包含多轮对话、常识问答等通用场景的测试数据，用于评估模型的对话能力。',
      dataCount: 256,
      dictionaryId: 'dict-1',
      createdAt: '2024-01-15',
      updatedAt: '2024-02-20',
    },
    '2': {
      id: '2',
      name: '代码生成测评集',
      icon: 'Cpu',
      iconType: 'preset',
      testType: 'objective',
      tags: ['代码', '编程'],
      description: '包含多种编程语言的代码生成任务，用于评估模型的代码生成能力。',
      dataCount: 128,
      dictionaryId: 'dict-2',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-15',
    },
    '3': {
      id: '3',
      name: '文档摘要测评集',
      icon: 'Document',
      iconType: 'preset',
      testType: 'subjective',
      tags: ['摘要', '生成'],
      description: '包含新闻摘要、论文摘要等任务，用于评估模型的文本摘要能力。',
      dataCount: 156,
      dictionaryId: 'dict-3',
      createdAt: '2024-02-18',
      updatedAt: '2024-02-26',
    },
    '4': {
      id: '4',
      name: '阅读理解测评集',
      icon: 'DataAnalysis',
      iconType: 'preset',
      testType: 'objective',
      tags: ['问答', '检索'],
      description: '包含基于上下文的问答任务，用于评估模型的阅读理解和信息提取能力。',
      dataCount: 380,
      dictionaryId: 'dict-4',
      createdAt: '2024-02-19',
      updatedAt: '2024-02-26',
    },
    '5': {
      id: '5',
      name: 'SQL生成测评集',
      icon: 'Cpu',
      iconType: 'preset',
      testType: 'objective',
      tags: ['SQL', '数据库'],
      description: '包含自然语言转SQL的任务，用于评估模型的数据库查询生成能力。',
      dataCount: 120,
      dictionaryId: 'dict-2',
      createdAt: '2024-02-20',
      updatedAt: '2024-02-26',
    },
    '6': {
      id: '6',
      name: '情感分析测评集',
      icon: 'ChatDotRound',
      iconType: 'preset',
      testType: 'objective',
      tags: ['情感', 'NLP'],
      description: '包含文本情感分类、情绪识别等任务，用于评估模型的情感理解能力。',
      dataCount: 200,
      dictionaryId: 'dict-5',
      createdAt: '2024-02-17',
      updatedAt: '2024-02-26',
    },
  }

  dataset.value = mockDatasets[id] || {
    id,
    name: '示例测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['示例', '测试'],
    description: '这是一个示例测评集的描述信息。',
    dataCount: 15,
    dictionaryId: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-02-01',
  }

  // 模拟测试数据
  testData.value = Array.from({ length: dataset.value.dataCount }, (_, i) => ({
    id: `${i + 1}`,
    input: `测试输入内容 ${i + 1}`,
    expectedOutput: `期望输出内容 ${i + 1}`,
    category: ['问候', '询问', '建议', '闲聊'][i % 4],
    difficulty: ['简单', '中等', '困难'][i % 3],
  }))
}

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)

// 当前页数据
const currentTestData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return testData.value.slice(start, end)
})

// 总数
const total = computed(() => testData.value.length)

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  selectedCell.value = null
  editingCell.value = null
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  selectedCell.value = null
  editingCell.value = null
}

// 返回列表
const goBack = () => {
  router.push('/dataset')
}

// 跳转到数据字典详情
const goToDictionaryDetail = (id) => {
  router.push(`/dictionary/${id}`)
}

// 编辑测评集
const editDialogVisible = ref(false)
const editForm = reactive({
  name: '',
  description: '',
  tags: [],
  iconType: 'preset',
  icon: 'ChatDotRound',
  customIconUrl: '',
  testType: 'objective',
  dictionaryId: '',
})

// 编辑表单验证规则
const editFormRules = {
  name: [{ required: true, message: '请输入测评集名称', trigger: 'blur' }],
  testType: [{ required: true, message: '请选择测试类型', trigger: 'change' }],
  dictionaryId: [{ required: true, message: '请选择数据字典', trigger: 'change' }],
}

const handleEdit = () => {
  if (!dataset.value) return

  // 填充表单数据
  editForm.name = dataset.value.name
  editForm.description = dataset.value.description
  editForm.tags = [...(dataset.value.tags || [])]
  editForm.iconType = dataset.value.iconType || 'preset'
  editForm.icon = dataset.value.icon || 'ChatDotRound'
  editForm.customIconUrl = dataset.value.customIconUrl || ''
  editForm.testType = dataset.value.testType || 'objective'
  editForm.dictionaryId = dataset.value.dictionaryId || ''

  editDialogVisible.value = true
}

const saveDatasetEdit = () => {
  if (!editForm.name.trim()) {
    ElMessage.warning('请输入测评集名称')
    return
  }

  // 保存编辑
  dataset.value.name = editForm.name
  dataset.value.description = editForm.description
  dataset.value.tags = [...editForm.tags]
  dataset.value.iconType = editForm.iconType
  dataset.value.icon = editForm.icon
  dataset.value.customIconUrl = editForm.customIconUrl
  dataset.value.testType = editForm.testType
  dataset.value.dictionaryId = editForm.dictionaryId
  dataset.value.updatedAt = new Date().toISOString().slice(0, 10)

  editDialogVisible.value = false
  ElMessage.success('保存成功')
}

const cancelDatasetEdit = () => {
  editDialogVisible.value = false
}

// 处理图片上传
const handleImageUpload = (options) => {
  const file = options.file
  if (!file) return

  // 检查文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  // 模拟上传，使用 FileReader 读取为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.customIconUrl = e.target?.result
    ElMessage.success('图标上传成功')
  }
  reader.readAsDataURL(file)
}

// 删除自定义图标
const handleRemoveCustomIcon = () => {
  editForm.customIconUrl = ''
  ElMessage.success('已删除自定义图标')
}

// 解析文件数据
const parseFileData = (file, importMode) => {
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        ElMessage.error('文件中没有工作表')
        return
      }
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        ElMessage.error('无法读取工作表')
        return
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        ElMessage.warning('文件内容为空或只有表头')
        return
      }

      // 获取表头
      const headers = jsonData[0]
      const headerMap = {}
      headers.forEach((h, i) => {
        if (h) headerMap[h.trim().toLowerCase()] = i
      })

      // 查找列索引
      const inputCol = headerMap['input'] ?? headerMap['输入'] ?? 0
      const outputCol = headerMap['output'] ?? headerMap['期望输出'] ?? headerMap['输出'] ?? 1
      const categoryCol = headerMap['category'] ?? headerMap['分类'] ?? 2
      const difficultyCol = headerMap['difficulty'] ?? headerMap['难度'] ?? 3

      // 解析数据行
      const newRows = []
      const startId = importMode === 'replace' ? 1 : testData.value.length + 1
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        newRows.push({
          id: `${startId + newRows.length}`,
          input: String(row[inputCol] || ''),
          expectedOutput: String(row[outputCol] || ''),
          category: String(row[categoryCol] || '问候'),
          difficulty: String(row[difficultyCol] || '简单'),
        })
      }

      if (newRows.length === 0) {
        ElMessage.warning('没有解析到有效数据')
        return
      }

      // 根据导入方式处理数据
      if (importMode === 'replace') {
        testData.value = newRows
      } else {
        testData.value.push(...newRows)
      }

      if (dataset.value) {
        dataset.value.dataCount = testData.value.length
      }

      const modeText = importMode === 'replace' ? '覆盖导入' : '追加导入'
      ElMessage.success(`${modeText}成功，共 ${newRows.length} 条数据`)
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

// 选择文件并导入
const selectFile = (importMode) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls,.csv'
  input.onchange = (e) => {
    const target = e.target
    const file = target.files?.[0]
    if (!file) return
    parseFileData(file, importMode)
  }
  input.click()
}

// 导入文件
const handleImport = () => {
  ElMessageBox.confirm(
    '请选择导入方式',
    '导入数据',
    {
      distinguishCancelAndClose: true,
      confirmButtonText: '覆盖导入',
      cancelButtonText: '追加导入',
      type: 'info',
      message: h('div', null, [
        h('p', { style: 'margin-bottom: 12px;' }, '请选择导入方式：'),
        h('div', { style: 'margin-bottom: 8px; padding: 8px; background: #f0f9eb; border-radius: 4px;' }, [
          h('strong', { style: 'color: #67c23a;' }, '覆盖导入：'),
          h('span', { style: 'color: #606266; font-size: 12px;' }, ' 对数据格式无要求，将清空当前数据')
        ]),
        h('div', { style: 'padding: 8px; background: #fdf6ec; border-radius: 4px;' }, [
          h('strong', { style: 'color: #e6a23c;' }, '追加导入：'),
          h('span', { style: 'color: #606266; font-size: 12px;' }, ' 要求导入数据格式与当前格式保持一致')
        ])
      ])
    }
  )
    .then(() => {
      // 点击确认 - 覆盖导入
      selectFile('replace')
    })
    .catch((action) => {
      if (action === 'cancel') {
        // 点击取消 - 追加导入
        selectFile('append')
      }
      // 点击关闭按钮则不做任何操作
    })
}

// 选中单元格
const selectCell = (rowIndex, colIndex) => {
  if (!isTableEditMode.value) return
  selectedCell.value = { row: rowIndex, col: colIndex }
}

// 双击编辑
const startEdit = (rowIndex, colIndex) => {
  if (!isTableEditMode.value) return
  const col = columns.value[colIndex]
  if (!col || col.key === 'id') return // ID列不可编辑

  editingCell.value = { row: rowIndex, col: colIndex }
  const row = currentTestData.value[rowIndex]
  if (row) {
    editContent.value = row[col.key] || ''
  }
}

// 保存单元格编辑
const saveCellEdit = () => {
  if (!editingCell.value) return

  const { row, col } = editingCell.value
  const colDef = columns.value[col]
  if (!colDef) return

  const colKey = colDef.key
  const actualIndex = (currentPage.value - 1) * pageSize.value + row
  if (testData.value[actualIndex]) {
    testData.value[actualIndex][colKey] = editContent.value
  }

  editingCell.value = null
  editContent.value = ''
  ElMessage.success('保存成功')
}

// 取消单元格编辑
const cancelCellEdit = () => {
  editingCell.value = null
  editContent.value = ''
}

// ========== 右键菜单功能 ==========

// 右键菜单处理
const handleContextMenu = (e, rowIndex, colIndex) => {
  if (!isTableEditMode.value) return
  e.preventDefault()

  selectedCell.value = { row: rowIndex, col: colIndex }
  contextMenuTarget.value = { type: 'cell', row: rowIndex, col: colIndex }
  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
}

// 右键菜单样式（位置）
const contextMenuStyle = computed(() => {
  if (!contextMenuTarget.value) return {}
  return {
    left: `${contextMenuPosition.value.x}px`,
    top: `${contextMenuPosition.value.y}px`,
  }
})

// 在上方添加一行
const addRowAbove = () => {
  if (!contextMenuTarget.value) return

  const { row } = contextMenuTarget.value
  const actualIndex = (currentPage.value - 1) * pageSize.value + row

  // 创建新行数据
  const newRow = {}
  columns.value.forEach(col => {
    if (col.key === 'id') {
      newRow[col.key] = 'new'
    } else if (col.enumOptions && col.enumOptions.length > 0) {
      // 枚举列使用第一个选项作为默认值
      newRow[col.key] = col.enumOptions[0]
    } else {
      newRow[col.key] = ''
    }
  })

  testData.value.splice(actualIndex, 0, newRow)

  // 重新生成 ID
  testData.value.forEach((item, index) => {
    item.id = `${index + 1}`
  })

  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }

  hideContextMenu()
  ElMessage.success('已在上方添加一行')
}

// 在下方添加一行
const addRowBelow = () => {
  if (!contextMenuTarget.value) return

  const { row } = contextMenuTarget.value
  const actualIndex = (currentPage.value - 1) * pageSize.value + row + 1

  // 创建新行数据
  const newRow = {}
  columns.value.forEach(col => {
    if (col.key === 'id') {
      newRow[col.key] = 'new'
    } else if (col.enumOptions && col.enumOptions.length > 0) {
      // 枚举列使用第一个选项作为默认值
      newRow[col.key] = col.enumOptions[0]
    } else {
      newRow[col.key] = ''
    }
  })

  testData.value.splice(actualIndex, 0, newRow)

  // 重新生成 ID
  testData.value.forEach((item, index) => {
    item.id = `${index + 1}`
  })

  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }

  hideContextMenu()
  ElMessage.success('已在下方添加一行')
}

// 在左侧添加一列
const addColumnLeft = () => {
  if (!contextMenuTarget.value) return

  const { col } = contextMenuTarget.value
  const newCol = {
    key: `column_${Date.now()}`,
    label: '新列',
    width: 100,
  }

  columns.value.splice(col, 0, newCol)

  // 为所有数据添加新字段
  testData.value.forEach(row => {
    const newRowData = {}
    let inserted = false
    Object.keys(row).forEach((key, index) => {
      if (index === col && !inserted) {
        newRowData[newCol.key] = ''
        inserted = true
      }
      newRowData[key] = row[key]
    })
    if (!inserted) {
      newRowData[newCol.key] = ''
    }
    // 更新原对象
    Object.keys(row).forEach(key => delete row[key])
    Object.assign(row, newRowData)
  })

  hideContextMenu()
  ElMessage.success('已在左侧添加一列')
}

// 在右侧添加一列
const addColumnRight = () => {
  if (!contextMenuTarget.value) return

  const { col } = contextMenuTarget.value
  const newCol = {
    key: `column_${Date.now()}`,
    label: '新列',
    width: 100,
  }

  columns.value.splice(col + 1, 0, newCol)

  // 为所有数据添加新字段
  testData.value.forEach(row => {
    row[newCol.key] = ''
  })

  hideContextMenu()
  ElMessage.success('已在右侧添加一列')
}

// 删除整行
const deleteEntireRow = () => {
  if (!contextMenuTarget.value) return

  const { row } = contextMenuTarget.value
  const actualIndex = (currentPage.value - 1) * pageSize.value + row

  testData.value.splice(actualIndex, 1)

  // 重新生成 ID
  testData.value.forEach((item, index) => {
    item.id = `${index + 1}`
  })

  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }

  selectedCell.value = null
  hideContextMenu()
  ElMessage.success('已删除整行')
}

// 删除整列
const deleteEntireColumn = () => {
  if (!contextMenuTarget.value) return

  const { col } = contextMenuTarget.value
  const colDef = columns.value[col]

  if (!colDef) {
    hideContextMenu()
    return
  }

  // 至少保留一列
  if (columns.value.length <= 1) {
    ElMessage.warning('至少需要保留一列')
    hideContextMenu()
    return
  }

  const colKey = colDef.key

  // 从列定义中移除
  columns.value.splice(col, 1)

  // 从所有数据中移除该字段
  testData.value.forEach(row => {
    delete row[colKey]
  })

  selectedCell.value = null
  hideContextMenu()
  ElMessage.success('已删除整列')
}

// 隐藏右键菜单
const hideContextMenu = () => {
  if (!contextMenuTarget.value) return
  contextMenuTarget.value = null
}

// 点击其他地方隐藏菜单
const handlePageClick = () => {
  if (contextMenuTarget.value) {
    hideContextMenu()
  }
}

// 添加行
const handleAddRow = () => {
  if (!isTableEditMode.value) return
  const newId = testData.value.length + 1

  // 创建新行数据
  const newRow = { id: `${newId}` }
  columns.value.forEach(col => {
    if (col.key !== 'id') {
      if (col.enumOptions && col.enumOptions.length > 0) {
        newRow[col.key] = col.enumOptions[0]
      } else {
        newRow[col.key] = ''
      }
    }
  })

  testData.value.push(newRow)
  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }
  // 跳转到最后一页
  currentPage.value = Math.ceil(testData.value.length / pageSize.value)
  ElMessage.success('已添加新行')
}

// 删除选中行
const handleDeleteRow = () => {
  if (!isTableEditMode.value) return
  if (!selectedCell.value) {
    ElMessage.warning('请先选择要删除的行')
    return
  }

  const rowIndex = selectedCell.value.row
  const actualIndex = (currentPage.value - 1) * pageSize.value + rowIndex
  const row = testData.value[actualIndex]

  ElMessageBox.confirm(`确定要删除第 ${row.id} 行数据吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    testData.value.splice(actualIndex, 1)
    if (dataset.value) {
      dataset.value.dataCount = testData.value.length
    }
    selectedCell.value = null
    ElMessage.success('删除成功')
  })
}

// 键盘导航
const handleKeyDown = (e) => {
  if (!isTableEditMode.value) return

  if (editingCell.value) {
    if (e.key === 'Enter') {
      saveCellEdit()
    } else if (e.key === 'Escape') {
      cancelCellEdit()
    }
    return
  }

  if (!selectedCell.value) return

  const { row, col } = selectedCell.value
  const maxRow = currentTestData.value.length - 1
  const maxCol = columns.value.length - 1

  switch (e.key) {
    case 'ArrowUp':
      selectedCell.value = { row: Math.max(0, row - 1), col }
      break
    case 'ArrowDown':
      selectedCell.value = { row: Math.min(maxRow, row + 1), col }
      break
    case 'ArrowLeft':
      selectedCell.value = { row, col: Math.max(0, col - 1) }
      break
    case 'ArrowRight':
      selectedCell.value = { row, col: Math.min(maxCol, col + 1) }
      break
    case 'Enter':
    case 'F2':
      startEdit(row, col)
      break
    case 'Delete':
      handleDeleteRow()
      break
  }
}

onMounted(() => {
  loadDataset()
  nextTick(() => {
    window.addEventListener('keydown', handleKeyDown)
  })
})
</script>

<template>
  <div class="dataset-detail-page" @click="handlePageClick">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info" v-if="dataset">
          <h2>{{ dataset.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ dataset.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><FolderOpened /></el-icon>
              {{ dataset.dataCount }} 条数据
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="Upload" @click="handleImport">导入</el-button>
        <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
      </div>
    </div>

    <!-- 测评集信息卡片 -->
    <el-card class="info-card" v-if="dataset">
      <div class="info-content">
        <div class="info-icon">
          <img
            v-if="dataset.iconType === 'custom' && dataset.customIconUrl"
            :src="dataset.customIconUrl"
            :alt="dataset.name"
            class="custom-icon"
          />
          <el-icon v-else :size="48">
            <component :is="getIconComponent(dataset.icon)" />
          </el-icon>
        </div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">测试类型：</span>
            <div class="info-value">
              <el-tag :type="getTestTypeTagType(dataset.testType)" size="small">
                {{ getTestTypeText(dataset.testType) }}
              </el-tag>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">描述：</span>
            <span class="info-value">{{ dataset.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">标签：</span>
            <div class="info-tags">
              <el-tag v-for="tag in dataset.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="info-row" v-if="getDictionary(dataset.dictionaryId)">
            <span class="info-label">数据字典：</span>
            <div class="info-value">
              <div class="dictionary-link clickable" @click="goToDictionaryDetail(dataset.dictionaryId)">
                <el-icon><Collection /></el-icon>
                <span>{{ getDictionary(dataset.dictionaryId)?.name }}</span>
                <el-tag size="small" type="info" effect="plain" style="margin-left: 8px;">
                  {{ getDictionary(dataset.dictionaryId)?.columns?.length || 0 }} 个字段
                </el-tag>
              </div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">更新时间：</span>
            <span class="info-value">{{ dataset.updatedAt }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 测试数据 Excel 表格 -->
    <div class="excel-container">
      <div class="excel-toolbar">
        <div class="toolbar-left">
          <el-button
            v-if="!isTableEditMode"
            type="primary"
            :icon="Edit"
            size="small"
            @click="enterEditMode"
          >
            编辑
          </el-button>
          <el-tooltip
            v-if="!isTableEditMode"
            content="使用AI Agent自动化爬取数据"
            placement="top"
          >
            <el-button
              type="success"
              :icon="MagicStick"
              size="small"
              @click="showGenerateDialog"
            >
              一键生成数据
            </el-button>
          </el-tooltip>
          <template v-else>
            <el-button type="success" :icon="Check" size="small" @click="saveEdit">
              保存
            </el-button>
            <el-button size="small" @click="cancelEdit">
              取消
            </el-button>
          </template>
        </div>
        <div class="toolbar-right">
          <span v-if="isTableEditMode" class="toolbar-tip">
            提示：双击单元格编辑，右键打开菜单
          </span>
          <span v-else class="toolbar-tip">点击"编辑"按钮进入编辑模式</span>
        </div>
      </div>

      <!-- 生成进度条 -->
      <div v-if="isGenerating" class="generate-progress-container">
        <div class="progress-header">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span class="progress-title">{{ generateStatusText }}</span>
        </div>
        <el-progress
          :percentage="generateProgress"
          :stroke-width="8"
          :show-text="true"
          :format="(percentage) => `${percentage}%`"
        />
      </div>

      <div class="excel-wrapper" :class="{ 'edit-mode': isTableEditMode }">
        <table class="excel-table">
          <thead>
            <tr>
              <th class="row-header"></th>
              <th
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :style="{ width: col.width + 'px' }"
                :class="{
                  'col-selected': selectedCell?.col === colIndex,
                  'header-editable': isTableEditMode,
                  'header-editing': editingHeaderCell?.type === 'label' && editingHeaderCell?.index === colIndex,
                }"
                @click="isTableEditMode && selectHeaderCell('label', colIndex)"
                @dblclick="isTableEditMode && startHeaderEdit('label', colIndex)"
              >
                <template v-if="editingHeaderCell?.type === 'label' && editingHeaderCell?.index === colIndex">
                  <input
                    v-model="editHeaderContent"
                    class="header-input"
                    @blur="saveHeaderEdit"
                    @keyup.enter="saveHeaderEdit"
                    @keyup.esc="cancelHeaderEdit"
                    ref="headerEditInput"
                    autofocus
                  />
                </template>
                <template v-else>
                  {{ col.label }}
                </template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in currentTestData"
              :key="row.id"
              :class="{ 'row-selected': selectedCell?.row === rowIndex }"
            >
              <td class="row-header">{{ (currentPage - 1) * pageSize + rowIndex + 1 }}</td>
              <td
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :class="{
                  'cell-selected':
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex,
                  'cell-editing':
                    editingCell?.row === rowIndex && editingCell?.col === colIndex,
                }"
                @click="selectCell(rowIndex, colIndex)"
                @dblclick="startEdit(rowIndex, colIndex)"
                @contextmenu="handleContextMenu($event, rowIndex, colIndex)"
              >
                <template
                  v-if="editingCell?.row === rowIndex && editingCell?.col === colIndex"
                >
                  <input
                    v-if="!col.enumOptions"
                    v-model="editContent"
                    class="cell-input"
                    @blur="saveCellEdit"
                    @keyup.enter="saveCellEdit"
                    @keyup.esc="cancelCellEdit"
                    ref="editInput"
                    autofocus
                  />
                  <select
                    v-else
                    v-model="editContent"
                    class="cell-select"
                    @change="saveCellEdit"
                    @blur="cancelCellEdit"
                  >
                    <option v-for="option in col.enumOptions" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                </template>
                <template v-else>
                  <span class="cell-text">{{ row[col.key] }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 右键菜单 -->
        <div
          v-if="contextMenuTarget && isTableEditMode"
          class="context-menu"
          :style="contextMenuStyle"
          @click.stop
        >
          <div class="context-menu-item" @click="addRowAbove">
            <el-icon><Plus /></el-icon>
            <span>在上方添加一行</span>
          </div>
          <div class="context-menu-item" @click="addRowBelow">
            <el-icon><Plus /></el-icon>
            <span>在下方添加一行</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" @click="addColumnLeft">
            <el-icon><Plus /></el-icon>
            <span>在左侧添加一列</span>
          </div>
          <div class="context-menu-item" @click="addColumnRight">
            <el-icon><Plus /></el-icon>
            <span>在右侧添加一列</span>
          </div>
          <div class="context-menu-item" @click="openColumnConfig">
            <el-icon><Setting /></el-icon>
            <span>配置列</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item danger" @click="deleteEntireRow">
            <el-icon><Delete /></el-icon>
            <span>删除整行</span>
          </div>
          <div class="context-menu-item danger" @click="deleteEntireColumn">
            <el-icon><Delete /></el-icon>
            <span>删除整列</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </div>

    <!-- 编辑测评集对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑测评集"
      width="720px"
      :close-on-click-modal="false"
      class="edit-dataset-dialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="88px"
        label-position="left"
        class="dataset-form"
      >
        <!-- 基础配置 -->
        <div class="form-section-card">
          <div class="section-header">
            <div class="section-icon">
              <el-icon :size="18"><Document /></el-icon>
            </div>
            <div class="section-info">
              <div class="section-title">基础配置</div>
              <div class="section-desc">设置测评集的基本信息</div>
            </div>
          </div>

          <div class="section-content">
            <el-form-item label="名称" prop="name">
              <el-input
                v-model="editForm.name"
                placeholder="请输入测评集名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>

            <el-form-item prop="testType">
              <template #label>
                <span>测试类型</span>
                <el-tooltip placement="top">
                  <template #content>
                    <div class="tooltip-content">
                      <p><strong>客观题：</strong>有标准答案，可自动判定通过/失败</p>
                      <p><strong>主观题：</strong>无标准答案，需人工评估</p>
                    </div>
                  </template>
                  <el-icon class="label-tooltip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-radio-group v-model="editForm.testType" class="test-type-radio">
                <el-radio-button
                  v-for="option in testTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="描述" prop="description">
              <el-input
                v-model="editForm.description"
                type="textarea"
                placeholder="请输入测评集描述，说明用途和测试场景"
                :rows="3"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </div>
        </div>

        <!-- 标签与字典 -->
        <div class="form-section-card">
          <div class="section-header">
            <div class="section-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <el-icon :size="18"><Collection /></el-icon>
            </div>
            <div class="section-info">
              <div class="section-title">标签与字典</div>
              <div class="section-desc">关联数据结构和分类标签</div>
            </div>
          </div>

          <div class="section-content">
            <el-form-item label="标签" prop="tags">
              <el-select
                v-model="editForm.tags"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择标签便于分类和检索"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in presetTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>

            <el-form-item prop="dictionaryId">
              <template #label>
                <span>数据字典</span>
                <el-tooltip content="选择数据字典后，将自动继承其字段结构" placement="top">
                  <el-icon class="label-tooltip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-select
                v-model="editForm.dictionaryId"
                placeholder="选择关联的数据字典"
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dataDictionaries"
                  :key="dict.id"
                  :label="dict.name"
                  :value="dict.id"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 图标设置 -->
        <div class="form-section-card">
          <div class="section-header">
            <div class="section-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
              <el-icon :size="18"><DataAnalysis /></el-icon>
            </div>
            <div class="section-info">
              <div class="section-title">图标设置</div>
              <div class="section-desc">选择或上传测评集图标</div>
            </div>
          </div>

          <div class="section-content">
            <el-form-item label="图标类型" prop="icon">
              <div class="icon-selector">
                <el-radio-group v-model="editForm.iconType" class="icon-type-group">
                  <el-radio-button value="preset">预设图标</el-radio-button>
                  <el-radio-button value="custom">自定义上传</el-radio-button>
                </el-radio-group>

                <!-- 预设图标选择 -->
                <div v-if="editForm.iconType === 'preset'" class="preset-icons-grid">
                  <div
                    v-for="option in iconOptions"
                    :key="option.value"
                    class="icon-card"
                    :class="{ active: editForm.icon === option.value }"
                    @click="editForm.icon = option.value"
                  >
                    <div class="icon-preview">
                      <el-icon :size="28">
                        <component :is="iconMap[option.value]" />
                      </el-icon>
                    </div>
                    <span class="icon-label">{{ option.label }}</span>
                  </div>
                </div>

                <!-- 自定义图标上传 -->
                <div v-else class="custom-icon-upload">
                  <el-upload
                    v-if="!editForm.customIconUrl"
                    class="icon-uploader"
                    :show-file-list="false"
                    :http-request="handleImageUpload"
                    accept="image/*"
                    drag
                  >
                    <div class="upload-content">
                      <el-icon class="upload-icon" :size="32"><Plus /></el-icon>
                      <div class="upload-text">
                        <span>点击或拖拽上传</span>
                        <span class="upload-hint">支持 JPG、PNG 格式，不超过 2MB</span>
                      </div>
                    </div>
                  </el-upload>
                  <div v-else class="custom-icon-preview">
                    <img :src="editForm.customIconUrl" alt="自定义图标" />
                    <div class="preview-overlay">
                      <el-button type="danger" size="small" circle @click="handleRemoveCustomIcon">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelDatasetEdit">取消</el-button>
          <el-button type="primary" @click="saveDatasetEdit">保存修改</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 一键生成数据对话框 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="一键生成数据"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetGenerateForm"
    >
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="生成数量">
          <el-input-number
            v-model="generateForm.count"
            :min="1"
            :max="1000"
            :step="10"
          />
          <span class="form-tip">条</span>
        </el-form-item>
        <el-form-item>
          <template #label>
            <div class="constraints-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>可为每列填写约束信息，帮助 AI 更精准地生成符合预期的数据</span>
            </div>
          </template>
          <div class="constraints-list">
            <div v-for="col in columns" :key="col.key" class="constraint-item">
              <div class="constraint-label">
                <span class="label-text">{{ col.label }}</span>
                <span class="label-key">({{ col.key }})</span>
              </div>
              <el-input
                v-model="generateForm.constraints[col.key]"
                type="textarea"
                :rows="2"
                placeholder="例如：生成1-100之间的随机数"
                resize="none"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="MagicStick" @click="generateRandomData">
          生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 列配置对话框 -->
    <el-dialog
      v-model="columnConfigDialogVisible"
      title="配置列"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="columnConfigForm" label-width="100px">
        <el-form-item label="列名" required>
          <el-input v-model="columnConfigForm.label" placeholder="请输入列名" />
        </el-form-item>

        <el-form-item label="列ID" required>
          <el-input v-model="columnConfigForm.key" placeholder="请输入列ID" />
        </el-form-item>

        <el-form-item label="列类型">
          <el-radio-group v-model="columnConfigForm.isEnum">
            <el-radio-button :value="false">普通文本</el-radio-button>
            <el-radio-button :value="true">枚举类型</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="columnConfigForm.isEnum" label="枚举选项" required>
          <div class="enum-options-container">
            <div class="enum-options-list">
              <div
                v-if="columnConfigForm.enumOptions.length === 0"
                class="enum-options-empty"
              >
                <el-icon class="empty-icon"><List /></el-icon>
                <span>暂无枚举选项，请添加选项后生效</span>
              </div>
              <div
                v-for="(option, index) in columnConfigForm.enumOptions"
                :key="index"
                class="enum-option-item"
              >
                <span class="enum-option-text">{{ option }}</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  @click="removeEnumOption(index)"
                />
              </div>
            </div>
            <div class="enum-option-add" @click.stop>
              <el-input
                v-model="newEnumOption"
                placeholder="输入新选项"
                size="small"
                @keyup.enter.stop="addEnumOption"
                @keydown.stop
              />
              <el-button type="primary" size="small" @click.stop="addEnumOption">添加</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="columnConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveColumnConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dataset-detail-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.info-card {
  margin-bottom: 24px;
}

.info-content {
  display: flex;
  gap: 24px;
}

.info-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  flex-shrink: 0;
}

.info-icon .custom-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.info-details {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Excel 表格样式 */
.excel-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.excel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-tip {
  font-size: 12px;
  color: #909399;
}

.excel-wrapper {
  overflow: auto;
  max-height: 600px;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.excel-table th,
.excel-table td {
  border: 1px solid #d4d4d4;
  padding: 0;
  height: 32px;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
  box-sizing: border-box;
}

.excel-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
  padding: 0 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table .column-id-row th {
  background: #e8e8e8;
  font-weight: 400;
  color: #666;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  top: 32px;
}

/* 可编辑表头样式 */
.excel-table th.header-editable {
  cursor: text;
}

.excel-table th.header-editable:hover {
  background: #e8f4ff;
}

.excel-table th.header-editing {
  padding: 0;
  background: #fffbe6;
}

.excel-table .column-id-row th.header-editable:hover {
  background: #e0e8f0;
}

.excel-table .column-id-row th.header-editing {
  background: #fffbe6;
}

.header-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  background: transparent;
  font-weight: inherit;
  font-family: inherit;
}

.excel-table .column-id-row .header-input {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.excel-table th.row-header {
  width: 50px;
  text-align: center;
  background: #e8e8e8;
}

.excel-table td.row-header {
  text-align: center;
  background: #f5f5f5;
  color: #666;
  font-weight: 500;
}

.excel-table td {
  padding: 0 8px;
  background: #fff;
  color: #303133;
}

.excel-wrapper.edit-mode .excel-table td {
  cursor: cell;
}

.excel-wrapper.edit-mode .excel-table td:hover {
  background: #f0f7ff;
}

.excel-table td.cell-selected {
  background: #e6f4ff;
  outline: 2px solid #1890ff;
  outline-offset: -2px;
}

.excel-table tr.row-selected td {
  background: #f5f9ff;
}

.excel-table tr.row-selected td.cell-selected {
  background: #e6f4ff;
}

.excel-table td.cell-editing {
  padding: 0;
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  background: #fffbe6;
}

.cell-select {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  background: #fffbe6;
  cursor: pointer;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.difficulty-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #303133;
}

.difficulty-简单 {
  background: #e6f7e6;
}

.difficulty-中等 {
  background: #fff7e6;
}

.difficulty-困难 {
  background: #fff1f0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #ebeef5;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
  z-index: 3000;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.context-menu-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.context-menu-item.danger {
  color: #f56c6c;
}

.context-menu-item.danger:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.context-menu-item .el-icon {
  font-size: 14px;
}

.context-menu-divider {
  height: 1px;
  background: #e4e7ed;
  margin: 4px 0;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

/* 生成进度条样式 */
.generate-progress-container {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e9 100%);
  border-bottom: 1px solid #e1f3d8;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.loading-icon {
  font-size: 18px;
  color: #67c23a;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #67c23a;
}

/* 枚举选项配置样式 */
.enum-options-container {
  width: 100%;
}

.enum-options-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
  background: #fafafa;
}

.enum-options-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 8px;
  color: #909399;
}

.enum-options-empty .empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.enum-options-empty span {
  font-size: 12px;
}

.enum-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.enum-option-item:last-child {
  margin-bottom: 0;
}

.enum-option-text {
  flex: 1;
  font-size: 13px;
  color: #606266;
}

.enum-option-add {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.enum-option-add .el-input {
  flex: 1;
}

.enum-option-add .el-button {
  flex-shrink: 0;
}

/* 数据字典链接样式 */
.dictionary-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  font-size: 14px;
}

.dictionary-link.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 6px;
}

.dictionary-link.clickable:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #5a67d8;
}

.dictionary-link .el-icon {
  font-size: 16px;
}

/* 编辑测评集对话框样式 */
.edit-dataset-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-right: 0;
}

.edit-dataset-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.edit-dataset-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.edit-dataset-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.dataset-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 表单分区卡片 */
.form-section-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.form-section-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(to right, #f9fafb, #ffffff);
  border-bottom: 1px solid #e5e7eb;
}

.section-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.section-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.section-content {
  padding: 20px;
}

.section-content :deep(.el-form-item) {
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 20px;
}

.section-content :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.section-content :deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.section-content :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

/* 测试类型单选按钮 */
.test-type-radio {
  width: 100%;
  display: flex;
}

.test-type-radio :deep(.el-radio-button) {
  flex: 1;
}

.test-type-radio :deep(.el-radio-button__inner) {
  width: 100%;
}

/* 图标选择器 */
.icon-selector {
  width: 100%;
}

.icon-type-group {
  margin-bottom: 16px;
}

/* 预设图标网格 */
.preset-icons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.icon-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.icon-card.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.icon-preview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px;
  color: #fff;
}

.icon-card.active .icon-preview {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.05);
}

.icon-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.icon-card.active .icon-label {
  color: #3b82f6;
}

/* 自定义图标上传 */
.custom-icon-upload {
  margin-top: 12px;
}

.icon-uploader {
  width: 100%;
}

.icon-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #fafafa;
  padding: 24px;
  transition: all 0.2s ease;
}

.icon-uploader :deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #9ca3af;
}

.icon-uploader :deep(.el-upload-dragger:hover) .upload-icon {
  color: #3b82f6;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-text span {
  font-size: 14px;
  color: #6b7280;
}

.upload-hint {
  font-size: 12px !important;
  color: #9ca3af !important;
}

/* 自定义图标预览 */
.custom-icon-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  margin: 0 auto;
}

.custom-icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.custom-icon-preview:hover .preview-overlay {
  opacity: 1;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  min-width: 100px;
}

/* 标签提示图标 */
.label-tooltip-icon {
  margin-left: 4px;
  color: #9ca3af;
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.2s;
}

.label-tooltip-icon:hover {
  color: #3b82f6;
}

/* 提示框内容 */
.tooltip-content p {
  margin: 0 0 6px 0;
  line-height: 1.5;
}

.tooltip-content p:last-child {
  margin-bottom: 0;
}

.tooltip-content strong {
  color: #3b82f6;
}

.constraints-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.constraints-tip .el-icon {
  color: #409eff;
}

.constraints-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.constraint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.2s;
}

.constraint-item:hover {
  background: #f0f2f5;
}

.constraint-label {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 100px;
}

.label-key {
  color: #606266;
  font-size: 12px;
}

.label-key {
  color: #909399;
  font-size: 12px;
  background: #e4e7ed;
  padding: 2px 6px;
  border-radius: 4px;
}

.constraint-item .el-input {
  flex: 1;
}

.constraint-item .el-textarea {
  flex: 1;
}
</style>
