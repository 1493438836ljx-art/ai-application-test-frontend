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
  CircleCheck,
  CircleClose,
} from '@element-plus/icons-vue'
import {
  getWorkflowList,
  createWorkflow,
  deleteWorkflow as deleteWorkflowApi,
  copyWorkflow as copyWorkflowApi,
  publishWorkflow,
  unpublishWorkflow,
  getDefaultWorkflow,
} from '@/api/workflow.js'
import { createAssociationData, AssociationType } from '@/api/workflowAssociation.js'

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

// 状态筛选（使用后端定义的状态）
const statusFilter = ref('')

// 后端定义的工作流状态
const WorkflowStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
}

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

// 状态标签配置（与后端 WorkflowStatus 枚举对齐）
const statusConfig = {
  [WorkflowStatus.PUBLISHED]: { label: '已发布', type: 'success' },
  [WorkflowStatus.DRAFT]: { label: '草稿', type: 'warning' },
  [WorkflowStatus.ARCHIVED]: { label: '已归档', type: 'info' },
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
      associations: [],
    }

    try {
      const defaultWorkflow = await getDefaultWorkflow()
      if (defaultWorkflow) {
        // 映射默认工作流的节点数据
        defaultData.nodes = (defaultWorkflow.nodes || []).map((node) => ({
          nodeUuid: node.nodeUuid,
          type: node.type,
          name: node.name,
          positionX: node.positionX,
          positionY: node.positionY,
          inputPorts: node.inputPorts,
          outputPorts: node.outputPorts,
          inputParams: node.inputParams,
          outputParams: node.outputParams,
          config: node.config,
        }))

        // 映射连接数据 - 使用后端期望的字段名
        defaultData.connections = (defaultWorkflow.connections || []).map((conn) => ({
          sourceNodeUuid: conn.sourceNodeUuid || conn.sourceNodeId,
          sourcePortId: conn.sourcePortId || conn.sourcePort,
          targetNodeUuid: conn.targetNodeUuid || conn.targetNodeId,
          targetPortId: conn.targetPortId || conn.targetPort,
          sourceParamIndex: conn.sourceParamIndex,
          targetParamIndex: conn.targetParamIndex,
        }))

        // 映射关联数据 - 使用后端期望的字段名（containerNodeUuid 替代 loopNodeUuid）
        defaultData.associations = (defaultWorkflow.associations || []).map((assoc) => ({
          containerNodeUuid: assoc.containerNodeUuid || assoc.loopNodeUuid || assoc.loopNodeId,
          bodyNodeUuid: assoc.bodyNodeUuid || assoc.bodyNodeId,
          associationType: assoc.associationType || AssociationType.LOOP_BODY,
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
      associations: defaultData.associations,
    })

    if (response && response.id) {
      ElMessage.success('创建成功')
      // 跳转到编辑页面
      router.push(`/workflow/${response.id}`)
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
      fetchWorkflowList()
    }
  } catch (error) {
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
      fetchWorkflowList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 取消发布工作流
const handleUnpublishWorkflow = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要取消发布工作流"${item.name}"吗？`, '确认取消发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    const response = await unpublishWorkflow(item.id)
    if (response) {
      ElMessage.success('取消发布成功')
      fetchWorkflowList()
    }
  } catch (error) {
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
    await ElMessageBox.confirm(`确定要删除工作流"${item.name}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })

    loading.value = true
    await deleteWorkflowApi(item.id)
    ElMessage.success('删除成功')
    fetchWorkflowList()
  } catch (error) {
    if (error !== 'cancel') {
      // 请求失败已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化人员信息（姓名拼音 工号）
const formatPerson = (name, id) => {
  if (!name) return '-'
  return id ? `${name} ${id}` : name
}

// 初始化
onMounted(() => {
  fetchWorkflowList()
})
</script>

<template>
  <div class="workflow-view" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工作流管理</h2>
      <p class="subtitle">管理和配置测试工作流</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索工作流名称..."
          :prefix-icon="Search"
          clearable
          style="width: 240px"
        />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="全部" value="" />
          <el-option label="草稿" :value="WorkflowStatus.DRAFT" />
          <el-option label="已发布" :value="WorkflowStatus.PUBLISHED" />
          <el-option label="已归档" :value="WorkflowStatus.ARCHIVED" />
        </el-select>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" @click="handleCreateWorkflow">新建工作流</el-button>
      </div>
    </div>

    <!-- 工作流列表 -->
    <div class="workflow-list">
      <el-empty v-if="!loading && workflowList.length === 0" description="暂无工作流数据" />

      <div v-else class="workflow-cards">
        <div v-for="item in workflowList" :key="item.id" class="workflow-card">
          <div class="card-header">
            <div class="title-row">
              <h3 class="workflow-name">{{ item.name }}</h3>
              <el-tag :type="getStatusConfig(item.status).type" size="small">
                {{ getStatusConfig(item.status).label }}
              </el-tag>
            </div>
            <p class="workflow-desc">{{ item.description || '暂无描述' }}</p>
          </div>

          <div class="card-body">
            <div class="info-item">
              <span class="label">创建人：</span>
              <span class="value">{{ formatPerson(item.createdBy, item.createdById) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="info-item" v-if="item.published">
              <span class="label">发布人：</span>
              <span class="value">{{ formatPerson(item.publishedBy, item.publishedById) }}</span>
            </div>
            <div class="info-item" v-if="item.publishedAt">
              <span class="label">发布时间：</span>
              <span class="value">{{ formatTime(item.publishedAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">版本：</span>
              <span class="value">v{{ item.version || 1 }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-time">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(item.updatedAt || item.createdAt) }}</span>
            </div>
            <div class="footer-actions">
              <el-button text size="small" @click="editWorkflow(item.id)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                v-if="!item.published"
                text
                size="small"
                type="success"
                @click="handlePublishWorkflow(item)"
              >
                <el-icon><CircleCheck /></el-icon>
                发布
              </el-button>
              <el-button
                v-else
                text
                size="small"
                type="warning"
                @click="handleUnpublishWorkflow(item)"
              >
                <el-icon><CircleClose /></el-icon>
                取消发布
              </el-button>
              <el-button text size="small" @click="copyWorkflow(item)">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button text size="small" type="danger" @click="deleteWorkflow(item)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
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
  </div>
</template>

<style scoped>
.workflow-view {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar .left {
  display: flex;
  gap: 12px;
}

.workflow-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.workflow-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.workflow-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.workflow-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.card-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workflow-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.workflow-desc {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  font-size: 13px;
  margin-bottom: 6px;
}

.info-item .label {
  color: #9ca3af;
  width: 70px;
  flex-shrink: 0;
}

.info-item .value {
  color: #374151;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
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
  gap: 4px;
}

.footer-actions .el-button {
  color: #6366f1;
  padding: 4px 8px;
}

.footer-actions .el-button:hover {
  background: #eef2ff;
}

.footer-actions .el-button--danger {
  color: #ef4444;
}

.footer-actions .el-button--danger:hover {
  background: #fef2f2;
}

.footer-actions .el-button--success {
  color: #10b981;
}

.footer-actions .el-button--success:hover {
  background: #ecfdf5;
}

.footer-actions .el-button--warning {
  color: #f59e0b;
}

.footer-actions .el-button--warning:hover {
  background: #fffbeb;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
