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
      @port-click="(port, event) => showAddNodeDialog(port, 'left', event)"
    />

    <!-- 右侧端口（简化模式） -->
    <LoopBodyPort
      :port="rightPort"
      :is-left="false"
      :simplified="true"
      @port-drag-start="handlePortDragStart"
      @port-click="(port, event) => showAddNodeDialog(port, 'right', event)"
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
        :is-selected="isBodyNodeSelected(node.id)"
        :is-inside-loop-body="true"
        :position="{
          x: node.x + loopBodyCanvas.offsetX,
          y: node.y + loopBodyCanvas.offsetY
        }"
        :node-types="nodeTypes"
        @node-mousedown="({ event, node }) => startDragBodyNode(event, node)"
        @node-click="({ node, multiSelect }) => selectBodyNode(node, multiSelect)"
        @node-dblclick="({ node }) => emit('node-dblclick', node)"
        @node-contextmenu="({ event, node }) => showBodyContextMenu(event, node)"
        @output-port-mousedown="({ event, node }) => startBodyConnection(event, node, 'output', 0)"
        @output-port-mouseup="({ event, node }) => handleOutputPortMouseUp(event, node)"
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

  <!-- 添加节点弹窗 -->
  <div
    v-if="showAddDialog"
    class="add-node-popover"
    :style="{ left: `${addPopoverPosition.x}px`, top: `${addPopoverPosition.y}px` }"
  >
    <div class="popover-header">
      <span>选择节点类型</span>
      <el-icon class="close-icon" @click="closeAddDialog"><Close /></el-icon>
    </div>
    <div class="popover-content">
      <template v-for="category in nodeCategories" :key="category.key">
        <div
          v-if="availableNodeTypes.filter((n) => n.category === category.key).length > 0"
          class="category-section"
        >
          <div class="category-title">{{ category.name }}</div>
          <div class="category-items">
            <div
              v-for="nodeType in availableNodeTypes.filter((n) => n.category === category.key)"
              :key="nodeType.type"
              class="popover-node-item"
              @click="addSelectedNodeType(nodeType)"
            >
              <div
                class="popover-node-icon"
                :style="{ background: `${nodeType.color}15`, color: nodeType.color }"
              >
                <el-icon :size="16">
                  <component :is="getIconComponent(nodeType.icon)" />
                </el-icon>
              </div>
              <span class="popover-node-name">{{ nodeType.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 弹窗遮罩 -->
  <div v-if="showAddDialog" class="popover-overlay" @click="closeAddDialog" />

  <!-- 右键菜单 -->
  <div
    v-if="bodyContextMenu.visible"
    class="context-menu"
    :style="{ left: `${bodyContextMenu.x}px`, top: `${bodyContextMenu.y}px` }"
  >
    <div class="context-menu-item" @click="bodyContextMenuRename">
      <el-icon><Edit /></el-icon>
      <span>重命名</span>
    </div>
    <div class="context-menu-item" @click="bodyContextMenuDuplicate">
      <el-icon><CopyDocument /></el-icon>
      <span>创建副本</span>
    </div>
    <div class="context-menu-divider" />
    <div class="context-menu-item danger" @click="bodyContextMenuDelete">
      <el-icon><Delete /></el-icon>
      <span>删除</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, Edit, CopyDocument, Delete } from '@element-plus/icons-vue'
import LoopBodyPort from './LoopBodyPort.vue'
import FlowNode from './FlowNode.vue'
import { useLoopBody } from '../composables/useLoopBody'
import { getSkillDetail } from '@/api/skill.js'
import { generateUuid } from '../utils/uuid'

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

const emit = defineEmits(['update', 'node-select', 'connection-create', 'canvas-drag-start', 'node-dblclick'])

const workspaceRef = ref(null)
const selectedBodyNode = ref(null)
const showAddDialog = ref(false)
// popover 位置
const addPopoverPosition = ref({ x: 0, y: 0 })
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

// 右键菜单状态
const bodyContextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null,
})

// 触发添加节点的源节点（点击节点输出端口时记录）
const triggerSourceNode = ref(null)

// 可用的节点类型（排除特殊类型）
const availableNodeTypes = computed(() => {
  return props.nodeTypes.filter((t) => !['start', 'end', 'loop', 'loopBodyCanvas'].includes(t.type))
})

// 节点分类（用于分组显示）
const nodeCategories = [
  { key: 'BASIC', name: '基础节点' },
  { key: 'LOGIC', name: '逻辑控制' },
  { key: 'EXECUTION', name: '执行节点' },
]

// 根据类型获取图标组件
const getIconComponent = (iconName) => {
  const iconMap = {
    'Connection': 'Connection',
    'Setting': 'Setting',
    'Document': 'Document',
    'Grid': 'Grid',
    'TrendCharts': 'TrendCharts',
    'DataLine': 'DataLine',
    'Cpu': 'Cpu',
    'ChatDotRound': 'ChatDotRound',
    'Collection': 'Collection',
    'Refresh': 'Refresh',
    'Timer': 'Timer',
    'Files': 'Files',
    'Folder': 'Folder',
  }
  return iconMap[iconName] || iconName
}

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

// 检查节点是否被选中
const isBodyNodeSelected = (nodeId) => {
  return selectedBodyNode.value?.id === nodeId
}

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

// 输出端口鼠标释放（点击添加节点）
const handleOutputPortMouseUp = (event, node) => {
  // 如果没有进行拖拽连线，则显示添加节点弹窗
  if (!drawingBodyConnection.value || drawingBodyConnection.value.sourceId === node.id) {
    // 显示添加节点弹窗
    addPopoverPosition.value = { x: event.clientX, y: event.clientY }
    triggerPortType.value = 'output'
    triggerConnection.value = null
    triggerSourceNode.value = node // 记录触发源节点
    showAddDialog.value = true
  }
}

// 显示右键菜单
const showBodyContextMenu = (event, node) => {
  event.preventDefault()
  event.stopPropagation()

  selectBodyNode(node)

  bodyContextMenu.visible = true
  bodyContextMenu.x = event.clientX
  bodyContextMenu.y = event.clientY
  bodyContextMenu.node = node

  // 点击其他地方关闭菜单
  document.addEventListener('click', hideBodyContextMenu, { once: true })
}

// 隐藏右键菜单
const hideBodyContextMenu = () => {
  bodyContextMenu.visible = false
  bodyContextMenu.node = null
}

// 右键菜单：重命名
const bodyContextMenuRename = () => {
  if (!bodyContextMenu.node) return
  hideBodyContextMenu()
  // 触发节点双击事件打开配置面板
  emit('node-dblclick', bodyContextMenu.node)
}

// 右键菜单：创建副本
const bodyContextMenuDuplicate = () => {
  if (!bodyContextMenu.node) return
  const originalNode = bodyContextMenu.node
  hideBodyContextMenu()

  // 复制节点
  const newNode = {
    ...originalNode,
    id: `body-node-${Date.now()}`,
    name: `${originalNode.name} (副本)`,
    x: originalNode.x + 30,
    y: originalNode.y + 30,
  }

  addBodyNode(newNode)
  ElMessage.success('已创建节点副本')
}

// 右键菜单：删除
const bodyContextMenuDelete = () => {
  if (!bodyContextMenu.node) return
  const nodeName = bodyContextMenu.node.name
  const nodeId = bodyContextMenu.node.id  // 先保存节点 ID
  hideBodyContextMenu()

  deleteBodyNode(nodeId)  // 使用保存的 ID
  selectedBodyNode.value = null
  ElMessage.success(`已删除节点: ${nodeName}`)
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
const showAddNodeDialog = (port, portType, event) => {
  triggerPortType.value = portType // 记录触发端口类型
  // 如果当前有悬浮的连线，记录下来（用于在连线中间插入节点）
  if (hoveredBodyConnection.value) {
    triggerConnection.value = { ...hoveredBodyConnection.value }
  } else {
    triggerConnection.value = null
  }
  // 设置 popover 位置
  if (event) {
    addPopoverPosition.value = { x: event.clientX, y: event.clientY }
  }
  showAddDialog.value = true
}

// 关闭添加节点弹窗
const closeAddDialog = () => {
  showAddDialog.value = false
  triggerConnection.value = null
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
const addSelectedNodeType = async (type) => {
  console.log('Adding node type:', type)

  // 处理 Skill 节点
  if (type.type.startsWith('skill-')) {
    await addSkillNodeToBody(type)
    return
  }

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

    // 从节点输出端口添加新节点时，自动连线
    if (triggerPortType.value === 'output' && triggerSourceNode.value) {
      // 从触发源节点连线到新节点
      const result = createBodyConnection(
        triggerSourceNode.value.id,
        newNode.id,
        'out-1',
        'in-1',
      )
      if (!result.success) {
        console.warn('Auto connect from source node failed:', result.error)
      } else {
        ElMessage.success('已自动连接节点')
      }
      triggerPortType.value = null
      triggerSourceNode.value = null
    }
  })
}

// 添加 Skill 节点到循环体
const addSkillNodeToBody = async (type) => {
  const skillId = type.type.replace('skill-', '')

  try {
    const skillDetail = await getSkillDetail(skillId)
    if (!skillDetail) {
      ElMessage.error('获取 Skill 详情失败')
      return
    }

    // 计算 Skill 节点位置
    let nodeX = 160
    let nodeY = 100 + bodyNodes.value.length * 120

    // 如果有触发连线，使用连线中点
    if (triggerConnection.value) {
      const midpoint = getBodyConnectionMidpoint(triggerConnection.value)
      if (midpoint) {
        nodeX = midpoint.x - 110 - loopBodyCanvas.offsetX // 居中
        nodeY = midpoint.y - 35 - loopBodyCanvas.offsetY
      }
    }

    // 创建 Skill 节点对象
    const newNode = {
      id: `skill-${Date.now()}`,
      nodeUuid: generateUuid(),
      type: 'skill',
      nodeCategory: 'EXECUTION',
      name: skillDetail.name,
      description: skillDetail.description || '',
      skillId: skillId,
      allowAddInputParams: skillDetail.allowAddInputParams || false,
      allowAddOutputParams: skillDetail.allowAddOutputParams || false,
      skillSnapshot: JSON.stringify({
        id: skillDetail.id,
        name: skillDetail.name,
        description: skillDetail.description || '',
        inputParameters: skillDetail.inputParameters || [],
        outputParameters: skillDetail.outputParameters || [],
      }),
      inputParams: (skillDetail.inputParameters || []).map((p) => ({
        name: p.paramName,
        type: p.paramType,
        required: p.required,
        description: p.description,
        defaultValue: p.defaultValue,
        valueSourceType: 'literal',
        value: p.defaultValue ?? '',
      })),
      outputParams: (skillDetail.outputParameters || []).map((p) => ({
        name: p.paramName,
        type: p.paramType,
        description: p.description,
      })),
      x: nodeX,
      y: nodeY,
      inputs: [{ id: `in-${Date.now()}`, name: '输入', type: 'Any' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出', type: 'Any' }],
      config: {},
    }

    // 添加节点到循环体
    bodyNodes.value.push(newNode)
    showAddDialog.value = false
    selectedBodyNode.value = newNode
    ElMessage.success(`已添加技能节点: ${skillDetail.name}`)

    // 保存状态
    saveLoopBodyState()

    // 处理连线逻辑
    nextTick(() => {
      if (triggerConnection.value) {
        const conn = triggerConnection.value
        deleteBodyConnection(conn.id)

        createBodyConnection(conn.sourceId, newNode.id, conn.sourcePort, 'in-1')
        createBodyConnection(newNode.id, conn.targetId, 'out-1', conn.targetPort)

        triggerConnection.value = null
        triggerPortType.value = null
        return
      }

      // 自动连线逻辑
      if (bodyNodes.value.length === 1 && triggerPortType.value) {
        if (triggerPortType.value === 'left') {
          createBodyConnection(leftPort.id, newNode.id, leftPort.id, 'in-1')
        } else if (triggerPortType.value === 'right') {
          createBodyConnection(newNode.id, rightPort.id, 'out-1', rightPort.id)
        }
        triggerPortType.value = null
      }

      if (triggerPortType.value === 'output' && triggerSourceNode.value) {
        createBodyConnection(triggerSourceNode.value.id, newNode.id, 'out-1', 'in-1')
        triggerPortType.value = null
        triggerSourceNode.value = null
      }
    })
  } catch (error) {
    console.error('添加 Skill 节点失败:', error)
    ElMessage.error('系统服务异常！')
  }
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

/* 添加节点弹窗样式（与主画布一致） */
.add-node-popover {
  position: fixed;
  width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  transform: translate(10px, -50%);
  animation: popover-in 0.2s ease;
}

@keyframes popover-in {
  from {
    opacity: 0;
    transform: translate(0, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(10px, -50%) scale(1);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.close-icon {
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #6366f1;
}

.popover-content {
  padding: 12px;
  max-height: 480px;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 12px;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.category-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.popover-node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.popover-node-item:hover {
  background: #f3f4f6;
}

.popover-node-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.popover-node-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 1999;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
  z-index: 3000;
  animation: context-menu-in 0.15s ease;
}

@keyframes context-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: background 0.15s;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}

.context-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}
</style>
