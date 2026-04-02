<template>
  <div class="run-panel-container">
    <!-- 调试日志弹窗 -->
    <el-dialog
      v-model="debugDialogVisible"
      :title="`调试日志 - ${debugNodeName || ''}`"
      width="600px"
      :close-on-click-modal="false"
      class="debug-dialog"
      @close="handleCloseDebug"
    >
      <div class="debug-dialog-content">
        <div class="debug-dialog-header">
          <el-button size="small" @click="handleClearDebugLogs">清除日志</el-button>
        </div>
        <div class="debug-dialog-logs">
          <div
            v-for="log in debugLogs"
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
          <div v-if="debugLogs.length === 0" class="debug-empty">
            暂无调试日志
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCloseDebug">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 运行日志面板 -->
    <div v-if="isRunning" class="debug-panel run-panel">
      <div class="debug-header">
        <div class="debug-title">
          <el-icon :size="16" color="#10b981"><VideoPlay /></el-icon>
          <span>运行日志</span>
          <span class="debug-node-name">- {{ workflowName }}</span>
        </div>
        <div class="debug-actions">
          <el-button text size="small" @click="handleClearRunLogs">清除日志</el-button>
          <el-button text size="small" @click="handleStopRun">
            <el-icon><Close /></el-icon>
            关闭
          </el-button>
        </div>
      </div>
      <div class="debug-logs">
        <div
          v-for="log in runLogs"
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
        <div v-if="runLogs.length === 0" class="debug-empty">
          暂无运行日志
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { VideoPlay, Close } from '@element-plus/icons-vue'

const props = defineProps({
  // 调试对话框是否显示
  debugDialogVisible: {
    type: Boolean,
    default: false,
  },
  // 调试节点名称
  debugNodeName: {
    type: String,
    default: '',
  },
  // 调试日志
  debugLogs: {
    type: Array,
    default: () => [],
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
})

const emit = defineEmits([
  'update:debugDialogVisible',
  'clear-debug-logs',
  'close-debug',
  'clear-run-logs',
  'stop-run',
])

// 双向绑定调试对话框显示状态
const debugDialogVisible = computed({
  get: () => props.debugDialogVisible,
  set: (val) => emit('update:debugDialogVisible', val),
})

// 清除调试日志
const handleClearDebugLogs = () => {
  emit('clear-debug-logs')
}

// 关闭调试对话框
const handleCloseDebug = () => {
  emit('close-debug')
}

// 清除运行日志
const handleClearRunLogs = () => {
  emit('clear-run-logs')
}

// 停止运行
const handleStopRun = () => {
  emit('stop-run')
}
</script>

<style scoped>
.run-panel-container {
  /* 容器样式 */
}

.debug-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 480px;
  max-height: 300px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
  overflow: hidden;
  z-index: 100;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f9fafb;
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
  gap: 8px;
}

.debug-logs {
  max-height: 240px;
  overflow-y: auto;
  padding: 12px 16px;
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
}

.log-type {
  flex-shrink: 0;
  font-weight: 500;
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
}

.debug-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 13px;
}

/* 调试对话框样式 */
.debug-dialog-content {
  /* 对话框内容样式 */
}

.debug-dialog-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.debug-dialog-logs {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
</style>
