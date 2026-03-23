<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  FolderOpened,
  Plus,
  Delete,
  More,
  DataAnalysis,
  Document,
  ChatDotRound,
  Cpu,
  Search,
  Collection,
  QuestionFilled,
  DataLine,
  WarningFilled,
  Headset,
  Picture,
  VideoCamera,
} from '@element-plus/icons-vue'
import {
  getDictionaryList,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  getDictionaryLinkStatus,
} from '@/api/dictionary'

const router = useRouter()

// 当前标签页
const activeTab = ref('datasets')

// 数据字典列表
const dataDictionaries = ref([])

// 数据字典加载状态
const dictionaryLoading = ref(false)

// 数据字典总数（用于分页）
const dictTotalFromApi = ref(0)

// 数据字典搜索
const dictSearchKeyword = ref('')

// 搜索防抖定时器
let searchDebounceTimer = null

// 加载数据字典列表
const loadDictionaries = async () => {
  dictionaryLoading.value = true
  try {
    const params = {
      page: dictCurrentPage.value,
      size: dictPageSize.value,
    }
    if (dictSearchKeyword.value) {
      params.keyword = dictSearchKeyword.value
    }
    const response = await getDictionaryList(params)
    if (response.code === 200) {
      // 转换API响应格式到前端格式
      dataDictionaries.value = response.data.list.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        columns: item.columns || [],
        linkedDatasetCount: item.linkedDatasetCount || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      dictTotalFromApi.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('系统服务异常！')
    console.error('加载数据字典失败:', error)
  } finally {
    dictionaryLoading.value = false
  }
}

// 处理搜索输入（带防抖）
const handleDictSearch = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    dictCurrentPage.value = 1
    loadDictionaries()
  }, 300)
}

// 监听搜索关键词变化
const onDictSearchChange = () => {
  handleDictSearch()
}

// 数据字典分页
const dictCurrentPage = ref(1)
const dictPageSize = ref(10)

// 数据字典总数（使用API返回的总数）
const dictTotal = computed(() => dictTotalFromApi.value)

// 当前页的数据字典（直接使用API返回的数据）
const paginatedDictionaries = computed(() => dataDictionaries.value)

// 获取列类型显示文本
const getColumnTypeText = (type) => {
  const typeMap = {
    string: '字符串',
    number: '数字',
    enum: '枚举',
  }
  return typeMap[type] || type
}

// 获取数据字典关联的测评集列表（保留用于查看详情对话框）
const getLinkedDatasets = (dictionaryId) => {
  return allDatasets.value.filter(d => d.dictionaryId === dictionaryId)
}

// 获取数据字典关联的测评集数量（用于卡片显示）
const getLinkedDatasetCount = (dictionaryId) => {
  if (!dictionaryId) return 0
  return allDatasets.value.filter(d => d.dictionaryId === dictionaryId).length
}

// 根据字典ID获取字典名称
const getDictionaryName = (dictionaryId) => {
  if (!dictionaryId) return ''
  const dict = dataDictionaries.value.find(d => d.id === dictionaryId)
  return dict ? dict.name : ''
}

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editingId = ref('')

// 对话框标题
const dialogTitle = computed(() => (isEditMode.value ? '编辑测评集' : '新建测评集'))

// 搜索和筛选
const searchKeyword = ref('')
const selectedTestType = ref('all')
const selectedMediaType = ref('all')

// 表单数据
const formData = reactive({
  name: '',
  iconType: 'preset',
  icon: 'ChatDotRound',
  customIconUrl: '',
  mediaType: 'text', // 媒体类型：text/audio/image/video
  testType: 'objective',
  tags: [],
  description: '',
  dictionaryId: '', // 关联的数据字典ID
})

// 媒体类型选项
const mediaTypeOptions = [
  { value: 'text', label: '文本', icon: 'Document', color: '#67C23A', desc: '文本类测评数据' },
  { value: 'audio', label: '语音', icon: 'Headset', color: '#E6A23C', desc: '语音文件测评数据' },
  { value: 'image', label: '图片', icon: 'Picture', color: '#409EFF', desc: '图片文件测评数据' },
  { value: 'video', label: '视频', icon: 'VideoCamera', color: '#F56C6C', desc: '视频文件测评数据' },
]

// 获取媒体类型颜色
const getMediaTypeColor = (mediaType) => {
  const option = mediaTypeOptions.find((opt) => opt.value === mediaType)
  return option?.color || '#909399'
}

// 获取媒体类型渐变色（用于卡片图标背景）
const getMediaTypeGradient = (mediaType) => {
  const gradients = {
    text: 'linear-gradient(135deg, #67C23A 0%, #4CAF50 100%)',
    audio: 'linear-gradient(135deg, #E6A23C 0%, #FF9800 100%)',
    image: 'linear-gradient(135deg, #409EFF 0%, #2196F3 100%)',
    video: 'linear-gradient(135deg, #F56C6C 0%, #E91E63 100%)',
  }
  return gradients[mediaType] || gradients.text
}

// 获取媒体类型图标
const getMediaTypeIcon = (mediaType) => {
  const iconMap = {
    text: Document,
    audio: Headset,
    image: Picture,
    video: VideoCamera,
  }
  return iconMap[mediaType] || Document
}

// 获取媒体类型文本
const getMediaTypeText = (mediaType) => {
  const option = mediaTypeOptions.find((opt) => opt.value === mediaType)
  return option?.label || '文本'
}

// 获取媒体类型图标组件
const getMediaTypeIconComponent = (iconName) => {
  const iconMap = {
    Document,
    Headset,
    Picture,
    VideoCamera,
  }
  return iconMap[iconName] || Document
}

// 媒体类型相关的近义词映射
const mediaTypeSynonyms = {
  text: ['文本', '文字', '文档'],
  audio: ['语音', '音频', '声音'],
  image: ['图片', '图像', '照片'],
  video: ['视频', '影像'],
}

// 获取过滤后的标签（移除与媒体类型重复的标签及近义词）
const getFilteredTags = (dataset) => {
  if (!dataset.tags) return []
  const mediaType = dataset.mediaType || 'text'
  const synonyms = mediaTypeSynonyms[mediaType] || []
  return dataset.tags.filter(tag => !synonyms.includes(tag))
}

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
  return testType === 'subjective' ? 'warning' : undefined
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

// 新建数据字典对话框
const dictionaryDialogVisible = ref(false)
const dictionaryFormRef = ref()
const isDictionaryEditMode = ref(false)
const editingDictionaryId = ref('')
const dictionaryForm = reactive({
  name: '',
  columns: [
    { key: 'id', label: 'ID', type: 'string' },
  { key: 'input', label: '输入', type: 'string' },
    { key: 'output', label: '输出', type: 'string' },
  ],
})

// 数据字典表单验证规则
const dictionaryFormRules = {
  name: [
    { required: true, message: '请输入数据字典名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

// 数据字典对话框标题
const dictionaryDialogTitle = computed(() =>
  isDictionaryEditMode.value ? '编辑数据字典' : '新建数据字典'
)

// 打开新建数据字典对话框
const openCreateDictionaryDialog = () => {
  isDictionaryEditMode.value = false
  editingDictionaryId.value = ''
  dictionaryForm.name = ''
  dictionaryForm.columns = [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'input', label: '输入', type: 'string' },
    { key: 'output', label: '输出', type: 'string' },
  ]
  dictionaryDialogVisible.value = true
}

// 打开编辑数据字典对话框
const openEditDictionaryDialog = (dict) => {
  isDictionaryEditMode.value = true
  editingDictionaryId.value = dict.id
  dictionaryForm.name = dict.name
  dictionaryForm.columns = dict.columns.map(col => ({
    key: col.key,
    label: col.label,
    type: col.type,
    ...(col.min !== undefined && { min: col.min }),
    ...(col.max !== undefined && { max: col.max }),
    ...(col.enumOptions && { enumOptions: Array.isArray(col.enumOptions) ? col.enumOptions.join(',') : col.enumOptions }),
  }))
  dictionaryDialogVisible.value = true
}

// 查看数据字典对话框
const viewDictionaryDialogVisible = ref(false)
const viewingDictionary = ref(null)

// 打开查看数据字典对话框
const openViewDictionaryDialog = (dict) => {
  viewingDictionary.value = dict
  viewDictionaryDialogVisible.value = true
}

// 删除数据字典
const handleDeleteDictionary = async (dict) => {
  try {
    // 先检查关联状态
    const linkStatus = await getDictionaryLinkStatus(dict.id)

    if (linkStatus.code === 200 && !linkStatus.data.canDelete) {
      // 有关联的测评集，无法删除
      const linkedCount = linkStatus.data.linkedDatasetCount || 0
      const linkedNames = linkStatus.data.linkedDatasets?.map(d => d.name).join('、') || ''
      ElMessageBox.alert(
        `该字典已被 ${linkedCount} 个测评集关联，无法删除。关联的测评集：${linkedNames}`,
        '无法删除',
        {
          confirmButtonText: '关闭',
          type: 'warning',
        }
      )
      return
    }

    // 可以删除，弹出确认框
    await ElMessageBox.confirm(`确定要删除数据字典「${dict.name}」吗？删除后无法恢复。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 执行删除
    const response = await deleteDictionary(dict.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadDictionaries()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('系统服务异常！')
      console.error('删除数据字典失败:', error)
    }
  }
}

// 添加字段
const addDictionaryColumn = () => {
  dictionaryForm.columns.push({
    key: '',
    label: '',
    type: 'string',
  })
}

// 删除字段
const removeDictionaryColumn = (index) => {
  if (dictionaryForm.columns.length > 1) {
    dictionaryForm.columns.splice(index, 1)
  }
}

// 提交数据字典
const handleDictionarySubmit = async () => {
  if (!dictionaryFormRef.value) return

  try {
    // 验证表单基础字段
    await dictionaryFormRef.value.validate()

    // 验证字段：至少1个字段
    if (dictionaryForm.columns.length === 0) {
      ElMessage.warning('请至少添加1个字段')
      return
    }

    // 验证所有字段的key和label都必填
    const hasEmptyField = dictionaryForm.columns.some(col => !col.key?.trim() || !col.label?.trim())
    if (hasEmptyField) {
      ElMessage.warning('请填写所有字段的Key和名称')
      return
    }

    const dictionaryData = {
      name: dictionaryForm.name,
      description: dictionaryForm.name, // 使用名称作为描述
      columns: dictionaryForm.columns.map(col => ({
        key: col.key.trim(),
        label: col.label.trim(),
        type: col.type,
        ...(col.type === 'number' && { min: col.min, max: col.max }),
        ...(col.type === 'enum' && { enumOptions: col.enumOptions }),
      })),
    }

    if (isDictionaryEditMode.value) {
      // 编辑模式：调用更新API
      const response = await updateDictionary(editingDictionaryId.value, dictionaryData)
      if (response.code === 200) {
        ElMessage.success('数据字典更新成功')
        dictionaryDialogVisible.value = false
        loadDictionaries()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    } else {
      // 新建模式：调用创建API
      const response = await createDictionary(dictionaryData)
      if (response.code === 200) {
        ElMessage.success('数据字典创建成功')
        dictionaryDialogVisible.value = false
        loadDictionaries()
        // 如果是在测评集创建弹窗中新建字典，自动选中新创建的字典
        if (response.data && response.data.id) {
          formData.dictionaryId = response.data.id
        }
      } else {
        ElMessage.error(response.message || '创建失败')
      }
    }
  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error('系统服务异常！')
      console.error('提交数据字典失败:', error)
    }
  }
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入测评集名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  testType: [{ required: true, message: '请选择测试类型', trigger: 'change' }],
  description: [
    { required: true, message: '请输入测评集描述', trigger: 'blur' },
    { min: 10, max: 200, message: '长度在 10 到 200 个字符', trigger: 'blur' },
  ],
  dictionaryId: [{ required: true, message: '请选择数据字典', trigger: 'change' }],
}

// 可选图标列表
const iconOptions = [
  { value: 'ChatDotRound', label: '对话' },
  { value: 'Cpu', label: '代码' },
  { value: 'Document', label: '文档' },
  { value: 'DataAnalysis', label: '数据分析' },
]

// 打开新建对话框
const openCreateDialog = () => {
  isEditMode.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (dataset) => {
  isEditMode.value = true
  editingId.value = dataset.id
  // 填充表单数据
  formData.name = dataset.name
  formData.iconType = dataset.iconType
  formData.icon = dataset.icon || 'ChatDotRound'
  formData.customIconUrl = dataset.customIconUrl || ''
  formData.mediaType = dataset.mediaType || 'text'
  formData.testType = dataset.testType || 'objective'
  formData.tags = [...dataset.tags]
  formData.description = dataset.description
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.iconType = 'preset'
  formData.icon = 'ChatDotRound'
  formData.customIconUrl = ''
  formData.mediaType = 'text'
  formData.testType = 'objective'
  formData.tags = []
  formData.description = ''
  formRef.value?.resetFields()
}

// 处理图片上传
const handleImageUpload = (options) => {
  const file = options.file
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  // 使用 FileReader 转换为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.customIconUrl = e.target?.result
  }
  reader.readAsDataURL(file)
}

// 删除自定义图标
const handleRemoveCustomIcon = () => {
  formData.customIconUrl = ''
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEditMode.value) {
        // 编辑模式：更新现有数据
        const index = allDatasets.value.findIndex((d) => d.id === editingId.value)
        if (index !== -1) {
          const original = allDatasets.value[index]
          if (original) {
            allDatasets.value[index] = {
              id: original.id,
              name: formData.name,
              iconType: formData.iconType,
              icon: formData.iconType === 'preset' ? formData.icon : '',
              customIconUrl:
                formData.iconType === 'custom' ? formData.customIconUrl : undefined,
              mediaType: formData.mediaType || 'text',
              testType: formData.testType,
              tags: [...formData.tags],
              description: formData.description,
              dictionaryId: formData.dictionaryId,
              dataCount: original.dataCount,
              createdAt: original.createdAt,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
            ElMessage.success('测评集更新成功')
          }
        }
      } else {
        // 新建模式：创建新数据
        const newDataset = {
          id: Date.now().toString(),
          name: formData.name,
          iconType: formData.iconType,
          icon: formData.iconType === 'preset' ? formData.icon : '',
          customIconUrl:
            formData.iconType === 'custom' ? formData.customIconUrl : undefined,
          mediaType: formData.mediaType || 'text',
          testType: formData.testType,
          tags: [...formData.tags],
          description: formData.description,
          dictionaryId: formData.dictionaryId,
          dataCount: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        allDatasets.value.unshift(newDataset)
        currentPage.value = 1
        ElMessage.success('测评集创建成功')
      }
      dialogVisible.value = false
    }
  })
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 查看详情
const handleViewDetail = (id) => {
  router.push(`/dataset/${id}`)
}

// 跳转到数据字典详情
const goToDictionaryDetail = (id) => {
  router.push(`/dictionary/${id}`)
}

// 删除测评集
const handleDelete = (dataset) => {
  ElMessageBox.confirm(`确定要删除测评集「${dataset.name}」吗？删除后无法恢复。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = allDatasets.value.findIndex((d) => d.id === dataset.id)
    if (index !== -1) {
      allDatasets.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 导入数据集对话框
const importDialogVisible = ref(false)
const currentImportDataset = ref(null)
const selectedSourceDataset = ref('')

// 打开导入对话框
const openImportDialog = (dataset) => {
  currentImportDataset.value = dataset
  selectedSourceDataset.value = ''
  importDialogVisible.value = true
}

// 可选择的数据集列表（排除当前数据集）
const availableDatasets = computed(() => {
  if (!currentImportDataset.value) return []
  return allDatasets.value.filter((d) => d.id !== currentImportDataset.value?.id)
})

// 确认导入
const confirmImport = () => {
  if (!selectedSourceDataset.value) {
    ElMessage.warning('请选择要导入的数据集')
    return
  }
  if (!currentImportDataset.value) return

  const sourceDataset = allDatasets.value.find((d) => d.id === selectedSourceDataset.value)
  if (sourceDataset) {
    currentImportDataset.value.dataCount += sourceDataset.dataCount
    ElMessage.success(`已将「${sourceDataset.name}」的数据导入到「${currentImportDataset.value.name}」`)
  }
  importDialogVisible.value = false
}

// 拆分数据集对话框
const splitDialogVisible = ref(false)
const currentSplitDataset = ref(null)
const splitForm = reactive({
  mode: 'ratio',
  ratio: 50,
  count: 10,
  name1: '',
  name2: '',
})

// 打开拆分对话框
const openSplitDialog = (dataset) => {
  currentSplitDataset.value = dataset
  splitForm.mode = 'ratio'
  splitForm.ratio = 50
  splitForm.count = 10
  splitForm.name1 = `${dataset.name}-1`
  splitForm.name2 = `${dataset.name}-2`
  splitDialogVisible.value = true
}

// 确认拆分
const confirmSplit = () => {
  if (!currentSplitDataset.value) return

  if (!splitForm.name1.trim() || !splitForm.name2.trim()) {
    ElMessage.warning('请输入拆分后的数据集名称')
    return
  }

  const totalCount = currentSplitDataset.value.dataCount
  let count1

  if (splitForm.mode === 'ratio') {
    count1 = Math.floor(totalCount * (splitForm.ratio / 100))
  } else {
    count1 = Math.min(splitForm.count, totalCount)
  }

  const count2 = totalCount - count1

  // 创建两个新数据集
  const newDataset1 = {
    id: Date.now().toString(),
    name: splitForm.name1,
    icon: currentSplitDataset.value.icon,
    iconType: currentSplitDataset.value.iconType,
    customIconUrl: currentSplitDataset.value.customIconUrl,
    testType: currentSplitDataset.value.testType,
    tags: [...currentSplitDataset.value.tags],
    description: `从「${currentSplitDataset.value.name}」拆分而来`,
    dataCount: count1,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  const newDataset2 = {
    id: (Date.now() + 1).toString(),
    name: splitForm.name2,
    icon: currentSplitDataset.value.icon,
    iconType: currentSplitDataset.value.iconType,
    customIconUrl: currentSplitDataset.value.customIconUrl,
    testType: currentSplitDataset.value.testType,
    tags: [...currentSplitDataset.value.tags],
    description: `从「${currentSplitDataset.value.name}」拆分而来`,
    dataCount: count2,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  // 在原数据集位置插入新数据集
  const index = allDatasets.value.findIndex((d) => d.id === currentSplitDataset.value?.id)
  if (index !== -1) {
    allDatasets.value.splice(index, 1, newDataset1, newDataset2)
  }

  ElMessage.success(`已将「${currentSplitDataset.value.name}」拆分为「${splitForm.name1}」(${count1}条) 和「${splitForm.name2}」(${count2}条)`)
  splitDialogVisible.value = false
}

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)

// 模拟测评集数据
const allDatasets = ref([
  {
    id: '1',
    name: '通用对话测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['对话', '通用'],
    description:
      '包含多轮对话、常识问答等通用场景的测试数据，用于评估模型的对话能力',
    dataCount: 256,
    dictionaryId: 'dict-1',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: '2',
    name: '代码生成测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['代码', '编程'],
    description:
      '包含多种编程语言的代码生成任务，用于评估模型的编程能力',
    dataCount: 128,
    dictionaryId: 'dict-2',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-18',
  },
  {
    id: '3',
    name: '文档理解测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'objective',
    tags: ['文档', '理解'],
    description:
      '包含长文档阅读理解、信息提取等任务，用于评估模型的文档处理能力',
    dataCount: 512,
    dictionaryId: 'dict-3',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25',
  },
  {
    id: '4',
    name: '数据分析测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    testType: 'objective',
    tags: ['数据', '分析'],
    description:
      '包含数据解读、图表分析、统计推理等任务，用于评估模型的数据分析能力',
    dataCount: 96,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-22',
  },
  {
    id: '5',
    name: '数学推理测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    testType: 'objective',
    tags: ['数学', '推理'],
    description: '包含数学计算、逻辑推理等任务，用于评估模型的数学能力',
    dataCount: 180,
    dictionaryId: 'dict-4',
    createdAt: '2024-02-12',
    updatedAt: '2024-02-23',
  },
  {
    id: '6',
    name: '翻译能力测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['翻译', '多语言'],
    description: '包含多语言翻译任务，用于评估模型的跨语言处理能力',
    dataCount: 320,
    dictionaryId: 'dict-6',
    createdAt: '2024-02-14',
    updatedAt: '2024-02-24',
  },
  {
    id: '7',
    name: '创意写作测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['写作', '创意'],
    description: '包含故事创作、文案生成等任务，用于评估模型的创意写作能力',
    dataCount: 88,
    dictionaryId: 'dict-3',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-25',
  },
  {
    id: '8',
    name: '知识问答测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['知识', '问答'],
    description: '包含各领域知识问答，用于评估模型的知识广度',
    dataCount: 450,
    dictionaryId: 'dict-4',
    createdAt: '2024-02-16',
    updatedAt: '2024-02-26',
  },
  {
    id: '9',
    name: '情感分析测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['情感', 'NLP'],
    description: '包含文本情感分类、情绪识别等任务，用于评估模型的情感理解能力',
    dataCount: 200,
    dictionaryId: 'dict-5',
    createdAt: '2024-02-17',
    updatedAt: '2024-02-26',
  },
  {
    id: '10',
    name: '摘要生成测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['摘要', '生成'],
    description: '包含新闻摘要、论文摘要等任务，用于评估模型的文本摘要能力',
    dataCount: 156,
    dictionaryId: 'dict-3',
    createdAt: '2024-02-18',
    updatedAt: '2024-02-26',
  },
  {
    id: '11',
    name: '问答系统测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['问答', '检索'],
    description:
      '包含基于上下文的问答任务，用于评估模型的阅读理解和信息提取能力',
    dataCount: 380,
    dictionaryId: 'dict-4',
    createdAt: '2024-02-19',
    updatedAt: '2024-02-26',
  },
  {
    id: '12',
    name: 'SQL生成测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['SQL', '数据库'],
    description: '包含自然语言转SQL的任务，用于评估模型的数据库查询生成能力',
    dataCount: 120,
    dictionaryId: 'dict-2',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-26',
  },
  {
    id: '13',
    name: '文本分类测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'objective',
    tags: ['分类', 'NLP'],
    description: '包含新闻分类、意图识别等任务，用于评估模型的文本分类能力',
    dataCount: 280,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-21',
    updatedAt: '2024-02-26',
  },
  {
    id: '14',
    name: '命名实体识别测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    testType: 'objective',
    tags: ['NER', 'NLP'],
    description:
      '包含人名、地名、机构名等实体识别任务，用于评估模型的实体抽取能力',
    dataCount: 175,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-22',
    updatedAt: '2024-02-26',
  },
  {
    id: '15',
    name: '对话状态追踪测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['对话', '状态'],
    description: '包含多轮对话状态追踪任务，用于评估模型的对话管理能力',
    dataCount: 92,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-23',
    updatedAt: '2024-02-26',
  },
  {
    id: '16',
    name: '文本纠错测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'objective',
    tags: ['纠错', 'NLP'],
    description: '包含拼写纠错、语法纠错等任务，用于评估模型的文本校对能力',
    dataCount: 210,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-24',
    updatedAt: '2024-02-26',
  },
  {
    id: '17',
    name: '机器阅读理解测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'objective',
    tags: ['阅读', '理解'],
    description: '包含篇章级阅读理解任务，用于评估模型的深度理解能力',
    dataCount: 340,
    dictionaryId: 'dict-3',
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '18',
    name: '代码补全测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['代码', '补全'],
    description: '包含代码自动补全任务，用于评估模型的代码预测能力',
    dataCount: 165,
    dictionaryId: 'dict-2',
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '19',
    name: '关键词提取测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    testType: 'objective',
    tags: ['关键词', 'NLP'],
    description: '包含文本关键词提取任务，用于评估模型的信息提取能力',
    dataCount: 145,
    dictionaryId: 'dict-7',
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '20',
    name: '文本相似度测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['相似度', '匹配'],
    description: '包含文本匹配、相似度计算任务，用于评估模型的语义理解能力',
    dataCount: 188,
    dictionaryId: 'dict-8',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '21',
    name: '图像描述生成测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['图像', '多模态'],
    description: '包含图像内容描述任务，用于评估模型的多模态理解能力',
    dataCount: 78,
    dictionaryId: '',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '22',
    name: '逻辑推理测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['逻辑', '推理'],
    description: '包含逻辑推理、因果分析等任务，用于评估模型的逻辑思维能力',
    dataCount: 112,
    dictionaryId: 'dict-4',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '23',
    name: '常识推理测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    testType: 'objective',
    tags: ['常识', '推理'],
    description: '包含日常生活常识推理任务，用于评估模型的常识判断能力',
    dataCount: 225,
    dictionaryId: 'dict-4',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '24',
    name: '文本生成测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['生成', 'NLP'],
    description: '包含续写、扩写等文本生成任务，用于评估模型的生成能力',
    dataCount: 198,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '25',
    name: 'API调用测评集',
    icon: 'Cpu',
    iconType: 'preset',
    mediaType: 'text',
    testType: 'objective',
    tags: ['API', '工具'],
    description: '包含API调用决策和参数生成任务，用于评估模型的工具使用能力',
    dataCount: 86,
    dictionaryId: '',
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  // 多媒体测评集示例数据
  {
    id: '26',
    name: '语音识别测评集',
    icon: 'Headset',
    iconType: 'preset',
    mediaType: 'audio',
    testType: 'objective',
    tags: ['语音', '识别'],
    description: '包含多种场景的语音识别任务，用于评估模型的语音转文字能力',
    dataCount: 150,
    dictionaryId: 'dict-audio-1',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-10',
  },
  {
    id: '27',
    name: '语音情感分析测评集',
    icon: 'Headset',
    iconType: 'preset',
    mediaType: 'audio',
    testType: 'objective',
    tags: ['语音', '情感'],
    description: '包含不同情感的语音片段，用于评估模型的语音情感识别能力',
    dataCount: 200,
    dictionaryId: 'dict-audio-2',
    createdAt: '2024-03-02',
    updatedAt: '2024-03-10',
  },
  {
    id: '28',
    name: '图片描述生成测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'subjective',
    tags: ['图像', '描述'],
    description: '包含各类图片，用于评估模型的图像理解和描述生成能力',
    dataCount: 180,
    dictionaryId: 'dict-image-1',
    createdAt: '2024-03-03',
    updatedAt: '2024-03-10',
  },
  {
    id: '29',
    name: '图像分类测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'objective',
    tags: ['图像', '分类'],
    description: '包含多类别图片，用于评估模型的图像分类能力',
    dataCount: 320,
    dictionaryId: 'dict-image-2',
    createdAt: '2024-03-04',
    updatedAt: '2024-03-10',
  },
  {
    id: '30',
    name: '视频理解测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'subjective',
    tags: ['视频', '理解'],
    description: '包含短视频内容，用于评估模型的视频内容理解和问答能力',
    dataCount: 80,
    dictionaryId: 'dict-video-1',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-10',
  },
  {
    id: '31',
    name: '视频动作识别测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'objective',
    tags: ['视频', '动作'],
    description: '包含人物动作视频，用于评估模型的动作识别和分类能力',
    dataCount: 120,
    dictionaryId: 'dict-video-2',
    createdAt: '2024-03-06',
    updatedAt: '2024-03-10',
  },
  // 更多语音类型测评集
  {
    id: '32',
    name: '语音指令识别测评集',
    icon: 'Headset',
    iconType: 'preset',
    mediaType: 'audio',
    testType: 'objective',
    tags: ['语音', '指令', '智能家居'],
    description: '包含智能家居场景的语音指令，用于评估模型的语音指令理解和执行能力',
    dataCount: 180,
    dictionaryId: 'dict-audio-3',
    createdAt: '2024-03-07',
    updatedAt: '2024-03-10',
  },
  {
    id: '33',
    name: '多语种语音识别测评集',
    icon: 'Headset',
    iconType: 'preset',
    mediaType: 'audio',
    testType: 'objective',
    tags: ['语音', '多语种', '翻译'],
    description: '包含中英日韩等多种语言的语音片段，用于评估模型的跨语言语音识别能力',
    dataCount: 250,
    dictionaryId: 'dict-audio-4',
    createdAt: '2024-03-08',
    updatedAt: '2024-03-10',
  },
  {
    id: '34',
    name: '语音合成质量评估集',
    icon: 'Headset',
    iconType: 'preset',
    mediaType: 'audio',
    testType: 'subjective',
    tags: ['语音', '合成', 'TTS'],
    description: '包含TTS合成语音样本，用于评估模型生成语音的自然度和准确性',
    dataCount: 100,
    dictionaryId: 'dict-audio-5',
    createdAt: '2024-03-09',
    updatedAt: '2024-03-10',
  },
  // 更多图片类型测评集
  {
    id: '35',
    name: 'OCR文字识别测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'objective',
    tags: ['图片', 'OCR', '识别'],
    description: '包含各类文档、证件、招牌等图片，用于评估模型的文字识别能力',
    dataCount: 280,
    dictionaryId: 'dict-image-3',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
  {
    id: '36',
    name: '医学影像分析测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'objective',
    tags: ['图片', '医学', '分析'],
    description: '包含X光、CT等医学影像，用于评估模型的医学影像分析能力',
    dataCount: 150,
    dictionaryId: 'dict-image-4',
    createdAt: '2024-03-11',
    updatedAt: '2024-03-11',
  },
  {
    id: '37',
    name: '图表理解测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'subjective',
    tags: ['图片', '图表', '理解'],
    description: '包含各类统计图表、流程图等，用于评估模型的图表解读和分析能力',
    dataCount: 200,
    dictionaryId: 'dict-image-5',
    createdAt: '2024-03-11',
    updatedAt: '2024-03-11',
  },
  {
    id: '38',
    name: '人脸识别测评集',
    icon: 'Picture',
    iconType: 'preset',
    mediaType: 'image',
    testType: 'objective',
    tags: ['图片', '人脸', '识别'],
    description: '包含不同角度、光照条件下的人脸图片，用于评估模型的人脸检测和识别能力',
    dataCount: 350,
    dictionaryId: 'dict-image-6',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
  // 更多视频类型测评集
  {
    id: '39',
    name: '视频摘要生成测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'subjective',
    tags: ['视频', '摘要', '生成'],
    description: '包含长视频内容，用于评估模型的视频内容摘要生成能力',
    dataCount: 60,
    dictionaryId: 'dict-video-3',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
  {
    id: '40',
    name: '视频问答测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'objective',
    tags: ['视频', '问答', '理解'],
    description: '包含视频内容及相关问题，用于评估模型的视频内容理解与问答能力',
    dataCount: 180,
    dictionaryId: 'dict-video-4',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
  {
    id: '41',
    name: '视频字幕生成测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'subjective',
    tags: ['视频', '字幕', '生成'],
    description: '包含电影、电视剧等视频片段，用于评估模型的视频字幕生成能力',
    dataCount: 90,
    dictionaryId: 'dict-video-5',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
  {
    id: '42',
    name: '自动驾驶场景测评集',
    icon: 'VideoCamera',
    iconType: 'preset',
    mediaType: 'video',
    testType: 'objective',
    tags: ['视频', '自动驾驶', '场景'],
    description: '包含各种驾驶场景的视频，用于评估模型的场景理解和目标检测能力',
    dataCount: 220,
    dictionaryId: 'dict-video-6',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
])

// 过滤后的数据
const filteredDatasets = computed(() => {
  let result = allDatasets.value

  // 媒体类型筛选
  if (selectedMediaType.value !== 'all') {
    result = result.filter(d => (d.mediaType || 'text') === selectedMediaType.value)
  }

  // 测试类型筛选
  if (selectedTestType.value !== 'all') {
    result = result.filter(d => d.testType === selectedTestType.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(keyword) ||
      d.description.toLowerCase().includes(keyword) ||
      d.tags.some(t => t.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 总数
const total = computed(() => filteredDatasets.value.length)

// 当前页数据
const datasets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDatasets.value.slice(start, end)
})

// 图标映射
const iconMap = {
  ChatDotRound,
  Cpu,
  Document,
  DataAnalysis,
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FolderOpened
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 数据字典分页处理
const handleDictPageChange = (page) => {
  dictCurrentPage.value = page
  loadDictionaries()
}

const handleDictSizeChange = (size) => {
  dictPageSize.value = size
  dictCurrentPage.value = 1
  loadDictionaries()
}

// 组件挂载时加载数据字典
onMounted(() => {
  loadDictionaries()
})
</script>

<template>
  <div class="dataset-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>测评集管理</h2>
      </div>
      <el-button v-if="activeTab === 'datasets'" type="primary" :icon="Plus" @click="openCreateDialog"
        >新建测评集</el-button
      >
      <el-button v-else type="primary" :icon="Plus" @click="openCreateDictionaryDialog"
        >新建数据字典</el-button
      >
    </div>

    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" class="page-tabs">
      <el-tab-pane label="测评集" name="datasets">
        <!-- 搜索和筛选 -->
        <div class="filter-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索测评集名称、标签或描述"
            :prefix-icon="Search"
            clearable
            style="width: 300px"
            @input="currentPage = 1"
          />
          <el-select v-model="selectedMediaType" placeholder="媒体类型" style="width: 120px" @change="currentPage = 1">
            <el-option label="全部媒体" value="all" />
            <el-option label="文本" value="text">
              <div class="media-option">
                <el-icon><Document /></el-icon>
                <span>文本</span>
              </div>
            </el-option>
            <el-option label="语音" value="audio">
              <div class="media-option">
                <el-icon><Headset /></el-icon>
                <span>语音</span>
              </div>
            </el-option>
            <el-option label="图片" value="image">
              <div class="media-option">
                <el-icon><Picture /></el-icon>
                <span>图片</span>
              </div>
            </el-option>
            <el-option label="视频" value="video">
              <div class="media-option">
                <el-icon><VideoCamera /></el-icon>
                <span>视频</span>
              </div>
            </el-option>
          </el-select>
          <el-select v-model="selectedTestType" placeholder="测试类型" style="width: 120px" @change="currentPage = 1">
            <el-option label="全部类型" value="all" />
            <el-option label="客观题" value="objective" />
            <el-option label="主观题" value="subjective" />
          </el-select>
        </div>

        <!-- 测评集卡片列表 -->
    <div class="dataset-grid">
      <el-card
        v-for="dataset in datasets"
        :key="dataset.id"
        class="dataset-card"
        shadow="hover"
      >
        <!-- 卡片头部：图标和名称 -->
        <div class="card-header">
          <div
            class="icon-wrapper"
            :style="{ background: getMediaTypeGradient(dataset.mediaType || 'text') }"
          >
            <img
              v-if="dataset.iconType === 'custom' && dataset.customIconUrl"
              :src="dataset.customIconUrl"
              :alt="dataset.name"
              class="custom-icon"
            />
            <el-icon v-else :size="32">
              <component :is="getIconComponent(dataset.icon)" />
            </el-icon>
            <!-- 媒体类型角标 -->
            <div
              class="media-type-badge"
              :style="{ backgroundColor: getMediaTypeColor(dataset.mediaType || 'text') }"
            >
              <el-icon :size="10">
                <component :is="getMediaTypeIcon(dataset.mediaType || 'text')" />
              </el-icon>
            </div>
          </div>
          <div class="title-area">
            <h3 class="dataset-name">{{ dataset.name }}</h3>
            <div class="tags">
              <el-tag
                class="media-type-tag"
                :style="{
                  '--tag-color': getMediaTypeColor(dataset.mediaType || 'text'),
                  backgroundColor: getMediaTypeColor(dataset.mediaType || 'text') + '15',
                  borderColor: getMediaTypeColor(dataset.mediaType || 'text') + '40',
                  color: getMediaTypeColor(dataset.mediaType || 'text')
                }"
                size="small"
                effect="plain"
              >
                {{ getMediaTypeText(dataset.mediaType || 'text') }}
              </el-tag>
              <el-tag
                :type="getTestTypeTagType(dataset.testType)"
                size="small"
                effect="plain"
              >
                {{ getTestTypeText(dataset.testType) }}
              </el-tag>
              <el-tag
                v-for="tag in getFilteredTags(dataset)"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <el-dropdown trigger="click" class="card-dropdown" @click.stop>
            <el-button class="more-btn" :icon="More" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openImportDialog(dataset)">
                  导入其他数据集
                </el-dropdown-item>
                <el-dropdown-item @click="openSplitDialog(dataset)">
                  拆分数据集
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete(dataset)">
                  <span style="color: #f56c6c">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 卡片内容：介绍 -->
        <div class="card-content">
          <p class="description">{{ dataset.description }}</p>
        </div>

        <!-- 卡片底部：数据个数和操作 -->
        <div class="card-footer">
          <div class="footer-info">
            <div class="data-info">
              <el-icon><FolderOpened /></el-icon>
              <span class="data-count">{{ dataset.dataCount }} 条测试数据</span>
            </div>
            <div v-if="dataset.dictionaryId" class="dictionary-info clickable" @click.stop="goToDictionaryDetail(dataset.dictionaryId)">
              <el-icon><Collection /></el-icon>
              <span class="dictionary-name">{{ getDictionaryName(dataset.dictionaryId) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button text type="primary" size="small" @click="handleViewDetail(dataset.id)"
              >查看详情</el-button
            >
            <el-button text type="primary" size="small" @click="openEditDialog(dataset)"
              >编辑</el-button
            >
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="datasets.length === 0"
      description="暂无测评集，点击上方按钮创建"
    />

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
      </el-tab-pane>

      <!-- 数据字典标签页 -->
      <el-tab-pane label="数据字典" name="dictionaries">
        <!-- 搜索栏 -->
        <div class="filter-bar">
          <el-input
            v-model="dictSearchKeyword"
            placeholder="搜索数据字典名称或字段"
            :prefix-icon="Search"
            clearable
            style="width: 300px"
            @input="onDictSearchChange"
          />
        </div>

        <!-- 数据字典卡片列表 -->
        <div class="dataset-grid">
          <el-card
            v-for="dict in paginatedDictionaries"
            :key="dict.id"
            class="dataset-card"
            shadow="hover"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon :size="32" color="#fff"><Collection /></el-icon>
              </div>
              <div class="title-area">
                <h3 class="dataset-name">{{ dict.name }}</h3>
                <div class="tags">
                  <el-tag size="small" type="info">
                    {{ dict.columns.length }} 个字段
                  </el-tag>
                </div>
              </div>
              <el-dropdown trigger="click" class="card-dropdown" @click.stop>
                <el-button class="more-btn" :icon="More" circle size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToDictionaryDetail(dict.id)">
                      查看详情
                    </el-dropdown-item>
                    <el-dropdown-item @click="openEditDictionaryDialog(dict)">
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleDeleteDictionary(dict)">
                      <span style="color: #f56c6c">删除</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 字段列表 -->
            <div class="columns-preview">
              <div class="preview-title">字段定义</div>
              <div class="columns-list">
                <el-tag
                  v-for="col in dict.columns.slice(0, 4)"
                  :key="col.key"
                  size="small"
                  :type="col.type === 'number' ? 'success' : (col.type === 'enum' ? 'warning' : 'info')"
                  effect="plain"
                >
                  {{ col.label }} ({{ getColumnTypeText(col.type) }})
                </el-tag>
                <el-tag v-if="dict.columns.length > 4" size="small" type="info" effect="plain">
                  +{{ dict.columns.length - 4 }} 更多
                </el-tag>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div class="card-footer">
              <div class="footer-info">
                <div class="data-info">
                  <el-icon><FolderOpened /></el-icon>
                  <span class="linked-count">{{ getLinkedDatasetCount(dict.id) }} 个测评集</span>
                </div>
                <div class="time-info">
                  <span class="time-text">创建于 {{ dict.createdAt }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button text type="primary" size="small" @click="goToDictionaryDetail(dict.id)"
                  >查看详情</el-button
                >
                <el-button text type="primary" size="small" @click="openEditDictionaryDialog(dict)"
                  >编辑</el-button
                >
              </div>
            </div>
          </el-card>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="paginatedDictionaries.length === 0"
          description="暂无数据字典"
        />

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="dictTotal > 0">
          <el-pagination
            v-model:current-page="dictCurrentPage"
            v-model:page-size="dictPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="dictTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleDictSizeChange"
            @current-change="handleDictPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建测评集对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
      class="create-dataset-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
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
                v-model="formData.name"
                placeholder="请输入测评集名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>

            <el-form-item prop="mediaType">
              <template #label>
                <span>媒体类型</span>
                <el-tooltip placement="top">
                  <template #content>
                    <div class="tooltip-content">
                      <p><strong>文本：</strong>纯文本输入/输出测评</p>
                      <p><strong>语音：</strong>音频文件输入测评</p>
                      <p><strong>图片：</strong>图片文件输入测评</p>
                      <p><strong>视频：</strong>视频文件输入测评</p>
                    </div>
                  </template>
                  <el-icon class="label-tooltip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <div class="media-type-selector">
                <div
                  v-for="option in mediaTypeOptions"
                  :key="option.value"
                  class="media-type-card"
                  :class="{ active: formData.mediaType === option.value }"
                  :style="{ '--theme-color': option.color }"
                  @click="formData.mediaType = option.value"
                >
                  <div class="media-icon">
                    <el-icon :size="28">
                      <component :is="getMediaTypeIconComponent(option.icon)" />
                    </el-icon>
                  </div>
                  <div class="media-info">
                    <div class="media-label">{{ option.label }}</div>
                    <div class="media-desc">{{ option.desc }}</div>
                  </div>
                </div>
              </div>
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
              <el-radio-group v-model="formData.testType" class="test-type-radio">
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
                v-model="formData.description"
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
                v-model="formData.tags"
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
              <div class="dictionary-select-wrapper">
                <el-select
                  v-model="formData.dictionaryId"
                  placeholder="选择关联的数据字典"
                  style="flex: 1"
                >
                  <el-option
                    v-for="dict in dataDictionaries"
                    :key="dict.id"
                    :label="dict.name"
                    :value="dict.id"
                  />
                </el-select>
                <el-button type="primary" @click="openCreateDictionaryDialog">
                  <el-icon class="el-icon--left"><Plus /></el-icon>
                  新建字典
                </el-button>
              </div>
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
                <el-radio-group v-model="formData.iconType" class="icon-type-group">
                  <el-radio-button value="preset">预设图标</el-radio-button>
                  <el-radio-button value="custom">自定义上传</el-radio-button>
                </el-radio-group>

                <!-- 预设图标选择 -->
                <div v-if="formData.iconType === 'preset'" class="preset-icons-grid">
                  <div
                    v-for="option in iconOptions"
                    :key="option.value"
                    class="icon-card"
                    :class="{ active: formData.icon === option.value }"
                    @click="formData.icon = option.value"
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
                    v-if="!formData.customIconUrl"
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
                    <img :src="formData.customIconUrl" alt="自定义图标" />
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
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ isEditMode ? '保存修改' : '创建测评集' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建/编辑数据字典对话框 -->
    <el-dialog
      v-model="dictionaryDialogVisible"
      :title="dictionaryDialogTitle"
      width="680px"
      :close-on-click-modal="false"
      class="dictionary-dialog"
    >
      <div class="dictionary-form-container">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon basic-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <span class="section-title">基本信息</span>
          </div>
          <div class="section-content">
            <el-form
              ref="dictionaryFormRef"
              :model="dictionaryForm"
              :rules="dictionaryFormRules"
              label-width="80px"
              label-position="left"
            >
              <el-form-item label="名称" prop="name">
                <el-input
                  v-model="dictionaryForm.name"
                  placeholder="请输入数据字典名称，如：通用对话测试"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 字段定义 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon field-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <span class="section-title">字段定义</span>
            <el-tooltip content="定义数据字典的列结构，用于测试数据的输入和输出" placement="top">
              <el-icon class="section-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="section-content">
            <div class="columns-form">
              <div
                v-for="(column, index) in dictionaryForm.columns"
                :key="index"
                class="column-item"
              >
                <div class="column-header">
                  <span class="column-index">
                    <span class="index-num">{{ index + 1 }}</span>
                    <span class="index-label">字段</span>
                  </span>
                  <el-button
                    v-if="dictionaryForm.columns.length > 1"
                    type="danger"
                    link
                    size="small"
                    @click="removeDictionaryColumn(index)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
                <div class="column-row">
                  <div class="column-field">
                    <label class="field-label"><span class="required">*</span> 字段Key</label>
                    <el-input v-model="column.key" placeholder="如: id" />
                  </div>
                  <div class="column-field">
                    <label class="field-label"><span class="required">*</span> 字段名称</label>
                    <el-input v-model="column.label" placeholder="如: ID" />
                  </div>
                  <div class="column-field">
                    <label class="field-label">字段类型</label>
                    <el-select v-model="column.type" placeholder="选择类型">
                      <el-option label="字符串" value="string" />
                      <el-option label="数字" value="number" />
                      <el-option label="枚举" value="enum" />
                    </el-select>
                  </div>
                </div>
                <!-- 数字类型额外配置 -->
                <div v-if="column.type === 'number'" class="column-extra">
                  <div class="column-field column-field-small">
                    <label class="field-label">最小值</label>
                    <el-input v-model="column.min" placeholder="可选" type="number" />
                  </div>
                  <div class="column-field column-field-small">
                    <label class="field-label">最大值</label>
                    <el-input v-model="column.max" placeholder="可选" type="number" />
                  </div>
                </div>
                <!-- 枚举类型额外配置 -->
                <div v-if="column.type === 'enum'" class="column-extra">
                  <div class="column-field column-field-full">
                    <label class="field-label">枚举值</label>
                    <el-input
                      v-model="column.enumOptions"
                      placeholder="多个枚举值用逗号分隔，如: 选项1,选项2,选项3"
                    />
                  </div>
                </div>
              </div>
              <div class="column-actions">
                <el-button
                  v-if="dictionaryForm.columns.length < 10"
                  type="primary"
                  link
                  :icon="Plus"
                  @click="addDictionaryColumn"
                >
                  添加字段
                </el-button>
                <span v-else class="field-limit-tip">
                  <el-icon><WarningFilled /></el-icon>
                  最多支持10个字段
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dictionaryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDictionarySubmit">
            {{ isDictionaryEditMode ? '保存修改' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看数据字典详情对话框 -->
    <el-dialog
      v-model="viewDictionaryDialogVisible"
      title="数据字典详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="viewingDictionary" class="dictionary-detail">
        <div class="detail-header">
          <div class="detail-icon">
            <el-icon :size="24" color="#fff"><Collection /></el-icon>
          </div>
          <div class="detail-info">
            <h3 class="detail-name">{{ viewingDictionary.name }}</h3>
            <div class="detail-meta">
              <span>{{ viewingDictionary.columns.length }} 个字段</span>
              <span class="meta-divider">|</span>
              <span>{{ getLinkedDatasetCount(viewingDictionary.id) }} 个关联测评集</span>
              <span class="meta-divider">|</span>
              <span>创建于 {{ viewingDictionary.createdAt }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-section">
          <div class="section-label">字段定义</div>
          <el-table :data="viewingDictionary.columns" border stripe size="small">
            <el-table-column prop="key" label="字段Key" width="120" />
            <el-table-column prop="label" label="字段名称" width="120" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'enum' ? 'warning' : 'info'" size="small">
                  {{ getColumnTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="约束/选项">
              <template #default="{ row }">
                <span v-if="row.type === 'number' && (row.min !== undefined || row.max !== undefined)">
                  {{ row.min !== undefined ? row.min : '-∞' }} ~ {{ row.max !== undefined ? row.max : '+∞' }}
                </span>
                <span v-else-if="row.type === 'enum' && row.enumOptions">
                  {{ Array.isArray(row.enumOptions) ? row.enumOptions.join(', ') : row.enumOptions }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 关联的测评集 -->
        <div class="detail-section" style="margin-top: 20px;">
          <div class="section-label">
            关联的测评集
            <span class="section-count">({{ getLinkedDatasets(viewingDictionary.id).length }})</span>
          </div>
          <div v-if="getLinkedDatasets(viewingDictionary.id).length > 0" class="linked-datasets">
            <div
              v-for="dataset in getLinkedDatasets(viewingDictionary.id)"
              :key="dataset.id"
              class="linked-dataset-item"
            >
              <div class="dataset-item-icon">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="dataset-item-info">
                <span class="dataset-item-name">{{ dataset.name }}</span>
                <span class="dataset-item-count">{{ dataset.dataCount }} 条数据</span>
              </div>
              <el-tag :type="dataset.testType === 'subjective' ? 'warning' : ''" size="small">
                {{ getTestTypeText(dataset.testType) }}
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无关联的测评集" :image-size="60" />
        </div>
      </div>

      <template #footer>
        <el-button @click="viewDictionaryDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewDictionaryDialogVisible = false; openEditDictionaryDialog(viewingDictionary)">
          编辑
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入其他数据集对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入其他数据集"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="import-dialog-content">
        <el-alert
          title="注意：如果被导入的数据集与当前数据集的列结构不一致，将会导入失败"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <p class="import-tip">
          将其他数据集的数据全量导入到「{{ currentImportDataset?.name }}」中
        </p>
        <el-form label-width="100px">
          <el-form-item label="选择数据集">
            <el-select
              v-model="selectedSourceDataset"
              placeholder="请选择要导入的数据集"
              style="width: 100%"
            >
              <el-option
                v-for="ds in availableDatasets"
                :key="ds.id"
                :label="`${ds.name} (${ds.dataCount} 条)`"
                :value="ds.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确定导入</el-button>
      </template>
    </el-dialog>

    <!-- 拆分数据集对话框 -->
    <el-dialog
      v-model="splitDialogVisible"
      title="拆分数据集"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="split-dialog-content">
        <p class="split-tip">
          将「{{ currentSplitDataset?.name }}」拆分为 2 个数据集（共 {{ currentSplitDataset?.dataCount }} 条数据）
        </p>
        <el-form :model="splitForm" label-width="100px">
          <el-form-item label="拆分方式">
            <el-radio-group v-model="splitForm.mode">
              <el-radio value="ratio">按比例</el-radio>
              <el-radio value="count">按数量</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="splitForm.mode === 'ratio'" label="拆分比例">
            <el-slider v-model="splitForm.ratio" :marks="{ 0: '0%', 50: '50%', 100: '100%' }" />
            <span class="split-info">第一个数据集占比 {{ splitForm.ratio }}%</span>
          </el-form-item>
          <el-form-item v-else label="拆分数量">
            <el-input-number
              v-model="splitForm.count"
              :min="1"
              :max="(currentSplitDataset?.dataCount || 1) - 1"
            />
            <span class="split-info">
              第一个数据集 {{ splitForm.count }} 条，第二个数据集 {{ (currentSplitDataset?.dataCount || 0) - splitForm.count }} 条
            </span>
          </el-form-item>
          <el-divider />
          <el-form-item label="数据集1名称">
            <el-input v-model="splitForm.name1" placeholder="请输入第一个数据集名称" />
          </el-form-item>
          <el-form-item label="数据集2名称">
            <el-input v-model="splitForm.name2" placeholder="请输入第二个数据集名称" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSplit">确定拆分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dataset-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.dataset-count {
  font-size: 14px;
  color: #909399;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 媒体类型下拉选项 */
.media-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 媒体类型选择器 */
.media-type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

.media-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.media-type-card:hover {
  border-color: var(--theme-color, #409eff);
  background: #fff;
}

.media-type-card.active {
  border-color: var(--theme-color, #409eff);
  background: linear-gradient(to bottom, rgba(64, 158, 255, 0.05), rgba(64, 158, 255, 0.1));
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.media-type-card.active .media-icon {
  background: var(--theme-color, #409eff);
  color: #fff;
}

.media-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f0f2f5;
  color: #606266;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.media-info {
  text-align: center;
}

.media-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.media-desc {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

/* 媒体类型标签样式 */
.media-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dataset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.dataset-card {
  border-radius: 8px;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dataset-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}

.dataset-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  position: relative;
}

.card-dropdown {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.dataset-card:hover .card-dropdown {
  opacity: 1;
}

.more-btn {
  border: none;
  background: transparent;
}

.icon-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  flex-shrink: 0;
}

.icon-wrapper .custom-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 媒体类型角标 */
.media-type-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

/* 媒体类型标签样式 */
.media-type-tag {
  font-weight: 500;
  border-width: 1px;
}

.title-area {
  flex: 1;
  min-width: 0;
}

.dataset-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-content {
  flex: 1;
  margin-bottom: 16px;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  margin-top: auto;
}

.data-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
}

.data-count {
  font-size: 13px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}

/* 新建测评集对话框样式 */
.create-dataset-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-right: 0;
}

.create-dataset-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.create-dataset-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.create-dataset-dialog :deep(.el-dialog__footer) {
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

/* 数据字典选择器 */
.dictionary-select-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dictionary-select-wrapper .el-button {
  flex-shrink: 0;
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

/* 对话框样式 */
.import-dialog-content,
.split-dialog-content {
  padding: 0 8px;
}

.import-tip,
.split-tip {
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

.split-info {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}

/* 数据字典卡片样式 */
.columns-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.preview-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.columns-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 60px;
  overflow: hidden;
}

.time-text {
  font-size: 13px;
  color: #909399;
}

/* 数据字典对话框样式 */
.dictionary-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.dictionary-form-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #fafbfc;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.basic-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.field-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-help {
  color: #909399;
  cursor: help;
  margin-left: auto;
}

.section-content {
  padding: 20px;
}

.columns-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: border-color 0.2s;
}

.column-item:hover {
  border-color: #d0d5dd;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.column-index {
  display: flex;
  align-items: center;
  gap: 6px;
}

.index-num {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.index-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.column-row {
  display: flex;
  gap: 12px;
}

.column-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.column-field-small {
  flex: 0 0 120px;
}

.column-field-full {
  flex: 1;
}

.field-label {
  font-size: 12px;
  color: #909399;
}

.field-label .required {
  color: #f56c6c;
  margin-right: 2px;
}

.column-extra {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.column-item .el-input,
.column-item .el-select {
  width: 100%;
}

.column-actions {
  padding-top: 8px;
}

.field-limit-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #e6a23c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 查看数据字典详情样式 */
.dictionary-detail {
  padding: 0 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  flex-shrink: 0;
}

.detail-info {
  flex: 1;
}

.detail-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
}

.meta-divider {
  color: #dcdfe6;
}

.detail-section {
  margin-top: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.text-muted {
  color: #c0c4cc;
}

/* 关联测评集列表样式 */
.linked-datasets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.linked-dataset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.linked-dataset-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.dataset-item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 8px;
  color: #fff;
  flex-shrink: 0;
}

.dataset-item-info {
  flex: 1;
  min-width: 0;
}

.dataset-item-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-item-count {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.section-count {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
  margin-left: 4px;
}

/* 卡片底部信息样式 */
.footer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dictionary-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.dictionary-info.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.dictionary-info.clickable:hover {
  color: #409eff;
}

.dictionary-info.clickable:hover .dictionary-name {
  text-decoration: underline;
}

.dictionary-info .el-icon {
  font-size: 14px;
}

.dictionary-name {
  color: #667eea;
}
</style>
