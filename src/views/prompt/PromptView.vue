<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Plus,
  Delete,
  More,
  Search,
  Edit,
  CopyDocument,
  ChatDotRound,
  Cpu,
  DataAnalysis,
  EditPen,
} from '@element-plus/icons-vue'

const router = useRouter()

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editingId = ref('')

// 对话框标题
const dialogTitle = computed(() => (isEditMode.value ? '编辑 Prompt' : '新建 Prompt'))

// 表单数据
const formData = reactive({
  name: '',
  category: '',
  tags: [],
  description: '',
})

// 预置分类
const categories = ['对话', '代码', '写作', '翻译', '分析', '总结', '分类', '抽取', '推理', '其他']

// 预置标签
const presetTags = [
  '通用',
  'ChatGPT',
  'Claude',
  '角色扮演',
  'Few-shot',
  'CoT',
  '结构化',
  'JSON',
  '多语言',
  '创意',
  'API',
  '工具调用',
  '安全',
  '评估',
]

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入 Prompt 名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' },
  ],
}

// 搜索和筛选
const searchText = ref('')
const filterCategory = ref('')
const filterTag = ref('')

// 模拟 Prompt 数据
const allPrompts = ref([
  {
    id: '1',
    name: '通用对话助手',
    description: '一个通用的对话助手 Prompt，适用于日常问答、闲聊等场景',
    content: '你是一个友好、专业的AI助手。请用简洁清晰的语言回答用户的问题。\n\n用户问题：{{question}}',
    category: '对话',
    tags: ['通用', 'ChatGPT'],
    variables: [{ name: 'question', type: 'string', required: true, description: '用户的问题' }],
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: '2',
    name: '代码审查专家',
    description: '专业的代码审查 Prompt，帮助发现代码中的问题和改进建议',
    content:
      '你是一位资深的代码审查专家。请仔细审查以下代码，指出潜在的问题、安全漏洞、性能问题，并提供改进建议。\n\n代码语言：{{language}}\n代码内容：\n{{code}}',
    category: '代码',
    tags: ['代码', '安全'],
    variables: [
      { name: 'language', type: 'string', required: true, description: '编程语言' },
      { name: 'code', type: 'string', required: true, description: '待审查的代码' },
    ],
    createdAt: '2024-01-20',
    updatedAt: '2024-02-18',
  },
  {
    id: '3',
    name: '技术文档写作',
    description: '帮助撰写清晰、专业的技术文档',
    content:
      '请根据以下信息撰写一份专业的技术文档。要求结构清晰、语言准确、易于理解。\n\n文档主题：{{topic}}\n目标读者：{{audience}}\n关键要点：{{keypoints}}',
    category: '写作',
    tags: ['结构化', '通用'],
    variables: [
      { name: 'topic', type: 'string', required: true, description: '文档主题' },
      { name: 'audience', type: 'string', required: false, description: '目标读者' },
      { name: 'keypoints', type: 'string', required: false, description: '关键要点' },
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25',
  },
  {
    id: '4',
    name: '英译中翻译',
    description: '专业的英译中翻译 Prompt，保持原文风格和准确性',
    content:
      '请将以下英文内容翻译成中文。要求：\n1. 保持原文的语气和风格\n2. 使用地道的中文表达\n3. 专业术语保持准确\n\n原文：\n{{text}}',
    category: '翻译',
    tags: ['多语言', '通用'],
    variables: [{ name: 'text', type: 'string', required: true, description: '待翻译的英文文本' }],
    createdAt: '2024-02-05',
    updatedAt: '2024-02-22',
  },
  {
    id: '5',
    name: '数据分析报告',
    description: '根据数据生成专业的分析报告',
    content:
      '你是一位数据分析专家。请根据以下数据生成一份分析报告，包括：数据概览、关键发现、趋势分析、建议。\n\n数据描述：{{dataDescription}}\n分析目的：{{purpose}}',
    category: '分析',
    tags: ['结构化', '通用'],
    variables: [
      { name: 'dataDescription', type: 'string', required: true, description: '数据描述' },
      { name: 'purpose', type: 'string', required: true, description: '分析目的' },
    ],
    createdAt: '2024-02-10',
    updatedAt: '2024-02-23',
  },
  {
    id: '6',
    name: '会议纪要生成',
    description: '根据会议内容自动生成结构化的会议纪要',
    content:
      '请根据以下会议内容生成一份结构化的会议纪要，包括：会议基本信息、讨论要点、决议事项、后续行动。\n\n会议内容：\n{{meetingContent}}',
    category: '总结',
    tags: ['结构化', '通用'],
    variables: [
      { name: 'meetingContent', type: 'string', required: true, description: '会议内容或记录' },
    ],
    createdAt: '2024-02-12',
    updatedAt: '2024-02-24',
  },
  {
    id: '7',
    name: '意图分类器',
    description: '对用户输入进行意图分类',
    content:
      '请分析以下用户输入的意图，从以下类别中选择最合适的一个：{{categories}}\n\n用户输入：{{input}}\n\n请直接输出类别名称，不要解释。',
    category: '分类',
    tags: ['通用', 'Few-shot'],
    variables: [
      { name: 'categories', type: 'string', required: true, description: '可选类别列表' },
      { name: 'input', type: 'string', required: true, description: '用户输入' },
    ],
    createdAt: '2024-02-14',
    updatedAt: '2024-02-25',
  },
  {
    id: '8',
    name: '实体抽取',
    description: '从文本中抽取关键实体信息',
    content:
      '请从以下文本中抽取所有实体，包括：人名、地名、机构名、时间、金额等。\n\n请以 JSON 格式输出，格式如下：\n{"人名": [], "地名": [], "机构": [], "时间": [], "其他": []}\n\n文本：\n{{text}}',
    category: '抽取',
    tags: ['JSON', '结构化'],
    variables: [{ name: 'text', type: 'string', required: true, description: '待抽取实体的文本' }],
    createdAt: '2024-02-15',
    updatedAt: '2024-02-26',
  },
  {
    id: '9',
    name: '逻辑推理助手',
    description: '基于 CoT 思维链进行逻辑推理',
    content:
      '请使用逐步推理的方式分析以下问题：\n\n1. 首先，理解问题的关键要素\n2. 然后，列出已知条件和约束\n3. 接着，逐步推导\n4. 最后，给出结论\n\n问题：{{problem}}',
    category: '推理',
    tags: ['CoT', '通用'],
    variables: [{ name: 'problem', type: 'string', required: true, description: '需要推理的问题' }],
    createdAt: '2024-02-16',
    updatedAt: '2024-02-26',
  },
  {
    id: '10',
    name: 'API 调用生成器',
    description: '根据自然语言生成 API 调用代码',
    content:
      '请根据用户的自然语言描述生成对应的 API 调用代码。\n\nAPI 文档：\n{{apiDoc}}\n\n用户需求：\n{{userRequest}}\n\n请生成完整的调用代码，包含必要的错误处理。',
    category: '代码',
    tags: ['API', '代码'],
    variables: [
      { name: 'apiDoc', type: 'string', required: true, description: 'API 文档说明' },
      { name: 'userRequest', type: 'string', required: true, description: '用户的自然语言需求' },
    ],
    createdAt: '2024-02-18',
    updatedAt: '2024-02-26',
  },
  {
    id: '11',
    name: '角色扮演：产品经理',
    description: '扮演一位经验丰富的产品经理，提供产品相关建议',
    content:
      '你现在是一位有10年经验的产品经理。请从用户需求、市场分析、产品定位等角度回答以下问题。\n\n问题：{{question}}',
    category: '对话',
    tags: ['角色扮演', '通用'],
    variables: [{ name: 'question', type: 'string', required: true, description: '产品相关问题' }],
    createdAt: '2024-02-20',
    updatedAt: '2024-02-26',
  },
  {
    id: '12',
    name: 'SQL 生成器',
    description: '根据自然语言生成 SQL 查询语句',
    content:
      '请根据以下表结构和自然语言查询需求，生成对应的 SQL 语句。\n\n表结构：\n{{schema}}\n\n查询需求：\n{{query}}\n\n请只输出 SQL 语句，不要解释。',
    category: '代码',
    tags: ['代码', '结构化'],
    variables: [
      { name: 'schema', type: 'string', required: true, description: '数据库表结构' },
      { name: 'query', type: 'string', required: true, description: '自然语言查询需求' },
    ],
    createdAt: '2024-02-22',
    updatedAt: '2024-02-26',
  },
])

// 筛选后的数据
const filteredPrompts = computed(() => {
  let result = allPrompts.value

  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
    )
  }

  // 分类过滤
  if (filterCategory.value) {
    result = result.filter((p) => p.category === filterCategory.value)
  }

  // 标签过滤
  if (filterTag.value) {
    result = result.filter((p) => p.tags.includes(filterTag.value))
  }

  return result
})

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)

// 总数
const total = computed(() => filteredPrompts.value.length)

// 当前页数据
const prompts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPrompts.value.slice(start, end)
})

// 所有标签（用于筛选）
const allTags = computed(() => {
  const tags = new Set()
  allPrompts.value.forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return Array.from(tags)
})

// 分类图标映射
const categoryIconMap = {
  对话: ChatDotRound,
  代码: Cpu,
  写作: EditPen,
  翻译: Document,
  分析: DataAnalysis,
  总结: Document,
  分类: DataAnalysis,
  抽取: Cpu,
  推理: DataAnalysis,
  其他: Document,
}

// 获取分类图标
const getCategoryIcon = (category) => {
  return categoryIconMap[category] || Document
}

// 打开新建对话框
const openCreateDialog = () => {
  isEditMode.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (prompt) => {
  isEditMode.value = true
  editingId.value = prompt.id
  formData.name = prompt.name
  formData.category = prompt.category
  formData.tags = [...prompt.tags]
  formData.description = prompt.description
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.category = ''
  formData.tags = []
  formData.description = ''
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEditMode.value) {
        const index = allPrompts.value.findIndex((p) => p.id === editingId.value)
        if (index !== -1) {
          const original = allPrompts.value[index]
          if (original) {
            allPrompts.value[index] = {
              ...original,
              name: formData.name,
              category: formData.category,
              tags: [...formData.tags],
              description: formData.description,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
            ElMessage.success('Prompt 更新成功')
          }
        }
      } else {
        const newPrompt = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          content: '请在此编辑 Prompt 内容...\n\n可以使用 {{变量名}} 定义变量。',
          category: formData.category,
          tags: [...formData.tags],
          variables: [],
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        allPrompts.value.unshift(newPrompt)
        currentPage.value = 1
        ElMessage.success('Prompt 创建成功，请前往详情页编辑内容')
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
  router.push(`/prompt/${id}`)
}

// 复制 Prompt
const handleCopy = (prompt) => {
  const newPrompt = {
    ...prompt,
    id: Date.now().toString(),
    name: `${prompt.name} (副本)`,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  allPrompts.value.unshift(newPrompt)
  currentPage.value = 1
  ElMessage.success('Prompt 复制成功')
}

// 删除 Prompt
const handleDelete = (prompt) => {
  ElMessageBox.confirm(`确定要删除 Prompt「${prompt.name}」吗？删除后无法恢复。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = allPrompts.value.findIndex((p) => p.id === prompt.id)
    if (index !== -1) {
      allPrompts.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
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

// 重置筛选
const resetFilters = () => {
  searchText.value = ''
  filterCategory.value = ''
  filterTag.value = ''
  currentPage.value = 1
}
</script>

<template>
  <div class="prompt-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>Prompt 管理</h2>
        <span class="prompt-count">共 {{ total }} 个 Prompt</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建 Prompt</el-button>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchText"
          placeholder="搜索 Prompt 名称或描述"
          :prefix-icon="Search"
          clearable
          style="width: 280px"
          @input="currentPage = 1"
        />
        <el-select
          v-model="filterCategory"
          placeholder="按分类筛选"
          clearable
          style="width: 140px"
          @change="currentPage = 1"
        >
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-select
          v-model="filterTag"
          placeholder="按标签筛选"
          clearable
          style="width: 140px"
          @change="currentPage = 1"
        >
          <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
        <el-button v-if="searchText || filterCategory || filterTag" text @click="resetFilters">
          重置
        </el-button>
      </div>
    </div>

    <!-- Prompt 卡片列表 -->
    <div class="prompt-grid" v-if="prompts.length > 0">
      <el-card v-for="prompt in prompts" :key="prompt.id" class="prompt-card" shadow="hover">
        <!-- 卡片头部：分类图标和名称 -->
        <div class="card-header">
          <div class="icon-wrapper" :class="`category-${prompt.category}`">
            <el-icon :size="24">
              <component :is="getCategoryIcon(prompt.category)" />
            </el-icon>
          </div>
          <div class="title-area">
            <h3 class="prompt-name">{{ prompt.name }}</h3>
            <el-tag size="small" type="info">{{ prompt.category }}</el-tag>
          </div>
          <el-dropdown trigger="click" class="card-dropdown" @click.stop>
            <el-button class="more-btn" :icon="More" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleCopy(prompt)">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-dropdown-item>
                <el-dropdown-item @click="openEditDialog(prompt)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete(prompt)">
                  <span style="color: #f56c6c">
                    <el-icon><Delete /></el-icon>
                    删除
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 卡片内容：描述和标签 -->
        <div class="card-content">
          <p class="description">{{ prompt.description }}</p>
          <div class="tags">
            <el-tag v-for="tag in prompt.tags" :key="tag" size="small" type="info" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 卡片底部：变量数量和操作 -->
        <div class="card-footer">
          <div class="meta-info">
            <span class="meta-item">
              <el-icon><EditPen /></el-icon>
              {{ prompt.variables.length }} 个变量
            </span>
            <span class="meta-item">{{ prompt.updatedAt }}</span>
          </div>
          <el-button text type="primary" size="small" @click="handleViewDetail(prompt.id)">
            查看详情
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无匹配的 Prompt">
      <el-button type="primary" @click="resetFilters">清除筛选条件</el-button>
    </el-empty>

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

    <!-- 新建/编辑 Prompt 对话框 -->
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
            placeholder="请输入 Prompt 名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择标签"
            style="width: 100%"
            allow-create
            filterable
          >
            <el-option v-for="tag in presetTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入 Prompt 描述"
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
  </div>
</template>

<style scoped>
.prompt-page {
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

.prompt-count {
  font-size: 14px;
  color: #909399;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.prompt-card {
  border-radius: 8px;
  transition: transform 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prompt-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
}

.prompt-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
}

.card-dropdown {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.prompt-card:hover .card-dropdown {
  opacity: 1;
}

.more-btn {
  border: none;
  background: transparent;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.category-对话 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.category-代码 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.category-写作 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.category-翻译 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.category-分析 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
.category-总结 {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}
.category-分类 {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
  color: #333;
}
.category-抽取 {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
}
.category-推理 {
  background: linear-gradient(135deg, #fddb92 0%, #d1fdff 100%);
  color: #333;
}
.category-其他 {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
  color: #333;
}

.title-area {
  flex: 1;
  min-width: 0;
}

.prompt-name {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
  flex: 1;
  margin-bottom: 12px;
  min-height: 0;
}

.description {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /*! autoprefixer: ignore next */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
