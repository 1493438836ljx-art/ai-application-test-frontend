<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Clock,
  MoreFilled,
  Edit,
  Delete,
  CopyDocument,
  VideoPlay,
  Setting,
} from '@element-plus/icons-vue'

const router = useRouter()

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// 工作流列表数据
const workflowList = ref([
  {
    id: '1',
    name: '智能问答工作流',
    description: '基于用户输入进行智能问答处理的工作流程',
    status: 'active',
    nodeCount: 5,
    lastModified: '2024-01-15 14:30',
    version: 'v1.2',
  },
  {
    id: '2',
    name: '数据分析流水线',
    description: '数据采集、清洗、分析和可视化的完整流程',
    status: 'draft',
    nodeCount: 8,
    lastModified: '2024-01-14 09:15',
    version: 'v2.0',
  },
  {
    id: '3',
    name: '报告生成工作流',
    description: '自动生成测评报告的工作流程',
    status: 'active',
    nodeCount: 6,
    lastModified: '2024-01-13 16:45',
    version: 'v1.0',
  },
  {
    id: '4',
    name: '多模态处理流程',
    description: '支持文本、图像、音频多模态数据处理的流程',
    status: 'inactive',
    nodeCount: 12,
    lastModified: '2024-01-10 11:20',
    version: 'v1.5',
  },
])

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const statusFilter = ref('')

// 筛选后的完整列表
const allFilteredList = computed(() => {
  let result = workflowList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value)
  }

  return result
})

// 总数
const filteredTotal = computed(() => allFilteredList.value.length)

// 分页后的列表
const filteredList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allFilteredList.value.slice(start, end)
})

// 分页大小变化处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 切换每页条数时重置到第一页
}

// 页码变化处理
const handlePageChange = (val) => {
  currentPage.value = val
}

// 状态标签配置
const statusConfig = {
  active: { label: '已发布', type: 'success' },
  draft: { label: '草稿', type: 'warning' },
  inactive: { label: '已停用', type: 'info' },
}

// 获取状态配置
const getStatusConfig = (status) => statusConfig[status] || { label: status, type: 'info' }

// 新建工作流
const createWorkflow = () => {
  router.push('/workflow/new')
}

// 编辑工作流
const editWorkflow = (id) => {
  router.push(`/workflow/${id}`)
}

// 复制工作流
const copyWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要复制工作流"${item.name}"吗？`, '确认复制', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const newWorkflow = {
      ...item,
      id: Date.now().toString(),
      name: `${item.name} (副本)`,
      status: 'draft',
      lastModified: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    workflowList.value.unshift(newWorkflow)
    ElMessage.success('复制成功')
  } catch {
    // 用户取消
  }
}

// 删除工作流
const deleteWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除工作流"${item.name}"吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const index = workflowList.value.findIndex((w) => w.id === item.id)
    if (index > -1) {
      workflowList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 运行工作流
const runWorkflow = (item) => {
  ElMessage.info(`正在运行工作流: ${item.name}`)
}

// 格式化时间
const formatTime = (time) => {
  return time
}

// 下拉菜单命令
const handleCommand = (command, item) => {
  switch (command) {
    case 'edit':
      editWorkflow(item.id)
      break
    case 'copy':
      copyWorkflow(item)
      break
    case 'delete':
      deleteWorkflow(item)
      break
    case 'run':
      runWorkflow(item)
      break
  }
}

onMounted(() => {
  // 加载工作流列表数据
})
</script>

<template>
  <div class="workflow-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">工作流管理</h1>
        <p class="page-desc">可视化编排 AI 工作流程，实现复杂业务逻辑</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="createWorkflow"> 新建工作流 </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索工作流名称或描述"
          :prefix-icon="Search"
          clearable
          style="width: 320px"
        />
      </div>
      <div class="filter-options">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="已发布" value="active" />
          <el-option label="草稿" value="draft" />
          <el-option label="已停用" value="inactive" />
        </el-select>
      </div>
    </div>

    <!-- 工作流列表 -->
    <div class="workflow-list">
      <div v-if="filteredList.length === 0" class="empty-state">
        <el-empty description="暂无工作流数据">
          <el-button type="primary" :icon="Plus" @click="createWorkflow"> 创建第一个工作流 </el-button>
        </el-empty>
      </div>

      <div v-else class="workflow-grid">
        <div v-for="item in filteredList" :key="item.id" class="workflow-card" @click="editWorkflow(item.id)">
          <div class="card-header">
            <div class="card-title-row">
              <h3 class="card-title">{{ item.name }}</h3>
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item)" @click.stop>
                <el-button text :icon="MoreFilled" class="more-btn" @click.stop />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Edit" command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item :icon="VideoPlay" command="run">运行</el-dropdown-item>
                    <el-dropdown-item :icon="CopyDocument" command="copy">复制</el-dropdown-item>
                    <el-dropdown-item :icon="Delete" command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <el-tag :type="getStatusConfig(item.status).type" size="small">
              {{ getStatusConfig(item.status).label }}
            </el-tag>
          </div>

          <p class="card-description">{{ item.description }}</p>

          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">节点数量</span>
              <span class="stat-value">{{ item.nodeCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">版本</span>
              <span class="stat-value">{{ item.version }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-time">
              <el-icon :size="14"><Clock /></el-icon>
              <span>{{ formatTime(item.lastModified) }}</span>
            </div>
            <div class="footer-actions">
              <el-button size="small" text :icon="VideoPlay" @click.stop="runWorkflow(item)">
                运行
              </el-button>
              <el-button size="small" text :icon="Setting" @click.stop="editWorkflow(item.id)">
                配置
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-wrapper" v-if="filteredTotal > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredTotal"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.workflow-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
}

.filter-options {
  display: flex;
  gap: 12px;
}

.workflow-list {
  min-height: 400px;
}

.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.workflow-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #6366f1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  padding: 4px;
  color: #9ca3af;
}

.more-btn:hover {
  color: #6366f1;
  background: #f3f4f6;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.card-stats {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.footer-actions .el-button {
  color: #6366f1;
}

.footer-actions .el-button:hover {
  background: #eef2ff;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
