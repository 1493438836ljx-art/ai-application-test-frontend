<template>
  <div
    class="loop-body-port"
    :class="{
      'left-port': isLeft,
      'right-port': !isLeft,
      'port-dragging': isDragging,
      simplified: simplified,
    }"
    :style="{
      left: isLeft ? '0' : 'auto',
      right: isLeft ? 'auto' : '0',
      top: port.y + 'px',
    }"
    :data-port-id="port.id"
    :data-port-type="isLeft ? 'left' : 'right'"
    @mousedown.stop="handlePortMouseDown"
  >
    <div class="port-icon" :class="{ 'has-params': port.params?.length > 0 }"></div>
    <div class="port-info">
      <div class="port-name">{{ port.name }}</div>
      <div v-if="!simplified && port.params && port.params.length > 0" class="port-params">
        <div v-for="(param, idx) in port.params" :key="idx" class="param-item">
          <span class="param-name">{{ param.name }}</span>
          <span class="param-type">{{ formatType(param) }}</span>
        </div>
      </div>
    </div>
    <!-- 连接点 -->
    <div class="port-connector" :class="isLeft ? 'right' : 'left'"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  port: {
    type: Object,
    required: true,
  },
  isLeft: {
    type: Boolean,
    default: true,
  },
  simplified: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['port-drag-start', 'port-drag-end', 'port-click'])

const isDragging = ref(false)

// 处理端口点击（添加节点）
const handlePortClick = () => {
  emit('port-click', props.port)
}

const handlePortMouseDown = (event) => {
  // 右侧端口禁止交互
  if (!props.isLeft) return

  // 只处理左键，不阻止默认行为以便 click 事件可以触发
  if (event.button !== 0) return
  event.stopPropagation()

  isDragging.value = true
  const startX = event.clientX
  const startY = event.clientY

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'

  emit('port-drag-start', {
    event,
    port: props.port,
    isLeft: props.isLeft,
  })

  const handleMouseUp = (upEvent) => {
    isDragging.value = false
    // 恢复文本选择
    document.body.style.userSelect = ''
    // 无论是点击还是拖拽，都触发 port-click 事件以弹出添加节点弹窗
    emit('port-click', props.port, upEvent)
    emit('port-drag-end')
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mouseup', handleMouseUp)
}

const formatType = (param) => {
  if (!param.type) return 'Any'
  if (param.type === 'Array' || param.type === 'array') {
    return `Array[${param.elementType || 'Any'}]`
  }
  return param.type
}
</script>

<style scoped>
.loop-body-port {
  position: absolute;
  width: 140px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  padding: 8px 12px;
  z-index: 20;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.1s;
}

.loop-body-port:hover {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.loop-body-port.port-dragging {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.left-port {
  border-left: none;
  border-radius: 0 6px 6px 0;
  transform: translateX(-2px);
}

.right-port {
  border-right: none;
  border-radius: 6px 0 0 6px;
  transform: translateX(2px);
  cursor: not-allowed;
}

/* 右侧端口禁止悬停效果 */
.right-port:hover {
  box-shadow: none;
}

.right-port .port-connector {
  cursor: not-allowed;
}

.right-port .port-connector:hover {
  transform: translateY(-50%);
  background: #3b82f6;
}

.port-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  margin-bottom: 6px;
}

.port-icon.has-params {
  background: #3b82f6;
}

.port-info {
  min-width: 0;
}

.port-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.port-params {
  margin-top: 6px;
  border-top: 1px solid #e5e7eb;
  padding-top: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
  padding: 2px 0;
}

.param-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.param-type {
  margin-left: 8px;
  font-size: 10px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
}

.port-connector {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: crosshair;
}

.port-connector.right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-connector.left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-connector:hover {
  transform: translateY(-50%) scale(1.2);
  background: #2563eb;
}

/* 简化模式样式 */
.loop-body-port.simplified {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
}

.loop-body-port.simplified .port-icon {
  display: none;
}

.loop-body-port.simplified .port-info {
  display: none;
}

.loop-body-port.simplified .port-connector {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 简化模式的端口定位调整 */
.loop-body-port.simplified.left-port {
  left: -6px;
  right: auto;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
  cursor: crosshair;
  margin-top: -6px;
}

/* 左侧简化端口隐藏连接点（使用外层容器作为连接点） */
.loop-body-port.simplified.left-port .port-connector {
  display: none;
}

/* 左侧端口悬停效果 */
.loop-body-port.simplified.left-port:hover {
  background: #22d3ee;
  transform: scale(1.2);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.loop-body-port.simplified.right-port {
  right: -6px;
  left: auto;
  width: 12px;
  height: 12px;
  background: #6366f1;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  cursor: not-allowed;
  /* 使用 margin-top 使端口中心对齐到 top 位置 */
  margin-top: -6px;
}

/* 右侧简化端口隐藏连接点（使用外层容器作为连接点） */
.loop-body-port.simplified.right-port .port-connector {
  display: none;
}
</style>
