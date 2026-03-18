<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/atom-one-dark.css'

// 注册 Python 语法
try {
  hljs.registerLanguage('python', python)
} catch (e) {
  console.warn('Failed to register Python language:', e)
}

const router = useRouter()

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
  Collection,
  Lock,
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 分类筛选
const selectedCategory = ref('all')

// 插件来源筛选
const selectedSource = ref('all')

// 数据类型筛选
const selectedDataType = ref('all')

// 数据类型选项
const dataTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'audio', label: '音频' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]

// 插件列表
const plugins = ref([
  {
    id: 'plugin-001',
    name: '情感分析插件',
    description: '用于分析文本情感倾向，支持正面、负面、中性三种情感分类',
    category: 'analysis',
    source: 'local',
    status: 'active',
    version: '1.2.0',
    author: '测试团队',
    supportedDataTypes: ['text'],
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'plugin-002',
    name: '代码执行插件',
    description: '安全执行用户提交的代码片段，支持 Python、JavaScript 等语言',
    category: 'executor',
    source: 'official',
    status: 'active',
    version: '2.0.1',
    author: '官方',
    supportedDataTypes: ['text'],
    createdAt: '2024-01-10',
    updatedAt: '2024-02-25',
  },
  {
    id: 'plugin-003',
    name: '图像理解插件',
    description: '分析图像内容，提取关键信息，支持多种图像格式',
    category: 'analysis',
    source: 'community',
    status: 'active',
    version: '1.0.0',
    author: '社区贡献',
    supportedDataTypes: ['image'],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
  },
  {
    id: 'plugin-004',
    name: '语音识别插件',
    description: '将音频转换为文本，支持多种语言和方言',
    category: 'converter',
    source: 'official',
    status: 'inactive',
    version: '1.5.0',
    author: '官方',
    supportedDataTypes: ['audio'],
    createdAt: '2024-01-20',
    updatedAt: '2024-02-10',
  },
  {
    id: 'plugin-005',
    name: '视频分析插件',
    description: '分析视频内容，提取关键帧，生成视频摘要',
    category: 'analysis',
    source: 'community',
    status: 'active',
    version: '0.9.0',
    author: '社区贡献',
    supportedDataTypes: ['video'],
    createdAt: '2024-02-05',
    updatedAt: '2024-02-20',
  },
  {
    id: 'plugin-006',
    name: '文本摘要插件',
    description: '自动生成文本摘要，支持多种摘要策略',
    category: 'generator',
    source: 'local',
    status: 'active',
    version: '1.3.0',
    author: '测试团队',
    supportedDataTypes: ['text'],
    createdAt: '2024-01-25',
    updatedAt: '2024-02-18',
  },
])

// 分类选项
const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: 'analysis', label: '分析类' },
  { value: 'executor', label: '执行类' },
  { value: 'converter', label: '转换类' },
  { value: 'generator', label: '生成类' },
]

// 来源选项
const sourceOptions = [
  { value: 'all', label: '全部来源' },
  { value: 'official', label: '官方插件' },
  { value: 'community', label: '社区插件' },
  { value: 'local', label: '本地插件' },
]

// 筛选后的插件列表
const filteredPlugins = computed(() => {
  let result = plugins.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(keyword) ||
        plugin.description.toLowerCase().includes(keyword)
    )
  }

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter((plugin) => plugin.category === selectedCategory.value)
  }

  // 来源过滤
  if (selectedSource.value !== 'all') {
    result = result.filter((plugin) => plugin.source === selectedSource.value)
  }

  // 数据类型过滤
  if (selectedDataType.value !== 'all') {
    result = result.filter((plugin) =>
      plugin.supportedDataTypes.includes(selectedDataType.value)
    )
  }

  return result
})

// 获取分类标签
const getCategoryTag = (category) => {
  const tags = {
    analysis: { text: '分析类', type: 'success' },
    executor: { text: '执行类', type: 'warning' },
    converter: { text: '转换类', type: '' },
    generator: { text: '生成类', type: 'info' },
  }
  return tags[category] || { text: '未知', type: 'info' }
}

// 获取来源标签
const getSourceTag = (source) => {
  const tags = {
    official: { text: '官方', type: 'primary' },
    community: { text: '社区', type: 'success' },
    local: { text: '本地', type: 'warning' },
  }
  return tags[source] || { text: '未知', type: 'info' }
}

// 获取数据类型图标
const getDataTypeIcon = (type) => {
  const icons = {
    text: Document,
    audio: VideoPlay,
    image: Document,
    video: VideoPlay,
  }
  return icons[type] || Document
}

// 新建插件
const handleCreatePlugin = () => {
  ElMessage.info('新建插件功能开发中')
}

// 删除插件
const handleDeletePlugin = (row) => {
  ElMessageBox.confirm(`确定要删除插件"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = plugins.value.findIndex((p) => p.id === row.id)
    if (index > -1) {
      plugins.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 切换插件状态
const handleToggleStatus = (row) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`${row.name} 已${row.status === 'active' ? '启用' : '停用'}`)
}
</script>

<template>
  <div class="plugin-management">
    <!-- 头部 -->
    <div class="management-header">
      <div class="header-left">
        <h2 class="panel-title">插件管理</h2>
        <p class="panel-subtitle">管理测试插件和工具扩展</p>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索插件名称或描述..."
          :prefix-icon="Search"
          clearable
          style="width: 280px"
        />
        <el-select
          v-model="selectedCategory"
          placeholder="分类"
          style="width: 120px; margin-left: 12px"
        >
          <el-option
            v-for="option in categoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select
          v-model="selectedSource"
          placeholder="来源"
          style="width: 120px; margin-left: 8px"
        >
          <el-option
            v-for="option in sourceOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select
          v-model="selectedDataType"
          placeholder="数据类型"
          style="width: 120px; margin-left: 8px"
        >
          <el-option label="全部类型" value="all" />
          <el-option
            v-for="option in dataTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="handleCreatePlugin">
          新建插件
        </el-button>
      </div>
    </div>

    <!-- 插件列表 -->
    <div class="content-area">
      <el-table :data="filteredPlugins" style="width: 100%" stripe>
        <el-table-column label="插件名称" prop="name" min-width="180">
          <template #default="{ row }">
            <div class="plugin-name">
              <el-icon :size="18" class="plugin-icon"><Cpu /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="260" show-overflow-tooltip />
        <el-table-column label="分类" prop="category" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryTag(row.category).type" size="small">
              {{ getCategoryTag(row.category).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" prop="source" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getSourceTag(row.source).type" size="small">
              {{ getSourceTag(row.source).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支持数据类型" prop="supportedDataTypes" width="140" align="center">
          <template #default="{ row }">
            <div class="data-types">
              <el-tag
                v-for="type in row.supportedDataTypes"
                :key="type"
                size="small"
                type="info"
                class="type-tag"
              >
                {{ dataTypeOptions.find((o) => o.value === type)?.label || type }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="版本" prop="version" width="90" align="center">
          <template #default="{ row }">
            <span class="version-text">v{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'active'"
              @change="handleToggleStatus(row)"
              active-text="启用"
              inactive-text="停用"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link>配置</el-button>
            <el-button type="danger" link @click="handleDeletePlugin(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.plugin-management {
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

.content-area {
  flex: 1;
  padding: 20px 28px;
  overflow-y: auto;
}

.plugin-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-icon {
  color: #6366f1;
}

.data-types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.type-tag {
  font-size: 11px;
}

.version-text {
  font-family: monospace;
  color: #6b7280;
  font-size: 13px;
}
</style>
