<script setup>
import { ref, computed, reactive } from 'vue'
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
} from '@element-plus/icons-vue'

const router = useRouter()

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editingId = ref('')

// 对话框标题
const dialogTitle = computed(() => (isEditMode.value ? '编辑测评集' : '新建测评集'))

// 表单数据
const formData = reactive({
  name: '',
  iconType: 'preset',
  icon: 'ChatDotRound',
  customIconUrl: '',
  tags: [],
  description: '',
})

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

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入测评集名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  description: [
    { required: true, message: '请输入测评集描述', trigger: 'blur' },
    { min: 10, max: 200, message: '长度在 10 到 200 个字符', trigger: 'blur' },
  ],
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
              tags: [...formData.tags],
              description: formData.description,
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
          tags: [...formData.tags],
          description: formData.description,
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
    tags: ['对话', '通用'],
    description:
      '包含多轮对话、常识问答等通用场景的测试数据，用于评估模型的对话能力',
    dataCount: 256,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: '2',
    name: '代码生成测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['代码', '编程'],
    description:
      '包含多种编程语言的代码生成任务，用于评估模型的编程能力',
    dataCount: 128,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-18',
  },
  {
    id: '3',
    name: '文档理解测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['文档', '理解'],
    description:
      '包含长文档阅读理解、信息提取等任务，用于评估模型的文档处理能力',
    dataCount: 512,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25',
  },
  {
    id: '4',
    name: '数据分析测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    tags: ['数据', '分析'],
    description:
      '包含数据解读、图表分析、统计推理等任务，用于评估模型的数据分析能力',
    dataCount: 96,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-22',
  },
  {
    id: '5',
    name: '数学推理测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    tags: ['数学', '推理'],
    description: '包含数学计算、逻辑推理等任务，用于评估模型的数学能力',
    dataCount: 180,
    createdAt: '2024-02-12',
    updatedAt: '2024-02-23',
  },
  {
    id: '6',
    name: '翻译能力测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['翻译', '多语言'],
    description: '包含多语言翻译任务，用于评估模型的跨语言处理能力',
    dataCount: 320,
    createdAt: '2024-02-14',
    updatedAt: '2024-02-24',
  },
  {
    id: '7',
    name: '创意写作测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['写作', '创意'],
    description: '包含故事创作、文案生成等任务，用于评估模型的创意写作能力',
    dataCount: 88,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-25',
  },
  {
    id: '8',
    name: '知识问答测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['知识', '问答'],
    description: '包含各领域知识问答，用于评估模型的知识广度',
    dataCount: 450,
    createdAt: '2024-02-16',
    updatedAt: '2024-02-26',
  },
  {
    id: '9',
    name: '情感分析测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['情感', 'NLP'],
    description: '包含文本情感分类、情绪识别等任务，用于评估模型的情感理解能力',
    dataCount: 200,
    createdAt: '2024-02-17',
    updatedAt: '2024-02-26',
  },
  {
    id: '10',
    name: '摘要生成测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['摘要', '生成'],
    description: '包含新闻摘要、论文摘要等任务，用于评估模型的文本摘要能力',
    dataCount: 156,
    createdAt: '2024-02-18',
    updatedAt: '2024-02-26',
  },
  {
    id: '11',
    name: '问答系统测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['问答', '检索'],
    description:
      '包含基于上下文的问答任务，用于评估模型的阅读理解和信息提取能力',
    dataCount: 380,
    createdAt: '2024-02-19',
    updatedAt: '2024-02-26',
  },
  {
    id: '12',
    name: 'SQL生成测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['SQL', '数据库'],
    description: '包含自然语言转SQL的任务，用于评估模型的数据库查询生成能力',
    dataCount: 120,
    createdAt: '2024-02-20',
    updatedAt: '2024-02-26',
  },
  {
    id: '13',
    name: '文本分类测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['分类', 'NLP'],
    description: '包含新闻分类、意图识别等任务，用于评估模型的文本分类能力',
    dataCount: 280,
    createdAt: '2024-02-21',
    updatedAt: '2024-02-26',
  },
  {
    id: '14',
    name: '命名实体识别测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    tags: ['NER', 'NLP'],
    description:
      '包含人名、地名、机构名等实体识别任务，用于评估模型的实体抽取能力',
    dataCount: 175,
    createdAt: '2024-02-22',
    updatedAt: '2024-02-26',
  },
  {
    id: '15',
    name: '对话状态追踪测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['对话', '状态'],
    description: '包含多轮对话状态追踪任务，用于评估模型的对话管理能力',
    dataCount: 92,
    createdAt: '2024-02-23',
    updatedAt: '2024-02-26',
  },
  {
    id: '16',
    name: '文本纠错测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['纠错', 'NLP'],
    description: '包含拼写纠错、语法纠错等任务，用于评估模型的文本校对能力',
    dataCount: 210,
    createdAt: '2024-02-24',
    updatedAt: '2024-02-26',
  },
  {
    id: '17',
    name: '机器阅读理解测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['阅读', '理解'],
    description: '包含篇章级阅读理解任务，用于评估模型的深度理解能力',
    dataCount: 340,
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '18',
    name: '代码补全测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['代码', '补全'],
    description: '包含代码自动补全任务，用于评估模型的代码预测能力',
    dataCount: 165,
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '19',
    name: '关键词提取测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    tags: ['关键词', 'NLP'],
    description: '包含文本关键词提取任务，用于评估模型的信息提取能力',
    dataCount: 145,
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
    id: '20',
    name: '文本相似度测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['相似度', '匹配'],
    description: '包含文本匹配、相似度计算任务，用于评估模型的语义理解能力',
    dataCount: 188,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '21',
    name: '图像描述生成测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['图像', '多模态'],
    description: '包含图像内容描述任务，用于评估模型的多模态理解能力',
    dataCount: 78,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '22',
    name: '逻辑推理测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['逻辑', '推理'],
    description: '包含逻辑推理、因果分析等任务，用于评估模型的逻辑思维能力',
    dataCount: 112,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '23',
    name: '常识推理测评集',
    icon: 'DataAnalysis',
    iconType: 'preset',
    tags: ['常识', '推理'],
    description: '包含日常生活常识推理任务，用于评估模型的常识判断能力',
    dataCount: 225,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '24',
    name: '文本生成测评集',
    icon: 'Document',
    iconType: 'preset',
    tags: ['生成', 'NLP'],
    description: '包含续写、扩写等文本生成任务，用于评估模型的生成能力',
    dataCount: 198,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
  {
    id: '25',
    name: 'API调用测评集',
    icon: 'Cpu',
    iconType: 'preset',
    tags: ['API', '工具'],
    description: '包含API调用决策和参数生成任务，用于评估模型的工具使用能力',
    dataCount: 86,
    createdAt: '2024-02-26',
    updatedAt: '2024-02-26',
  },
])

// 总数
const total = computed(() => allDatasets.value.length)

// 当前页数据
const datasets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allDatasets.value.slice(start, end)
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
</script>

<template>
  <div class="dataset-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>测评集管理</h2>
        <span class="dataset-count">共 {{ total }} 个测评集</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog"
        >新建测评集</el-button
      >
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
          <div class="icon-wrapper">
            <img
              v-if="dataset.iconType === 'custom' && dataset.customIconUrl"
              :src="dataset.customIconUrl"
              :alt="dataset.name"
              class="custom-icon"
            />
            <el-icon v-else :size="32">
              <component :is="getIconComponent(dataset.icon)" />
            </el-icon>
          </div>
          <div class="title-area">
            <h3 class="dataset-name">{{ dataset.name }}</h3>
            <div class="tags">
              <el-tag
                v-for="tag in dataset.tags"
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
          <div class="data-info">
            <el-icon><FolderOpened /></el-icon>
            <span class="data-count">{{ dataset.dataCount }} 条测试数据</span>
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

    <!-- 新建测评集对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入测评集名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <div class="icon-form-wrapper">
            <el-radio-group v-model="formData.iconType" class="icon-type-radio">
              <el-radio-button value="preset">预设图标</el-radio-button>
              <el-radio-button value="custom">自定义上传</el-radio-button>
            </el-radio-group>

            <!-- 预设图标选择 -->
            <div v-if="formData.iconType === 'preset'" class="preset-icons">
              <el-radio-group v-model="formData.icon">
                <el-radio-button
                  v-for="option in iconOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  <div class="icon-option">
                    <el-icon :size="18">
                      <component :is="iconMap[option.value]" />
                    </el-icon>
                    <span>{{ option.label }}</span>
                  </div>
                </el-radio-button>
              </el-radio-group>
            </div>

            <!-- 自定义图标上传 -->
            <div v-else class="custom-icon-upload">
              <el-upload
                v-if="!formData.customIconUrl"
                class="icon-uploader"
                :show-file-list="false"
                :http-request="handleImageUpload"
                accept="image/*"
              >
                <div class="upload-placeholder">
                  <el-icon :size="24"><Plus /></el-icon>
                  <span>上传图标</span>
                </div>
              </el-upload>
              <div v-else class="custom-icon-preview">
                <img :src="formData.customIconUrl" alt="自定义图标" />
                <div class="icon-actions" @click="handleRemoveCustomIcon">
                  <el-icon><Plus /></el-icon>
                </div>
              </div>
              <div class="upload-tip">支持 jpg、png 格式，大小不超过 2MB</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择标签"
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

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入测评集描述"
            :rows="4"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
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

.dataset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.dataset-card {
  border-radius: 8px;
  transition: transform 0.2s;
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

/* 对话框样式 */
.icon-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 图标表单样式 */
.icon-form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-type-radio {
  width: fit-content;
}

.preset-icons {
  margin-top: 4px;
}

.custom-icon-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-uploader {
  width: 80px;
  height: 80px;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.upload-placeholder span {
  font-size: 12px;
}

.custom-icon-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.custom-icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-icon-preview .icon-actions {
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
  transition: opacity 0.2s;
  cursor: pointer;
}

.custom-icon-preview:hover .icon-actions {
  opacity: 1;
}

.custom-icon-preview .icon-actions .el-icon {
  color: #fff;
  font-size: 20px;
  transform: rotate(45deg);
}

.upload-tip {
  font-size: 12px;
  color: #909399;
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
</style>
