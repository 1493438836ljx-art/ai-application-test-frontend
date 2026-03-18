<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  DocumentChecked,
  VideoPlay,
  Setting,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Delete,
  Plus,
  ChatDotRound,
  Document,
  Connection,
  Cpu,
  DataAnalysis,
  Brush,
  Link,
  Timer,
  Close,
  MoreFilled,
  Edit,
  CopyDocument,
  CircleCheck,
  Picture,
  Crop,
  Monitor,
  Microphone,
  Film,
  EditPen,
  Cpu as Robot,
  Stopwatch,
  TrendCharts,
  DataLine,
  DocumentAdd,
  Files,
  Grid,
  Upload,
  Tools,
  QuestionFilled,
  ArrowUp,
  ArrowDown,
  Position,
} from '@element-plus/icons-vue'
import AiChat from '@/components/chat/AiChat.vue'

const route = useRoute()
const router = useRouter()

// 工作流信息
const workflow = reactive({
  id: route.params.id || 'new',
  name: route.query.projectName || (route.params.id === 'new' ? '未命名工作流' : '智能问答工作流'),
  description: '',
  published: false,
  hasRun: false, // 是否已成功运行过
})

// 画布状态
const canvas = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  width: 3000,
  height: 2000,
})

// 节点类型分组配置
const nodeCategories = [
  { key: 'logic', name: '逻辑处理' },
  { key: 'testDesign', name: '测试设计' },
  { key: 'testPrep', name: '测试准备' },
  { key: 'testExec', name: '测试执行' },
  { key: 'eval', name: '结果评估' },
  { key: 'report', name: '报告' },
]

// 节点类型配置
const nodeTypes = [
  // 基础（不在弹窗中显示）
  { type: 'start', name: '开始', icon: 'VideoPlay', color: '#10b981', category: 'basic' },
  { type: 'end', name: '结束', icon: 'CircleCheck', color: '#ef4444', category: 'basic' },
  // 逻辑处理
  { type: 'condition', name: '条件判断', icon: 'Brush', color: '#ec4899', category: 'logic' },
  { type: 'loop', name: '循环', icon: 'Timer', color: '#3b82f6', category: 'logic' },
  // 测试准备
  { type: 'envConnect', name: '环境对接', icon: 'Monitor', color: '#64748b', category: 'testPrep' },
  { type: 'tableExtract', name: '表格提取', icon: 'Grid', color: '#10b981', category: 'testPrep' },
  { type: 'textClean', name: '文本清洗', icon: 'Document', color: '#6366f1', category: 'testPrep' },
  { type: 'textDedupe', name: '文本去重', icon: 'Files', color: '#8b5cf6', category: 'testPrep' },
  { type: 'textGeneralize', name: '文本泛化', icon: 'EditPen', color: '#a855f7', category: 'testPrep' },
  { type: 'textGenerate', name: '文本生成', icon: 'ChatDotRound', color: '#06b6d4', category: 'testPrep' },
  { type: 'imageGenerate', name: '图像生成', icon: 'Picture', color: '#f59e0b', category: 'testPrep' },
  { type: 'imageCutout', name: '抠图', icon: 'Crop', color: '#84cc16', category: 'testPrep' },
  { type: 'imageEnhance', name: '画质提升', icon: 'DataLine', color: '#22c55e', category: 'testPrep' },
  { type: 'videoExtractAudio', name: '视频提取音频', icon: 'Film', color: '#0ea5e9', category: 'testPrep' },
  { type: 'audioToText', name: '音频转文本', icon: 'Microphone', color: '#14b8a6', category: 'testPrep' },
  { type: 'videoFrame', name: '视频抽帧', icon: 'Film', color: '#64748b', category: 'testPrep' },
  // 测试设计
  { type: 'testPlan', name: '测试方案生成', icon: 'DocumentAdd', color: '#f97316', category: 'testDesign' },
  // 测试执行
  { type: 'apiAuto', name: '接口自动化', icon: 'Connection', color: '#3b82f6', category: 'testExec' },
  { type: 'aiAuto', name: 'AI自动化', icon: 'Cpu', color: '#8b5cf6', category: 'testExec' },
  // 结果评估
  { type: 'judgeModel', name: '裁判模型', icon: 'DataAnalysis', color: '#ec4899', category: 'eval' },
  { type: 'firstTokenLatency', name: '首Token响应时延', icon: 'Stopwatch', color: '#f59e0b', category: 'eval' },
  { type: 'tokenOutputTime', name: '每Token输出耗时', icon: 'TrendingCharts', color: '#06b6d4', category: 'eval' },
  { type: 'e2eLatency', name: '端到端时延', icon: 'Timer', color: '#6366f1', category: 'eval' },
  // 报告
  { type: 'reportGenerate', name: '生成报告', icon: 'DocumentAdd', color: '#10b981', category: 'report' },
  { type: 'reportAnalysis', name: '报告分析', icon: 'TrendCharts', color: '#0ea5e9', category: 'report' },
]

// 节点功能描述映射
const nodeDescriptions = {
  tableExtract: '从表格文件中提取指定列的数据',
  textClean: '对文本数据进行清洗、过滤和标准化处理',
}

// 变量类型级联选择器数据
const typeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  {
    value: 'array',
    label: 'Array',
    children: [
      { value: 'string', label: 'String' },
      { value: 'number', label: 'Number' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'object', label: 'Object' },
    ],
  },
]

// 将参数的 type 和 elementType 转换为级联选择器的值
const getTypeValue = (param) => {
  if (!param.type) return ['string']
  if (param.type === 'array') {
    return ['array', param.elementType || 'string']
  }
  return [param.type]
}

// 处理级联选择器值变化
const handleTypeChange = (value, row) => {
  if (!value || value.length === 0) {
    row.type = 'string'
    row.elementType = undefined
    return
  }
  if (value[0] === 'array') {
    row.type = 'array'
    row.elementType = value[1] || 'string'
  } else {
    row.type = value[0]
    row.elementType = undefined
  }
}

// 节点图标映射
const iconComponents = {
  VideoPlay,
  CircleCheck,
  Brush,
  Timer,
  Document,
  Files,
  EditPen,
  ChatDotRound,
  Picture,
  Crop,
  DataLine,
  Film,
  Microphone,
  DocumentAdd,
  Monitor,
  Connection,
  Cpu,
  DataAnalysis,
  Stopwatch,
  TrendCharts,
}

// 节点列表
const nodes = ref([
  {
    id: 'start-1',
    type: 'start',
    name: '开始',
    x: 100,
    y: 300,
    inputs: [],
    outputs: [{ id: 'out-1', name: '输出' }],
    outputParams: [{ name: 'input', type: 'String', elementType: 'string' }],
    inputParams: [],
    config: {},
  },
  {
    id: 'tableExtract-1',
    type: 'tableExtract',
    name: '表格提取',
    x: 380,
    y: 300,
    inputs: [{ id: 'in-te-1', name: '输入' }],
    outputs: [{ id: 'out-te-1', name: '输出' }],
    outputParams: [{ name: 'column1', type: 'String' }],
    config: {},
  },
  {
    id: 'textClean-1',
    type: 'textClean',
    name: '文本清洗',
    x: 660,
    y: 300,
    inputs: [{ id: 'in-tc-1', name: '输入' }],
    outputs: [{ id: 'out-tc-1', name: '输出' }],
    config: {},
  },
  {
    id: 'envConnect-1',
    type: 'envConnect',
    name: '环境对接',
    x: 940,
    y: 300,
    inputs: [{ id: 'in-env-1', name: '输入' }],
    outputs: [{ id: 'out-env-1', name: '输出' }],
    config: {},
  },
  {
    id: 'apiAuto-1',
    type: 'apiAuto',
    name: '接口自动化',
    x: 1220,
    y: 300,
    inputs: [{ id: 'in-api-1', name: '输入' }],
    outputs: [{ id: 'out-api-1', name: '输出' }],
    config: {},
  },
  {
    id: 'judgeModel-1',
    type: 'judgeModel',
    name: '裁判模型',
    x: 1500,
    y: 300,
    inputs: [{ id: 'in-jm-1', name: '输入' }],
    outputs: [{ id: 'out-jm-1', name: '输出' }],
    config: {},
  },
  {
    id: 'end-1',
    type: 'end',
    name: '结束',
    x: 1780,
    y: 300,
    inputs: [{ id: 'in-1', name: '输入' }],
    outputs: [],
    config: {},
  },
])

// 连线列表
const connections = ref([
  { id: 'conn-1', sourceId: 'start-1', sourcePort: 'out-1', targetId: 'tableExtract-1', targetPort: 'in-te-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-2', sourceId: 'tableExtract-1', sourcePort: 'out-te-1', targetId: 'textClean-1', targetPort: 'in-tc-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-3', sourceId: 'textClean-1', sourcePort: 'out-tc-1', targetId: 'envConnect-1', targetPort: 'in-env-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-4', sourceId: 'envConnect-1', sourcePort: 'out-env-1', targetId: 'apiAuto-1', targetPort: 'in-api-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-5', sourceId: 'apiAuto-1', sourcePort: 'out-api-1', targetId: 'judgeModel-1', targetPort: 'in-jm-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-6', sourceId: 'judgeModel-1', sourcePort: 'out-jm-1', targetId: 'end-1', targetPort: 'in-1', sourceParamIndex: 0, targetParamIndex: 0 },
])

// 选中的节点
const selectedNode = ref(null)

// 选中的连线
const selectedConnection = ref(null)

// 悬浮的连线
const hoveredConnection = ref(null)
let hoveredConnectionTimer = null

// 延迟清除悬停状态，避免鼠标移到添加按钮时闪烁
const handleConnectionMouseLeave = () => {
  hoveredConnectionTimer = setTimeout(() => {
    hoveredConnection.value = null
  }, 100)
}

const handleConnectionMouseEnter = (conn) => {
  if (hoveredConnectionTimer) {
    clearTimeout(hoveredConnectionTimer)
    hoveredConnectionTimer = null
  }
  hoveredConnection.value = conn
}

// 连线绘制状态
const drawingConnection = ref(null)

// 添加节点弹窗状态
const showAddNodePopover = ref(null) // 存储要添加子节点的父节点ID
const insertConnection = ref(null) // 存储要在中间插入节点的连线
const popoverPosition = ref({ x: 0, y: 0 })

// 长按检测状态
const longPressState = reactive({
  isLongPress: false,
  timer: null,
  startTime: 0,
  startX: 0,
  startY: 0,
  node: null,
  port: null,
})

// 画布引用
const canvasRef = ref(null)
const canvasContainerRef = ref(null)

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  node: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
})

// 画布拖拽状态
const canvasDragState = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
})

// 获取添加按钮的实际 DOM 位置（用于开始节点的连线起点）
const getActionBtnDomPosition = (nodeId) => {
  const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`)
  if (!nodeElement) return null

  const btnElement = nodeElement.querySelector('.node-action-btn')
  if (!btnElement) return null

  const btnRect = btnElement.getBoundingClientRect()
  const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()
  if (!canvasRect) return null

  return {
    x: btnRect.left + btnRect.width / 2 - canvasRect.left,
    y: btnRect.top + btnRect.height / 2 - canvasRect.top,
  }
}

// 获取端口的实际 DOM 位置
const getPortDomPosition = (nodeId, paramIndex, type, nodeType = null) => {
  const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`)
  if (!nodeElement) return null

  // 如果是开始节点且类型是输出，使用添加按钮的位置
  if (nodeType === 'start' && type === 'output') {
    return getActionBtnDomPosition(nodeId)
  }

  const portSelector = type === 'output' ? '.output-port' : '.input-port'
  const ports = nodeElement.querySelectorAll(portSelector)
  const portElement = ports[paramIndex]
  if (!portElement) return null

  const portRect = portElement.getBoundingClientRect()
  const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()
  if (!canvasRect) return null

  return {
    x: portRect.left + portRect.width / 2 - canvasRect.left,
    y: portRect.top + portRect.height / 2 - canvasRect.top,
  }
}

// 计算连线路径
const getConnectionPath = (connection) => {
  const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
  const targetNode = nodes.value.find((n) => n.id === connection.targetId)

  if (!sourceNode || !targetNode) return ''

  // 获取参数索引，如果没有则使用0（兼容旧数据）
  const sourceParamIndex = connection.sourceParamIndex ?? 0
  const targetParamIndex = connection.targetParamIndex ?? 0

  // 尝试使用 DOM 获取端口实际位置
  const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
  const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

  let x1, y1, x2, y2

  if (sourcePortPos && targetPortPos) {
    x1 = sourcePortPos.x
    y1 = sourcePortPos.y
    x2 = targetPortPos.x
    y2 = targetPortPos.y
  } else {
    // 回退到计算位置
    const nodeWidth = 220
    // 计算起点：开始节点使用添加按钮位置（right: -14px, width: 18px, center: -5px）
    // 其他节点使用节点右侧边缘
    if (sourceNode.type === 'start') {
      x1 = sourceNode.x + nodeWidth - 5 // 添加按钮中心位置
      // 开始节点的 Y 位置：节点垂直居中
      const params = getNodeOutputParams(sourceNode)
      const paramsHeight = params.length > 0 ? 32 : 0
      const nodeHeight = 40 + paramsHeight
      y1 = sourceNode.y + nodeHeight / 2
    } else {
      y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
      x1 = sourceNode.x + nodeWidth
    }
    y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
    x2 = targetNode.x
  }

  // 贝塞尔曲线控制点
  const distance = Math.abs(x2 - x1)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`
}

// 计算连线中点坐标（用于显示添加按钮）
const getConnectionMidpoint = (connection) => {
  const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
  const targetNode = nodes.value.find((n) => n.id === connection.targetId)

  if (!sourceNode || !targetNode) return null

  // 获取参数索引
  const sourceParamIndex = connection.sourceParamIndex ?? 0
  const targetParamIndex = connection.targetParamIndex ?? 0

  // 尝试使用 DOM 获取端口实际位置
  const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
  const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

  let x1, y1, x2, y2

  if (sourcePortPos && targetPortPos) {
    x1 = sourcePortPos.x
    y1 = sourcePortPos.y
    x2 = targetPortPos.x
    y2 = targetPortPos.y
  } else {
    // 回退到计算位置
    const nodeWidth = 220
    // 计算起点：开始节点使用添加按钮位置
    if (sourceNode.type === 'start') {
      x1 = sourceNode.x + nodeWidth - 5
      const params = getNodeOutputParams(sourceNode)
      const paramsHeight = params.length > 0 ? 32 : 0
      const nodeHeight = 40 + paramsHeight
      y1 = sourceNode.y + nodeHeight / 2
    } else {
      y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
      x1 = sourceNode.x + nodeWidth
    }
    y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
    x2 = targetNode.x
  }

  // 贝塞尔曲线在 t=0.5 时的点
  const distance = Math.abs(x2 - x1)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

  const cx1 = x1 + controlOffset
  const cy1 = y1
  const cx2 = x2 - controlOffset
  const cy2 = y2

  // 三次贝塞尔曲线 t=0.5 时的公式
  const t = 0.5
  const mt = 1 - t
  const x = mt * mt * mt * x1 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x2
  const y = mt * mt * mt * y1 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y2

  return { x, y }
}

// 计算临时连线路径
const tempConnectionPath = computed(() => {
  if (!drawingConnection.value) return ''
  const { startX, startY, endX, endY } = drawingConnection.value

  const distance = Math.abs(endX - startX)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`
})

// 计算连线路径的一部分（用于分层渲染）
// part: 'start' 返回前半部分（在节点下层），'end' 返回后半部分（在节点上层）
const getConnectionPathPart = (connection, part) => {
  const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
  const targetNode = nodes.value.find((n) => n.id === connection.targetId)

  if (!sourceNode || !targetNode) return ''

  // 获取参数索引
  const sourceParamIndex = connection.sourceParamIndex ?? 0
  const targetParamIndex = connection.targetParamIndex ?? 0

  // 尝试使用 DOM 获取端口实际位置
  const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
  const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

  let x1, y1, x2, y2

  if (sourcePortPos && targetPortPos) {
    x1 = sourcePortPos.x
    y1 = sourcePortPos.y
    x2 = targetPortPos.x
    y2 = targetPortPos.y
  } else {
    // 回退到计算位置
    const nodeWidth = 220
    // 计算起点：开始节点使用添加按钮位置
    if (sourceNode.type === 'start') {
      x1 = sourceNode.x + nodeWidth - 5
      const params = getNodeOutputParams(sourceNode)
      const paramsHeight = params.length > 0 ? 32 : 0
      const nodeHeight = 40 + paramsHeight
      y1 = sourceNode.y + nodeHeight / 2
    } else {
      y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
      x1 = sourceNode.x + nodeWidth
    }
    y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
    x2 = targetNode.x
  }

  // 贝塞尔曲线控制点
  const distance = Math.abs(x2 - x1)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

  // 原始三次贝塞尔曲线的四个控制点
  // P0 = 起点, P1 = 第一个控制点, P2 = 第二个控制点, P3 = 终点
  const p0x = x1
  const p0y = y1
  const p1x = x1 + controlOffset
  const p1y = y1
  const p2x = x2 - controlOffset
  const p2y = y2
  const p3x = x2
  const p3y = y2

  // 使用 de Casteljau 算法在 t=0.5 处分割贝塞尔曲线
  const t = 0.5

  // 第一层插值
  const q0x = (1 - t) * p0x + t * p1x
  const q0y = (1 - t) * p0y + t * p1y
  const q1x = (1 - t) * p1x + t * p2x
  const q1y = (1 - t) * p1y + t * p2y
  const q2x = (1 - t) * p2x + t * p3x
  const q2y = (1 - t) * p2y + t * p3y

  // 第二层插值
  const r0x = (1 - t) * q0x + t * q1x
  const r0y = (1 - t) * q0y + t * q1y
  const r1x = (1 - t) * q1x + t * q2x
  const r1y = (1 - t) * q1y + t * q2y

  // 中点（第三层插值）
  const midX = (1 - t) * r0x + t * r1x
  const midY = (1 - t) * r0y + t * r1y

  if (part === 'start') {
    // 前半部分：从起点到中点，控制点是 Q0 和 R0
    return `M ${p0x} ${p0y} C ${q0x} ${q0y}, ${r0x} ${r0y}, ${midX} ${midY}`
  } else {
    // 后半部分：从中点到终点，控制点是 R1 和 Q2
    return `M ${midX} ${midY} C ${r1x} ${r1y}, ${q2x} ${q2y}, ${p3x} ${p3y}`
  }
}

// 计算临时连线路径的一部分
const getTempConnectionPathPart = (part) => {
  if (!drawingConnection.value) return ''
  const { startX, startY, endX, endY } = drawingConnection.value

  const distance = Math.abs(endX - startX)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

  // 原始三次贝塞尔曲线的四个控制点
  const p0x = startX
  const p0y = startY
  const p1x = startX + controlOffset
  const p1y = startY
  const p2x = endX - controlOffset
  const p2y = endY
  const p3x = endX
  const p3y = endY

  // 使用 de Casteljau 算法在 t=0.5 处分割贝塞尔曲线
  const t = 0.5

  // 第一层插值
  const q0x = (1 - t) * p0x + t * p1x
  const q0y = (1 - t) * p0y + t * p1y
  const q1x = (1 - t) * p1x + t * p2x
  const q1y = (1 - t) * p1y + t * p2y
  const q2x = (1 - t) * p2x + t * p3x
  const q2y = (1 - t) * p2y + t * p3y

  // 第二层插值
  const r0x = (1 - t) * q0x + t * q1x
  const r0y = (1 - t) * q0y + t * q1y
  const r1x = (1 - t) * q1x + t * q2x
  const r1y = (1 - t) * q1y + t * q2y

  // 中点（第三层插值）
  const midX = (1 - t) * r0x + t * r1x
  const midY = (1 - t) * r0y + t * r1y

  if (part === 'start') {
    return `M ${p0x} ${p0y} C ${q0x} ${q0y}, ${r0x} ${r0y}, ${midX} ${midY}`
  } else {
    return `M ${midX} ${midY} C ${r1x} ${r1y}, ${q2x} ${q2y}, ${p3x} ${p3y}`
  }
}

// 获取节点类型配置
const getNodeTypeConfig = (type) => {
  return nodeTypes.find((t) => t.type === type) || nodeTypes[0]
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponents[iconName]
}

// 缩放画布
const zoomIn = () => {
  canvas.scale = Math.min(2, canvas.scale + 0.1)
}

const zoomOut = () => {
  canvas.scale = Math.max(0.5, canvas.scale - 0.1)
}

const resetZoom = () => {
  canvas.scale = 1
}

// 返回列表
const goBack = () => {
  router.push('/workflow')
}

// 保存工作流
const saveWorkflow = async () => {
  try {
    // 保存逻辑
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 运行工作流
const runWorkflow = () => {
  runState.isRunning = true
  runState.logs = []
  runState.currentStep = 0
  runState.totalSteps = nodes.value.length

  addRunLog('info', '开始运行工作流...')
  addRunLog('info', `工作流名称: ${workflow.name}`)
  addRunLog('info', `节点总数: ${nodes.value.length}`)

  // 找到开始节点
  const startNode = nodes.value.find((n) => n.type === 'start')
  if (!startNode) {
    addRunLog('error', '未找到开始节点')
    runState.isRunning = false
    return
  }

  addRunLog('info', '正在初始化工作流...')

  // 模拟运行过程
  let delay = 500
  nodes.value.forEach((node, index) => {
    setTimeout(() => {
      runState.currentStep = index + 1
      addRunLog('info', `正在执行节点 [${index + 1}/${nodes.value.length}]: ${node.name}`)

      // 模拟每个节点的执行
      setTimeout(() => {
        if (node.type === 'start') {
          addRunLog('success', '开始节点初始化完成')
        } else if (node.type === 'end') {
          addRunLog('success', '工作流执行完成')
          workflow.hasRun = true
        } else {
          addRunLog('success', `节点 "${node.name}" 执行成功`)
        }
      }, 300)
    }, delay)
    delay += 800
  })

  // 运行完成后保持面板显示
  setTimeout(() => {
    runState.isRunning = false
    ElMessage.success('工作流运行成功')
  }, delay + 500)
}

// 发布工作流
const publishWorkflow = () => {
  if (!workflow.hasRun) {
    ElMessage.warning('请先运行工作流')
    return
  }

  ElMessageBox.confirm('确定要发布此工作流吗？发布后可在任务管理中创建执行任务。', '确认发布', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      workflow.published = true
      ElMessage.success('工作流发布成功')
    })
    .catch(() => {
      // 用户取消
    })
}

// 添加节点
const addNode = (type) => {
  const typeConfig = getNodeTypeConfig(type)
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    name: typeConfig.name,
    x: 200 + Math.random() * 200,
    y: 200 + Math.random() * 200,
    inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
    outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
    config: {},
  }

  // 开始和结束节点特殊处理
  if (type === 'start') {
    newNode.inputs = []
    newNode.inputParams = []
  } else if (type === 'end') {
    newNode.outputs = []
  }

  nodes.value.push(newNode)
  selectedNode.value = newNode
}

// 重命名节点
const renameDialogVisible = ref(false)
const newNodeName = ref('')

// 调试状态
const debugState = reactive({
  showDialog: false, // 控制弹窗显示
  currentNode: null,
  logs: [],
})

// AI聊天框状态
const aiChatExpanded = ref(false)
const aiChatMessages = ref([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是工作流AI助手，有什么可以帮助你的吗？',
    time: new Date(),
  },
])
const aiChatInput = ref('')
const aiChatIsTyping = ref(false)
const aiChatMessagesRef = ref(null)

// 切换AI聊天框展开/折叠
const toggleAiChat = () => {
  aiChatExpanded.value = !aiChatExpanded.value
}

// 预设的AI回复
const aiReplies = [
  '这是一个很好的问题！让我来帮你分析一下。',
  '我理解你的需求。根据你的描述，我建议...',
  '好的，我已经收到你的消息了。请问还有什么需要补充的吗？',
  '这个问题很有趣！从技术角度来看...',
  '感谢你的提问。我可以为你提供以下建议...',
  '明白了，让我帮你处理这个需求。',
]

// 发送AI消息
const sendAiMessage = async () => {
  const content = aiChatInput.value.trim()
  if (!content) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content,
    time: new Date(),
  }
  aiChatMessages.value.push(userMessage)
  aiChatInput.value = ''

  await nextTick()
  scrollAiChatToBottom()

  aiChatIsTyping.value = true

  setTimeout(async () => {
    aiChatIsTyping.value = false
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: aiReplies[Math.floor(Math.random() * aiReplies.length)],
      time: new Date(),
    }
    aiChatMessages.value.push(aiMessage)
    await nextTick()
    scrollAiChatToBottom()
  }, 1000 + Math.random() * 1000)
}

// 滚动AI聊天到底部
const scrollAiChatToBottom = () => {
  if (aiChatMessagesRef.value) {
    aiChatMessagesRef.value.scrollTop = aiChatMessagesRef.value.scrollHeight
  }
}

// 格式化AI聊天时间
const formatAiChatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 清空AI聊天记录
const clearAiChat = () => {
  aiChatMessages.value = [
    {
      id: Date.now(),
      type: 'ai',
      content: '对话已清空，有什么新问题吗？',
      time: new Date(),
    },
  ]
}

// 处理AI聊天输入回车
const handleAiChatKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendAiMessage()
  }
}

// 调试节点
const debugNode = () => {
  if (!selectedNode.value) return

  debugState.showDialog = true
  debugState.currentNode = selectedNode.value
  debugState.logs = []

  // 添加调试开始日志
  addDebugLog('info', `开始调试节点: ${selectedNode.value.name}`)

  // 模拟调试过程
  setTimeout(() => {
    addDebugLog('info', '正在初始化节点配置...')
  }, 300)

  setTimeout(() => {
    addDebugLog('info', `节点类型: ${selectedNode.value.type}`)
    if (selectedNode.value.config) {
      addDebugLog('info', `配置参数: ${JSON.stringify(selectedNode.value.config)}`)
    }
  }, 600)

  setTimeout(() => {
    addDebugLog('info', '正在执行节点逻辑...')
  }, 1000)

  setTimeout(() => {
    addDebugLog('success', `节点 "${selectedNode.value.name}" 执行完成`)
  }, 1500)
}

// 添加调试日志
const addDebugLog = (type, message) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  debugState.logs.push({
    id: Date.now(),
    type,
    message,
    timestamp,
  })
}

// 停止调试
const stopDebug = () => {
  debugState.showDialog = false
  debugState.currentNode = null
}

// 清空调试日志
const clearDebugLogs = () => {
  debugState.logs = []
}

// 运行状态
const runState = reactive({
  isRunning: false,
  logs: [],
  currentStep: 0,
  totalSteps: 0,
})

// 运行工作流
const runWorkflowWithLogs = () => {
  runState.isRunning = true
  runState.logs = []
  runState.currentStep = 0
  runState.totalSteps = nodes.value.length

  addRunLog('info', '开始运行工作流...')
  addRunLog('info', `工作流名称: ${workflow.name}`)
  addRunLog('info', `节点总数: ${nodes.value.length}`)

  // 找到开始节点
  const startNode = nodes.value.find((n) => n.type === 'start')
  if (!startNode) {
    addRunLog('error', '未找到开始节点')
    runState.isRunning = false
    return
  }

  addRunLog('info', '正在初始化工作流...')

  // 模拟运行过程
  let delay = 500
  nodes.value.forEach((node, index) => {
    setTimeout(() => {
      runState.currentStep = index + 1
      addRunLog('info', `正在执行节点 [${index + 1}/${nodes.value.length}]: ${node.name}`)

      // 模拟每个节点的执行
      setTimeout(() => {
        if (node.type === 'start') {
          addRunLog('success', '开始节点初始化完成')
        } else if (node.type === 'end') {
          addRunLog('success', '工作流执行完成')
          workflow.hasRun = true
          runState.isRunning = false
        } else {
          addRunLog('success', `节点 "${node.name}" 执行成功`)
        }
      }, 300)
    }, delay)
    delay += 800
  })
}

// 添加运行日志
const addRunLog = (type, message) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  runState.logs.push({
    id: Date.now(),
    type,
    message,
    timestamp,
  })
}

// 停止运行
const stopRun = () => {
  runState.isRunning = false
  addRunLog('warning', '工作流运行已停止')
}

// 清空运行日志
const clearRunLogs = () => {
  runState.logs = []
}

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null,
  connection: null, // 连线右键菜单支持
})

// 显示右键菜单
const showContextMenu = (node, event) => {
  event.preventDefault()
  event.stopPropagation()

  selectNode(node)

  contextMenu.visible = true
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.node = node
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenu.visible = false
  contextMenu.node = null
  contextMenu.connection = null
}

// 右键菜单操作：重命名
const contextMenuRename = () => {
  hideContextMenu()
  showRenameDialog()
}

// 右键菜单操作：创建副本
const contextMenuDuplicate = () => {
  hideContextMenu()
  duplicateNode()
}

// 右键菜单操作：删除
const contextMenuDelete = () => {
  hideContextMenu()
  deleteSelectedNode()
}

// 右键菜单操作：调整布局
const contextMenuAutoLayout = () => {
  hideContextMenu()
  autoLayoutNodes()
}

// 显示连线右键菜单
const showConnectionContextMenu = (connection, event) => {
  event.preventDefault()
  event.stopPropagation()

  selectConnection(connection)

  contextMenu.visible = true
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.connection = connection
}

// 连线右键菜单操作：添加节点
const connectionMenuAddNode = () => {
  if (!contextMenu.connection) return
  const connection = contextMenu.connection
  hideContextMenu()

  // 计算连线中点位置作为弹窗位置
  const midpoint = getConnectionMidpoint(connection)
  if (midpoint) {
    popoverPosition.value = { x: midpoint.x, y: midpoint.y }
  }
  showAddPopoverForConnection(connection, { stopPropagation: () => {}, clientX: midpoint?.x || 0, clientY: midpoint?.y || 0 })
}

// 连线右键菜单操作：删除连线
const connectionMenuDelete = () => {
  if (!contextMenu.connection) return
  selectedConnection.value = contextMenu.connection
  hideContextMenu()
  deleteSelectedConnection()
}

// 自动调整节点布局
const autoLayoutNodes = async () => {
  if (nodes.value.length === 0) return

  // 布局参数（根据实际节点样式调整）
  const nodeWidth = 220 // 节点实际宽度
  const nodeHeight = 100 // 节点平均高度（动态高度的估算值）
  const horizontalGap = 100 // 水平间距
  const verticalGap = 60 // 垂直间距
  const startX = 100
  const startY = 100

  // 计算每个节点的层级（基于连接关系）
  const nodeLevels = new Map()
  const nodeChildren = new Map()
  const nodeParents = new Map()

  // 初始化
  nodes.value.forEach((node) => {
    nodeChildren.set(node.id, [])
    nodeParents.set(node.id, [])
  })

  // 构建父子关系
  connections.value.forEach((conn) => {
    const children = nodeChildren.get(conn.sourceId) || []
    children.push(conn.targetId)
    nodeChildren.set(conn.sourceId, children)

    const parents = nodeParents.get(conn.targetId) || []
    parents.push(conn.sourceId)
    nodeParents.set(conn.targetId, parents)
  })

  // 找出所有根节点（没有父节点的节点）
  const rootNodes = nodes.value.filter((node) => {
    const parents = nodeParents.get(node.id) || []
    return parents.length === 0
  })

  // BFS 计算层级
  const visited = new Set()
  const queue = rootNodes.map((node) => ({ id: node.id, level: 0 }))

  while (queue.length > 0) {
    const { id, level } = queue.shift()

    if (visited.has(id)) continue
    visited.add(id)

    nodeLevels.set(id, level)

    const children = nodeChildren.get(id) || []
    children.forEach((childId) => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }

  // 处理未被访问的节点（孤立节点）
  let maxLevel = Math.max(...Array.from(nodeLevels.values()), 0)
  nodes.value.forEach((node) => {
    if (!nodeLevels.has(node.id)) {
      nodeLevels.set(node.id, ++maxLevel)
    }
  })

  // 按层级分组
  const levelGroups = new Map()
  nodeLevels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level).push(nodeId)
  })

  // 计算节点位置
  levelGroups.forEach((nodeIds, level) => {
    const x = startX + level * (nodeWidth + horizontalGap)
    const totalHeight = nodeIds.length * nodeHeight + (nodeIds.length - 1) * verticalGap
    const startOffsetY = startY - totalHeight / 2 + nodeHeight / 2

    nodeIds.forEach((nodeId, index) => {
      const node = nodes.value.find((n) => n.id === nodeId)
      if (node) {
        node.x = x
        node.y = startOffsetY + index * (nodeHeight + verticalGap)
      }
    })
  })

  // 等待 DOM 更新后触发连线重新渲染
  await nextTick()
  if (connections.value.length > 0) {
    const temp = [...connections.value]
    connections.value = temp
  }

  ElMessage.success('布局已调整')
}

const showRenameDialog = () => {
  if (!selectedNode.value) return
  newNodeName.value = selectedNode.value.name
  renameDialogVisible.value = true
}

const confirmRename = () => {
  if (!selectedNode.value || !newNodeName.value.trim()) return
  selectedNode.value.name = newNodeName.value.trim()
  renameDialogVisible.value = false
  ElMessage.success('重命名成功')
}

// 创建节点副本
const duplicateNode = () => {
  if (!selectedNode.value) return

  const originalNode = selectedNode.value
  const newNode = {
    ...JSON.parse(JSON.stringify(originalNode)),
    id: `${originalNode.type}-${Date.now()}`,
    name: `${originalNode.name} (副本)`,
    x: originalNode.x + 50,
    y: originalNode.y + 50,
  }

  nodes.value.push(newNode)
  ElMessage.success('副本创建成功')
}

// 删除选中节点
const deleteSelectedNode = () => {
  if (!selectedNode.value) return

  const nodeId = selectedNode.value.id
  nodes.value = nodes.value.filter((n) => n.id !== nodeId)
  connections.value = connections.value.filter(
    (c) => c.sourceId !== nodeId && c.targetId !== nodeId
  )
  selectedNode.value = null
}

// 删除选中连线
const deleteSelectedConnection = () => {
  if (!selectedConnection.value) return
  connections.value = connections.value.filter((c) => c.id !== selectedConnection.value.id)
  selectedConnection.value = null
}

// 选中节点
const selectNode = (node, event) => {
  event?.stopPropagation()
  hideContextMenu()
  selectedNode.value = node
  selectedConnection.value = null
  // 初始化条件判断节点配置
  if (node.type === 'condition') {
    initConditionConfig()
  }
  // 初始化文本清洗节点配置
  if (node.type === 'textClean') {
    initTextCleanConfig()
  }
}

// 选中连线
const selectConnection = (connection, event) => {
  event?.stopPropagation()
  hideContextMenu()
  selectedConnection.value = connection
  selectedNode.value = null
  // 选中连线时同时设置悬浮状态，保持视觉效果一致
  hoveredConnection.value = connection
}

// 取消选择
const deselectAll = () => {
  selectedNode.value = null
  selectedConnection.value = null
  hoveredConnection.value = null
  showAddNodePopover.value = null
}

// 处理画布点击事件
const handleCanvasClick = () => {
  deselectAll()
  hideContextMenu()
}

// 添加输入参数
const addInputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.inputParams) {
    selectedNode.value.inputParams = []
  }
  selectedNode.value.inputParams.push({
    name: '',
    type: 'string',
    required: false,
  })
}

// 删除输入参数
const removeInputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.inputParams) return
  selectedNode.value.inputParams.splice(index, 1)
}

// 添加输出参数（用于开始节点）
const addOutputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.outputParams) {
    selectedNode.value.outputParams = []
  }
  selectedNode.value.outputParams.push({
    name: '',
    type: 'string',
    elementType: 'string',
    required: false,
  })
}

// 删除输出参数（用于开始节点）
const removeOutputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.outputParams) return
  selectedNode.value.outputParams.splice(index, 1)
}

// 添加输出参数（用于表格提取节点）
const addTableExtractOutputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.outputParams) {
    selectedNode.value.outputParams = []
  }
  const columnCount = selectedNode.value.outputParams.length + 1
  selectedNode.value.outputParams.push({
    name: `column${columnCount}`,
    type: 'String',
  })
}

// 删除输出参数（用于表格提取节点）
const removeTableExtractOutputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.outputParams) return
  selectedNode.value.outputParams.splice(index, 1)
}

// 获取可用的变量列表（从开始节点的输入参数获取）
const getAvailableVariables = () => {
  const startNode = nodes.value.find((n) => n.type === 'start')
  if (!startNode || !startNode.inputParams) return []
  return startNode.inputParams.map((param) => ({
    name: param.name,
    type: param.type,
  }))
}

// 格式化参数类型显示（数组类型显示元素类型）
const formatParamType = (param) => {
  if (!param.type) return 'String'
  if (param.type === 'array' && param.elementType) {
    const elementTypes = {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      object: 'Object',
    }
    return `Array[${elementTypes[param.elementType] || 'String'}]`
  }
  // 首字母大写
  return param.type.charAt(0).toUpperCase() + param.type.slice(1)
}

// 获取节点的输入参数（用于在节点方框中显示）
const getNodeInputParams = (node) => {
  if (!node) return []

  // 开始节点：输入参数与输出参数相同
  if (node.type === 'start') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // 表格提取节点：输入参数
  if (node.type === 'tableExtract') {
    return [
      {
        name: 'file',
        type: 'File',
        required: true,
        description: '需要提取数据的表格文件',
      },
    ]
  }

  // 文本清洗节点：输入参数
  if (node.type === 'textClean') {
    return [
      {
        name: 'input_file',
        type: 'File',
        required: true,
        description: '需要被清洗的目标xlsx文件',
      },
      {
        name: 'cols',
        type: 'String',
        required: true,
        description: '指定xlsx文件中需要清洗的列（英文逗号分隔）',
      },
      {
        name: 'remove_extra_spaces',
        type: 'Boolean',
        required: false,
        description: '是否去除多余空格',
      },
      {
        name: 'remove_html_tags',
        type: 'Boolean',
        required: false,
        description: '是否去除HTML标签',
      },
      {
        name: 'remove_special_chars',
        type: 'Boolean',
        required: false,
        description: '是否去除特殊字符',
      },
      {
        name: 'standardized_newline_char',
        type: 'Boolean',
        required: false,
        description: '是否标准化换行符',
      },
      {
        name: 'trim_front_back',
        type: 'Boolean',
        required: false,
        description: '是否去除首尾空白',
      },
    ]
  }

  // 条件判断节点：从变量配置获取
  if (node.type === 'condition') {
    const variables = new Set()
    if (node.config?.branches) {
      node.config.branches.forEach((branch) => {
        branch.conditions?.forEach((cond) => {
          if (cond.variable) {
            variables.add(cond.variable)
          }
        })
      })
    }
    return Array.from(variables).map((v) => ({
      name: v,
      type: 'Any',
    }))
  }

  // 其他节点：默认输入参数
  return [{ name: 'input', type: 'Any' }]
}

// 获取节点的输出参数（用于在节点方框中显示）
const getNodeOutputParams = (node) => {
  if (!node) return []

  // 开始节点：从 outputParams 配置读取
  if (node.type === 'start') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      // 没有定义输出参数时，显示占位符
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // 结束节点：输出参数与输入参数相同
  if (node.type === 'end') {
    const inputParams = getNodeInputParams(node)
    if (inputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return inputParams
  }

  // 表格提取节点：从 outputParams 配置读取（支持用户增减）
  if (node.type === 'tableExtract') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: 'String',
    }))
  }

  // 文本清洗节点：输出参数为 output_file
  if (node.type === 'textClean') {
    return [
      {
        name: 'output_file',
        type: 'File',
        description: '被清洗之后的xlsx文件',
      },
    ]
  }

  // 条件判断节点：输出布尔值
  if (node.type === 'condition') {
    return [{ name: 'result', type: 'Boolean' }]
  }

  // AI自动化节点
  if (node.type === 'aiAuto') {
    return [
      { name: 'response', type: 'String' },
      { name: 'tokens', type: 'Number' },
    ]
  }

  // 接口自动化节点
  if (node.type === 'apiAuto') {
    return [
      { name: 'response', type: 'JSON' },
      { name: 'statusCode', type: 'Number' },
    ]
  }

  // 文本生成节点
  if (node.type === 'textGenerate') {
    return [{ name: 'text', type: 'String' }]
  }

  // 图像生成节点
  if (node.type === 'imageGenerate') {
    return [{ name: 'imageUrl', type: 'String' }]
  }

  // 音频转文本节点
  if (node.type === 'audioToText') {
    return [{ name: 'text', type: 'String' }]
  }

  // 裁判模型节点
  if (node.type === 'judgeModel') {
    return [
      { name: 'score', type: 'Number' },
      { name: 'reason', type: 'String' },
    ]
  }

  // 时延相关节点
  if (['firstTokenLatency', 'tokenOutputTime', 'e2eLatency'].includes(node.type)) {
    return [{ name: 'latency', type: 'Number' }]
  }

  // 报告生成节点
  if (node.type === 'reportGenerate') {
    return [{ name: 'reportUrl', type: 'String' }]
  }

  // 默认情况下显示占位输出参数
  return [{ name: '-', type: '-', isPlaceholder: true }]
}

// 初始化条件判断节点配置
const initConditionConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.branches) {
    selectedNode.value.config.branches = [
      {
        id: `branch-${Date.now()}`,
        name: '分支1',
        logic: 'and',
        conditions: [
          {
            id: `cond-${Date.now()}`,
            variable: '',
            operator: 'eq',
            value: '',
          },
        ],
      },
    ]
  }
}

// 添加条件分支
const addConditionBranch = () => {
  if (!selectedNode.value) return
  initConditionConfig()
  const branchCount = selectedNode.value.config.branches.length + 1
  selectedNode.value.config.branches.push({
    id: `branch-${Date.now()}`,
    name: `分支${branchCount}`,
    logic: 'and',
    conditions: [
      {
        id: `cond-${Date.now()}`,
        variable: '',
        operator: 'eq',
        value: '',
      },
    ],
  })
  // 更新节点的输出端口
  updateConditionOutputs()
}

// 删除条件分支
const removeConditionBranch = (index) => {
  if (!selectedNode.value || !selectedNode.value.config.branches) return
  if (selectedNode.value.config.branches.length <= 1) return
  selectedNode.value.config.branches.splice(index, 1)
  // 更新节点的输出端口
  updateConditionOutputs()
}

// 添加条件
const addCondition = (branchIndex) => {
  if (!selectedNode.value || !selectedNode.value.config.branches) return
  const branch = selectedNode.value.config.branches[branchIndex]
  if (!branch.conditions) {
    branch.conditions = []
  }
  branch.conditions.push({
    id: `cond-${Date.now()}`,
    variable: '',
    operator: 'eq',
    value: '',
  })
}

// 删除条件
const removeCondition = (branchIndex, condIndex) => {
  if (!selectedNode.value || !selectedNode.value.config.branches) return
  const branch = selectedNode.value.config.branches[branchIndex]
  if (!branch.conditions) return
  branch.conditions.splice(condIndex, 1)
  // 如果分支没有条件了，添加一个空条件
  if (branch.conditions.length === 0) {
    branch.conditions.push({
      id: `cond-${Date.now()}`,
      variable: '',
      operator: 'eq',
      value: '',
    })
  }
}

// 更新条件节点的输出端口
const updateConditionOutputs = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'condition') return
  const branches = selectedNode.value.config.branches || []
  const outputs = branches.map((branch, index) => ({
    id: `out-branch-${index}`,
    name: branch.name,
  }))
  // 添加默认分支输出
  outputs.push({
    id: 'out-default',
    name: '默认',
  })
  selectedNode.value.outputs = outputs
}

// 测评集列表数据
const datasetList = ref([
  {
    id: '1',
    name: '通用对话测评集',
    dictionaryId: 'dict-1',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'input', label: '输入', type: 'string' },
      { key: 'expectedOutput', label: '期望输出', type: 'string' },
    ],
  },
  {
    id: '2',
    name: '代码生成测评集',
    dictionaryId: 'dict-2',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
    ],
  },
  {
    id: '3',
    name: '文本摘要测评集',
    dictionaryId: 'dict-3',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'originalText', label: '原文', type: 'string' },
      { key: 'expectedSummary', label: '期望摘要', type: 'string' },
    ],
  },
  {
    id: '4',
    name: '情感分析测评集',
    dictionaryId: 'dict-5',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'text', label: '文本', type: 'string' },
      { key: 'expectedSentiment', label: '期望情感', type: 'enum' },
    ],
  },
  {
    id: '5',
    name: '翻译能力测评集',
    dictionaryId: 'dict-6',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'sourceText', label: '源文本', type: 'string' },
      { key: 'expectedTranslation', label: '期望翻译', type: 'string' },
    ],
  },
])

// 当前正在选择变量的字段
const variableSelectorField = ref(null)
const showVariableSelectorDialog = ref(false)

// 处理文件上传
const handleFileUpload = (file, field) => {
  if (!selectedNode.value) return false

  // 检查文件类型
  const isValidType = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  if (!isValidType) {
    ElMessage.warning('请上传 xlsx 或 xls 格式的文件')
    return false
  }

  // 模拟上传，将文件名存储到配置中
  selectedNode.value.config[field] = file.name
  ElMessage.success(`文件 ${file.name} 已选择`)
  return false // 阻止自动上传
}

// 显示变量选择器
const showVariableSelector = (field) => {
  variableSelectorField.value = field
  showVariableSelectorDialog.value = true
}

// 获取前置节点的输出变量列表
const getUpstreamNodeOutputs = () => {
  if (!selectedNode.value) return []

  const outputs = []
  const visitedNodes = new Set()

  // 递归获取所有前置节点
  const findUpstreamNodes = (nodeId) => {
    if (visitedNodes.has(nodeId)) return
    visitedNodes.add(nodeId)

    // 找到连接到当前节点的连线
    const incomingConns = connections.value.filter((c) => c.targetId === nodeId)
    incomingConns.forEach((conn) => {
      const sourceNode = nodes.value.find((n) => n.id === conn.sourceId)
      if (sourceNode && !visitedNodes.has(sourceNode.id)) {
        // 获取该节点的输出参数
        const nodeOutputs = getNodeOutputParams(sourceNode)
        nodeOutputs.forEach((param) => {
          outputs.push({
            nodeId: sourceNode.id,
            nodeName: sourceNode.name,
            param: param.name,
            type: param.type,
            variable: `\${${sourceNode.name}.${param.name}}`,
          })
        })
        // 继续向上查找
        findUpstreamNodes(sourceNode.id)
      }
    })
  }

  findUpstreamNodes(selectedNode.value.id)
  return outputs
}

// 选择变量
const selectVariable = (variable) => {
  if (!selectedNode.value || !variableSelectorField.value) return
  selectedNode.value.config[variableSelectorField.value] = variable
  showVariableSelectorDialog.value = false
  variableSelectorField.value = null
}

// 初始化文本清洗节点配置
const initTextCleanConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.inputType) {
    selectedNode.value.config.inputType = 'text' // 'text' | 'dataset'
    selectedNode.value.config.textContent = ''
    selectedNode.value.config.datasetId = ''
    selectedNode.value.config.datasetFields = [] // 支持多选字段
    // 清洗规则默认值
    selectedNode.value.config.removeExtraSpaces = true
    selectedNode.value.config.removeHtmlTags = false
    selectedNode.value.config.removeSpecialChars = false
    selectedNode.value.config.normalizeNewlines = true
    selectedNode.value.config.trimWhitespace = true
    // 输出格式根据输入类型自动确定，无需手动配置
  }
}

// 获取选中的测评集
const getSelectedDataset = () => {
  if (!selectedNode.value || !selectedNode.value.config.datasetId) return null
  return datasetList.value.find((d) => d.id === selectedNode.value.config.datasetId)
}

// 获取测评集的字段列表（仅字符串类型）
const getDatasetFields = () => {
  const dataset = getSelectedDataset()
  if (!dataset) return []
  return dataset.columns.filter((col) => col.type === 'string')
}

// 当测评集选择变化时，重置字段选择
const onDatasetChange = () => {
  if (selectedNode.value) {
    selectedNode.value.config.datasetFields = []
  }
}

// 获取输出格式预览
const getOutputFormatPreview = () => {
  if (!selectedNode.value) return ''

  const config = selectedNode.value.config
  const inputType = config.inputType || 'text'

  // 根据输入类型自动生成输出格式预览
  if (inputType === 'text') {
    // 文本输入：输出单个字符串
    return `"清洗后的文本内容示例"`
  } else {
    // 测评集输入：输出数组形式的JSON
    const fields = config.datasetFields || []
    const sampleFields = fields.length > 0 ? fields : ['question', 'answer']

    const items = sampleFields.map((field) => ({
      field: field,
      originalContent: `原始${field}内容示例`,
      cleanedContent: `清洗后的${field}内容示例`,
    }))
    return JSON.stringify(items, null, 2)
  }
}

// 显示添加节点弹窗
const showAddPopover = (node, event) => {
  event.stopPropagation()
  if (node.outputs.length === 0) {
    return
  }
  showAddNodePopover.value = node.id
  popoverPosition.value = { x: event.clientX, y: event.clientY }
}

// 长按时间阈值（毫秒）
const LONG_PRESS_THRESHOLD = 150

// 处理按钮按下
const handleActionBtnDown = (node, event) => {
  event.stopPropagation()

  // 检查节点是否可以添加连线（开始节点使用 outputParams，其他节点使用 outputs）
  const outputParams = node.type === 'start' ? (node.outputParams || []) : node.outputs
  if (outputParams.length === 0) return

  const port = outputParams[0]
  const nodeWidth = 220
  // 根据节点内容计算实际高度
  const params = getNodeOutputParams(node)
  const paramsHeight = params.length > 0 ? 32 : 0
  const nodeHeight = 40 + paramsHeight // header 40px + 参数区域

  // 计算起点位置 - 与添加按钮中心重合
  // 添加按钮 CSS: right: -14px, width: 18px, center = nodeWidth - 14 + 9 = nodeWidth - 5
  const x = node.x + nodeWidth - 5
  const y = node.y + nodeHeight / 2

  longPressState.isLongPress = false
  longPressState.startTime = Date.now()
  longPressState.startX = event.clientX
  longPressState.startY = event.clientY
  longPressState.node = node
  longPressState.port = port

  // 设置长按计时器
  longPressState.timer = setTimeout(() => {
    longPressState.isLongPress = true

    // 开始绘制连线
    drawingConnection.value = {
      sourceNode: node,
      sourcePort: port,
      sourcePortType: 'output',
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    }

    document.addEventListener('mousemove', onDrawingConnection)
    document.addEventListener('mouseup', stopConnection)
  }, LONG_PRESS_THRESHOLD)
}

// 处理按钮释放
const handleActionBtnUp = (node, event) => {
  event.stopPropagation()

  // 清除长按计时器
  if (longPressState.timer) {
    clearTimeout(longPressState.timer)
    longPressState.timer = null
  }

  // 如果不是长按，则显示添加节点弹窗
  if (!longPressState.isLongPress) {
    showAddPopover(node, event)
  }

  longPressState.isLongPress = false
}

// 关闭添加节点弹窗
const closeAddPopover = () => {
  showAddNodePopover.value = null
  insertConnection.value = null
}

// 从连线中间显示添加节点弹窗
const showAddPopoverForConnection = (connection, event) => {
  event.stopPropagation()
  insertConnection.value = connection
  const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
  if (sourceNode) {
    showAddNodePopover.value = sourceNode.id
  }
  popoverPosition.value = { x: event.clientX, y: event.clientY }
}

// 添加子节点并自动连线
const addConnectedNode = (type) => {
  const parentNode = nodes.value.find((n) => n.id === showAddNodePopover.value)
  if (!parentNode) return

  const typeConfig = getNodeTypeConfig(type)
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    name: typeConfig.name,
    x: parentNode.x + 280,
    y: parentNode.y,
    inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
    outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
    config: {},
  }

  // 开始和结束节点特殊处理
  if (type === 'start') {
    newNode.inputs = []
    newNode.inputParams = []
  } else if (type === 'end') {
    newNode.outputs = []
  }

  // 条件判断节点特殊处理
  if (type === 'condition') {
    newNode.config.branches = [
      {
        id: `branch-${Date.now()}`,
        name: '分支1',
        logic: 'and',
        conditions: [
          {
            id: `cond-${Date.now()}`,
            variable: '',
            operator: 'eq',
            value: '',
          },
        ],
      },
    ]
    newNode.outputs = [
      { id: 'out-branch-0', name: '分支1' },
      { id: 'out-default', name: '默认' },
    ]
  }

  nodes.value.push(newNode)

  // 如果是从连线中间插入
  if (insertConnection.value) {
    const oldConn = insertConnection.value
    const targetNode = nodes.value.find((n) => n.id === oldConn.targetId)

    // 删除原连线
    connections.value = connections.value.filter((c) => c.id !== oldConn.id)

    // 创建两条新连线
    const sourcePort = parentNode.outputs[0]
    const newInputPort = newNode.inputs[0]
    const newOutputPort = newNode.outputs[0]
    const targetPort = targetNode?.inputs[0]

    if (sourcePort && newInputPort) {
      connections.value.push({
        id: `conn-${Date.now()}`,
        sourceId: parentNode.id,
        sourcePort: sourcePort.id,
        targetId: newNode.id,
        targetPort: newInputPort.id,
      })
    }

    if (newOutputPort && targetPort && targetNode) {
      connections.value.push({
        id: `conn-${Date.now() + 1}`,
        sourceId: newNode.id,
        sourcePort: newOutputPort.id,
        targetId: targetNode.id,
        targetPort: targetPort.id,
      })
    }
  } else {
    // 正常添加子节点
    const sourcePort = parentNode.outputs[0]
    const targetPort = newNode.inputs[0]

    if (sourcePort && targetPort) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        sourceId: parentNode.id,
        sourcePort: sourcePort.id,
        targetId: newNode.id,
        targetPort: targetPort.id,
      }
      connections.value.push(newConnection)
    }
  }

  showAddNodePopover.value = null
  insertConnection.value = null
  selectedNode.value = newNode
}

// 开始拖拽节点
const startDragNode = (node, event) => {
  event.stopPropagation()
  selectNode(node)

  dragState.isDragging = true
  dragState.node = node
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.offsetX = node.x
  dragState.offsetY = node.y

  document.addEventListener('mousemove', onDragNode)
  document.addEventListener('mouseup', stopDragNode)
}

// 拖拽节点
const onDragNode = (event) => {
  if (!dragState.isDragging || !dragState.node) return

  const dx = (event.clientX - dragState.startX) / canvas.scale
  const dy = (event.clientY - dragState.startY) / canvas.scale

  dragState.node.x = Math.max(0, dragState.offsetX + dx)
  dragState.node.y = Math.max(0, dragState.offsetY + dy)
}

// 停止拖拽节点
const stopDragNode = () => {
  dragState.isDragging = false
  dragState.node = null
  document.removeEventListener('mousemove', onDragNode)
  document.removeEventListener('mouseup', stopDragNode)
}

// 开始拖拽画布
const startDragCanvas = (event) => {
  // 只有点击在空白处才触发画布拖拽
  if (event.target.closest('.flow-node, .connection-path, .connection-add-btn, .node-action-btn')) {
    return
  }

  canvasDragState.isDragging = true
  canvasDragState.startX = event.clientX
  canvasDragState.startY = event.clientY
  canvasDragState.startOffsetX = canvas.offsetX
  canvasDragState.startOffsetY = canvas.offsetY

  document.addEventListener('mousemove', onDragCanvas)
  document.addEventListener('mouseup', stopDragCanvas)
}

// 拖拽画布
const onDragCanvas = (event) => {
  if (!canvasDragState.isDragging) return

  const dx = event.clientX - canvasDragState.startX
  const dy = event.clientY - canvasDragState.startY

  canvas.offsetX = canvasDragState.startOffsetX + dx
  canvas.offsetY = canvasDragState.startOffsetY + dy
}

// 停止拖拽画布
const stopDragCanvas = () => {
  canvasDragState.isDragging = false
  document.removeEventListener('mousemove', onDragCanvas)
  document.removeEventListener('mouseup', stopDragCanvas)
}

// 开始绘制连线
const startConnection = (node, port, portType, event) => {
  event.stopPropagation()

  // 节点尺寸
  const nodeWidth = 200
  const nodeContentHeight = 52
  const portGap = 24

  // 计算端口位置
  const portIndex = node.outputs.indexOf(port)
  const portsCount = node.outputs.length
  const portsHeight = (portsCount - 1) * portGap
  const startY = node.y + nodeContentHeight / 2 - portsHeight / 2

  const x = node.x + nodeWidth
  const y = startY + portIndex * portGap

  drawingConnection.value = {
    sourceNode: node,
    sourcePort: port,
    sourcePortType: portType,
    startX: x,
    startY: y,
    endX: x,
    endY: y,
  }

  document.addEventListener('mousemove', onDrawingConnection)
  document.addEventListener('mouseup', stopConnection)
}

// 绘制连线中
const onDrawingConnection = (event) => {
  if (!drawingConnection.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  drawingConnection.value.endX = (event.clientX - rect.left) / canvas.scale
  drawingConnection.value.endY = (event.clientY - rect.top) / canvas.scale
}

// 结束连线
const stopConnection = (event) => {
  document.removeEventListener('mousemove', onDrawingConnection)
  document.removeEventListener('mouseup', stopConnection)
  drawingConnection.value = null
}

// 在输入端口结束连线
const endConnection = (targetNode, targetParam, paramIndex, event) => {
  document.removeEventListener('mousemove', onDrawingConnection)
  document.removeEventListener('mouseup', stopConnection)

  if (!drawingConnection.value) return

  const { sourceNode, sourceParam, sourceParamIndex } = drawingConnection.value

  // 不能连接到自己
  if (sourceNode.id === targetNode.id) {
    drawingConnection.value = null
    return
  }

  // 检查是否已存在相同连线
  const existingConnection = connections.value.find(
    (c) =>
      c.sourceId === sourceNode.id &&
      c.sourceParamIndex === sourceParamIndex &&
      c.targetId === targetNode.id &&
      c.targetParamIndex === paramIndex
  )

  if (existingConnection) {
    drawingConnection.value = null
    return
  }

  // 创建新连线
  const newConnection = {
    id: `conn-${Date.now()}`,
    sourceId: sourceNode.id,
    sourceParamIndex: sourceParamIndex,
    targetId: targetNode.id,
    targetParamIndex: paramIndex,
  }

  connections.value.push(newConnection)
  drawingConnection.value = null
}

// 从输出端口开始连线
const startConnectionFromOutput = (node, param, paramIndex, event) => {
  event.stopPropagation()

  // 使用端口的实际 DOM 位置
  const portElement = event.target
  const portRect = portElement.getBoundingClientRect()
  const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()

  if (!canvasRect) {
    // 回退到计算位置
    const nodeWidth = 220
    const y = getNodeParamPortPosition(node, paramIndex, 'output')
    const x = node.x + nodeWidth

    drawingConnection.value = {
      sourceNode: node,
      sourceParam: param,
      sourceParamIndex: paramIndex,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    }
  } else {
    // 计算端口中心相对于画布的坐标
    const x = portRect.left + portRect.width / 2 - canvasRect.left
    const y = portRect.top + portRect.height / 2 - canvasRect.top

    drawingConnection.value = {
      sourceNode: node,
      sourceParam: param,
      sourceParamIndex: paramIndex,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    }
  }

  document.addEventListener('mousemove', onDrawingConnection)
  document.addEventListener('mouseup', stopConnection)
}

// 计算节点参数端口位置
const getNodeParamPortPosition = (node, paramIndex, type) => {
  // 基础高度：节点头部 + node-content padding-top
  const headerHeight = 56  // 包含 node-content padding-top: 12px
  // 参数区域起始Y坐标
  let startY = node.y + headerHeight

  // 如果有输入参数且当前是输出参数，需要加上输入参数区域高度
  const inputParams = getNodeInputParams(node)
  const outputParams = getNodeOutputParams(node)

  if (type === 'output' && inputParams.length > 0) {
    // 输入参数区域高度：margin-top(12) + padding-top(10) + 标签(18) + margin-bottom(6) + 表格行(inputParams.length * 32)
    startY += 12 + 10 + 18 + 6 + inputParams.length * 32
  }

  // 当前参数区域的起始高度：margin-top(12) + padding-top(10) + 标签(18) + margin-bottom(6)
  startY += 12 + 10 + 18 + 6

  // 表格行高度（包含 padding）
  const rowHeight = 32

  // 计算具体参数行的Y坐标（端口在行的中间）
  return startY + paramIndex * rowHeight + rowHeight / 2
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedNode.value) {
      deleteSelectedNode()
    } else if (selectedConnection.value) {
      deleteSelectedConnection()
    }
  } else if (event.key === 'Escape') {
    deselectAll()
    drawingConnection.value = null
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  // 等待 DOM 准备好后触发连线重新计算
  await nextTick()
  // 通过微调 connections 数组来触发重新渲染
  if (connections.value.length > 0) {
    const temp = [...connections.value]
    connections.value = temp
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="workflow-editor">
    <!-- 悬浮工具栏 -->
    <div class="floating-toolbar">
      <el-button text :icon="ArrowLeft" @click="goBack" title="返回">返回</el-button>
      <div class="toolbar-divider"></div>
      <div class="workflow-name-display">
        <span class="workflow-name-text">{{ workflow.name }}</span>
      </div>
      <div class="toolbar-divider"></div>
      <div class="zoom-controls">
        <el-button text :icon="ZoomOut" @click="zoomOut" title="缩小" />
        <span class="zoom-value">{{ Math.round(canvas.scale * 100) }}%</span>
        <el-button text :icon="ZoomIn" @click="zoomIn" title="放大" />
      </div>
      <div class="toolbar-divider"></div>
      <el-button text :icon="Grid" @click="autoLayoutNodes">调整布局</el-button>
      <el-button text :icon="VideoPlay" @click="runWorkflow">运行</el-button>
      <el-button
        text
        :icon="Upload"
        :disabled="!workflow.hasRun || workflow.published"
        @click="publishWorkflow"
      >
        {{ workflow.published ? '已发布' : '发布' }}
      </el-button>
      <el-button type="primary" text :icon="DocumentChecked" @click="saveWorkflow">保存</el-button>
    </div>

    <div class="editor-content">
      <div ref="canvasContainerRef" class="canvas-container" :class="{ dragging: canvasDragState.isDragging }" @click="handleCanvasClick" @mousedown="startDragCanvas">
        <div
          ref="canvasRef"
          class="canvas"
          :style="{
            width: `${canvas.width}px`,
            height: `${canvas.height}px`,
            transform: `translate(${canvas.offsetX}px, ${canvas.offsetY}px) scale(${canvas.scale})`,
            transformOrigin: '0 0',
          }"
        >
          <!-- 连线层（起点部分 - 在节点下层） -->
          <svg class="connections-layer connections-layer-bottom" :width="canvas.width" :height="canvas.height">
            <!-- 箭头标记定义 -->
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
              <marker
                id="arrowhead-selected"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
              <marker
                id="arrowhead-temp"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
              </marker>
              <!-- 连线渐变 -->
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color: #6366f1; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #8b5cf6; stop-opacity: 1" />
              </linearGradient>
            </defs>
            <!-- 已有连线（起点部分） -->
            <path
              v-for="conn in connections"
              :key="conn.id + '-start'"
              :d="getConnectionPathPart(conn, 'start')"
              class="connection-path"
              :class="{
                selected: selectedConnection?.id === conn.id,
                hovered: hoveredConnection?.id === conn.id
              }"
              @click.stop="selectConnection(conn, $event)"
              @contextmenu.prevent.stop="showConnectionContextMenu(conn, $event)"
              @mouseenter="handleConnectionMouseEnter(conn)"
              @mouseleave="handleConnectionMouseLeave"
            />
            <!-- 临时连线（起点部分） -->
            <path
              v-if="tempConnectionPath"
              :d="getTempConnectionPathPart('start')"
              class="connection-path temp"
            />
          </svg>

          <!-- 连线中间的添加按钮 -->
          <div
            v-for="conn in connections"
            :key="'btn-' + conn.id"
          >
            <div
              v-if="hoveredConnection?.id === conn.id && getConnectionMidpoint(conn)"
              class="connection-add-btn"
              :style="{
                left: `${getConnectionMidpoint(conn).x}px`,
                top: `${getConnectionMidpoint(conn).y}px`,
              }"
              @mouseenter="handleConnectionMouseEnter(conn)"
              @click.stop="showAddPopoverForConnection(conn, $event)"
            >
              <el-icon :size="12"><Plus /></el-icon>
            </div>
          </div>

          <!-- 节点层 -->
          <div
            v-for="node in nodes"
            :key="node.id"
            :data-node-id="node.id"
            class="flow-node"
            :class="{ selected: selectedNode?.id === node.id }"
            :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            @mousedown="startDragNode(node, $event)"
            @click.stop="selectNode(node, $event)"
            @contextmenu="showContextMenu(node, $event)"
          >
            <!-- 节点内容 -->
            <div class="node-content">
              <div class="node-header">
                <div
                  class="node-icon"
                  :style="{
                    background: `${getNodeTypeConfig(node.type).color}15`,
                    color: getNodeTypeConfig(node.type).color,
                  }"
                >
                  <el-icon :size="16">
                    <component :is="getIconComponent(getNodeTypeConfig(node.type).icon)" />
                  </el-icon>
                </div>
                <span class="node-name">{{ node.name }}</span>
              </div>

              <!-- 开始节点：单行显示输入参数 -->
              <template v-if="node.type === 'start'">
                <div
                  v-if="getNodeOutputParams(node).length > 0"
                  class="node-params inline-params"
                >
                  <span class="params-label">输入</span>
                  <span class="params-inline-list">
                    <span
                      v-for="(param, idx) in getNodeOutputParams(node)"
                      :key="'inout-' + idx"
                      class="param-inline-item"
                      :title="param.name + ': ' + param.type"
                    >
                      {{ param.name || '新建参数' }}
                    </span>
                  </span>
                </div>
                <!-- 开始节点右侧的添加/连线按钮 -->
                <div
                  class="node-action-btn"
                  @mousedown.stop="handleActionBtnDown(node, $event)"
                  @mouseup.stop="handleActionBtnUp(node, $event)"
                >
                  <el-icon :size="12"><Plus /></el-icon>
                </div>
              </template>

              <!-- 结束节点：单行显示输出参数，左侧有端口 -->
              <template v-else-if="node.type === 'end'">
                <div class="input-port end-node-port" @mouseup.stop="endConnection(node, null, 0, $event)"></div>
                <div
                  v-if="getNodeInputParams(node).length > 0"
                  class="node-params inline-params end-inline-params"
                >
                  <span class="params-label">输出</span>
                  <span class="params-inline-list">
                    <span
                      v-for="(param, idx) in getNodeInputParams(node)"
                      :key="'inout-' + idx"
                      class="param-inline-item"
                      :title="param.name + ': ' + param.type"
                    >
                      {{ param.name || '新建参数' }}
                    </span>
                  </span>
                </div>
              </template>

              <!-- 其他节点：分别显示输入和输出参数 -->
              <template v-else>
                <!-- 输入端口在节点左侧边缘垂直居中 -->
                <div
                  class="input-port node-edge-port node-center-port"
                  title="input"
                  @mouseup.stop="endConnection(node, null, 0, $event)"
                ></div>

                <!-- 输入参数：单行显示 -->
                <div
                  v-if="getNodeInputParams(node).length > 0"
                  class="node-params inline-params input-inline-params"
                >
                  <span class="params-label">输入</span>
                  <span class="params-inline-list">
                    <span
                      v-for="(param, idx) in getNodeInputParams(node)"
                      :key="'in-' + idx"
                      class="param-inline-item"
                      :title="param.name + ': ' + param.type"
                    >
                      {{ param.name || '新建参数' }}
                    </span>
                  </span>
                </div>

                <!-- 输出参数：单行显示 -->
                <div
                  v-if="getNodeOutputParams(node).length > 0"
                  class="node-params inline-params output-inline-params"
                >
                  <span class="params-label">输出</span>
                  <span class="params-inline-list">
                    <span
                      v-for="(param, idx) in getNodeOutputParams(node)"
                      :key="'out-' + idx"
                      class="param-inline-item"
                      :title="param.name + ': ' + param.type"
                    >
                      {{ param.name || '新建参数' }}
                    </span>
                  </span>
                </div>

                <!-- 输出端口在节点右侧边缘垂直居中 -->
                <div
                  class="output-port node-edge-port node-center-port"
                  title="output"
                  @mousedown.stop="startConnectionFromOutput(node, null, 0, $event)"
                ></div>
              </template>
            </div>
          </div>

          <!-- 连线层（终点部分 - 在节点上层） -->
          <svg class="connections-layer connections-layer-top" :width="canvas.width" :height="canvas.height">
            <!-- 箭头标记定义（需要在每个 SVG 中独立定义） -->
            <defs>
              <marker
                id="arrowhead-top"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
              <marker
                id="arrowhead-top-selected"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
              <marker
                id="arrowhead-top-temp"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 5 3 L 0 6" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
              </marker>
            </defs>
            <!-- 已有连线（终点部分）- 直接在此路径上添加 marker-end -->
            <path
              v-for="conn in connections"
              :key="conn.id + '-end'"
              :d="getConnectionPathPart(conn, 'end')"
              class="connection-path"
              :class="{
                selected: selectedConnection?.id === conn.id,
                hovered: hoveredConnection?.id === conn.id
              }"
              :marker-end="selectedConnection?.id === conn.id ? 'url(#arrowhead-top-selected)' : (hoveredConnection?.id === conn.id ? 'url(#arrowhead-top-selected)' : 'url(#arrowhead-top)')"
              :style="{ pointerEvents: 'none' }"
            />
            <!-- 临时连线（终点部分） -->
            <path
              v-if="tempConnectionPath"
              :d="getTempConnectionPathPart('end')"
              class="connection-path temp"
              marker-end="url(#arrowhead-top-temp)"
              :style="{ pointerEvents: 'none' }"
            />
          </svg>
        </div>

        <!-- 添加节点弹窗 -->
        <div
          v-if="showAddNodePopover"
          class="add-node-popover"
          :style="{ left: `${popoverPosition.x}px`, top: `${popoverPosition.y}px` }"
        >
          <div class="popover-header">
            <span>选择节点类型</span>
            <el-icon class="close-icon" @click="closeAddPopover"><Close /></el-icon>
          </div>
          <div class="popover-content">
            <template v-for="category in nodeCategories" :key="category.key">
              <div
                v-if="nodeTypes.filter((n) => n.category === category.key && n.type !== 'start').length > 0"
                class="category-section"
              >
                <div class="category-title">{{ category.name }}</div>
                <div class="category-items">
                  <div
                    v-for="nodeType in nodeTypes.filter((n) => n.category === category.key && n.type !== 'start')"
                    :key="nodeType.type"
                    class="popover-node-item"
                    @click="addConnectedNode(nodeType.type)"
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
        <div v-if="showAddNodePopover" class="popover-overlay" @click="closeAddPopover" />

        <!-- 右键菜单 -->
        <div
          v-if="contextMenu.visible && contextMenu.node && !['start', 'end'].includes(contextMenu.node.type)"
          class="context-menu"
          :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        >
          <div class="context-menu-item" @click="contextMenuRename">
            <el-icon><Edit /></el-icon>
            <span>重命名</span>
          </div>
          <div class="context-menu-item" @click="contextMenuDuplicate">
            <el-icon><CopyDocument /></el-icon>
            <span>创建副本</span>
          </div>
          <div class="context-menu-divider" />
          <div class="context-menu-item danger" @click="contextMenuDelete">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </div>
        </div>

        <!-- 连线右键菜单 -->
        <div
          v-if="contextMenu.visible && contextMenu.connection"
          class="context-menu"
          :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        >
          <div class="context-menu-item" @click="connectionMenuAddNode">
            <el-icon><Plus /></el-icon>
            <span>添加节点</span>
          </div>
          <div class="context-menu-divider" />
          <div class="context-menu-item danger" @click="connectionMenuDelete">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </div>
        </div>

        <!-- 调试日志弹窗 -->
        <el-dialog
          v-model="debugState.showDialog"
          :title="`调试日志 - ${debugState.currentNode?.name || ''}`"
          width="600px"
          :close-on-click-modal="false"
          class="debug-dialog"
        >
          <div class="debug-dialog-content">
            <div class="debug-dialog-header">
              <el-button size="small" @click="clearDebugLogs">清除日志</el-button>
            </div>
            <div class="debug-dialog-logs">
              <div
                v-for="log in debugState.logs"
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
              <div v-if="debugState.logs.length === 0" class="debug-empty">
                暂无调试日志
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="stopDebug">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 运行日志面板 -->
        <div v-if="runState.isRunning" class="debug-panel run-panel">
          <div class="debug-header">
            <div class="debug-title">
              <el-icon :size="16" color="#10b981"><VideoPlay /></el-icon>
              <span>运行日志</span>
              <span class="debug-node-name">- {{ workflow.name }}</span>
            </div>
            <div class="debug-actions">
              <el-button text size="small" @click="clearRunLogs">清除日志</el-button>
              <el-button text size="small" @click="stopRun">
                <el-icon><Close /></el-icon>
                关闭
              </el-button>
            </div>
          </div>
          <div class="debug-logs">
            <div
              v-for="log in runState.logs"
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
            <div v-if="runState.logs.length === 0" class="debug-empty">
              暂无运行日志
            </div>
          </div>
        </div>

        <!-- AI助手面板 -->
        <div class="ai-chat-panel" :class="{ expanded: aiChatExpanded }">
          <div class="ai-chat-header" @click="toggleAiChat">
            <div class="ai-chat-title">
              <el-icon :size="16" color="#6366f1"><ChatDotRound /></el-icon>
              <span>AI 智能助手</span>
            </div>
            <el-icon class="expand-icon" :class="{ expanded: aiChatExpanded }">
              <ArrowUp v-if="aiChatExpanded" />
              <ArrowDown v-else />
            </el-icon>
          </div>
          <div v-show="aiChatExpanded" class="ai-chat-content">
            <div ref="aiChatMessagesRef" class="ai-chat-messages">
              <div
                v-for="message in aiChatMessages"
                :key="message.id"
                class="ai-message-item"
                :class="message.type"
              >
                <div v-if="message.type === 'ai'" class="ai-message-avatar">
                  <el-icon :size="14"><ChatDotRound /></el-icon>
                </div>
                <div class="ai-message-bubble">{{ message.content }}</div>
                <div v-if="message.type === 'user'" class="ai-message-avatar user">
                  <span>我</span>
                </div>
              </div>
              <!-- 正在输入提示 -->
              <div v-if="aiChatIsTyping" class="ai-message-item ai">
                <div class="ai-message-avatar">
                  <el-icon :size="14"><ChatDotRound /></el-icon>
                </div>
                <div class="ai-message-bubble typing">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
            <div class="ai-chat-input-area">
              <el-input
                v-model="aiChatInput"
                placeholder="输入消息，按 Enter 发送..."
                size="small"
                @keydown.enter.prevent="sendAiMessage"
              >
                <template #suffix>
                  <el-icon class="send-icon" @click="sendAiMessage"><Position /></el-icon>
                </template>
              </el-input>
              <el-button text size="small" @click="clearAiChat">清空</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div v-if="selectedNode" class="config-panel">
        <div class="panel-header">
          <div class="panel-title-area">
            <span class="panel-node-name">{{ selectedNode.name }}</span>
            <span v-if="nodeDescriptions[selectedNode.type]" class="panel-node-desc">
              {{ nodeDescriptions[selectedNode.type] }}
            </span>
          </div>
          <div v-if="!['start', 'end'].includes(selectedNode.type)" class="panel-actions">
            <el-button text :icon="Tools" @click="debugNode" title="调试">调试</el-button>
            <el-dropdown trigger="click">
              <el-button text :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Edit" @click="showRenameDialog">
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item :icon="CopyDocument" @click="duplicateNode">
                    创建副本
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Delete" divided @click="deleteSelectedNode">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="panel-content">
          <!-- 开始节点 - 输出参数配置 -->
          <template v-if="selectedNode.type === 'start'">
            <div class="config-item">
              <div class="config-item-header">
                <label>输出参数</label>
                <el-button type="primary" text size="small" :icon="Plus" @click="addOutputParam">
                  添加参数
                </el-button>
              </div>
              <el-table
                :data="selectedNode.outputParams"
                border
                size="small"
                empty-text="暂无输出参数"
                style="width: 100%"
              >
                <el-table-column label="变量名" min-width="120">
                  <template #default="{ row }">
                    <el-input v-model="row.name" placeholder="请输入变量名" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="变量类型" min-width="160">
                  <template #default="{ row }">
                    <el-cascader
                      :model-value="getTypeValue(row)"
                      :options="typeOptions"
                      :props="{
                        expandTrigger: 'hover',
                        emitPath: true,
                        checkStrictly: false,
                      }"
                      placeholder="选择类型"
                      size="small"
                      style="width: 100%"
                      clearable
                      @update:model-value="(val) => handleTypeChange(val, row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="必填" width="80" align="center">
                  <template #default="{ row }">
                    <el-switch v-model="row.required" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="60" align="center">
                  <template #default="{ $index }">
                    <el-button
                      type="danger"
                      text
                      size="small"
                      :icon="Delete"
                      @click="removeOutputParam($index)"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>

          <!-- LLM节点配置 -->
          <template v-if="selectedNode.type === 'llm'">
            <div class="config-item">
              <label>模型选择</label>
              <el-select v-model="selectedNode.config.model" placeholder="选择模型">
                <el-option label="GPT-4" value="gpt-4" />
                <el-option label="GPT-3.5" value="gpt-3.5" />
                <el-option label="Claude 3" value="claude-3" />
              </el-select>
            </div>
            <div class="config-item">
              <label>提示词</label>
              <el-input
                v-model="selectedNode.config.prompt"
                type="textarea"
                :rows="4"
                placeholder="输入提示词"
              />
            </div>
          </template>

          <!-- 条件判断节点配置 -->
          <template v-if="selectedNode.type === 'condition'">
            <div class="config-item">
              <div class="config-item-header">
                <label>条件分支</label>
                <el-button type="primary" text size="small" :icon="Plus" @click="addConditionBranch">
                  添加分支
                </el-button>
              </div>
              <div class="condition-branches">
                <div
                  v-for="(branch, index) in selectedNode.config.branches"
                  :key="branch.id"
                  class="condition-branch"
                  :class="'branch-color-' + ((index % 4) + 1)"
                >
                  <div class="branch-header">
                    <div class="branch-title">
                      <span class="branch-index">{{ index + 1 }}</span>
                      <el-input
                        v-model="branch.name"
                        placeholder="分支名称"
                        size="small"
                        class="branch-name-input"
                      />
                    </div>
                    <el-button
                      v-if="selectedNode.config.branches.length > 1"
                      type="danger"
                      text
                      size="small"
                      :icon="Delete"
                      @click="removeConditionBranch(index)"
                    />
                  </div>
                  <div class="branch-conditions">
                    <div class="condition-logic-toggle">
                      <span class="logic-label">多条件关系：</span>
                      <el-radio-group v-model="branch.logic" size="small">
                        <el-radio-button value="and">
                          <span class="logic-btn">且 (AND)</span>
                        </el-radio-button>
                        <el-radio-button value="or">
                          <span class="logic-btn">或 (OR)</span>
                        </el-radio-button>
                      </el-radio-group>
                    </div>
                    <div class="conditions-list">
                      <div
                        v-for="(condition, condIndex) in branch.conditions"
                        :key="condition.id"
                        class="condition-row"
                      >
                        <span class="condition-label">条件 {{ condIndex + 1 }}</span>
                        <div class="condition-fields">
                          <el-select
                            v-model="condition.variable"
                            placeholder="选择变量"
                            size="small"
                            class="condition-var"
                            filterable
                            allow-create
                          >
                            <el-option
                              v-for="param in getAvailableVariables()"
                              :key="param.name"
                              :label="param.name"
                              :value="param.name"
                            />
                          </el-select>
                          <el-select
                            v-model="condition.operator"
                            placeholder="运算符"
                            size="small"
                            class="condition-op"
                          >
                            <el-option label="等于" value="eq" />
                            <el-option label="不等于" value="neq" />
                            <el-option label="大于" value="gt" />
                            <el-option label="大于等于" value="gte" />
                            <el-option label="小于" value="lt" />
                            <el-option label="小于等于" value="lte" />
                            <el-option label="包含" value="contains" />
                            <el-option label="不包含" value="notContains" />
                            <el-option label="为空" value="isEmpty" />
                            <el-option label="不为空" value="isNotEmpty" />
                            <el-option label="为真" value="isTrue" />
                            <el-option label="为假" value="isFalse" />
                          </el-select>
                          <el-input
                            v-if="!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(condition.operator)"
                            v-model="condition.value"
                            placeholder="比较值"
                            size="small"
                            class="condition-val"
                          />
                          <div
                            v-else
                            class="condition-val-placeholder"
                          >
                            —
                          </div>
                          <el-button
                            type="danger"
                            text
                            size="small"
                            :icon="Delete"
                            class="condition-delete-btn"
                            @click="removeCondition(index, condIndex)"
                          />
                        </div>
                      </div>
                    </div>
                    <el-button
                      type="primary"
                      text
                      size="small"
                      :icon="Plus"
                      class="add-condition-btn"
                      @click="addCondition(index)"
                    >
                      添加条件
                    </el-button>
                  </div>
                </div>
                <!-- 默认分支 -->
                <div class="condition-branch default-branch">
                  <div class="branch-header">
                    <div class="branch-title">
                      <span class="branch-index default">☆</span>
                      <span class="branch-name-label">默认分支</span>
                    </div>
                    <span class="branch-hint">当以上条件都不满足时执行</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 文本清洗节点配置 -->
          <template v-if="selectedNode.type === 'textClean'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[
                    { name: 'input_file', type: 'File', required: true, desc: '需要被清洗的目标xlsx文件', field: 'inputFileValue' },
                    { name: 'cols', type: 'String', required: true, desc: '指定xlsx文件中需要清洗的列（英文逗号分隔）', field: 'colsValue' },
                    { name: 'remove_extra_spaces', type: 'Boolean', required: false, desc: '是否去除多余空格', field: 'removeExtraSpaces' },
                    { name: 'remove_html_tags', type: 'Boolean', required: false, desc: '是否去除HTML标签', field: 'removeHtmlTags' },
                    { name: 'remove_special_chars', type: 'Boolean', required: false, desc: '是否去除特殊字符', field: 'removeSpecialChars' },
                    { name: 'standardized_newline_char', type: 'Boolean', required: false, desc: '是否标准化换行符', field: 'standardizedNewlineChar' },
                    { name: 'trim_front_back', type: 'Boolean', required: false, desc: '是否去除首尾空白', field: 'trimFrontBack' }
                  ]"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="180">
                    <template #default="{ row }">
                      <div class="param-name-cell">
                        <span v-if="row.required" class="required-mark">*</span>
                        <span class="param-name-text">{{ row.name }}</span>
                        <el-tooltip :content="row.desc" placement="top" :show-after="300">
                          <el-icon class="param-desc-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row }">
                      <!-- Boolean 类型：下拉框 + 关联选择 -->
                      <div v-if="row.type === 'Boolean'" class="param-value-input">
                        <el-select
                          v-model="selectedNode.config[row.field]"
                          placeholder="选择"
                          size="small"
                          class="param-select-with-btn"
                          clearable
                        >
                          <el-option label="true" :value="true" />
                          <el-option label="false" :value="false" />
                        </el-select>
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field)"><Link /></el-icon>
                      </div>
                      <!-- File 类型：只显示上传按钮和关联按钮 -->
                      <div v-else-if="row.type === 'File'" class="param-value-input file-input">
                        <span v-if="selectedNode.config[row.field]" class="file-value">{{ selectedNode.config[row.field] }}</span>
                        <span v-else class="file-placeholder">未选择文件</span>
                        <div class="file-actions">
                          <el-upload
                            :show-file-list="false"
                            accept=".xlsx,.xls"
                            :before-upload="(file) => handleFileUpload(file, row.field)"
                          >
                            <el-icon class="action-icon upload-icon" title="上传文件"><Upload /></el-icon>
                          </el-upload>
                          <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field)"><Link /></el-icon>
                        </div>
                      </div>
                      <!-- 其他类型：输入框 + 关联选择 -->
                      <div v-else class="param-value-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        >
                          <template #suffix>
                            <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field)"><Link /></el-icon>
                          </template>
                        </el-input>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 输出参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输出</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[{ name: 'output_file', type: 'File', desc: '被清洗之后的xlsx文件' }]"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="160">
                    <template #default="{ row }">
                      <div class="param-name-cell">
                        <span class="param-name-text">{{ row.name }}</span>
                        <el-tooltip :content="row.desc" placement="top" :show-after="300">
                          <el-icon class="param-desc-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

          <!-- 表格提取节点配置 -->
          <template v-if="selectedNode.type === 'tableExtract'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[
                    { name: 'file', type: 'File', required: true, desc: '需要提取数据的表格文件', field: 'inputFileValue' }
                  ]"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="180">
                    <template #default="{ row }">
                      <div class="param-name-cell">
                        <span v-if="row.required" class="required-mark">*</span>
                        <span class="param-name-text">{{ row.name }}</span>
                        <el-tooltip :content="row.desc" placement="top" :show-after="300">
                          <el-icon class="param-desc-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row }">
                      <!-- File 类型：只显示上传按钮和关联按钮 -->
                      <div class="param-value-input file-input">
                        <span v-if="selectedNode.config[row.field]" class="file-value">{{ selectedNode.config[row.field] }}</span>
                        <span v-else class="file-placeholder">未选择文件</span>
                        <div class="file-actions">
                          <el-upload
                            :show-file-list="false"
                            accept=".xlsx,.xls,.csv"
                            :before-upload="(file) => handleFileUpload(file, row.field)"
                          >
                            <el-icon class="action-icon upload-icon" title="上传文件"><Upload /></el-icon>
                          </el-upload>
                          <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field)"><Link /></el-icon>
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 输出参数（支持增减） -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输出（提取列名）</span>
                <el-button type="primary" text size="small" :icon="Plus" @click="addTableExtractOutputParam" style="margin-left: auto;">
                  添加列
                </el-button>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.outputParams"
                  size="small"
                  class="io-table"
                  empty-text="暂无输出列，请添加需要提取的列名"
                >
                  <el-table-column label="列名" min-width="160">
                    <template #default="{ row }">
                      <el-input v-model="row.name" placeholder="请输入列名" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100" align="center">
                    <template #default>
                      <span class="param-type-tag">String</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="60" align="center">
                    <template #default="{ $index }">
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeTableExtractOutputParam($index)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- 变量选择器对话框 -->
    <el-dialog
      v-model="showVariableSelectorDialog"
      title="选择变量"
      width="500px"
      class="variable-selector-dialog"
    >
      <div class="variable-list">
        <div v-if="getUpstreamNodeOutputs().length === 0" class="no-variables">
          暂无可关联的前置节点输出变量
        </div>
        <div
          v-for="(item, index) in getUpstreamNodeOutputs()"
          :key="index"
          class="variable-item"
          @click="selectVariable(item.variable)"
        >
          <div class="variable-info">
            <span class="variable-node">{{ item.nodeName }}</span>
            <span class="variable-arrow">→</span>
            <span class="variable-param">{{ item.param }}</span>
          </div>
          <div class="variable-meta">
            <span class="variable-type">{{ item.type }}</span>
            <span class="variable-expr">{{ item.variable }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名节点" width="400px">
      <el-input v-model="newNodeName" placeholder="请输入节点名称" @keyup.enter="confirmRename" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 悬浮工具栏 */
.floating-toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}

.workflow-name-display {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.workflow-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
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
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  min-width: 40px;
  text-align: center;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #fafbfc;
  background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: grab;
}

.canvas-container.dragging {
  cursor: grabbing;
  user-select: none;
}

.canvas {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connections-layer-bottom {
  z-index: 5; /* 节点下层，z-index 低于节点 */
}

.connections-layer-top {
  z-index: 25; /* 节点上层，z-index 高于节点 */
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

.connection-path:hover,
.connection-path.hovered,
.connection-path.selected {
  stroke: #22d3ee;
  stroke-width: 3;
}

.connection-path.temp {
  stroke: #6366f1;
  stroke-dasharray: 6, 4;
  opacity: 0.6;
}

/* 连线中间的添加按钮 */
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

.flow-node {
  position: absolute;
  width: 220px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  cursor: move;
  transition: border-color 0.2s, box-shadow 0.2s;
  z-index: 10; /* 在底层连线上面，顶层连线下面 */
}

.flow-node:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.flow-node.selected {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

.node-content {
  padding: 12px 14px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-description {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  line-height: 1.4;
  padding: 0 2px;
}

.node-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

/* 节点参数显示样式 - 表格形式 */
.node-params {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.node-params .params-label {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.node-params .params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.node-params .params-table tbody tr {
  height: 24px;
}

.node-params .params-table td {
  padding: 4px 8px;
  vertical-align: middle;
  border: none;
}

.node-params .param-name-cell {
  color: #374151;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-params .param-name-cell.param-name-empty {
  color: #9ca3af;
  font-style: italic;
  font-weight: 400;
}

.node-params .param-type-cell {
  color: #6b7280;
  font-size: 10px;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  text-align: center;
  min-width: 50px;
}

.node-params .param-port-cell {
  width: 12px;
  padding: 0;
  position: relative;
}

/* 输入参数样式 */
.node-params.input-params .params-label {
  color: #6366f1;
}

.node-params.input-params .param-type-cell {
  background: #eef2ff;
  color: #6366f1;
}

/* 输出参数样式 */
.node-params.output-params .params-label {
  color: #10b981;
}

.node-params.output-params .param-type-cell {
  background: #ecfdf5;
  color: #10b981;
}

/* 开始节点单行显示参数样式 */
.node-params.inline-params {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.node-params.inline-params .params-label {
  flex-shrink: 0;
}

.node-params.inline-params .params-inline-list {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.node-params.inline-params .param-inline-item {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

/* 输入参数样式 - 紫色 */
.node-params.inline-params.input-inline-params .params-label {
  color: #6366f1;
}

.node-params.inline-params.input-inline-params .param-inline-item {
  background: #eef2ff;
  color: #6366f1;
}

/* 输出参数样式 - 绿色 */
.node-params.inline-params.output-inline-params .params-label {
  color: #10b981;
}

.node-params.inline-params.output-inline-params .param-inline-item {
  background: #ecfdf5;
  color: #10b981;
}

/* 开始节点输入参数样式 - 紫色 */
.node-params.inline-params:not(.input-inline-params):not(.output-inline-params):not(.end-inline-params) .params-label {
  color: #6366f1;
}

.node-params.inline-params:not(.input-inline-params):not(.output-inline-params):not(.end-inline-params) .param-inline-item {
  background: #eef2ff;
  color: #6366f1;
}

/* 结束节点输出参数样式 - 绿色 */
.node-params.inline-params.end-inline-params .params-label {
  color: #10b981;
}

.node-params.inline-params.end-inline-params .param-inline-item {
  background: #ecfdf5;
  color: #10b981;
}

/* 内联端口样式 */
.param-inline-item .inline-port {
  position: relative !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  transform: none !important;
  width: 8px !important;
  height: 8px !important;
  flex-shrink: 0;
}

.param-inline-item .inline-port.input-port {
  left: auto !important;
}

.param-inline-item .inline-port.output-port {
  position: relative !important;
  right: auto !important;
}

.param-inline-item .inline-port:hover {
  transform: scale(1.2) !important;
}

/* 输入端口样式 */
.input-port {
  position: absolute;
  left: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 5;
}

.input-port:hover {
  background: #22d3ee;
  transform: scale(1.2);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.5);
}

/* 输出端口样式 */
.output-port {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 5;
}

.output-port:hover {
  background: #22d3ee;
  transform: translateY(-50%) scale(1.2);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.output-port-cell {
  position: relative;
  width: 12px;
}

/* 结束节点端口样式 */
.end-node-port {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3);
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 5;
}

.end-node-port:hover {
  background: #22d3ee;
  transform: translateY(-50%) scale(1.2);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

/* 节点边缘端口样式（用于其他节点的输入/输出端口） */
.node-edge-port.input-port {
  position: absolute;
  left: -6px;
  transform: translateY(-50%);
}

.node-edge-port.output-port {
  position: absolute;
  right: -6px;
  transform: translateY(-50%);
}

.node-edge-port:hover {
  transform: translateY(-50%) scale(1.2);
}

/* 节点垂直居中端口样式 */
.node-center-port {
  top: 50% !important;
}

/* 结束节点单行参数样式 - 标签使用红色 */
.node-params.end-inline-params .params-label {
  color: #ef4444;
}

.node-params.end-inline-params .param-inline-item {
  background: #fee2e2;
  color: #ef4444;
}

.config-panel {
  width: 520px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  margin-top: 60px;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}

.panel-title-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-node-name{
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.panel-node-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.panel-actions {
  display: flex;
  align-items: center;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-item {
  margin-bottom: 16px;
}

.config-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.config-item-header label {
  margin-bottom: 0;
}

.config-item .el-table {
  --el-table-border-color: #e5e7eb;
}

.config-item .el-table__body-wrapper {
  overflow-x: hidden;
}

.config-item .el-table__header-wrapper {
  overflow-x: hidden;
}

.config-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.config-item .el-input,
.config-item .el-select,
.config-item .el-textarea {
  width: 100%;
}

/* 条件分支配置样式 */
.condition-branches {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.condition-branch {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.condition-branch:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 分支颜色主题 */
.condition-branch.branch-color-1 {
  border-left: 4px solid #6366f1;
}

.condition-branch.branch-color-2 {
  border-left: 4px solid #10b981;
}

.condition-branch.branch-color-3 {
  border-left: 4px solid #f59e0b;
}

.condition-branch.branch-color-4 {
  border-left: 4px solid #ec4899;
}

.condition-branch.default-branch {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px dashed #86efac;
  border-left: 4px solid #22c55e;
}

.branch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.condition-branch.default-branch .branch-header {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-bottom: 1px dashed #86efac;
}

.branch-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.branch-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.condition-branch.branch-color-2 .branch-index {
  background: #10b981;
}

.condition-branch.branch-color-3 .branch-index {
  background: #f59e0b;
}

.condition-branch.branch-color-4 .branch-index {
  background: #ec4899;
}

.branch-index.default {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  font-size: 14px;
}

.branch-name-input {
  flex: 1;
  max-width: 180px;
}

.branch-name-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.branch-hint {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.branch-conditions {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-logic-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 4px;
}

.logic-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.logic-btn {
  font-size: 12px;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.condition-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.condition-row:hover {
  background: #f8fafc;
  border-color: #d1d5db;
}

.condition-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.condition-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.condition-var {
  flex: 1;
  min-width: 120px;
}

.condition-op {
  width: 100px;
  flex-shrink: 0;
}

.condition-val {
  flex: 1;
  min-width: 100px;
}

.condition-val-placeholder {
  flex: 1;
  min-width: 100px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  background: #f3f4f6;
  border-radius: 4px;
}

.condition-delete-btn {
  flex-shrink: 0;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.condition-row:hover .condition-delete-btn {
  opacity: 1;
}

.add-condition-btn {
  align-self: flex-start;
  margin-top: 4px;
  padding: 8px 16px;
  border-radius: 6px;
  background: #f0f9ff;
  border: 1px dashed #60a5fa;
  transition: all 0.2s ease;
}

.add-condition-btn:hover {
  background: #e0f2fe;
  border-color: #3b82f6;
}

/* 合并的连线/添加按钮 */
.node-action-btn {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  z-index: 10;
  user-select: none;
}

.flow-node:hover .node-action-btn {
  opacity: 1;
}

.node-action-btn:hover {
  background: #4f46e5;
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.node-action-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* 输入端口 - 節点内的表格行中 */
.input-port {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  cursor: crosshair;
  transition: all 0.2s;
}

.input-port:hover {
  background: #22d3ee;
  transform: scale(1.2);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.5);
}

/* 添加节点弹窗 */
.add-node-popover {
  position: fixed;
  width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
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
  z-index: 999;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  min-width: 140px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  padding: 6px 0;
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
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: #333;
}

.context-menu-item:hover {
  background: #f5f7fa;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}

.context-menu-item .el-icon {
  font-size: 16px;
}

.context-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

/* 调试日志面板 */
.debug-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1e1e2e;
  border-top: 1px solid #313244;
  z-index: 100;
  display: flex;
  flex-direction: column;
  max-height: 280px;
  animation: debug-panel-in 0.3s ease;
}

@keyframes debug-panel-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #313244;
  border-bottom: 1px solid #45475a;
}

.debug-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #cdd6f4;
}

.debug-node-name {
  color: #89b4fa;
  font-weight: 400;
}

.debug-actions {
  display: flex;
  gap: 8px;
}

.debug-actions .el-button {
  color: #a6adc8;
  font-size: 12px;
}

.debug-actions .el-button:hover {
  color: #cdd6f4;
  background: rgba(255, 255, 255, 0.1);
}

.debug-logs {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.debug-log-item {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(69, 71, 90, 0.3);
}

.debug-log-item:last-child {
  border-bottom: none;
}

.debug-log-item.info .log-type {
  color: #89b4fa;
}

.debug-log-item.success .log-type {
  color: #a6e3a1;
}

.debug-log-item.warning .log-type {
  color: #f9e2af;
}

.debug-log-item.error .log-type {
  color: #f38ba8;
}

.log-time {
  color: #6c7086;
  flex-shrink: 0;
  font-size: 12px;
}

.log-type {
  flex-shrink: 0;
  width: 80px;
}

.log-message {
  color: #bac2de;
  word-break: break-all;
}

.debug-empty {
  color: #6c7086;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.debug-logs::-webkit-scrollbar {
  width: 6px;
}

.debug-logs::-webkit-scrollbar-track {
  background: transparent;
}

.debug-logs::-webkit-scrollbar-thumb {
  background: #45475a;
  border-radius: 3px;
}

.debug-logs::-webkit-scrollbar-thumb:hover {
  background: #585b70;
}

/* 调试弹窗样式 */
.debug-dialog-content {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.debug-dialog-header {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.debug-dialog-logs {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #1e1e2e;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.debug-dialog-logs .debug-log-item {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(69, 71, 90, 0.3);
}

.debug-dialog-logs .debug-log-item:last-child {
  border-bottom: none;
}

.debug-dialog-logs .debug-log-item.info .log-type {
  color: #89b4fa;
}

.debug-dialog-logs .debug-log-item.success .log-type {
  color: #a6e3a1;
}

.debug-dialog-logs .debug-log-item.warning .log-type {
  color: #f9e2af;
}

.debug-dialog-logs .debug-log-item.error .log-type {
  color: #f38ba8;
}

.debug-dialog-logs .log-time {
  color: #6c7086;
  flex-shrink: 0;
  font-size: 12px;
}

.debug-dialog-logs .log-type {
  flex-shrink: 0;
  width: 80px;
}

.debug-dialog-logs .log-message {
  color: #bac2de;
  word-break: break-all;
}

.debug-dialog-logs .debug-empty {
  color: #6c7086;
  text-align: center;
  padding: 40px;
  font-style: italic;
}

.debug-dialog-logs::-webkit-scrollbar {
  width: 6px;
}

.debug-dialog-logs::-webkit-scrollbar-track {
  background: transparent;
}

.debug-dialog-logs::-webkit-scrollbar-thumb {
  background: #45475a;
  border-radius: 3px;
}

.debug-dialog-logs::-webkit-scrollbar-thumb:hover {
  background: #585b70;
}

/* AI助手面板样式 */
.ai-chat-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  z-index: 99;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.ai-chat-panel.expanded {
  height: 300px;
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e5e7eb;
}

.ai-chat-header:hover {
  background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4f46e5;
}

.ai-chat-header .expand-icon {
  color: #6366f1;
  transition: transform 0.3s ease;
}

.ai-chat-header .expand-icon.expanded {
  transform: rotate(180deg);
}

.ai-chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
}

.ai-message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ai-message-item.user {
  justify-content: flex-end;
}

.ai-message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
}

.ai-message-avatar.user {
  background: linear-gradient(135deg, #10b981, #059669);
}

.ai-message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.ai-message-item.ai .ai-message-bubble {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-top-left-radius: 4px;
}

.ai-message-item.user .ai-message-bubble {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-top-right-radius: 4px;
}

.ai-message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a5b4fc;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.ai-chat-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.ai-chat-input-area .el-input {
  flex: 1;
}

.ai-chat-input-area .send-icon {
  cursor: pointer;
  color: #6366f1;
  transition: color 0.2s;
}

.ai-chat-input-area .send-icon:hover {
  color: #4f46e5;
}

.ai-chat-messages::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.ai-chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 文本清洗节点配置样式 */
.input-type-radio {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-type-radio .el-radio {
  height: auto;
  margin-right: 0;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.input-type-radio .el-radio:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.input-type-radio .el-radio.is-checked {
  border-color: #6366f1;
  background: #f5f3ff;
}

.input-type-radio .el-radio__label {
  font-size: 14px;
  color: #374151;
}

.dataset-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.clean-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.clean-rules .el-checkbox {
  height: auto;
  margin-right: 0;
}

.clean-rules .el-checkbox__label {
  font-size: 14px;
  color: #374151;
}

/* 输出格式配置样式 */
.output-format-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.format-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.format-row.inline {
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.format-label {
  flex-shrink: 0;
  width: 70px;
  font-size: 13px;
  color: #606266;
}

.field-count {
  color: #6366f1;
  font-weight: 500;
}

/* 输出预览样式 */
.output-preview {
  margin-top: 8px;
}

.preview-content {
  padding: 12px;
  background: #1e1e2e;
  border-radius: 8px;
  overflow: hidden;
}

.preview-code {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #cdd6f4;
  white-space: pre-wrap;
  word-break: break-all;
}

.config-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.config-item-header label {
  margin-bottom: 0;
}

/* 元素类型占位符样式 */
.element-type-placeholder {
  color: #9ca3af;
  text-align: center;
  display: block;
}

/* 输入参数定义样式 */
.input-params-definition {
  padding: 12px 16px;
  background: #faf5ff;
  border-radius: 8px;
  border: 1px solid #e9d5ff;
}

/* 输出参数定义样式 */
.output-params-definition {
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.param-name {
  display: inline-block;
  padding: 4px 10px;
  background: #6366f1;
  color: #fff;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.param-type {
  display: inline-block;
  padding: 4px 10px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #a7f3d0;
}

.param-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.auto-hint {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
  margin-left: 4px;
}

.param-fields {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.field-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.field-item:first-child {
  padding-top: 0;
}

.field-name {
  display: inline-block;
  padding: 3px 8px;
  background: #6366f1;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  min-width: 120px;
}

.field-type {
  display: inline-block;
  padding: 3px 8px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #a7f3d0;
  min-width: 80px;
  text-align: center;
}

.field-desc {
  font-size: 12px;
  color: #6b7280;
}

/* IO Section 样式 */
.io-section {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.io-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  user-select: none;
}

.io-section-header:hover {
  background: #f3f4f6;
}

.expand-icon {
  color: #9ca3af;
  font-size: 12px;
  transition: transform 0.2s;
}

.io-section-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.io-section-content {
  padding: 12px 16px;
  background: #fff;
}

.io-param-item {
  margin-bottom: 16px;
}

.io-param-item:last-child {
  margin-bottom: 0;
}

.io-param-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.io-param-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.io-param-name .required-mark {
  color: #ef4444;
  margin-left: 2px;
}

.io-param-type {
  font-size: 12px;
  color: #6b7280;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
}

.io-param-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.io-param-input {
  margin-top: 8px;
}

.io-param-input .el-input__wrapper {
  background: #fff;
}

/* IO 表格样式 - 无边框表格 */
.io-table {
  --el-table-border-color: transparent;
}

.io-table .el-table__inner-wrapper::before {
  display: none;
}

.io-table .el-table__header-wrapper th {
  background: #f9fafb;
  font-weight: 500;
  color: #6b7280;
  font-size: 12px;
}

.io-table .el-table__body tr:hover > td {
  background: #f9fafb;
}

.io-table .el-table__body td {
  padding: 10px 0;
}

.param-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-name-cell .required-mark {
  color: #ef4444;
  font-weight: 500;
}

.param-name-cell .param-name-text {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.param-name-cell .param-desc-icon {
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.param-name-cell .param-desc-icon:hover {
  color: #6366f1;
}

.param-type-tag {
  font-size: 12px;
  color: #6b7280;
  padding: 2px 10px;
  background: #f3f4f6;
  border-radius: 4px;
}

/* 参数值输入样式 */
.param-value-input {
  display: flex;
  align-items: center;
  justify-content: center;
}

.param-input-with-btn {
  width: 100%;
}

.param-select-with-btn {
  flex: 1;
  min-width: 0;
}

.param-value-input .link-icon {
  margin-left: 8px;
  flex-shrink: 0;
}

/* File 类型输入样式 */
.param-value-input.file-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-value {
  flex: 1;
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-placeholder {
  flex: 1;
  font-size: 12px;
  color: #9ca3af;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.param-input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  cursor: pointer;
  font-size: 14px;
  color: #9ca3af;
  transition: color 0.2s;
}

.action-icon:hover {
  color: #6366f1;
}

.upload-icon:hover {
  color: #10b981;
}

.link-icon:hover {
  color: #3b82f6;
}

/* 变量选择器对话框样式 */
.variable-selector-dialog .variable-list {
  max-height: 400px;
  overflow-y: auto;
}

.variable-selector-dialog .no-variables {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}

.variable-selector-dialog .variable-item {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.variable-selector-dialog .variable-item:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.variable-selector-dialog .variable-item:last-child {
  margin-bottom: 0;
}

.variable-selector-dialog .variable-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.variable-selector-dialog .variable-node {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.variable-selector-dialog .variable-arrow {
  color: #9ca3af;
  font-size: 12px;
}

.variable-selector-dialog .variable-param {
  font-size: 13px;
  color: #6366f1;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.variable-selector-dialog .variable-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.variable-selector-dialog .variable-type {
  font-size: 11px;
  color: #6b7280;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 3px;
}

.variable-selector-dialog .variable-expr {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
