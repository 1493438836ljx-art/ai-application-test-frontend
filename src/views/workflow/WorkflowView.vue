<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
import {
  getWorkflowList,
  createWorkflow,
  deleteWorkflow as deleteWorkflowApi,
  copyWorkflow as copyWorkflowApi,
  publishWorkflow,
  getDefaultWorkflow,
  getWorkflowDetail,
} from '@/api/workflow'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// 工作流列表数据
const workflowList = ref([])

// 总数
const total = ref(0)

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const statusFilter = ref('')

// 获取工作流列表
const fetchWorkflowList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value,
    }
    const response = await getWorkflowList(params)
    // 后端返回的是 Spring Data Page 对象: { content: [], totalElements: 0 }
    if (response) {
      workflowList.value = response.content || []
      total.value = response.totalElements || 0
    }
  } catch (error) {
    // 错误已在 request.js 中统一处理
    workflowList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听搜索和筛选条件变化，重置页码并重新获取数据
watch([searchKeyword, statusFilter], () => {
  currentPage.value = 1
  fetchWorkflowList()
})

// 分页大小变化处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchWorkflowList()
}

// 页码变化处理
const handlePageChange = (val) => {
  currentPage.value = val
  fetchWorkflowList()
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
const handleCreateWorkflow = async () => {
  try {
    const { value: name } = await ElMessageBox.prompt('请输入工作流名称', '新建工作流', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,50}$/,
      inputErrorMessage: '名称长度为1-50个字符',
    })

    loading.value = true

    // 先获取默认工作流数据
    let defaultData = {
      nodes: [],
      connections: [],
      associations: []
    }

    try {
      const defaultWorkflow = await getDefaultWorkflow()
      if (defaultWorkflow) {
        // 映射默认工作流的节点数据
        defaultData.nodes = (defaultWorkflow.nodes || []).map(node => ({
          nodeUuid: node.nodeUuid,
          type: node.type,
          name: node.name,
          positionX: node.positionX,
          positionY: node.positionY,
          inputPorts: node.inputPorts,
          outputPorts: node.outputPorts,
          inputParams: node.inputParams,
          outputParams: node.outputParams,
          config: node.config
        }))

        // 映射连接数据 - 使用后端期望的字段名
        defaultData.connections = (defaultWorkflow.connections || []).map(conn => ({
          sourceNodeUuid: conn.sourceNodeUuid || conn.sourceNodeId,
          sourcePortId: conn.sourcePortId,
          targetNodeUuid: conn.targetNodeUuid || conn.targetNodeId,
          targetPortId: conn.targetPortId,
          sourceParamIndex: conn.sourceParamIndex,
          targetParamIndex: conn.targetParamIndex
        }))

        // 映射关联数据 - 使用后端期望的字段名
        defaultData.associations = (defaultWorkflow.associations || []).map(assoc => ({
          loopNodeUuid: assoc.loopNodeUuid || assoc.loopNodeId,
          bodyNodeUuid: assoc.bodyNodeUuid || assoc.bodyNodeId,
          associationType: assoc.associationType
        }))
      }
    } catch (error) {
      console.warn('获取默认工作流失败，将创建空工作流:', error)
    }

    // 创建工作流，包含默认数据
    const response = await createWorkflow({
      name,
      description: '',
      nodes: defaultData.nodes,
      connections: defaultData.connections,
      associations: defaultData.associations
    })

    if (response && response.data) {
      ElMessage.success('创建成功')
      // 跳转到编辑页面
      router.push(`/workflow/${response.data.id}`)
    }
  } catch (error) {
    // 用户取消或请求失败
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
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

    loading.value = true
    const response = await copyWorkflowApi(item.id)
    if (response) {
      ElMessage.success('复制成功')
      // 重新获取列表
      fetchWorkflowList()
    }
  } catch (error) {
    // 用户取消或请求失败
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
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

    loading.value = true
    const response = await deleteWorkflowApi(item.id)
    if (response) {
      ElMessage.success('删除成功')
      // 重新获取列表
      fetchWorkflowList()
    }
  } catch (error) {
    // 用户取消或请求失败
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 发布工作流
const handlePublishWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要发布工作流"${item.name}"吗？`, '确认发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    loading.value = true
    const response = await publishWorkflow(item.id)
    if (response) {
      ElMessage.success('发布成功')
      // 重新获取列表
      fetchWorkflowList()
    }
  } catch (error) {
    // 用户取消或请求失败
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 运行工作流
const runWorkflow = (item) => {
  ElMessage.info(`正在运行工作流: ${item.name}`)
  // TODO: 跳转到运行页面或打开运行对话框
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
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
    case 'publish':
      handlePublishWorkflow(item)
      break
  }
}

onMounted(() => {
  // 加载工作流列表数据
  fetchWorkflowList()
})
</script>

<template>
  <div class="workflow-view" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">工作流管理</h1>
        <p class="page-desc">可视化编排 AI 工作流程，实现复杂业务逻辑</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreateWorkflow">
          新建工作流
        </el-button>
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
      <div v-if="workflowList.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无工作流数据">
          <el-button type="primary" :icon="Plus" @click="handleCreateWorkflow">
            创建第一个工作流
          </el-button>
        </el-empty>
      </div>

      <div v-else class="workflow-grid">
        <div
          v-for="item in workflowList"
          :key="item.id"
          class="workflow-card"
          @click="editWorkflow(item.id)"
        >
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

          <p class="card-description">{{ item.description || '暂无描述' }}</p>

          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">节点数量</span>
              <span class="stat-value">{{ item.nodeCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">版本</span>
              <span class="stat-value">{{ item.version || '-' }}</span>
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
