<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 工具栏 -->
    <div class="canvas-toolbar">
      <el-button text :icon="ZoomOut" @click="handleZoomOut" title="缩小 (Ctrl+-)" />
      <el-popover
        v-model:visible="showZoomInput"
        placement="top"
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
          <span class="zoom-value">{{ scalePercent }}%</span>
        </template>
      </el-popover>
      <el-button text :icon="ZoomIn" @click="handleZoomIn" title="放大 (Ctrl+=)" />
      <el-button text :icon="FullScreen" @click="handleFitContent" title="适应内容" />
      <el-button text :icon="Grid" @click="handleResetView" title="重置视图 (Ctrl+0)" />
    </div>

    <!-- 画布区域 -->
    <div
      class="canvas-viewport"
      ref="viewportRef"
      @wheel.prevent="handleWheel"
      @mousedown="handleViewportMouseDown"
      @mousemove="handleViewportMouseMove"
      @mouseup="handleViewportMouseUp"
      @mouseleave="handleViewportMouseUp"
      @click="handleCanvasClick"
    >
      <div class="canvas" :style="transformStyle">
        <!-- 网格背景 -->
        <CanvasBackground :width="canvasState.width" :height="canvasState.height" />

        <!-- 插槽：节点和连线 -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 画布容器组件
 * 提供缩放、平移、网格背景等功能
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ZoomIn, ZoomOut, Grid, FullScreen } from '@element-plus/icons-vue'
import { useCanvas } from '../composables/useCanvas'
import CanvasBackground from './CanvasBackground.vue'

const emit = defineEmits(['canvas-click', 'canvas-ready'])

// 配置
const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 2000

// 容器引用
const containerRef = ref(null)
const viewportRef = ref(null)

// 使用画布 composable
const {
  state: canvasState,
  scalePercent,
  transformStyle,
  zoomIn,
  zoomOut,
  zoomToPoint,
  resetView,
  startPanning,
  stopPanning,
  centerOnNode,
} = useCanvas({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
})

// 平移状态
const panState = ref({
  isPanning: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
})

// 空格键状态
const spaceKeyPressed = ref(false)

// 缩放输入状态
const showZoomInput = ref(false)
const inputZoom = ref(100)

// 监听 scale 变化，同步 inputZoom
watch(
  () => canvasState.scale,
  (newScale) => {
    inputZoom.value = Math.round(newScale * 100)
  },
  { immediate: true }
)

// 处理放大
const handleZoomIn = () => {
  zoomIn()
}

// 处理缩小
const handleZoomOut = () => {
  zoomOut()
}

// 处理重置视图
const handleResetView = () => {
  resetView()
}

// 处理缩放输入
const handleZoomInputChange = (value) => {
  const newScale = value / 100
  canvasState.scale = Math.min(Math.max(newScale, 0.25), 2)
}

// 处理适应内容
const handleFitContent = () => {
  resetView()
}

// 判断点击目标是否为画布背景
const isCanvasBackground = (target) => {
  return (
    target.classList.contains('canvas-viewport') ||
    target.classList.contains('canvas-background') ||
    target.classList.contains('canvas') ||
    target.tagName === 'svg'
  )
}

// 处理键盘按下
const handleKeyDown = (event) => {
  // 忽略输入框内的快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  // 空格键：进入平移模式
  if (event.code === 'Space' && !spaceKeyPressed.value) {
    event.preventDefault()
    spaceKeyPressed.value = true
    if (viewportRef.value) {
      viewportRef.value.style.cursor = 'grab'
    }
  }

  // Ctrl/Cmd 快捷键
  if (event.ctrlKey || event.metaKey) {
    if (event.key === '=' || event.key === '+') {
      event.preventDefault()
      zoomIn()
    } else if (event.key === '-') {
      event.preventDefault()
      zoomOut()
    } else if (event.key === '0') {
      event.preventDefault()
      resetView()
    }
  }
}

// 处理键盘松开
const handleKeyUp = (event) => {
  if (event.code === 'Space') {
    spaceKeyPressed.value = false
    if (viewportRef.value && !panState.value.isPanning) {
      viewportRef.value.style.cursor = ''
    }
  }
}

// 处理滚轮缩放（以鼠标位置为中心）
const handleWheel = (event) => {
  if (!viewportRef.value) return

  const rect = viewportRef.value.getBoundingClientRect()
  const pivotX = event.clientX - rect.left
  const pivotY = event.clientY - rect.top

  // 计算新的缩放比例
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = canvasState.scale + delta

  // 以鼠标位置为中心缩放
  zoomToPoint(newScale, pivotX, pivotY)
}

// 开始平移的通用方法
const startPan = (event) => {
  startPanning()
  panState.value = {
    isPanning: true,
    startX: event.clientX,
    startY: event.clientY,
    startOffsetX: canvasState.offsetX,
    startOffsetY: canvasState.offsetY,
  }
  if (viewportRef.value) {
    viewportRef.value.style.cursor = 'grabbing'
  }
}

// 处理视口鼠标按下（开始平移）
const handleViewportMouseDown = (event) => {
  // 方式1：中键拖拽
  if (event.button === 1) {
    event.preventDefault()
    startPan(event)
    return
  }

  // 方式2：空格键 + 左键拖拽
  if (event.button === 0 && spaceKeyPressed.value) {
    event.preventDefault()
    startPan(event)
    return
  }

  // 方式3：Alt + 左键拖拽
  if (event.button === 0 && event.altKey) {
    event.preventDefault()
    startPan(event)
    return
  }

  // 方式4：左键点击空白区域拖拽
  if (event.button === 0 && isCanvasBackground(event.target)) {
    event.preventDefault()
    startPan(event)
    return
  }
}

// 处理视口鼠标移动（平移中）
const handleViewportMouseMove = (event) => {
  if (!panState.value.isPanning) return

  const dx = event.clientX - panState.value.startX
  const dy = event.clientY - panState.value.startY

  canvasState.offsetX = panState.value.startOffsetX + dx
  canvasState.offsetY = panState.value.startOffsetY + dy
}

// 处理视口鼠标松开（结束平移）
const handleViewportMouseUp = () => {
  if (panState.value.isPanning) {
    stopPanning()
    panState.value.isPanning = false
    if (viewportRef.value) {
      // 如果空格键还按着，保持 grab 光标
      viewportRef.value.style.cursor = spaceKeyPressed.value ? 'grab' : ''
    }
  }
}

// 处理画布点击
const handleCanvasClick = (event) => {
  // 如果是平移操作，不触发点击事件
  if (panState.value.isPanning) return

  emit('canvas-click', {
    event,
    canvasState: { ...canvasState },
  })
}

// 组件挂载时发出就绪事件
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  emit('canvas-ready', {
    canvasState: { ...canvasState },
    containerRef: containerRef.value,
    viewportRef: viewportRef.value,
  })
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mouseup', handleViewportMouseUp)
})

// 暴露给父组件
defineExpose({
  canvasState,
  zoomIn,
  zoomOut,
  resetView,
  centerOnNode,
  containerRef,
  viewportRef,
})
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--canvas-bg, #f9fafb);
}

.canvas-toolbar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--toolbar-bg, #ffffff);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.zoom-value {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: var(--text-color, #374151);
  user-select: none;
}

.canvas-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: default;
}

.canvas {
  position: relative;
  transform-origin: 0 0;
}

/* 确保 Slot 内容在网格背景之上 */
.canvas > :not(.canvas-background) {
  position: relative;
  z-index: 1;
}
</style>
