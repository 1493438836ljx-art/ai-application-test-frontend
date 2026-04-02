<template>
  <div class="floating-toolbar">
    <!-- 返回按钮 -->
    <el-button text :icon="ArrowLeft" @click="handleBack" title="返回">返回</el-button>

    <div class="toolbar-divider"></div>

    <!-- 工作流名称显示 -->
    <div class="workflow-name-display">
      <span class="workflow-name-text">{{ workflowName }}</span>
    </div>

    <div class="toolbar-divider"></div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <el-button text :icon="ZoomOut" @click="handleZoomOut" title="缩小 (Ctrl+-)" />
      <el-popover
        v-model:visible="showZoomInput"
        placement="bottom"
        :width="140"
        trigger="click"
      >
        <el-input-number
          v-model="inputZoom"
          :min="25"
          :max="200"
          :step="10"
          size="small"
          @change="handleZoomInputChange"
        />
        <template #reference>
          <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
        </template>
      </el-popover>
      <el-button text :icon="ZoomIn" @click="handleZoomIn" title="放大 (Ctrl+=)" />
      <el-button text :icon="FullScreen" @click="handleFitContent" title="适应内容" />
    </div>

    <div class="toolbar-divider"></div>

    <!-- 操作按钮 -->
    <el-button text :icon="Grid" @click="handleAutoLayout" title="调整布局">调整布局</el-button>
    <el-button text :icon="VideoPlay" @click="handleRun" title="运行">运行</el-button>
    <el-button
      text
      :icon="Upload"
      :disabled="!hasRun || published"
      @click="handlePublish"
      :title="published ? '已发布' : '发布'"
    >
      {{ published ? '已发布' : '发布' }}
    </el-button>
    <el-button type="primary" text :icon="DocumentChecked" @click="handleSave" :loading="isSaving" title="保存">保存</el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Grid,
  VideoPlay,
  Upload,
  DocumentChecked,
} from '@element-plus/icons-vue'

const props = defineProps({
  // 工作流名称
  workflowName: {
    type: String,
    default: '未命名工作流',
  },
  // 当前缩放比例
  scale: {
    type: Number,
    default: 1,
  },
  // 是否已运行
  hasRun: {
    type: Boolean,
    default: false,
  },
  // 是否已发布
  published: {
    type: Boolean,
    default: false,
  },
  // 是否正在保存
  isSaving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'back',
  'zoom-in',
  'zoom-out',
  'zoom-change',
  'fit-content',
  'auto-layout',
  'run',
  'publish',
  'save',
])

// 显示缩放输入框
const showZoomInput = ref(false)
const inputZoom = computed({
  get: () => Math.round(props.scale * 100),
  set: (val) => {
    emit('zoom-change', val)
  },
})

// 返回
const handleBack = () => {
  emit('back')
}

// 放大
const handleZoomIn = () => {
  emit('zoom-in')
}

// 缩小
const handleZoomOut = () => {
  emit('zoom-out')
}

// 缩放值变化
const handleZoomInputChange = (value) => {
  emit('zoom-change', value)
}

// 适应内容
const handleFitContent = () => {
  emit('fit-content')
}

// 自动布局
const handleAutoLayout = () => {
  emit('auto-layout')
}

// 运行
const handleRun = () => {
  emit('run')
}

// 发布
const handlePublish = () => {
  emit('publish')
}

// 保存
const handleSave = () => {
  emit('save')
}
</script>

<style scoped>
.floating-toolbar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  z-index: 1000;
  gap: 8px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e4e7ed;
  margin: 0 4px;
}

.workflow-name-display {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.workflow-name-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-value {
  display: inline-block;
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.zoom-value:hover {
  background: #f5f7fa;
}

:deep(.el-button) {
  font-size: 13px;
}

:deep(.el-button.is-disabled) {
  opacity: 0.5;
}
</style>
