<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/atom-one-dark.css'

// 注册 Python 语法
hljs.registerLanguage('python', python)

import {
  Plus,
  Edit,
  Delete,
  VideoPlay,
  Document,
  Search,
  Setting,
  CopyDocument,
  More,
  CircleCheck,
  CircleClose,
  Cpu,
  FullScreen,
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 分类筛选
const selectedCategory = ref('all')

// 插件列表
const plugins = ref([
  {
    id: 'plugin-1',
    name: '数据预处理脚本',
    description: '对输入数据进行清洗和标准化处理，去除多余空白、统一换行符、移除HTML标签',
    category: 'data',
    tags: ['数据处理', '文本清洗'],
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
    createdAt: '2024-02-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'plugin-2',
    name: 'JSON 数据提取',
    description: '从嵌套 JSON 中提取指定路径的数据，支持多级路径访问',
    category: 'data',
    tags: ['数据处理', 'JSON'],
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
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
  },
  {
    id: 'plugin-3',
    name: '敏感词过滤',
    description: '检测并过滤文本中的敏感词汇，返回过滤后的文本和发现的敏感词列表',
    category: 'data',
    tags: ['数据处理', '安全'],
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
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  {
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
        return json.loads(response.read().decode())`,
    params: [
      { name: 'url', type: 'string', default: '', description: '请求 URL' },
      { name: 'method', type: 'string', default: 'GET', description: '请求方法' },
    ],
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-18',
  },
  {
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

    # 模拟执行查询
    result = {
        'query': query,
        'params': params,
        'rows_affected': 0,
        'data': []
    }
    return result`,
    params: [
      { name: 'query', type: 'string', default: '', description: 'SQL 查询语句' },
    ],
    status: 'inactive',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-10',
  },
  {
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
    return round(similarity, 4)`,
    params: [],
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-18',
  },
  {
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
        'min': min(sorted_times),
        'max': max(sorted_times),
        'avg': round(sum(sorted_times) / n, 2),
        'median': sorted_times[n // 2] if n % 2 else (sorted_times[n//2-1] + sorted_times[n//2]) / 2,
        'p95': sorted_times[int(n * 0.95)] if n > 20 else sorted_times[-1],
    }
    return result`,
    params: [],
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-10',
  },
  {
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

    matches = []
    for keyword in keywords:
        keyword = keyword.strip()
        if keyword and keyword.lower() in text.lower():
            matches.append(keyword)

    if mode == 'any':
        passed = len(matches) > 0
    elif mode == 'all':
        passed = len(matches) == len([k for k in keywords if k.strip()])
    else:  # none
        passed = len(matches) == 0

    return {
        'passed': passed,
        'matches': matches,
        'total_keywords': len([k for k in keywords if k.strip()])
    }`,
    params: [
      { name: 'keywords', type: 'string', default: '', description: '关键词列表，逗号分隔' },
      { name: 'mode', type: 'string', default: 'any', description: '匹配模式：any/all/none' },
    ],
    status: 'active',
    createdAt: '2024-02-28',
    updatedAt: '2024-02-28',
  },
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const editingId = ref('')

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  category: 'data',
  tags: [],
  code: `import argparse
import json


def execute(input_data, config):
    """
    插件描述
    :param input_data: 输入测评集
    :param config: 配置参数
    :return: 处理结果
    """
    result = input_data
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='插件执行脚本')
    parser.add_argument('-i', '--input', type=str, default='', help='输入数据')
    parser.add_argument('-c', '--config', type=str, default='{}', help='配置参数(JSON格式)')
    args = parser.parse_args()

    input_data = args.input
    config = json.loads(args.config)
    result = execute(input_data, config)
    print(f"执行结果: {result}")`,
  params: [],
  status: 'active',
})

// 参数表单
const paramFormData = reactive({
  name: '',
  type: 'string',
  default: '',
  description: '',
})

// 参数对话框
const paramDialogVisible = ref(false)
const isEditParamMode = ref(false)
const editingParamIndex = ref(-1)

// 测试对话框
const testDialogVisible = ref(false)
const testInput = ref('')
const testConfig = ref('{}')
const testResult = ref('')
const testLoading = ref(false)

// 查看代码对话框
const codeDialogVisible = ref(false)
const viewCodePlugin = ref(null)

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入插件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入插件代码', trigger: 'blur' },
  ],
}

// 参数类型选项
const paramTypes = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'json', label: 'JSON' },
]

// 插件分类
const pluginCategories = [
  { value: 'data', label: '数据处理', color: 'primary' },
  { value: 'execution', label: '测试执行', color: 'success' },
  { value: 'evaluation', label: '结果评估', color: 'warning' },
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

// 获取分类标签
const getCategoryLabel = (category) => {
  const found = pluginCategories.find(c => c.value === category)
  return found ? found.label : '未分类'
}

// 获取分类颜色
const getCategoryColor = (category) => {
  const found = pluginCategories.find(c => c.value === category)
  return found ? found.color : ''
}

// 过滤后的插件列表
const filteredPlugins = computed(() => {
  let result = plugins.value

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword) ||
      (p.tags && p.tags.some(tag => tag.toLowerCase().includes(keyword)))
    )
  }

  return result
})

// 分页后的插件列表
const paginatedPlugins = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPlugins.value.slice(start, start + pageSize.value)
})

// 插件总数
const total = computed(() => filteredPlugins.value.length)

// 代码行数（用于编辑器行号）
const codeLines = computed(() => {
  const lines = formData.code.split('\n').length
  return Math.max(lines, 20) // 至少显示20行
})

// 高亮后的代码
const highlightedCode = computed(() => {
  try {
    return hljs.highlight(formData.code, { language: 'python' }).value
  } catch {
    return formData.code
  }
})

// 获取状态类型
const getStatusType = (status) => {
  return status === 'active' ? 'success' : 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  return status === 'active' ? '已启用' : '已禁用'
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.category = 'data'
  formData.tags = []
  formData.code = `import argparse
import json


def execute(input_data, config):
    """
    插件描述
    :param input_data: 输入测评集
    :param config: 配置参数
    :return: 处理结果
    """
    result = input_data
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='插件执行脚本')
    parser.add_argument('-i', '--input', type=str, default='', help='输入数据')
    parser.add_argument('-c', '--config', type=str, default='{}', help='配置参数(JSON格式)')
    args = parser.parse_args()

    input_data = args.input
    config = json.loads(args.config)
    result = execute(input_data, config)
    print(f"执行结果: {result}")`
  formData.params = []
  formData.status = 'active'
  formRef.value?.resetFields()
}

// 打开新建对话框
const openCreateDialog = () => {
  isEditMode.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (plugin) => {
  isEditMode.value = true
  editingId.value = plugin.id
  formData.name = plugin.name
  formData.description = plugin.description
  formData.category = plugin.category || 'data'
  formData.tags = plugin.tags ? [...plugin.tags] : []
  formData.code = plugin.code
  formData.params = plugin.params ? plugin.params.map(p => ({ ...p })) : []
  formData.status = plugin.status
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEditMode.value) {
        const index = plugins.value.findIndex(p => p.id === editingId.value)
        if (index !== -1) {
          plugins.value[index] = {
            ...plugins.value[index],
            name: formData.name,
            description: formData.description,
            category: formData.category,
            tags: [...formData.tags],
            code: formData.code,
            params: [...formData.params],
            status: formData.status,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
          ElMessage.success('插件更新成功')
        }
      } else {
        const newPlugin = {
          id: `plugin-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: [...formData.tags],
          code: formData.code,
          params: [...formData.params],
          status: formData.status,
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        plugins.value.unshift(newPlugin)
        ElMessage.success('插件创建成功')
      }
      dialogVisible.value = false
    }
  })
}

// 切换状态
const toggleStatus = (plugin) => {
  plugin.status = plugin.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${plugin.status === 'active' ? '启用' : '禁用'}插件「${plugin.name}」`)
}

// 删除插件
const handleDelete = (plugin) => {
  ElMessageBox.confirm(`确定要删除插件「${plugin.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = plugins.value.findIndex(p => p.id === plugin.id)
    if (index !== -1) {
      plugins.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 复制插件
const handleCopy = (plugin) => {
  const newPlugin = {
    ...plugin,
    id: `plugin-${Date.now()}`,
    name: `${plugin.name} (副本)`,
    tags: plugin.tags ? [...plugin.tags] : [],
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  plugins.value.unshift(newPlugin)
  ElMessage.success('插件已复制')
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
  const param = formData.params[index]
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
    formData.params[editingParamIndex.value] = param
  } else {
    formData.params.push(param)
  }
  paramDialogVisible.value = false
}

// 删除参数
const removeParam = (index) => {
  formData.params.splice(index, 1)
}

// 打开测试对话框
const openTestDialog = (plugin) => {
  testInput.value = ''
  testConfig.value = plugin.params && plugin.params.length > 0
    ? JSON.stringify(plugin.params.reduce((acc, p) => {
        acc[p.name] = p.default
        return acc
      }, {}), null, 2)
    : '{}'
  testResult.value = ''
  testDialogVisible.value = true
}

// 运行测试
const runTest = () => {
  testLoading.value = true
  testResult.value = ''

  setTimeout(() => {
    try {
      const input = testInput.value
      const config = JSON.parse(testConfig.value || '{}')

      testResult.value = JSON.stringify({
        status: 'success',
        input: input,
        config: config,
        output: '模拟执行结果：处理完成',
        execution_time: '0.023s',
      }, null, 2)

      ElMessage.success('执行成功')
    } catch (e) {
      testResult.value = `执行错误: ${e.message}`
      ElMessage.error('执行失败')
    }
    testLoading.value = false
  }, 500)
}

// 查看代码
const openCodeDialog = (plugin) => {
  viewCodePlugin.value = plugin
  codeDialogVisible.value = true
}

// 复制代码
const handleCopyCode = (plugin) => {
  navigator.clipboard.writeText(plugin.code).then(() => {
    ElMessage.success('代码已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 处理代码编辑器 Tab 键缩进
const handleCodeKeydown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = formData.code

    // 插入 4 个空格作为缩进
    const indent = '    '
    formData.code = value.substring(0, start) + indent + value.substring(end)

    // 恢复光标位置
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + indent.length
    })
  }
}

// 编辑器全屏状态
const isFullscreen = ref(false)

// ESC 键退出全屏处理
const handleEscKey = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    e.preventDefault()
    e.stopPropagation()
    isFullscreen.value = false
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 监听全屏状态变化
watch(isFullscreen, (val) => {
  if (val) {
    // 使用捕获阶段，优先于对话框处理
    document.addEventListener('keydown', handleEscKey, true)
  } else {
    document.removeEventListener('keydown', handleEscKey, true)
  }
})

// 监听对话框关闭，重置全屏状态
watch(dialogVisible, (val) => {
  if (!val && isFullscreen.value) {
    isFullscreen.value = false
  }
})

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
</script>

<template>
  <div class="plugin-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>插件管理</h2>
        <span class="plugin-count">共 {{ plugins.length }} 个插件脚本</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建插件</el-button>
    </div>

    <!-- 提示信息 -->
    <el-alert
      title="插件说明"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        插件是可执行的 Python 脚本，可在测试流程中被调用。每个插件必须包含 <code>execute(input_data, config)</code> 函数作为入口。
      </template>
    </el-alert>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索插件名称或描述"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
        @input="handleSearch"
      />
      <el-select v-model="selectedCategory" placeholder="分类筛选" style="width: 150px; margin-left: 12px" @change="handleSearch">
        <el-option label="全部分类" value="all" />
        <el-option
          v-for="cat in pluginCategories"
          :key="cat.value"
          :label="cat.label"
          :value="cat.value"
        />
      </el-select>
    </div>

    <!-- 插件卡片网格 -->
    <div class="plugin-grid" v-if="total > 0">
      <el-card v-for="plugin in paginatedPlugins" :key="plugin.id" class="plugin-card" shadow="hover">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="plugin-icon">
            <el-icon :size="24"><Cpu /></el-icon>
          </div>
          <div class="title-area">
            <div class="title-row">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <el-tag :type="getCategoryColor(plugin.category)" size="small">
                {{ getCategoryLabel(plugin.category) }}
              </el-tag>
              <el-tag :type="getStatusType(plugin.status)" size="small">
                {{ getStatusText(plugin.status) }}
              </el-tag>
            </div>
            <div class="plugin-meta">
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ plugin.code.split('\n').length }} 行代码
              </span>
              <span class="meta-item">
                <el-icon><Setting /></el-icon>
                {{ plugin.params?.length || 0 }} 个参数
              </span>
            </div>
          </div>
          <el-dropdown trigger="click" class="card-dropdown" @click.stop>
            <el-button class="more-btn" :icon="More" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openTestDialog(plugin)">
                  <el-icon><VideoPlay /></el-icon>
                  测试运行
                </el-dropdown-item>
                <el-dropdown-item @click="openCodeDialog(plugin)">
                  <el-icon><Document /></el-icon>
                  查看代码
                </el-dropdown-item>
                <el-dropdown-item @click="handleCopy(plugin)">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-dropdown-item>
                <el-dropdown-item @click="toggleStatus(plugin)">
                  <el-icon>
                    <CircleCheck v-if="plugin.status !== 'active'" />
                    <CircleClose v-else />
                  </el-icon>
                  {{ plugin.status === 'active' ? '禁用' : '启用' }}
                </el-dropdown-item>
                <el-dropdown-item @click="openEditDialog(plugin)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete(plugin)">
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
          <!-- 标签显示 -->
          <div class="plugin-tags" v-if="plugin.tags && plugin.tags.length > 0">
            <el-tag v-for="tag in plugin.tags" :key="tag" size="small" type="info" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
          <p class="plugin-description">{{ plugin.description }}</p>

          <!-- 参数预览 -->
          <div class="params-preview" v-if="plugin.params && plugin.params.length > 0">
            <div class="preview-title">配置参数</div>
            <div class="params-tags">
              <el-tag v-for="param in plugin.params" :key="param.name" size="small" type="info">
                {{ param.name }}
              </el-tag>
            </div>
          </div>

          <!-- 代码预览 -->
          <div class="code-preview">
            <div class="preview-title">
              <span>代码预览</span>
              <el-button size="small" link type="primary" @click="handleCopyCode(plugin)">
                <el-icon><CopyDocument /></el-icon>
                复制代码
              </el-button>
            </div>
            <pre class="code-snippet"><code>{{ plugin.code.split('\n').slice(0, 5).join('\n') }}...</code></pre>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="time-info">
            <span>创建于 {{ plugin.createdAt }}</span>
            <span class="time-divider">|</span>
            <span>更新于 {{ plugin.updatedAt }}</span>
          </div>
          <div class="card-actions">
            <el-button size="small" :icon="VideoPlay" @click="openTestDialog(plugin)">测试</el-button>
            <el-button type="primary" size="small" @click="openEditDialog(plugin)">编辑</el-button>
          </div>
        </div>
      </el-card>
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
    <el-empty v-if="total === 0" description="暂无插件，点击上方按钮创建" />

    <!-- 新建/编辑插件对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑插件' : '新建插件'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="插件名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入插件名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入插件功能描述" />
        </el-form-item>

        <el-form-item label="分类">
          <el-radio-group v-model="formData.category">
            <el-radio-button v-for="cat in pluginCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入标签"
            style="width: 100%"
          >
            <el-option v-for="tag in presetTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">配置参数</el-divider>

        <el-form-item label="">
          <div class="params-config">
            <el-table :data="formData.params" size="small" v-if="formData.params.length > 0">
              <el-table-column prop="name" label="参数名" width="120" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  {{ paramTypes.find(t => t.value === row.type)?.label || row.type }}
                </template>
              </el-table-column>
              <el-table-column prop="default" label="默认值" width="120" />
              <el-table-column prop="description" label="说明" />
              <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                  <el-button size="small" link @click="editParam($index)">编辑</el-button>
                  <el-button size="small" link type="danger" @click="removeParam($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link @click="addParam" style="margin-top: 8px">
              <el-icon><Plus /></el-icon>
              添加参数
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">Python 代码</el-divider>

        <el-form-item label="" prop="code">
          <div class="code-editor-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
            <div class="editor-header">
              <span class="editor-title">
                <el-icon><Document /></el-icon>
                plugin.py
              </span>
              <div class="editor-actions">
                <span class="editor-tip">
                  必须定义 <code>execute(input_data, config)</code> 函数作为入口
                </span>
                <el-button
                  class="fullscreen-btn"
                  :icon="FullScreen"
                  circle
                  size="small"
                  @click="toggleFullscreen"
                />
              </div>
            </div>
            <div class="editor-container">
              <div class="line-numbers">
                <span v-for="line in codeLines" :key="line">{{ line }}</span>
              </div>
              <div class="code-area">
                <pre class="code-highlight"><code v-html="highlightedCode"></code></pre>
                <textarea
                  v-model="formData.code"
                  class="code-input"
                  placeholder="请输入 Python 代码"
                  spellcheck="false"
                  @keydown="handleCodeKeydown"
                ></textarea>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

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

    <!-- 测试对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="测试插件"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px" label-position="left">
        <el-form-item label="输入数据">
          <el-input
            v-model="testInput"
            type="textarea"
            :rows="4"
            placeholder="输入测试数据，可以是字符串或 JSON 格式"
          />
        </el-form-item>
        <el-form-item label="配置参数">
          <el-input
            v-model="testConfig"
            type="textarea"
            :rows="4"
            placeholder="JSON 格式的配置参数"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="VideoPlay" :loading="testLoading" @click="runTest">
            执行测试
          </el-button>
        </el-form-item>
        <el-form-item label="执行结果" v-if="testResult">
          <pre class="test-result"><code>{{ testResult }}</code></pre>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 查看代码对话框 -->
    <el-dialog
      v-model="codeDialogVisible"
      title="查看代码"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="view-code-header" v-if="viewCodePlugin">
        <h3>{{ viewCodePlugin.name }}</h3>
        <p>{{ viewCodePlugin.description }}</p>
      </div>
      <pre class="view-code-content" v-if="viewCodePlugin"><code>{{ viewCodePlugin.code }}</code></pre>

      <template #footer>
        <el-button @click="codeDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openEditDialog(viewCodePlugin); codeDialogVisible = false">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.plugin-page {
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

.plugin-count {
  font-size: 14px;
  color: #909399;
}

.search-bar {
  margin-bottom: 20px;
}

/* 卡片网格布局 */
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
  align-items: stretch;
}

.plugin-card {
  border-radius: 8px;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
}

.plugin-card:hover {
  transform: translateY(-2px);
}

.plugin-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
  position: relative;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.plugin-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plugin-meta {
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

.plugin-card:hover .card-dropdown {
  opacity: 1;
}

.more-btn {
  border: none;
  background: transparent;
}

/* 卡片内容 */
.card-content {
  margin-bottom: 16px;
  flex: 1;
}

.plugin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.plugin-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.params-preview {
  margin-bottom: 12px;
}

.preview-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.params-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.code-preview {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.code-snippet {
  margin: 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.time-info {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-divider {
  color: #dcdfe6;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* 代码编辑器 */
.code-editor-wrapper {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.code-editor-wrapper.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
  border: none;
}

.code-editor-wrapper.is-fullscreen .editor-container {
  height: calc(100vh - 52px);
  min-height: calc(100vh - 52px);
}

.code-editor-wrapper.is-fullscreen .code-area,
.code-editor-wrapper.is-fullscreen .code-highlight,
.code-editor-wrapper.is-fullscreen .code-input {
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #1e1e1e;
  border-bottom: 1px solid #3c3c3c;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #cccccc;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fullscreen-btn {
  background: transparent;
  border: 1px solid #3c3c3c;
  color: #cccccc;
}

.fullscreen-btn:hover {
  background: #3c3c3c;
  color: #fff;
}

.editor-tip {
  font-size: 12px;
  color: #909399;
}

.editor-tip code {
  background: #3c3c3c;
  padding: 2px 6px;
  border-radius: 3px;
  color: #4ec9b0;
}

.editor-container {
  display: flex;
  background: #1e1e1e;
  min-height: 360px;
}

.line-numbers {
  padding: 12px 0;
  background: #252526;
  color: #858585;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  min-width: 50px;
  border-right: 1px solid #3c3c3c;
}

.line-numbers span {
  display: block;
  padding: 0 12px;
}

.code-area {
  flex: 1;
  position: relative;
  min-height: 360px;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 12px 16px;
  background: transparent;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #fff;
}

.code-highlight code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
  color: #fff;
}

.code-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  background: transparent;
  color: transparent;
  caret-color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  tab-size: 4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-input::placeholder {
  color: #6a6a6a;
}

.params-config {
  width: 100%;
}

.test-result,
.view-code-content {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
}

.view-code-header {
  margin-bottom: 16px;
}

.view-code-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.view-code-header p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
