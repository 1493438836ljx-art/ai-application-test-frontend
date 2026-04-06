<template>
  <div class="run-panel-container">
    <!-- 运行日志面板 -->
    <div v-if="visible" class="debug-panel run-panel" @wheel.stop>
      <div class="debug-header">
        <div class="debug-title">
          <el-icon :size="16" color="#10b981"><VideoPlay /></el-icon>
          <span>执行日志</span>
          <span class="debug-node-name">- {{ workflowName }}</span>
        </div>
        <div class="debug-actions">
          <el-select
            v-model="selectedExecutionId"
            placeholder="选择执行记录"
            size="small"
            style="width: 200px"
            @change="handleExecutionChange"
          >
            <el-option
              v-for="exec in executionList"
              :key="exec.id"
              :label="`#${exec.id} - ${formatStatus(exec.status)} - ${formatTime(exec.createdAt)}`"
              :value="exec.id"
            >
              <div class="execution-option">
                <span class="exec-id">#{{ exec.id }}</span>
                <el-tag :type="getStatusType(exec.status)" size="small">{{ formatStatus(exec.status) }}</el-tag>
                <span class="exec-time">{{ formatTime(exec.createdAt) }}</span>
              </div>
            </el-option>
          </el-select>
          <el-button text size="small" @click="handleRefresh" :loading="loading">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button text size="small" @click="handleClearRunLogs">清除</el-button>
          <el-button text size="small" @click="handleClose">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 执行结果折叠面板 -->
      <el-collapse v-if="outputParams.length > 0" class="output-collapse">
        <el-collapse-item title="执行结果" name="outputs">
          <template #title>
            <div class="collapse-title">
              <el-icon><Document /></el-icon>
              <span>执行结果</span>
              <el-tag size="small" type="success">{{ outputParams.length }} 个输出</el-tag>
            </div>
          </template>
          <div class="output-params">
            <div v-for="param in outputParams" :key="param.name" class="param-item">
              <!-- 文本类型参数 -->
              <div v-if="isTextType(param)" class="text-param">
                <div class="param-label">
                  <span class="label-text">{{ param.label || param.name }}</span>
                  <el-tag size="small" type="info">{{ param.type }}</el-tag>
                </div>
                <div class="param-value">
                  <pre>{{ formatValue(param.value) }}</pre>
                </div>
              </div>

              <!-- 单文件类型参数 -->
              <div v-else-if="isFileType(param)" class="file-param">
                <div class="param-label">
                  <span class="label-text">{{ param.label || param.name }}</span>
                  <el-tag size="small" type="warning">{{ param.type }}</el-tag>
                </div>
                <div class="file-info">
                  <el-icon><Document /></el-icon>
                  <span class="file-name">{{ param.fileName || '未知文件' }}</span>
                  <span class="file-size">({{ formatFileSize(param.fileSize) }})</span>
                  <el-button type="primary" link size="small" @click="downloadFile(param.downloadUrl)">
                    下载
                  </el-button>
                </div>
              </div>

              <!-- 文件数组类型参数 -->
              <div v-else-if="isFileArrayType(param)" class="file-array-param">
                <div class="param-label">
                  <span class="label-text">{{ param.label || param.name }}</span>
                  <el-tag size="small" type="warning">{{ param.type }}</el-tag>
                </div>
                <div class="file-list">
                  <div v-for="file in param.files" :key="file.fileId" class="file-item">
                    <el-icon><Document /></el-icon>
                    <span class="file-name">{{ file.fileName || '未知文件' }}</span>
                    <span class="file-size">({{ formatFileSize(file.fileSize) }})</span>
                    <el-button type="primary" link size="small" @click="downloadFile(file.downloadUrl)">
                      下载
                    </el-button>
                  </div>
                  <div v-if="!param.files || param.files.length === 0" class="empty-files">
                    暂无文件
                  </div>
                </div>
              </div>

              <!-- 其他类型（默认显示） -->
              <div v-else class="text-param">
                <div class="param-label">
                  <span class="label-text">{{ param.label || param.name }}</span>
                  <el-tag size="small">{{ param.type || 'Unknown' }}</el-tag>
                </div>
                <div class="param-value">
                  <pre>{{ formatValue(param.value) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <div class="debug-logs" ref="logsContainer" @wheel.stop>
        <div
          v-for="log in displayLogs"
          :key="log.id"
          class="debug-log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-type">
            <template v-if="log.type === 'info'">[INFO]</template>
            <template v-else-if="log.type === 'success'">[SUCCESS]</template>
            <template v-else-if="log.type === 'warning'">[WARNING]</template>
            <template v-else-if="log.type === 'error'">[ERROR]</template>
          </span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="displayLogs.length === 0" class="debug-empty">
          暂无运行日志
        </div>
        <div v-if="isRunning" class="running-indicator">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在执行中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { VideoPlay, Close, Refresh, Loading, Document } from '@element-plus/icons-vue'
import { getWorkflowExecutions, getExecutionDetail, getExecutionOutputs } from '@/api/workflow.js'

const props = defineProps({
  // 是否显示
  visible: {
    type: Boolean,
    default: false,
  },
  // 是否正在运行
  isRunning: {
    type: Boolean,
    default: false,
  },
  // 运行日志
  runLogs: {
    type: Array,
    default: () => [],
  },
  // 工作流名称
  workflowName: {
    type: String,
    default: '',
  },
  // 工作流ID
  workflowId: {
    type: [Number, String],
    default: null,
  },
  // 当前执行ID
  currentExecutionId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits([
  'update:visible',
  'clear-run-logs',
  'close',
])

const logsContainer = ref(null)
const loading = ref(false)
const selectedExecutionId = ref(null)
const executionList = ref([])
const executionLogs = ref([])
const outputParams = ref([])

// 显示的日志
const displayLogs = computed(() => {
  if (selectedExecutionId.value && executionLogs.value.length > 0) {
    return executionLogs.value
  }
  return props.runLogs
})

// 判断参数类型
const isTextType = (param) => {
  return param.category === 'BASIC' ||
         (param.type && !param.type.startsWith('File') && !param.type.startsWith('Array<File'))
}

const isFileType = (param) => {
  return param.type && param.type.startsWith('File<')
}

const isFileArrayType = (param) => {
  return param.type && param.type.startsWith('Array<File<')
}

// 下载文件
const downloadFile = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 格式化值
const formatValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

// 监听当前执行ID变化
watch(() => props.currentExecutionId, (newId) => {
  if (newId && props.visible) {
    selectedExecutionId.value = newId
    loadExecutionDetail(newId)
    loadExecutionOutputs(newId)
  }
})

// 监听visible变化，加载执行列表
watch(() => props.visible, async (newVal) => {
  if (newVal && props.workflowId) {
    await loadExecutionList()
    if (props.currentExecutionId) {
      selectedExecutionId.value = props.currentExecutionId
      await loadExecutionDetail(props.currentExecutionId)
      await loadExecutionOutputs(props.currentExecutionId)
    }
  }
})

// 加载执行记录列表
const loadExecutionList = async () => {
  if (!props.workflowId) return

  try {
    loading.value = true
    const result = await getWorkflowExecutions(props.workflowId, { page: 0, size: 20 })
    executionList.value = result.content || []
  } catch (error) {
    console.error('加载执行记录列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载执行详情
const loadExecutionDetail = async (executionId) => {
  if (!executionId) return

  try {
    loading.value = true
    const execution = await getExecutionDetail(executionId)
    executionLogs.value = buildLogsFromExecution(execution)
  } catch (error) {
    console.error('加载执行详情失败:', error)
    executionLogs.value = []
  } finally {
    loading.value = false
  }
}

// 加载执行输出参数
const loadExecutionOutputs = async (executionId) => {
  if (!executionId) return

  try {
    const response = await getExecutionOutputs(executionId)
    outputParams.value = response.outputs || []
  } catch (error) {
    console.error('加载执行输出失败:', error)
    outputParams.value = []
  }
}

// 从执行记录构建日志
const buildLogsFromExecution = (execution) => {
  const logs = []
  const timestamp = formatTime(execution.createdAt)

  logs.push({
    id: `exec-${execution.id}`,
    timestamp,
    type: 'info',
    message: `执行ID: ${execution.id}`,
  })

  logs.push({
    id: `status-${execution.id}`,
    timestamp,
    type: execution.status === 'SUCCESS' ? 'success' :
          execution.status === 'FAILED' ? 'error' : 'warning',
    message: `执行状态: ${formatStatus(execution.status)}`,
  })

  // 解析节点执行详情
  if (execution.nodeExecutions) {
    const nodeExecMap = typeof execution.nodeExecutions === 'string'
      ? JSON.parse(execution.nodeExecutions)
      : execution.nodeExecutions

    for (const [nodeUuid, nodeExec] of Object.entries(nodeExecMap)) {
      const startTime = nodeExec.startTime ? formatTime(nodeExec.startTime) : timestamp
      const logType = nodeExec.status === 'SUCCESS' ? 'success' :
                      nodeExec.status === 'FAILED' ? 'error' : 'info'

      logs.push({
        id: `node-${nodeUuid}`,
        timestamp: startTime,
        type: logType,
        message: `节点执行: ${nodeExec.status} - ${nodeUuid}`,
      })

      if (nodeExec.errorMessage) {
        logs.push({
          id: `error-${nodeUuid}`,
          timestamp: startTime,
          type: 'error',
          message: `错误: ${nodeExec.errorMessage}`,
        })
      }
    }
  }

  return logs
}

// 执行记录变化
const handleExecutionChange = (executionId) => {
  loadExecutionDetail(executionId)
  loadExecutionOutputs(executionId)
}

// 刷新
const handleRefresh = async () => {
  await loadExecutionList()
  if (selectedExecutionId.value) {
    await loadExecutionDetail(selectedExecutionId.value)
    await loadExecutionOutputs(selectedExecutionId.value)
  }
}

// 清除运行日志
const handleClearRunLogs = () => {
  executionLogs.value = []
  outputParams.value = []
  emit('clear-run-logs')
}

// 关闭
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    'SUCCESS': '成功',
    'FAILED': '失败',
    'PARTIAL_SUCCESS': '部分成功',
    'RUNNING': '运行中',
    'PENDING': '等待中',
  }
  return statusMap[status] || status
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'SUCCESS': 'success',
    'FAILED': 'danger',
    'PARTIAL_SUCCESS': 'warning',
    'RUNNING': 'primary',
    'PENDING': 'info',
  }
  return typeMap[status] || 'info'
}

// 自动滚动到底部
watch(() => props.runLogs, () => {
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.run-panel-container {
  /* 容器样式 */
}

.debug-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 600px;
  max-height: 500px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f9fafb;
  flex-shrink: 0;
}

.debug-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.debug-node-name {
  color: #909399;
  font-weight: normal;
}

.debug-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 执行结果折叠面板 */
.output-collapse {
  border: none;
  flex-shrink: 0;
}

.output-collapse :deep(.el-collapse-item__header) {
  padding: 0 16px;
  height: 40px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.output-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.output-collapse :deep(.el-collapse-item__content) {
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.output-params {
  padding: 12px 16px;
}

.param-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.param-item:last-child {
  border-bottom: none;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.label-text {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.param-value {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px 12px;
}

.param-value pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

.file-info,
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.file-name {
  font-size: 13px;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-list {
  padding-left: 0;
}

.empty-files {
  font-size: 12px;
  color: #909399;
  padding: 8px 0;
}

/* 日志区域 */
.debug-logs {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  min-height: 100px;
}

.debug-log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px solid #f5f7fa;
}

.debug-log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  flex-shrink: 0;
  min-width: 80px;
}

.log-type {
  flex-shrink: 0;
  font-weight: 500;
  min-width: 70px;
}

.debug-log-item.info .log-type {
  color: #409eff;
}

.debug-log-item.success .log-type {
  color: #67c23a;
}

.debug-log-item.warning .log-type {
  color: #e6a23c;
}

.debug-log-item.error .log-type {
  color: #f56c6c;
}

.log-message {
  color: #303133;
  word-break: break-all;
  flex: 1;
}

.debug-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 13px;
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #409eff;
  font-size: 13px;
}

.execution-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exec-id {
  font-weight: 500;
  color: #303133;
}

.exec-time {
  color: #909399;
  font-size: 12px;
}
</style>
