<script setup>
import { ref, computed } from 'vue'
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

const router = useRouter()

// 当前标签页
const activeTab = ref('datasets')

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
      { key: 'category', label: '分类', type: 'enum' },
      { key: 'difficulty', label: '难度', type: 'enum' },
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: 'dict-2',
    name: '代码生成测试',
    description: '用于测试模型的代码生成能力，包含 Python、Java、SQL 等编程语言的代码生成测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
      { key: 'language', label: '编程语言', type: 'enum' },
      { key: 'complexity', label: '复杂度', type: 'enum' },
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25',
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
    createdAt: '2024-02-10',
    updatedAt: '2024-02-20',
  },
])

// 测评集列表
const datasets = ref([
  {
    id: 'ds-001',
    name: '对话能力测评集',
    description: '用于评估模型的多轮对话能力',
    type: 'chat',
    totalCount: 1500,
    createdAt: '2024-01-10',
    status: 'active',
  },
  {
    id: 'ds-002',
    name: '代码生成测评集',
    description: '用于评估模型的代码生成能力',
    type: 'code',
    totalCount: 800,
    createdAt: '2024-01-15',
    status: 'active',
  },
  {
    id: 'ds-003',
    name: '文本摘要测评集',
    description: '用于评估模型的文本摘要能力',
    type: 'text',
    totalCount: 600,
    createdAt: '2024-01-20',
    status: 'draft',
  },
  {
    id: 'ds-004',
    name: '多模态理解测评集',
    description: '用于评估模型的图像理解和音频理解能力',
    type: 'multimodal',
    totalCount: 450,
    createdAt: '2024-02-01',
    status: 'active',
  },
])

// 搜索关键词
const searchKeyword = ref('')

// 数据类型筛选
const selectedDataType = ref('all')

// 数据类型选项
const dataTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'chat', label: '对话' },
  { value: 'code', label: '代码' },
  { value: 'text', label: '文本' },
  { value: 'multimodal', label: '多模态' },
]

// 筛选后的测评集
const filteredDatasets = computed(() => {
  let result = datasets.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (ds) =>
        ds.name.toLowerCase().includes(keyword) ||
        ds.description.toLowerCase().includes(keyword)
    )
  }

  // 类型过滤
  if (selectedDataType.value !== 'all') {
    result = result.filter((ds) => ds.type === selectedDataType.value)
  }

  return result
})

// 筛选后的数据字典
const filteredDictionaries = computed(() => {
  if (!searchKeyword.value) return dataDictionaries.value

  const keyword = searchKeyword.value.toLowerCase()
  return dataDictionaries.value.filter(
    (dict) =>
      dict.name.toLowerCase().includes(keyword) ||
      dict.description.toLowerCase().includes(keyword)
  )
})

// 获取类型图标
const getTypeIcon = (type) => {
  const icons = {
    chat: ChatDotRound,
    code: Cpu,
    text: Document,
    multimodal: DataAnalysis,
  }
  return icons[type] || Document
}

// 获取类型标签颜色
const getTypeTag = (type) => {
  const tags = {
    chat: { text: '对话', type: 'success' },
    code: { text: '代码', type: 'warning' },
    text: { text: '文本', type: '' },
    multimodal: { text: '多模态', type: 'danger' },
  }
  return tags[type] || { text: '未知', type: 'info' }
}

// 创建测评集
const handleCreateDataset = () => {
  ElMessage.info('创建测评集功能开发中')
}

// 删除测评集
const handleDeleteDataset = (row) => {
  ElMessageBox.confirm(`确定要删除测评集"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = datasets.value.findIndex((ds) => ds.id === row.id)
    if (index > -1) {
      datasets.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 创建数据字典
const handleCreateDictionary = () => {
  ElMessage.info('创建数据字典功能开发中')
}

// 删除数据字典
const handleDeleteDictionary = (dict) => {
  ElMessageBox.confirm(`确定要删除数据字典"${dict.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = dataDictionaries.value.findIndex((d) => d.id === dict.id)
    if (index > -1) {
      dataDictionaries.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}
</script>

<template>
  <div class="dataset-management">
    <!-- 头部标签页 -->
    <div class="management-header">
      <div class="header-left">
        <h2 class="panel-title">测评集管理</h2>
        <p class="panel-subtitle">管理测试数据集和数据字典</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="activeTab" size="default">
          <el-radio-button value="datasets">测评集列表</el-radio-button>
          <el-radio-button value="dictionaries">数据字典</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称或描述..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
        />
        <el-select
          v-if="activeTab === 'datasets'"
          v-model="selectedDataType"
          placeholder="数据类型"
          style="width: 140px; margin-left: 12px"
        >
          <el-option
            v-for="option in dataTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button
          type="primary"
          :icon="Plus"
          @click="activeTab === 'datasets' ? handleCreateDataset() : handleCreateDictionary()"
        >
          {{ activeTab === 'datasets' ? '新建测评集' : '新建数据字典' }}
        </el-button>
      </div>
    </div>

    <!-- 测评集列表 -->
    <div v-if="activeTab === 'datasets'" class="content-area">
      <el-table :data="filteredDatasets" style="width: 100%" stripe>
        <el-table-column label="名称" prop="name" min-width="200">
          <template #default="{ row }">
            <div class="dataset-name">
              <el-icon :size="18" class="type-icon">
                <component :is="getTypeIcon(row.type)" />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="280" show-overflow-tooltip />
        <el-table-column label="类型" prop="type" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type).type" size="small">
              {{ getTypeTag(row.type).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据量" prop="totalCount" width="100" align="center">
          <template #default="{ row }">
            <span class="count-text">{{ row.totalCount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="120" align="center" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link :icon="Delete" @click="handleDeleteDataset(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 数据字典列表 -->
    <div v-if="activeTab === 'dictionaries'" class="content-area">
      <div class="dictionary-grid">
        <div
          v-for="dict in filteredDictionaries"
          :key="dict.id"
          class="dictionary-card"
        >
          <div class="card-header">
            <div class="card-icon">
              <el-icon :size="24"><Collection /></el-icon>
            </div>
            <div class="card-title">{{ dict.name }}</div>
            <el-dropdown trigger="click">
              <el-button link :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>查看详情</el-dropdown-item>
                  <el-dropdown-item>编辑</el-dropdown-item>
                  <el-dropdown-item divided @click="handleDeleteDictionary(dict)">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="card-body">
            <p class="card-desc">{{ dict.description }}</p>
            <div class="card-meta">
              <span class="meta-item">
                <el-icon><DataLine /></el-icon>
                {{ dict.columns.length }} 个字段
              </span>
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ dict.createdAt }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dataset-management {
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

.dataset-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  color: #6366f1;
}

.count-text {
  font-weight: 500;
  color: #374151;
}

/* 数据字典卡片网格 */
.dictionary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.dictionary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.dictionary-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.card-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  padding: 16px 20px;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.card-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.meta-item .el-icon {
  font-size: 14px;
}
</style>
