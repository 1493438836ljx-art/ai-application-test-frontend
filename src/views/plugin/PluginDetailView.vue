<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  VideoPlay,
  CopyDocument,
  Setting,
  Edit,
  Check,
  Close,
  Plus,
  FullScreen,
  Collection,
  Delete,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/atom-one-dark.css'

// 注册 Python 语法
hljs.registerLanguage('python', python)

const route = useRoute()
const router = useRouter()

// 插件数据
const plugin = ref(null)

// 编辑状态
const isEditing = ref(false)
const isFullscreen = ref(false)
const codeTextareaRef = ref(null)
const editForm = reactive({
  name: '',
  description: '',
  category: 'data',
  tags: [],
  code: '',
  params: [],
  status: 'active',
  dataDictionaryId: '',
})

// 代码行数
const codeLines = computed(() => {
  const lines = editForm.code.split('\n').length
  return Math.max(lines, 15)
})

// 高亮后的代码
const highlightedCode = computed(() => {
  try {
    return hljs.highlight(editForm.code, { language: 'python' }).value
  } catch {
    return editForm.code
  }
})

// 参数编辑对话框
const paramDialogVisible = ref(false)
const isEditParamMode = ref(false)
const editingParamIndex = ref(-1)
const paramFormData = reactive({
  name: '',
  type: 'string',
  default: '',
  description: '',
})

// 参数类型选项
const paramTypes = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'json', label: 'JSON' },
]

// 分类选项
const categoryOptions = [
  { value: 'data', label: '数据处理' },
  { value: 'execution', label: '测试执行' },
  { value: 'evaluation', label: '结果评估' },
]

// 预设标签选项
const presetTags = [
  '数据处理',
  '文本清洗',
  'JSON',
  '安全',
  '测试执行',
  'HTTP',
  'API',
  '数据库',
  '结果评估',
  'NLP',
  '性能',
  '文本匹配',
  '工具',
  '转换',
]

// 数据字典列表
const dataDictionaries = ref([
  {
    id: 'dict-1',
    name: '通用对话测试',
    description: '用于测试模型的基础对话能力，包含多轮对话、意图识别等测试场景',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'input', label: '输入', type: 'string' },
      { key: 'expectedOutput', label: '期望输出', type: 'string' },
    ],
  },
  {
    id: 'dict-2',
    name: '代码生成测试',
    description: '用于测试模型的代码生成能力，包含 Python、Java、SQL 等编程语言的代码生成测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
    ],
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
  },
  {
    id: 'dict-4',
    name: '阅读理解测试',
    description: '用于测试模型的阅读理解和信息提取能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'passage', label: '文章', type: 'string' },
      { key: 'question', label: '问题', type: 'string' },
      { key: 'answer', label: '答案', type: 'string' },
    ],
  },
  {
    id: 'dict-5',
    name: '情感分析测试',
    description: '用于测试模型的情感分析能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'text', label: '文本', type: 'string' },
      { key: 'sentiment', label: '情感', type: 'string' },
    ],
  },
])

// 需要关联数据字典的分类
const categoriesRequireDictionary = ['data', 'execution', 'evaluation']

// 测试相关
const testInput = ref('')
const testConfig = ref('{}')
const testResult = ref('')
const isTesting = ref(false)

// 加载插件数据
const loadPlugin = () => {
  const id = route.params.id
  // 模拟数据
  const mockPlugins = {
    'plugin-1': {
      id: 'plugin-1',
      name: '数据预处理脚本',
      description: '对输入数据进行清洗和标准化处理，去除多余空白、统一换行符、移除HTML标签',
      category: 'data',
      tags: ['数据处理', '文本清洗'],
      source: 'system',
      dataDictionaryId: 'dict-1',
      code: `def execute(input_data, config):
    import re
    result = input_data.strip()
    result = result.replace('\\r\\n', '\\n')
    result = re.sub(r'<[^>]+>', '', result)
    return result`,
      params: [
        { name: 'remove_html', type: 'boolean', default: 'true', description: '是否移除HTML标签' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 15:30',
      createdAt: '2024-02-15',
      updatedAt: '2024-02-20',
    },
    'plugin-2': {
      id: 'plugin-2',
      name: 'JSON 数据提取',
      description: '从嵌套 JSON 中提取指定路径的数据，支持多级路径访问',
      category: 'data',
      tags: ['数据处理', 'JSON'],
      source: 'custom',
      dataDictionaryId: 'dict-2',
      code: `def execute(input_data, config):
    import json
    def get_nested_value(obj, path):
        keys = path.split('.')
        result = obj
        for key in keys:
            if isinstance(result, dict) and key in result:
                result = result[key]
            else:
                return None
        return result
    path = config.get('path', '')
    data = json.loads(input_data) if isinstance(input_data, str) else input_data
    return get_nested_value(data, path)`,
      params: [
        { name: 'path', type: 'string', default: '', description: '数据路径，如 data.result' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 14:20',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-15',
    },
    'plugin-3': {
      id: 'plugin-3',
      name: '敏感词过滤',
      description: '检测并过滤文本中的敏感词汇，返回过滤后的文本和发现的敏感词列表',
      category: 'data',
      tags: ['数据处理', '安全'],
      source: 'system',
      code: `def execute(input_data, config):
    text = str(input_data)
    sensitive_words = config.get('words', '').split(',')
    found_words = []
    filtered_text = text
    for word in sensitive_words:
        word = word.strip()
        if word and word in text:
            found_words.append(word)
            filtered_text = filtered_text.replace(word, '*' * len(word))
    return {
        'has_sensitive': len(found_words) > 0,
        'found_words': found_words,
        'filtered_text': filtered_text
    }`,
      params: [
        { name: 'words', type: 'string', default: '', description: '敏感词列表，逗号分隔' },
      ],
      status: 'active',
      testResult: 'failed',
      lastTestTime: '2024-02-25 10:00',
      createdAt: '2024-02-25',
      updatedAt: '2024-02-26',
    },
    'plugin-4': {
      id: 'plugin-4',
      name: 'HTTP 请求执行器',
      description: '执行自定义 HTTP 请求，支持 GET、POST 等方法，可配置请求头和请求体',
      category: 'execution',
      tags: ['测试执行', 'HTTP', 'API'],
      code: `def execute(input_data, config):
    import urllib.request
    import json

    url = config.get('url', '')
    method = config.get('method', 'GET')
    headers = config.get('headers', {})

    req = urllib.request.Request(url, method=method)
    for key, value in headers.items():
        req.add_header(key, value)

    if method == 'POST' and input_data:
        req.data = json.dumps(input_data).encode()

    with urllib.request.urlopen(req) as response:
        return response.read().decode()

    return None`,
      params: [
        { name: 'url', type: 'string', default: '', description: '请求URL' },
        { name: 'method', type: 'string', default: 'GET', description: '请求方法' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 16:00',
      createdAt: '2024-02-10',
      updatedAt: '2024-02-18',
    },
    'plugin-5': {
      id: 'plugin-5',
      name: '数据库查询执行器',
      description: '执行 SQL 查询语句，支持 MySQL、PostgreSQL 等数据库',
      category: 'execution',
      tags: ['测试执行', '数据库'],
      code: `def execute(input_data, config):
    # 数据库查询执行器
    # 注意：实际使用需要安装相应数据库驱动
    query = config.get('query', '')
    params = input_data if isinstance(input_data, list) else []

    # 模拟执行
    return {
        'query': query,
        'params': params,
        'rows': [],
        'rowcount': 0
    }`,
      params: [
        { name: 'query', type: 'string', default: '', description: 'SQL查询语句' },
      ],
      status: 'inactive',
      testResult: 'pending',
      lastTestTime: null,
      createdAt: '2024-01-20',
      updatedAt: '2024-02-10',
    },
    'plugin-6': {
      id: 'plugin-6',
      name: '文本相似度评估',
      description: '计算两个文本之间的相似度分数，返回0-1之间的浮点数',
      category: 'evaluation',
      tags: ['结果评估', 'NLP'],
      code: `def execute(input_data, config):
    from difflib import SequenceMatcher

    text1 = input_data.get('text1', '')
    text2 = input_data.get('text2', '')

    similarity = SequenceMatcher(None, text1, text2).ratio()
    return {
        'similarity': similarity,
        'percentage': similarity * 100
    }`,
      params: [],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 11:00',
      createdAt: '2024-02-10',
      updatedAt: '2024-02-18',
    },
    'plugin-7': {
      id: 'plugin-7',
      name: '响应时间分析',
      description: '分析 API 响应时间并生成统计报告，包括最小值、最大值、平均值、中位数、P95等',
      category: 'evaluation',
      tags: ['结果评估', '性能'],
      code: `def execute(input_data, config):
    times = input_data if isinstance(input_data, list) else [input_data]

    if not times:
        return {'error': 'No data provided'}

    sorted_times = sorted(times)
    n = len(sorted_times)

    result = {
        'count': n,
        'min': sorted_times[0],
        'max': sorted_times[-1],
        'mean': sum(times) / n,
        'median': sorted_times[n // 2] if n % 2 else (sorted_times[n//2-1] + sorted_times[n//2]) / 2,
        'p95': sorted_times[int(n * 0.95)]
    }

    return result`,
      params: [],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 09:30',
      createdAt: '2024-01-20',
      updatedAt: '2024-02-10',
    },
    'plugin-8': {
      id: 'plugin-8',
      name: '关键词匹配评估',
      description: '检查输出中是否包含预期的关键词，支持多个关键词和匹配模式',
      category: 'evaluation',
      tags: ['结果评估', '文本匹配'],
      code: `def execute(input_data, config):
    import re

    text = str(input_data.get('output', ''))
    keywords = config.get('keywords', '').split(',')
    mode = config.get('mode', 'any')  # any, all, none

    found = []
    for kw in keywords:
        kw = kw.strip()
        if kw and re.search(kw, text, re.IGNORECASE):
            found.append(kw)

    if mode == 'any':
        passed = len(found) > 0
    elif mode == 'all':
        passed = len(found) == len([k for k in keywords if k.strip()])
    else:  # none
        passed = len(found) == 0

    return {
        'passed': passed,
        'found_keywords': found,
        'mode': mode
    }`,
      params: [
        { name: 'keywords', type: 'string', default: '', description: '关键词列表，逗号分隔' },
        { name: 'mode', type: 'string', default: 'any', description: '匹配模式: any/all/none' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-28 14:00',
      createdAt: '2024-02-28',
      updatedAt: '2024-02-28',
    },
  }

  plugin.value = mockPlugins[id] || null
  if (plugin.value) {
    // 初始化测试配置
    testConfig.value = plugin.value.params && plugin.value.params.length > 0
      ? JSON.stringify(plugin.value.params.reduce((acc, p) => {
          acc[p.name] = p.default
          return acc
        }, {}), null, 2)
      : '{}'
  }
}

// 返回上一页
const goBack = () => {
  router.push('/plugin')
}

// 删除插件
const handleDelete = async () => {
  if (!plugin.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除插件「${plugin.value.name}」吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    // 模拟删除操作
    // 实际项目中这里应该调用 API 删除插件
    // await deletePlugin(plugin.value.id)

    ElMessage.success('插件删除成功')
    router.push('/plugin')
  } catch (e) {
    // 用户取消删除
    if (e !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 运行测试
const runTest = async () => {
  isTesting.value = true
  testResult.value = ''

  // 模拟测试
  await new Promise(resolve => setTimeout(resolve, 1000))

  try {
    // 模拟执行结果
    testResult.value = JSON.stringify({
      status: 'success',
      output: '测试执行成功',
      execution_time: '0.123s',
    }, null, 2)
    ElMessage.success('测试执行成功')
  } catch (e) {
    testResult.value = `错误: ${e.message}`
    ElMessage.error('测试执行失败')
  } finally {
    isTesting.value = false
  }
}

// 复制代码
const handleCopyCode = () => {
  const code = isEditing.value ? editForm.code : plugin.value?.code
  if (code) {
    navigator.clipboard.writeText(code)
    ElMessage.success('代码已复制到剪贴板')
  }
}

// 获取分类文字
const getCategoryText = (category) => {
  const found = categoryOptions.find(c => c.value === category)
  return found ? found.label : category
}

// 获取测试结果文字
const getTestResultText = (result) => {
  if (result === 'success') return '测试通过'
  if (result === 'failed') return '测试失败'
  return '未测试'
}

// 获取数据字典名称
const getDictionaryName = (dictId) => {
  if (!dictId) return ''
  const dict = dataDictionaries.value.find((d) => d.id === dictId)
  return dict ? dict.name : ''
}

// 获取数据字典字段数量
const getDictionaryFieldCount = (dictId) => {
  if (!dictId) return 0
  const dict = dataDictionaries.value.find((d) => d.id === dictId)
  return dict?.columns?.length || 0
}

// 跳转到数据字典详情页
const goToDictionaryDetail = (dictId) => {
  if (dictId) {
    router.push(`/data-dictionary/${dictId}`)
  }
}

// 判断分类是否需要关联数据字典
const needsDictionary = (category) => {
  return categoriesRequireDictionary.includes(category)
}

// 进入编辑模式
const enterEditMode = () => {
  if (plugin.value) {
    editForm.name = plugin.value.name
    editForm.description = plugin.value.description
    editForm.category = plugin.value.category
    editForm.tags = [...plugin.value.tags]
    editForm.code = plugin.value.code
    editForm.params = plugin.value.params ? plugin.value.params.map(p => ({ ...p })) : []
    editForm.status = plugin.value.status
    editForm.dataDictionaryId = plugin.value.dataDictionaryId || ''
    isEditing.value = true
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
}

// 保存编辑
const saveEdit = () => {
  if (!editForm.name.trim()) {
    ElMessage.warning('请输入插件名称')
    return
  }
  // 验证数据字典关联
  if (needsDictionary(editForm.category) && !editForm.dataDictionaryId) {
    ElMessage.warning('请选择关联的数据字典')
    return
  }
  if (plugin.value) {
    plugin.value.name = editForm.name
    plugin.value.description = editForm.description
    plugin.value.category = editForm.category
    plugin.value.tags = [...editForm.tags]
    plugin.value.code = editForm.code
    plugin.value.params = editForm.params.map(p => ({ ...p }))
    plugin.value.status = editForm.status
    plugin.value.dataDictionaryId = needsDictionary(editForm.category) ? editForm.dataDictionaryId : ''
    plugin.value.updatedAt = new Date().toISOString().slice(0, 10)
    isEditing.value = false
    ElMessage.success('保存成功')
  }
}

// 添加参数
const addParam = () => {
  isEditParamMode.value = false
  editingParamIndex.value = -1
  paramFormData.name = ''
  paramFormData.type = 'string'
  paramFormData.default = ''
  paramFormData.description = ''
  paramDialogVisible.value = true
}

// 编辑参数
const editParam = (index) => {
  isEditParamMode.value = true
  editingParamIndex.value = index
  const param = editForm.params[index]
  paramFormData.name = param.name
  paramFormData.type = param.type
  paramFormData.default = param.default
  paramFormData.description = param.description
  paramDialogVisible.value = true
}

// 保存参数
const handleParamSubmit = () => {
  if (!paramFormData.name.trim()) {
    ElMessage.warning('请输入参数名称')
    return
  }

  const param = {
    name: paramFormData.name,
    type: paramFormData.type,
    default: paramFormData.default,
    description: paramFormData.description,
  }

  if (isEditParamMode.value) {
    editForm.params[editingParamIndex.value] = param
  } else {
    editForm.params.push(param)
  }
  paramDialogVisible.value = false
}

// 删除参数
const removeParam = (index) => {
  editForm.params.splice(index, 1)
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// ESC 键退出全屏
const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

// 代码编辑键盘事件处理
const handleCodeKeydown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    editForm.code = editForm.code.substring(0, start) + '    ' + editForm.code.substring(end)
    nextTick(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 4
    })
  }
}

// 同步滚动
const handleCodeScroll = (e) => {
  const lineNumbers = e.target.parentElement.querySelector('.line-numbers')
  if (lineNumbers) {
    lineNumbers.scrollTop = e.target.scrollTop
  }
}

onMounted(() => {
  loadPlugin()
  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  // 移除全局键盘事件监听
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="plugin-detail-page" v-if="plugin">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info">
          <h2>{{ isEditing ? '编辑插件' : plugin.name }}</h2>
          <div class="header-meta" v-if="!isEditing">
            <span class="meta-item">
              <el-icon><Setting /></el-icon>
              {{ getCategoryText(plugin.category) }}
            </span>
            <span class="meta-item">
              创建于 {{ plugin.createdAt }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <!-- 编辑模式：保存/取消按钮 -->
        <template v-if="isEditing">
          <el-button @click="cancelEdit">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button type="primary" @click="saveEdit">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </template>
        <!-- 查看模式：编辑/删除按钮 -->
        <template v-else>
          <el-button class="delete-btn" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
          <el-button type="primary" @click="enterEditMode">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </template>
      </div>
    </div>

    <!-- 编辑模式提示 -->
    <el-alert
      v-if="isEditing"
      type="warning"
      title="编辑模式"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      您正在编辑此插件，修改完成后请点击「保存」按钮保存更改，或点击「取消」放弃修改。
    </el-alert>

    <!-- 插件信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <span>基本信息</span>
      </template>
      <el-form label-width="80px" label-position="left">
        <!-- 名称 -->
        <el-form-item label="插件名称" :required="isEditing">
          <template v-if="isEditing">
            <el-input
              v-model="editForm.name"
              placeholder="请输入插件名称"
              maxlength="50"
              show-word-limit
            />
          </template>
          <template v-else>
            <span class="form-value">{{ plugin.name }}</span>
          </template>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述">
          <template v-if="isEditing">
            <el-input
              v-model="editForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入插件功能描述"
            />
          </template>
          <template v-else>
            <span class="form-value">{{ plugin.description }}</span>
          </template>
        </el-form-item>

        <!-- 分类 -->
        <el-form-item label="分类">
          <template v-if="isEditing">
            <el-radio-group v-model="editForm.category">
              <el-radio-button
                v-for="cat in categoryOptions"
                :key="cat.value"
                :value="cat.value"
              >
                {{ cat.label }}
              </el-radio-button>
            </el-radio-group>
          </template>
          <template v-else>
            <el-tag type="primary" size="small">{{ getCategoryText(plugin.category) }}</el-tag>
          </template>
        </el-form-item>

        <!-- 标签 -->
        <el-form-item label="标签">
          <template v-if="isEditing">
            <el-select
              v-model="editForm.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请选择或输入标签"
              style="width: 100%"
            >
              <el-option v-for="tag in presetTags" :key="tag" :label="tag" :value="tag" />
            </el-select>
          </template>
          <template v-else>
            <div class="tag-list">
              <el-tag v-for="tag in plugin.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态">
          <template v-if="isEditing">
            <el-radio-group v-model="editForm.status">
              <el-radio value="active">启用</el-radio>
              <el-radio value="inactive">禁用</el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-tag :type="plugin.status === 'active' ? 'success' : 'info'" size="small">
              {{ plugin.status === 'active' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-form-item>

        <!-- 插件来源（只读） -->
        <el-form-item label="插件来源">
          <el-tag :type="plugin.source === 'system' ? 'primary' : 'warning'" size="small" effect="plain">
            {{ plugin.source === 'system' ? '系统' : '自定义' }}
          </el-tag>
        </el-form-item>

        <!-- 数据字典 - 仅当分类为数据处理、测试执行、结果评估时显示 -->
        <el-form-item
          v-if="needsDictionary(isEditing ? editForm.category : plugin.category)"
          label="数据字典"
        >
          <template v-if="isEditing">
            <el-select
              v-model="editForm.dataDictionaryId"
              placeholder="请选择关联的数据字典"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="dict in dataDictionaries"
                :key="dict.id"
                :label="dict.name"
                :value="dict.id"
              >
                <div style="display: flex; flex-direction: column">
                  <span>{{ dict.name }}</span>
                  <span style="font-size: 12px; color: #909399">{{ dict.description }}</span>
                </div>
              </el-option>
            </el-select>
          </template>
          <template v-else>
            <div class="dictionary-display" v-if="plugin.dataDictionaryId">
              <div class="dictionary-link clickable" @click="goToDictionaryDetail(plugin.dataDictionaryId)">
                <el-icon><Collection /></el-icon>
                <span>{{ getDictionaryName(plugin.dataDictionaryId) }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ getDictionaryFieldCount(plugin.dataDictionaryId) }} 个字段
                </el-tag>
              </div>
            </div>
            <span v-else class="text-muted">未关联</span>
          </template>
        </el-form-item>

        <!-- 测试状态（只读） -->
        <el-form-item label="测试状态" v-if="!isEditing">
          <div class="test-status" :class="plugin.testResult">
            <span class="status-dot"></span>
            <span class="status-text">{{ getTestResultText(plugin.testResult) }}</span>
            <span class="test-time" v-if="plugin.lastTestTime">{{ plugin.lastTestTime }}</span>
          </div>
        </el-form-item>

        <!-- 更新时间（只读） -->
        <el-form-item label="更新时间" v-if="!isEditing">
          <span class="form-value">{{ plugin.updatedAt }}</span>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 代码区域 -->
    <el-card class="code-card" :class="{ 'is-fullscreen': isFullscreen && isEditing }">
      <template #header>
        <div class="card-header">
          <span>插件代码</span>
          <div class="code-actions">
            <el-button type="primary" link @click="handleCopyCode">
              <el-icon><CopyDocument /></el-icon>
              复制代码
            </el-button>
            <el-button v-if="isEditing" type="primary" link @click="isFullscreen = !isFullscreen">
              <el-icon><FullScreen /></el-icon>
              {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
            </el-button>
          </div>
        </div>
      </template>
      <!-- 编辑模式：代码编辑器 -->
      <template v-if="isEditing">
        <div class="code-editor-wrapper">
          <div class="editor-header">
            <span class="editor-title">
              <el-icon><Document /></el-icon>
              plugin.py
            </span>
            <div class="editor-actions">
              <span class="editor-tip">
                必须定义 <code>execute(input_data, config)</code> 函数作为入口
              </span>
            </div>
          </div>
          <div class="editor-container">
            <div class="line-numbers">
              <span v-for="line in codeLines" :key="line">{{ line }}</span>
            </div>
            <div class="code-area">
              <pre class="code-highlight"><code v-html="highlightedCode"></code></pre>
              <textarea
                ref="codeTextareaRef"
                v-model="editForm.code"
                class="code-input"
                placeholder="请输入 Python 代码"
                spellcheck="false"
                @keydown="handleCodeKeydown"
                @scroll="handleCodeScroll"
              ></textarea>
            </div>
          </div>
        </div>
      </template>
      <!-- 查看模式：代码展示 -->
      <template v-else>
        <pre class="code-content"><code>{{ plugin.code }}</code></pre>
      </template>
    </el-card>

    <!-- 参数配置 -->
    <el-card class="params-card">
      <template #header>
        <div class="card-header">
          <span>配置参数</span>
          <el-button v-if="isEditing" type="primary" link @click="addParam">
            <el-icon><Plus /></el-icon>
            添加参数
          </el-button>
        </div>
      </template>

      <!-- 编辑模式：可编辑参数表格 -->
      <template v-if="isEditing">
        <el-table :data="editForm.params" border v-if="editForm.params.length > 0">
          <el-table-column prop="name" label="参数名" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ paramTypes.find(t => t.value === row.type)?.label || row.type }}
            </template>
          </el-table-column>
          <el-table-column prop="default" label="默认值" width="150" />
          <el-table-column prop="description" label="说明" />
          <el-table-column label="操作" width="120">
            <template #default="{ $index }">
              <el-button size="small" link @click="editParam($index)">编辑</el-button>
              <el-button size="small" link type="danger" @click="removeParam($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无参数配置，点击上方按钮添加" :image-size="60" />
      </template>

      <!-- 查看模式：只读参数表格 -->
      <template v-else>
        <el-table :data="plugin.params" border v-if="plugin.params && plugin.params.length > 0">
          <el-table-column prop="name" label="参数名" width="150" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="default" label="默认值" width="150" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        <el-empty v-else description="暂无参数配置" :image-size="60" />
      </template>
    </el-card>

    <!-- 测试区域（仅查看模式显示） -->
    <el-card class="test-card" v-if="!isEditing">
      <template #header>
        <span>测试运行</span>
      </template>
      <div class="test-content">
        <div class="test-section">
          <div class="section-label">输入数据</div>
          <el-input
            v-model="testInput"
            type="textarea"
            :rows="4"
            placeholder="请输入测试数据"
          />
        </div>
        <div class="test-section">
          <div class="section-label">配置参数</div>
          <el-input
            v-model="testConfig"
            type="textarea"
            :rows="4"
            placeholder="请输入配置参数（JSON格式）"
          />
        </div>
        <div class="test-action">
          <el-button type="primary" @click="runTest" :loading="isTesting">
            <el-icon><VideoPlay /></el-icon>
            运行测试
          </el-button>
        </div>
        <div class="test-result" v-if="testResult">
          <div class="section-label">执行结果</div>
          <pre class="result-content">{{ testResult }}</pre>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 未找到插件 -->
  <div class="not-found" v-else>
    <el-empty description="插件不存在" />
    <el-button type="primary" @click="goBack">返回列表</el-button>
  </div>

  <!-- 参数配置对话框 -->
  <el-dialog
    v-model="paramDialogVisible"
    :title="isEditParamMode ? '编辑参数' : '添加参数'"
    width="450px"
    :close-on-click-modal="false"
  >
    <el-form :model="paramFormData" label-width="80px" label-position="left">
      <el-form-item label="参数名" required>
        <el-input v-model="paramFormData.name" placeholder="如：threshold" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="paramFormData.type" style="width: 100%">
          <el-option v-for="t in paramTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认值">
        <el-input v-model="paramFormData.default" placeholder="参数默认值" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="paramFormData.description" placeholder="参数用途说明" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="paramDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleParamSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.plugin-detail-page {
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

.info-card,
.code-card,
.params-card,
.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-value {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.test-status.success .status-dot {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
}

.test-status.failed .status-dot {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.5);
}

.test-status.pending .status-dot {
  background: #c0c4cc;
}

.test-status.success .status-text {
  color: #67c23a;
}

.test-status.failed .status-text {
  color: #f56c6c;
}

.test-status.pending .status-text {
  color: #909399;
}

.test-time {
  font-size: 12px;
  color: #a0a0a0;
}

.dictionary-display {
  display: flex;
  align-items: center;
  gap: 8px;
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

.text-muted {
  color: #c0c4cc;
  font-size: 14px;
}

.code-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.code-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #f5f7fa;
  border-radius: 8px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.test-action {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 24px;
}

/* 代码编辑器样式 */
.code-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
}

.code-card.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  margin: 0;
  border-radius: 0;
}

.code-card.is-fullscreen .code-editor-wrapper {
  height: calc(100vh - 120px);
  border-radius: 0;
  border: none;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #21252b;
  border-bottom: 1px solid #3d4148;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #abb2bf;
  font-size: 13px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.editor-tip {
  color: #5c6370;
  font-size: 12px;
}

.editor-tip code {
  background: #3d4148;
  padding: 2px 6px;
  border-radius: 4px;
  color: #98c379;
  font-family: 'Monaco', 'Menlo', monospace;
}

.editor-container {
  display: flex;
  height: 400px;
  overflow: hidden;
}

.code-card.is-fullscreen .editor-container {
  height: calc(100vh - 170px);
}

.line-numbers {
  padding: 16px 12px;
  background: #282c34;
  color: #5c6370;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  border-right: 1px solid #3d4148;
  min-width: 50px;
  overflow: hidden;
}

.line-numbers span {
  display: block;
}

.code-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #abb2bf;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  pointer-events: none;
}

.code-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: transparent;
  caret-color: #fff;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
}

.code-input::placeholder {
  color: #5c6370;
}

/* 全屏按钮样式 */
.fullscreen-btn {
  background: transparent;
  border: none;
  color: #5c6370;
}

.fullscreen-btn:hover {
  color: #abb2bf;
}

/* 删除按钮样式优化 */
.delete-btn {
  border-color: #dcdfe6;
  background: #fff;
  color: #606266;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: #f56c6c;
}

.delete-btn:hover .el-icon {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
</style>
