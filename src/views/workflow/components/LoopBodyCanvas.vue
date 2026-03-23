<template>
  <div
    class="loop-body-canvas"
    :style="{
      left: loopBodyNode.x + 'px',
      top: loopBodyNode.y + 'px',
      width: loopBodyNode.width + 'px',
      height: loopBodyNode.height + 'px',
    }"
    :data-node-id="loopBodyNode.id"
    @mousedown.stop="handleCanvasClick"
  >
    <!-- 标题栏 -->
    <div class="loop-body-header" @mousedown.stop="startDragCanvas">
      <span class="header-title">{{ loopBodyNode.name }}</span>
    </div>

    <!-- 左侧端口（简化模式） -->
    <LoopBodyPort
      :port="leftPort"
      :is-left="true"
      :simplified="true"
      @port-drag-start="handlePortDragStart"
      @port-click="(port) => showAddNodeDialog(port, 'left')"
    />

    <!-- 右侧端口（简化模式） -->
    <LoopBodyPort
      :port="rightPort"
      :is-left="false"
      :simplified="true"
      @port-drag-start="handlePortDragStart"
      @port-click="(port) => showAddNodeDialog(port, 'right')"
    />

    <!-- 子画布区域 -->
    <div
      class="loop-body-workspace"
      ref="workspaceRef"
      @mousedown="handleWorkspaceMouseDown"
    >
      <!-- 循环体内节点（使用共享的 FlowNode 组件） -->
      <FlowNode
        v-for="node in bodyNodes"
        :key="node.id"
        :node="node"
        :is-selected="selectedBodyNode?.id === node.id"
        :is-inside-loop-body="true"
        :position="{
          x: node.x + loopBodyCanvas.offsetX,
          y: node.y + loopBodyCanvas.offsetY
        }"
        :node-types="nodeTypes"
        @node-mousedown="({ event, node }) => startDragBodyNode(event, node)"
        @node-click="({ node }) => selectBodyNode(node)"
        @output-port-mousedown="({ event, node }) => startBodyConnection(event, node, 'output', 0)"
      />

      <!-- 循环体内连线 SVG -->
      <svg
        class="loop-body-connections"
        :width="loopBodyNode.width"
        :height="loopBodyNode.height - 40"
      >
        <defs>
          <marker
            id="arrowhead-body"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </marker>
          <marker
            id="arrowhead-body-hover"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </marker>
          <!-- 连线渐变 -->
          <linearGradient id="line-gradient-body" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: #6366f1; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #8b5cf6; stop-opacity: 1" />
          </linearGradient>
        </defs>
        <path
          v-for="conn in bodyConnections"
          :key="conn.id"
          :d="getBodyConnectionPath(conn)"
          class="connection-path"
          :class="{ 'auto-created': conn.isAutoCreated, hovered: hoveredBodyConnection?.id === conn.id }"
          :marker-end="hoveredBodyConnection?.id === conn.id ? 'url(#arrowhead-body-hover)' : 'url(#arrowhead-body)'"
          @mouseenter="handleBodyConnectionMouseEnter(conn)"
          @mouseleave="handleBodyConnectionMouseLeave"
        />
        <!-- 临时连线 -->
        <path v-if="tempBodyConnection" :d="tempBodyConnection" class="temp-connection-path" />
      </svg>

      <!-- 连线中间的添加按钮 -->
      <div
        v-for="conn in bodyConnections"
        :key="'btn-' + conn.id"
      >
        <div
          v-if="hoveredBodyConnection?.id === conn.id && getBodyConnectionMidpoint(conn)"
          class="connection-add-btn"
          :style="{
            left: `${getBodyConnectionMidpoint(conn).x}px`,
            top: `${getBodyConnectionMidpoint(conn).y}px`,
          }"
          @mouseenter="handleBodyConnectionMouseEnter(conn)"
          @click.stop="showAddNodeDialog(conn.targetId === leftPort.id ? leftPort : rightPort, conn.targetId === leftPort.id ? 'left' : 'right')"
        >
          <el-icon :size="12"><Plus /></el-icon>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加节点对话框 -->
  <el-dialog v-model="showAddDialog" title="添加循环体节点" width="400px" append-to-body>
    <div class="node-type-list">
      <div
        v-for="type in availableNodeTypes"
        :key="type.type"
        class="node-type-item"
        @click="addSelectedNodeType(type)"
      >
        <el-icon :style="{ color: type.color }">
          <component :is="type.icon" />
        </el-icon>
        <span>{{ type.name }}</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import LoopBodyPort from './LoopBodyPort.vue'
import FlowNode from './FlowNode.vue'
import { useLoopBody } from '../composables/useLoopBody'

const props = defineProps({
  loopBodyNode: {
    type: Object,
    required: true,
  },
  loopNode: {
    type: Object,
    default: null,
  },
  nodeTypes: {
    type: Array,
    default: () => [],
  },
})

// 使用 useLoopBody composable（只传入一次 loopBodyNode）
const { loopBodyCanvas, bodyNodes, bodyConnections, leftPort, rightPort, addBodyNode, deleteBodyNode, createBodyConnection, deleteBodyConnection, validateLoopBodyConnection, saveLoopBodyState, moveBodyNode, } = useLoopBody(props.loopBodyNode, props.loopNode)

const emit = defineEmits(['update', 'node-select', 'connection-create', 'canvas-drag-start'])

const workspaceRef = ref(null)
const selectedBodyNode = ref(null)
const showAddDialog = ref(false)
// 记录触发添加节点的端口类型（leftPort 或 rightPort）
const triggerPortType = ref(null)
// 记录触发添加节点的连线（用于在连线中间插入节点）
const triggerConnection = ref(null)
// 悬浮的连线
const hoveredBodyConnection = ref(null)
let hoveredBodyConnectionTimer = null

// 临时连线状态
const tempBodyConnection = ref(null)
const drawingBodyConnection = ref(null)

// 可用的节点类型（排除特殊类型）
const availableNodeTypes = computed(() => {
  return props.nodeTypes.filter((t) => !['start', 'end', 'loop', 'loopBodyCanvas'].includes(t.type))
})

// 画布拖拽状态
const canvasDragState = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
})

// 节点拖拽状态
const nodeDragState = reactive({
  isDragging: false,
  node: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
})

// 画布点击
const handleCanvasClick = () => {
  selectedBodyNode.value = null
}

// 工作区点击
const handleWorkspaceMouseDown = (event) => {
  if (event.target === workspaceRef.value) {
    // 开始画布拖拽
    canvasDragState.isDragging = true
    canvasDragState.startX = event.clientX
    canvasDragState.startY = event.clientY
    canvasDragState.startOffsetX = loopBodyCanvas.offsetX
    canvasDragState.startOffsetY = loopBodyCanvas.offsetY

    document.addEventListener('mousemove', handleCanvasDrag)
    document.addEventListener('mouseup', handleCanvasDragEnd)
  }
}

// 画布拖拽
const handleCanvasDrag = (event) => {
  if (!canvasDragState.isDragging) return

  const deltaX = event.clientX - canvasDragState.startX
  const deltaY = event.clientY - canvasDragState.startY

  loopBodyCanvas.offsetX = canvasDragState.startOffsetX + deltaX
  loopBodyCanvas.offsetY = canvasDragState.startOffsetY + deltaY
}

// 画布拖拽结束
const handleCanvasDragEnd = () => {
  canvasDragState.isDragging = false
  document.removeEventListener('mousemove', handleCanvasDrag)
  document.removeEventListener('mouseup', handleCanvasDragEnd)
  saveLoopBodyState()
}

// 开始拖拽画布标题栏（移动整个循环体画布）
const startDragCanvas = (event) => {
  // 由父组件处理
  emit('canvas-drag-start', event)
}

// 选择循环体节点
const selectBodyNode = (node) => {
  selectedBodyNode.value = node
  emit('node-select', node)
}

// 开始拖拽循环体节点
const startDragBodyNode = (event, node) => {
  nodeDragState.isDragging = true
  nodeDragState.node = node
  nodeDragState.startX = event.clientX
  nodeDragState.startY = event.clientY
  nodeDragState.offsetX = node.x
  nodeDragState.offsetY = node.y

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'

  document.addEventListener('mousemove', handleNodeDrag)
  document.addEventListener('mouseup', handleNodeDragEnd)
}

// 节点拖拽
const handleNodeDrag = (event) => {
  if (!nodeDragState.isDragging || !nodeDragState.node) return

  const deltaX = event.clientX - nodeDragState.startX
  const deltaY = event.clientY - nodeDragState.startY

  const newX = nodeDragState.offsetX + deltaX
  const newY = nodeDragState.offsetY + deltaY

  moveBodyNode(nodeDragState.node.id, newX, newY)
}

// 节点拖拽结束
const handleNodeDragEnd = () => {
  nodeDragState.isDragging = false
  nodeDragState.node = null
  // 恢复文本选择
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', handleNodeDrag)
  document.removeEventListener('mouseup', handleNodeDragEnd)
}

// 开始创建循环体内部连线
const startBodyConnection = (event, node, portType, portIndex) => {
  event.stopPropagation()

  drawingBodyConnection.value = {
    sourceId: node.id,
    sourcePort: portType === 'output' ? node.outputs[portIndex]?.id : node.inputs[portIndex]?.id,
    sourceType: portType,
    startX: event.clientX,
    startY: event.clientY,
  }

  document.addEventListener('mousemove', handleBodyConnectionDrag)
  document.addEventListener('mouseup', handleBodyConnectionEnd)
}

// 连线拖拽
const handleBodyConnectionDrag = (event) => {
  if (!drawingBodyConnection.value) return

  const workspaceRect = workspaceRef.value?.getBoundingClientRect()
  if (!workspaceRect) return

  const startX = drawingBodyConnection.value.startX - workspaceRect.left
  const startY = drawingBodyConnection.value.startY - workspaceRect.top
  const endX = event.clientX - workspaceRect.left
  const endY = event.clientY - workspaceRect.top

  tempBodyConnection.value = `M ${startX} ${startY} L ${endX} ${endY}`
}

// 连线结束
const handleBodyConnectionEnd = (event) => {
  if (drawingBodyConnection.value) {
    // 检查是否连接到右侧端口（输出目的地）
    const rightPortEl = event.target.closest('[data-port-type="right"]')
    if (rightPortEl && drawingBodyConnection.value.sourceType === 'output') {
      // 从节点输出端口连接到右侧端口
      const result = createBodyConnection(
        drawingBodyConnection.value.sourceId,
        rightPort.id,
        drawingBodyConnection.value.sourcePort,
        rightPort.id,
      )
      if (!result.success) {
        ElMessage.warning(result.error)
      }
    } else {
      // 检查是否连接到其他节点
      const target = event.target.closest('[data-body-node-id]')
      if (target) {
        const targetId = target.dataset.bodyNodeId
        const result = createBodyConnection(
          drawingBodyConnection.value.sourceId,
          targetId,
          drawingBodyConnection.value.sourcePort,
          'in-1', // 简化处理
        )

        if (!result.success) {
          ElMessage.warning(result.error)
        }
      }
    }
  }

  drawingBodyConnection.value = null
  tempBodyConnection.value = null
  document.removeEventListener('mousemove', handleBodyConnectionDrag)
  document.removeEventListener('mouseup', handleBodyConnectionEnd)
}

// 端口拖拽开始
const handlePortDragStart = ({ event, port, isLeft }) => {
  // 处理从端口开始的连线
  drawingBodyConnection.value = {
    sourceId: port.id,
    sourcePort: port.id,
    sourceType: isLeft ? 'output' : 'input',
    startX: event.clientX,
    startY: event.clientY,
    fromPort: true,
    isLeftPort: isLeft,
  }

  document.addEventListener('mousemove', handleBodyConnectionDrag)
  document.addEventListener('mouseup', handlePortConnectionEnd)
}

// 端口连线结束
const handlePortConnectionEnd = (event) => {
  if (drawingBodyConnection.value?.fromPort) {
    const target = event.target.closest('[data-body-node-id]')

    if (drawingBodyConnection.value.isLeftPort && target) {
      // 左侧端口连接到节点
      const targetId = target.dataset.bodyNodeId
      const result = createBodyConnection(
        drawingBodyConnection.value.sourceId,
        targetId,
        drawingBodyConnection.value.sourcePort,
        'in-1',
      )
      if (!result.success) {
        ElMessage.warning(result.error)
      }
    } else if (!drawingBodyConnection.value.isLeftPort && target) {
      // 节点连接到右侧端口
      const sourceId = target.dataset.bodyNodeId
      const result = createBodyConnection(
        sourceId,
        drawingBodyConnection.value.sourceId,
        'out-1',
        drawingBodyConnection.value.sourcePort,
      )
      if (!result.success) {
        ElMessage.warning(result.error)
      }
    }
  }

  drawingBodyConnection.value = null
  tempBodyConnection.value = null
  document.removeEventListener('mousemove', handleBodyConnectionDrag)
  document.removeEventListener('mouseup', handlePortConnectionEnd)
}

// 获取循环体内部连线路径
const getBodyConnectionPath = (connection) => {
  let sourceX, sourceY, targetX, targetY

  // 尝试使用 DOM 获取端口连接点的实际位置
  const workspaceEl = workspaceRef.value
  if (!workspaceEl) return ''

  // 获取源位置
  if (connection.sourceId === leftPort.id) {
    // 从左侧端口（简化模式）- 直接使用端口容器本身，因为 .port-connector 已隐藏
    const portEl = workspaceEl.parentElement?.querySelector('[data-port-id="' + leftPort.id + '"]')
    if (portEl) {
      const portRect = portEl.getBoundingClientRect()
      const workspaceRect = workspaceEl.getBoundingClientRect()
      sourceX = portRect.left - workspaceRect.left + portRect.width / 2
      sourceY = portRect.top - workspaceRect.top + portRect.height / 2
    } else {
      // 回退计算
      sourceX = -5
      sourceY = leftPort.y + 15
    }
  } else {
    // 从节点输出端口
    const sourceNode = bodyNodes.value.find((n) => n.id === connection.sourceId)
    if (sourceNode) {
      // 尝试获取节点右侧输出端口的实际位置
      const nodeEl = workspaceEl.querySelector('[data-body-node-id="' + sourceNode.id + '"] .output-port')
      if (nodeEl) {
        const portRect = nodeEl.getBoundingClientRect()
        const workspaceRect = workspaceEl.getBoundingClientRect()
        sourceX = portRect.left - workspaceRect.left + portRect.width / 2
        sourceY = portRect.top - workspaceRect.top + portRect.height / 2
      } else {
        // 回退计算：使用节点右侧边缘垂直居中
        sourceX = sourceNode.x + 220 + loopBodyCanvas.offsetX
        sourceY = sourceNode.y + 50 + loopBodyCanvas.offsetY
      }
    } else {
      return ''
    }
  }

  // 获取目标位置
  if (connection.targetId === rightPort.id) {
    // 到右侧端口（简化模式）- 直接使用端口容器本身，因为 .port-connector 已隐藏
    const portEl = workspaceEl.parentElement?.querySelector('[data-port-id="' + rightPort.id + '"]')
    if (portEl) {
      const portRect = portEl.getBoundingClientRect()
      const workspaceRect = workspaceEl.getBoundingClientRect()
      targetX = portRect.left - workspaceRect.left + portRect.width / 2
      targetY = portRect.top - workspaceRect.top + portRect.height / 2
    } else {
      // 回退计算
      targetX = props.loopBodyNode.width - 35
      targetY = rightPort.y + 15
    }
  } else {
    // 到节点的输入端口
    const targetNode = bodyNodes.value.find((n) => n.id === connection.targetId)
    if (targetNode) {
      // 尝试获取节点左侧输入端口的实际位置
      const nodeEl = workspaceEl.querySelector('[data-body-node-id="' + targetNode.id + '"] .input-port')
      if (nodeEl) {
        const portRect = nodeEl.getBoundingClientRect()
        const workspaceRect = workspaceEl.getBoundingClientRect()
        targetX = portRect.left - workspaceRect.left + portRect.width / 2
        targetY = portRect.top - workspaceRect.top + portRect.height / 2
      } else {
        // 回退计算
        targetX = targetNode.x + loopBodyCanvas.offsetX
        targetY = targetNode.y + 50 + loopBodyCanvas.offsetY
      }
    } else {
      return ''
    }
  }

  // 贝塞尔曲线
  const distance = Math.abs(targetX - sourceX)
  const controlOffset = Math.max(20, Math.min(distance * 0.4, 60))

  return `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`
}

// 显示添加节点对话框
const showAddNodeDialog = (port, portType) => {
  triggerPortType.value = portType // 记录触发端口类型
  // 如果当前有悬浮的连线，记录下来（用于在连线中间插入节点）
  if (hoveredBodyConnection.value) {
    triggerConnection.value = { ...hoveredBodyConnection.value }
  } else {
    triggerConnection.value = null
  }
  showAddDialog.value = true
}

// 延迟清除悬停状态
const handleBodyConnectionMouseLeave = () => {
  hoveredBodyConnectionTimer = setTimeout(() => {
    hoveredBodyConnection.value = null
  }, 100)
}

const handleBodyConnectionMouseEnter = (conn) => {
  if (hoveredBodyConnectionTimer) {
    clearTimeout(hoveredBodyConnectionTimer)
    hoveredBodyConnectionTimer = null
  }
  hoveredBodyConnection.value = conn
}

// 计算连线中点坐标
const getBodyConnectionMidpoint = (connection) => {
  const { sourceX, sourceY, targetX, targetY } = getBodyConnectionCoordinates(connection)
  if (sourceX === undefined) return null

  // 贝塞尔曲线在 t=0.5 时的点
  const distance = Math.abs(targetX - sourceX)
  const controlOffset = Math.max(20, Math.min(distance * 0.4, 60))

  const cx1 = sourceX + controlOffset
  const cy1 = sourceY
  const cx2 = targetX - controlOffset
  const cy2 = targetY

  // 三次贝塞尔曲线 t=0.5 时的公式
  const t = 0.5
  const mt = 1 - t
  const x = mt * mt * mt * sourceX + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * targetX
  const y = mt * mt * mt * sourceY + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * targetY

  return { x, y }
}

// 获取连线坐标（用于中点计算）
const getBodyConnectionCoordinates = (connection) => {
  let sourceX, sourceY, targetX, targetY

  // 尝试使用 DOM 获取端口连接点的实际位置
  const workspaceEl = workspaceRef.value
  if (!workspaceEl) return {}

  // 获取源位置
  if (connection.sourceId === leftPort.id) {
    // 左侧端口 - 直接使用端口容器本身，因为 .port-connector 已隐藏
    const portEl = workspaceEl.parentElement?.querySelector('[data-port-id="' + leftPort.id + '"]')
    if (portEl) {
      const portRect = portEl.getBoundingClientRect()
      const workspaceRect = workspaceEl.getBoundingClientRect()
      sourceX = portRect.left - workspaceRect.left + portRect.width / 2
      sourceY = portRect.top - workspaceRect.top + portRect.height / 2
    } else {
      sourceX = -5
      sourceY = leftPort.y + 15
    }
  } else {
    const sourceNode = bodyNodes.value.find((n) => n.id === connection.sourceId)
    if (sourceNode) {
      // 尝试获取节点右侧输出端口的实际位置
      const nodeEl = workspaceEl.querySelector('[data-body-node-id="' + sourceNode.id + '"] .output-port')
      if (nodeEl) {
        const portRect = nodeEl.getBoundingClientRect()
        const workspaceRect = workspaceEl.getBoundingClientRect()
        sourceX = portRect.left - workspaceRect.left + portRect.width / 2
        sourceY = portRect.top - workspaceRect.top + portRect.height / 2
      } else {
        // 回退计算
        sourceX = sourceNode.x + 220 + loopBodyCanvas.offsetX
        sourceY = sourceNode.y + 50 + loopBodyCanvas.offsetY
      }
    }
  }

  // 获取目标位置
  if (connection.targetId === rightPort.id) {
    // 右侧端口 - 直接使用端口容器本身，因为 .port-connector 已隐藏
    const portEl = workspaceEl.parentElement?.querySelector('[data-port-id="' + rightPort.id + '"]')
    if (portEl) {
      const portRect = portEl.getBoundingClientRect()
      const workspaceRect = workspaceEl.getBoundingClientRect()
      targetX = portRect.left - workspaceRect.left + portRect.width / 2
      targetY = portRect.top - workspaceRect.top + portRect.height / 2
    } else {
      targetX = props.loopBodyNode.width - 35
      targetY = rightPort.y + 15
    }
  } else {
    const targetNode = bodyNodes.value.find((n) => n.id === connection.targetId)
    if (targetNode) {
      const nodeEl = workspaceEl.querySelector('[data-body-node-id="' + targetNode.id + '"] .input-port')
      if (nodeEl) {
        const portRect = nodeEl.getBoundingClientRect()
        const workspaceRect = workspaceEl.getBoundingClientRect()
        targetX = portRect.left - workspaceRect.left + portRect.width / 2
        targetY = portRect.top - workspaceRect.top + portRect.height / 2
      } else {
        targetX = targetNode.x + loopBodyCanvas.offsetX
        targetY = targetNode.y + 50 + loopBodyCanvas.offsetY
      }
    }
  }

  return { sourceX, sourceY, targetX, targetY }
}

// 添加选中的节点类型
const addSelectedNodeType = (type) => {
  console.log('Adding node type:', type)
  const newNode = addBodyNode(type.type, { name: type.name, ...type })
  console.log('New node created:', newNode)
  console.log('Body nodes value:', bodyNodes.value)
  showAddDialog.value = false
  selectedBodyNode.value = newNode
  ElMessage.success(`已添加节点: ${type.name}`)

  nextTick(() => {
    // 如果是在连线上点击添加（有触发连线），则在连线中间插入节点
    if (triggerConnection.value) {
      const conn = triggerConnection.value

      // 1. 删除原连线
      deleteBodyConnection(conn.id)

      // 2. 创建从源端到新节点的连线
      const sourceResult = createBodyConnection(
        conn.sourceId,
        newNode.id,
        conn.sourcePort,
        'in-1',
      )
      if (!sourceResult.success) {
        console.warn('Auto connect from source failed:', sourceResult.error)
      }

      // 3. 创建从新节点到目标端的连线
      const targetResult = createBodyConnection(
        newNode.id,
        conn.targetId,
        'out-1',
        conn.targetPort,
      )
      if (!targetResult.success) {
        console.warn('Auto connect to target failed:', targetResult.error)
      }

      triggerConnection.value = null
      triggerPortType.value = null
      return
    }

    // 自动连线逻辑：如果是添加的第一个节点，且是从端口点击触发的
    if (bodyNodes.value.length === 1 && triggerPortType.value) {
      // 根据触发端口类型决定连线方式
      if (triggerPortType.value === 'left') {
        // 从左端口连线到新节点
        const result = createBodyConnection(
          leftPort.id,
          newNode.id,
          leftPort.id,
          'in-1',
        )
        if (!result.success) {
          console.warn('Auto connect from left port failed:', result.error)
        }
      } else if (triggerPortType.value === 'right') {
        // 从新节点连线到右端口
        const result = createBodyConnection(
          newNode.id,
          rightPort.id,
          'out-1',
          rightPort.id,
        )
        if (!result.success) {
          console.warn('Auto connect to right port failed:', result.error)
        }
      }
      triggerPortType.value = null // 重置触发端口类型
    }
  })
}

// 暴露方法
defineExpose({
  saveLoopBodyState,
  bodyNodes,
  bodyConnections,
  leftPort,
  rightPort,
})
</script>

<style scoped>
.loop-body-canvas {
  position: absolute;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background: #f8fafc;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loop-body-header {
  padding: 8px 12px;
  background: linear-gradient(to bottom, #3b82f6, #93c5fd, #dbeafe, #ffffff);
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
  cursor: move;
  user-select: none;
}

.header-title {
  font-size: 14px;
}

.belongs-to {
  opacity: 0.8;
  font-size: 12px;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.loop-body-workspace {
  position: relative;
  width: 100%;
  height: calc(100% - 40px);
  overflow: hidden;
  background-color: #fff;
  background-image: linear-gradient(#f0f0f0 1px, transparent 1px),
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.loop-body-connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-path {
  fill: none;
  stroke: #6366f1;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: stroke;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connection-path.hovered {
  stroke: #22d3ee;
  stroke-width: 3;
}

.connection-path.auto-created {
  stroke-dasharray: 5, 3;
  stroke: #3b82f6;
}

.temp-connection-path {
  fill: none;
  stroke: #6366f1;
  stroke-width: 2;
  stroke-dasharray: 6, 4;
  opacity: 0.6;
  pointer-events: none;
}

/* 循环体连线中间的添加按钮 */
.connection-add-btn {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #22d3ee;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.4);
  z-index: 10;
  transition: all 0.2s;
}

.connection-add-btn:hover {
  background: #06b6d4;
  transform: translate(-50%, -50%) scale(1.15);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.5);
}

.node-type-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.node-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-type-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
</style>
