<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
  Document,
  Connection,
  DataAnalysis,
  Link,
  Timer,
  Close,
  MoreFilled,
  Edit,
  CopyDocument,
  CircleCheck,
  Grid,
  Upload,
  Tools,
  QuestionFilled,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Position,
  Loading,
  Share,
  DataLine,
  Cpu,
  FolderAdd,
  Refresh,
} from '@element-plus/icons-vue'
import AiChat from '@/components/chat/AiChat.vue'
import LoopBodyCanvas from './components/LoopBodyCanvas.vue'
import JsonTreeView from '@/components/workflow/JsonTreeView.vue'
import { useAssociations } from './composables/useAssociations'
import { useNodeParams, flattenJsonTree, getNodeOutputParams } from './composables/useNodeParams'
// 新增 composables - 可用于渐进式重构
// import { useAIChat } from './composables/useAIChat'
// import { useWorkflowExecution } from './composables/useWorkflowExecution'
// import { useClipboard } from './composables/useClipboard'
// import { useWorkflowSave } from './composables/useWorkflowSave'
// 新增 components - 可用于渐进式重构
// import AIChatPanel from './components/AIChatPanel.vue'
// import RunPanel from './components/RunPanel.vue'
// import EditorToolbar from './components/EditorToolbar.vue'
import { generateCopyName, getExistingNames } from './utils/nodeCopyName'
import { generateUuid } from './utils/uuid'
import { useVariableTypeStore } from '@/stores/variableType.js'
import { getNodeTypes } from '@/api/nodeType.js'
import { getSkillList, getSkillDetail } from '@/api/skill.js'
import { getDefaultWorkflow, getWorkflowDetail, saveWorkflowData, updateWorkflow, publishWorkflow as publishWorkflowApi, createWorkflow } from '@/api/workflow.js'
import { sendMessage as sendChatMessage, sendMessageStream } from '@/api/chat.js'
import { getDictionaryColumnsByName } from '@/api/dictionary.js'
import { marked } from 'marked'

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

// 空格键状态（用于平移模式）
const spaceKeyPressed = ref(false)

// 缩放输入状态
const showZoomInput = ref(false)
const inputZoom = ref(100)

// 监听 scale 变化，同步 inputZoom
watch(
  () => canvas.scale,
  (newScale) => {
    inputZoom.value = Math.round(newScale * 100)
  },
  { immediate: true }
)

// 节点类型分组配置（核心3个分类）
const nodeCategories = [
  { key: 'BASIC', name: '基础节点' },
  { key: 'LOGIC', name: '逻辑控制' },
  { key: 'EXECUTION', name: '执行节点' },
]

// 节点类型配置（核心8种类型 + Skill 从后端动态加载）
const nodeTypes = ref([
  // 基础节点（不在弹窗中显示）
  { type: 'start', name: '开始', icon: 'VideoPlay', color: '#22c55e', category: 'BASIC' },
  { type: 'end', name: '结束', icon: 'CircleCheck', color: '#ef4444', category: 'BASIC' },
  { type: 'loopBodyCanvas', name: '循环体', icon: 'Grid', color: '#3b82f6', category: 'BASIC', hidden: true },
  // 逻辑控制节点
  { type: 'loop', name: '循环', icon: 'Refresh', color: '#8b5cf6', category: 'LOGIC' },
  { type: 'condition_simple', name: '条件分支', icon: 'Share', color: '#f59e0b', category: 'LOGIC' },
  { type: 'condition_multi', name: '多路分支', icon: 'Grid', color: '#f97316', category: 'LOGIC' },
  { type: 'batch', name: '批处理', icon: 'DataLine', color: '#3b82f6', category: 'LOGIC' },
  { type: 'async', name: '异步处理', icon: 'Connection', color: '#0ea5e9', category: 'LOGIC' },
  { type: 'collect', name: '结果收集', icon: 'FolderAdd', color: '#14b8a6', category: 'LOGIC' },
  // 执行节点（Skill 从后端动态加载）
])

// 加载节点类型数据
const loadNodeTypes = async () => {
  try {
    const response = await getNodeTypes()
    if (response && Array.isArray(response)) {
      // 基础节点类型（不在弹窗中显示）
      const basicNodeTypes = [
        { type: 'start', name: '开始', icon: 'VideoPlay', color: '#22c55e', category: 'BASIC' },
        { type: 'end', name: '结束', icon: 'CircleCheck', color: '#ef4444', category: 'BASIC' },
        { type: 'loopBodyCanvas', name: '循环体', icon: 'Grid', color: '#3b82f6', category: 'BASIC', hidden: true },
      ]
      // 核心节点类型定义（前端回退，不包含 skill）
      const coreNodeTypeDefinitions = [
        { type: 'loop', name: '循环', icon: 'Refresh', color: '#8b5cf6', category: 'LOGIC' },
        { type: 'condition_simple', name: '条件分支', icon: 'Share', color: '#f59e0b', category: 'LOGIC' },
        { type: 'condition_multi', name: '多路分支', icon: 'Grid', color: '#f97316', category: 'LOGIC' },
        { type: 'batch', name: '批处理', icon: 'DataLine', color: '#3b82f6', category: 'LOGIC' },
        { type: 'async', name: '异步处理', icon: 'Connection', color: '#0ea5e9', category: 'LOGIC' },
        { type: 'collect', name: '结果收集', icon: 'FolderAdd', color: '#14b8a6', category: 'LOGIC' },
      ]
      // 核心节点图标映射
      const coreIconMap = {
        loop: 'Refresh',
        condition_simple: 'Share',
        condition_multi: 'Grid',
        batch: 'DataLine',
        async: 'Connection',
        collect: 'FolderAdd',
      }
      // 核心节点颜色映射
      const coreColorMap = {
        loop: '#8b5cf6',
        condition_simple: '#f59e0b',
        condition_multi: '#f97316',
        batch: '#3b82f6',
        async: '#0ea5e9',
        collect: '#14b8a6',
      }
      // 映射后端数据到前端格式
      const apiNodeTypes = response.map((item) => ({
        type: item.code,
        name: item.name,
        icon: item.icon || coreIconMap[item.code] || 'Document',
        color: item.color || coreColorMap[item.code] || '#6366f1',
        category: item.category,
        description: item.description,
      }))
      // 合并节点类型：API节点 + 前端回退节点（去重）
      const apiTypeSet = new Set(apiNodeTypes.map(n => n.type))
      // 只添加后端没有返回的基础节点
      const filteredBasicTypes = basicNodeTypes.filter(n => !apiTypeSet.has(n.type))
      const filteredCoreTypes = coreNodeTypeDefinitions.filter(n => !apiTypeSet.has(n.type))
      nodeTypes.value = [...apiNodeTypes, ...filteredBasicTypes, ...filteredCoreTypes]
    }
  } catch (error) {
    console.error('加载节点类型失败:', error)
    ElMessage.error('系统服务异常！')
  }

  // 加载已发布的 Skill 列表作为执行节点
  await loadSkillNodes()
}

// 加载已发布的 Skill 列表作为执行节点
const loadSkillNodes = async () => {
  try {
    const response = await getSkillList({ status: 'PUBLISHED', size: 100 })
    if (response && response.content) {
      const skillNodeTypes = response.content.map((skill) => ({
        type: `skill-${skill.id}`,
        name: skill.name,
        icon: 'Cpu',
        color: '#6366f1',
        category: 'EXECUTION',
        description: skill.description || '',
        skillData: skill, // 保存原始 Skill 数据
      }))
      // 移除已有的 Skill 节点，添加新的
      const nonSkillTypes = nodeTypes.value.filter((t) => !t.type.startsWith('skill-'))
      nodeTypes.value = [...nonSkillTypes, ...skillNodeTypes]
    }
  } catch (error) {
    console.error('加载 Skill 列表失败:', error)
    // 不显示错误提示，因为可能没有 Skill 数据
  }
}

// 节点功能描述映射（核心节点）
const nodeDescriptions = {
  loop: '循环遍历执行，支持计数循环和数组遍历',
  condition_simple: '二分支条件判断，true/false 两个分支',
  condition_multi: '多路条件分支，支持多个 case 和 default',
  batch: '批量并行处理，提高执行效率',
  async: '异步执行节点，不阻塞主流程',
  collect: '收集多个分支的执行结果',
  skill: '从 Skill 库加载的执行节点',
}

// 使用变量类型 Store
const variableTypeStore = useVariableTypeStore()

// 变量类型级联选择器数据（从后端动态获取）
const typeOptions = computed(() => variableTypeStore.typeOptions)

// 基本类型选项（不含 Array 和 File，用于循环节点输出变量）
const basicTypeOptions = computed(() => variableTypeStore.basicTypeOptions)

// 将参数的 type 和 elementType/fileType/dictionaryType 转换为级联选择器的值
const getTypeValue = (param) => {
  if (!param.type) return ['String']
  if (param.type === 'Array') {
    return ['Array', param.elementType || 'String']
  }
  if (param.type === 'File') {
    return ['File', param.fileType || 'Txt']
  }
  if (param.type === 'Dictionary') {
    return ['Dictionary', param.dictionaryType || '公文写作数据字典']
  }
  return [param.type]
}

// 处理级联选择器值变化
const handleTypeChange = (value, row) => {
  if (!value || value.length === 0) {
    row.type = 'String'
    row.elementType = undefined
    row.fileType = undefined
    row.dictionaryType = undefined
    return
  }
  if (value[0] === 'Array') {
    row.type = 'Array'
    row.elementType = value[1] || 'String'
    row.fileType = undefined
    row.dictionaryType = undefined
  } else if (value[0] === 'File') {
    row.type = 'File'
    row.fileType = value[1] || 'Txt'
    row.elementType = undefined
    row.dictionaryType = undefined
  } else if (value[0] === 'Dictionary') {
    row.type = 'Dictionary'
    row.dictionaryType = value[1] || '公文写作数据字典'
    row.elementType = undefined
    row.fileType = undefined
  } else {
    row.type = value[0]
    row.elementType = undefined
    row.fileType = undefined
    row.dictionaryType = undefined
  }
}

// 节点图标映射
const iconComponents = {
  VideoPlay,
  CircleCheck,
  Timer,
  Document,
  Connection,
  DataAnalysis,
  Share,
  Grid,
  DataLine,
  Cpu,
  FolderAdd,
  Refresh,
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
    name: 'HTTPS/HTTP接口调用',
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
    config: {
      modelValue: 'DeepSeekR1-32B',
      promptValue: '',
      toEvaluateType: 'String',
      toEvaluateValue: '',
      refType: 'String',
      refValue: '',
    },
  },
  {
    id: 'tableGenerate-1',
    type: 'tableGenerate',
    name: '表格生成',
    x: 1780,
    y: 300,
    inputs: [{ id: 'in-tg-1', name: '输入' }],
    outputs: [{ id: 'out-tg-1', name: '输出' }],
    config: {
      inputParams: [],
    },
  },
  {
    id: 'end-1',
    type: 'end',
    name: '结束',
    x: 2060,
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
  { id: 'conn-6', sourceId: 'judgeModel-1', sourcePort: 'out-jm-1', targetId: 'tableGenerate-1', targetPort: 'in-tg-1', sourceParamIndex: 0, targetParamIndex: 0 },
  { id: 'conn-7', sourceId: 'tableGenerate-1', sourcePort: 'out-tg-1', targetId: 'end-1', targetPort: 'in-1', sourceParamIndex: 0, targetParamIndex: 0 },
])

// 关联线（循环节点与循环体画布之间的虚线关联）
const associations = ref([])

// 获取循环体画布节点
const getLoopBodyNodes = computed(() => {
  return nodes.value.filter((n) => n.type === 'loopBodyCanvas')
})

// 计算节点高度（用于端口位置计算和关联线计算）
const calculateNodeHeight = (node) => {
  const nodeWidth = 220

  // 开始节点
  if (node.type === 'start') {
    const params = getNodeOutputParams(node)
    const paramsHeight = params.length > 0 ? 32 : 0
    return 56 + paramsHeight
  }

  // 结束节点
  if (node.type === 'end') {
    const inputParams = getNodeInputParams(node)
    let nodeHeight = 56
    if (inputParams.length > 0) {
      nodeHeight += 45
    }
    return nodeHeight
  }

  // 普通节点
  const inputParams = getNodeInputParams(node)
  const outputParams = getNodeOutputParams(node)

  // 基础高度：border(4) + padding-top(12) + header(28) + padding-bottom(12) = 56px
  let nodeHeight = 56

  // 如果有输入参数，增加输入参数区域高度：margin-top(12) + height(34) = 46px
  if (inputParams.length > 0) {
    nodeHeight += 46
  }

  // 如果有输出参数，增加输出参数区域高度
  if (outputParams.length > 0) {
    nodeHeight += 46
  }

  return nodeHeight
}

// 使用 useAssociations composable
const { getAssociationPath, createAssociation, deleteAssociation, getLoopBodyIdByLoopId } =
  useAssociations(associations, nodes, getLoopBodyNodes, calculateNodeHeight)

// 使用 useNodeParams composable 获取节点参数函数
const { formatParamType, getNodeInputParams } = useNodeParams()

// 选中的节点
const selectedNode = ref(null)

// 配置弹窗可见性
const configDialogVisible = ref(false)

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

// 分支选择对话框状态
const showBranchSelectDialog = ref(false)
const pendingConnection = ref(null)

// 获取可选择的分支列表
const getSelectableBranches = computed(() => {
  if (!pendingConnection.value) return []
  const sourceNode = pendingConnection.value.sourceNode
  if (!sourceNode || sourceNode.type !== 'condition_multi') return []

  const branches = []
  const conditions = sourceNode.conditions

  // 如果没有 conditions 数据，提供默认分支
  if (!conditions) {
    return [
      { id: 'default', label: '默认分支', type: 'default' }
    ]
  }

  if (conditions.cases) {
    // 添加所有 case 分支
    conditions.cases.forEach((c) => {
      branches.push({
        id: c.id,
        label: c.label,
        type: 'case',
      })
    })
  }
  // 添加默认分支
  if (conditions.defaultCase) {
    branches.push({
      id: conditions.defaultCase.id,
      label: conditions.defaultCase.label,
      type: 'default',
    })
  } else {
    // 如果没有默认分支，添加一个默认的
    branches.push({
      id: 'default',
      label: '默认分支',
      type: 'default',
    })
  }
  return branches
})

// 处理分支选择
const handleBranchSelect = (branch) => {
  if (!pendingConnection.value) return

  const { sourceNode, sourceParam, sourceParamIndex, targetNode, targetParam, targetParamIndex } =
    pendingConnection.value

  // 创建新连线，带上分支标签
  const newConnection = {
    id: `conn-${Date.now()}`,
    sourceId: sourceNode.id,
    sourcePort: sourceParam?.id || `out-${sourceParamIndex}`,
    sourceParamIndex: sourceParamIndex,
    targetId: targetNode.id,
    targetPort: targetParam?.id || `in-${targetParamIndex}`,
    targetParamIndex: targetParamIndex,
    branchLabel: branch.label,
    branchId: branch.id,
    branchType: branch.type,
  }

  connections.value.push(newConnection)

  // 重置状态
  showBranchSelectDialog.value = false
  pendingConnection.value = null
}

// 取消分支选择
const cancelBranchSelect = () => {
  showBranchSelectDialog.value = false
  pendingConnection.value = null
}

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
  hasTriggeredDrag: false, // 标记是否真正触发了拖拽（长按计时器执行）
})

// 关闭添加节点弹窗

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
  hasMoved: false, // 是否真正移动了（用于区分点击和拖拽）
  isMultiDrag: false, // 是否多节点拖拽
  multiNodeStartPositions: {}, // 多节点拖拽时的起始位置
})

// 画布拖拽状态
const canvasDragState = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
})

// 直接从节点数据计算端口位置（不依赖 DOM 测量，避免缩放时的时序问题）
const getPortPosition = (node, paramIndex, type) => {
  const nodeWidth = 220

  // 开始节点的输出端口（添加按钮位置）- 在节点右侧垂直居中
  if (node.type === 'start' && type === 'output') {
    // 开始节点高度：border(2*2) + padding(12*2) + content(28) = 56px
    // 如果有输出参数，高度增加：margin-top(12) + 内容(20) = 32px
    const params = getNodeOutputParams(node)
    const paramsHeight = params.length > 0 ? 32 : 0
    const nodeHeight = 56 + paramsHeight
    return {
      x: node.x + nodeWidth - 2, // right: -6px 意味着端口中心在节点右边框内 2px
      y: node.y + nodeHeight / 2,
    }
  }

  // 结束节点的输入端口 - 在节点左侧垂直居中
  if (node.type === 'end' && type === 'input') {
    // 结束节点高度需要根据参数计算
    const inputParams = getNodeInputParams(node)
    // 基础高度：border(4) + padding(24) + header(28) = 56px
    let nodeHeight = 56
    if (inputParams.length > 0) {
      // 参数区域：margin-top(12) + padding-top(10) + border-top(1) + 内容(约22px) ≈ 45px
      nodeHeight += 45
    }
    return {
      x: node.x + 2, // left: -6px 意味着端口中心在节点左边框内 2px
      y: node.y + nodeHeight / 2,
    }
  }

  // 输入端口在节点左侧 - 在节点垂直中心位置
  if (type === 'input') {
    // 计算普通节点的实际高度
    const inputParams = getNodeInputParams(node)
    const outputParams = getNodeOutputParams(node)

    // 基础高度：border(4) + padding-top(12) + header(28) + padding-bottom(12) = 56px
    let nodeHeight = 56

    // 如果有输入参数，增加输入参数区域高度：margin-top(12) + height(34) = 46px
    if (inputParams.length > 0) {
      nodeHeight += 46
    }

    // 如果有输出参数，增加输出参数区域高度
    if (outputParams.length > 0) {
      nodeHeight += 46
    }

    return {
      x: node.x,
      y: node.y + nodeHeight / 2,
    }
  }

  // 输出端口在节点右侧 - 在节点垂直中心位置
  // 计算普通节点的实际高度（与输入端口相同）
  const inputParams = getNodeInputParams(node)
  const outputParams = getNodeOutputParams(node)

  // 基础高度：border(4) + padding-top(12) + header(28) + padding-bottom(12) = 56px
  let nodeHeight = 56

  // 如果有输入参数，增加输入参数区域高度：margin-top(12) + height(34) = 46px
  if (inputParams.length > 0) {
    nodeHeight += 46
  }

  // 如果有输出参数，增加输出参数区域高度
  if (outputParams.length > 0) {
    nodeHeight += 46
  }

  return {
    x: node.x + nodeWidth,
    y: node.y + nodeHeight / 2,
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

  // 直接从节点数据计算端口位置（避免 DOM 测量的时序问题）
  const sourcePortPos = getPortPosition(sourceNode, sourceParamIndex, 'output')
  const targetPortPos = getPortPosition(targetNode, targetParamIndex, 'input')

  const x1 = sourcePortPos.x
  const y1 = sourcePortPos.y
  const x2 = targetPortPos.x
  const y2 = targetPortPos.y

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

  // 直接从节点数据计算端口位置（避免 DOM 测量的时序问题）
  const sourcePortPos = getPortPosition(sourceNode, sourceParamIndex, 'output')
  const targetPortPos = getPortPosition(targetNode, targetParamIndex, 'input')

  const x1 = sourcePortPos.x
  const y1 = sourcePortPos.y
  const x2 = targetPortPos.x
  const y2 = targetPortPos.y

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

  // 直接从节点数据计算端口位置（避免 DOM 测量的时序问题）
  const sourcePortPos = getPortPosition(sourceNode, sourceParamIndex, 'output')
  const targetPortPos = getPortPosition(targetNode, targetParamIndex, 'input')

  const x1 = sourcePortPos.x
  const y1 = sourcePortPos.y
  const x2 = targetPortPos.x
  const y2 = targetPortPos.y

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
  return nodeTypes.value.find((t) => t.type === type) || nodeTypes.value[0]
}

// 解析 JSON 字段的辅助函数
const parseJsonField = (field, defaultValue) => {
  if (!field) return defaultValue
  if (typeof field === 'string') {
    try {
      return JSON.parse(field)
    } catch {
      return defaultValue
    }
  }
  return field
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponents[iconName]
}

// 获取可用的数组变量（用于循环节点的 cycle_array 配置）
const getArrayVariables = () => {
  const arrayVars = []

  // 遍历所有节点，查找数组类型的输出参数
  nodes.value.forEach((node) => {
    if (node.type === 'start') {
      // 开始节点的输出参数
      const outputParams = node.outputParams || []
      outputParams.forEach((param) => {
        if (param.type === 'Array' || param.type === 'array') {
          arrayVars.push({
            label: `${param.name} - ${formatParamType(param)} (${node.name})`,
            value: `${node.id}.${param.name}`,
          })
        }
      })
    } else if (node.type === 'loop') {
      // 循环节点的输出参数中可能有数组
      const outputParams = node.outputParams || []
      outputParams.forEach((param) => {
        if (param.type === 'Array' || param.type === 'array') {
          arrayVars.push({
            label: `${param.name} - ${formatParamType(param)} (${node.name})`,
            value: `${node.id}.${param.name}`,
          })
        }
      })
    } else {
      // 其他节点的输出参数
      const outputParams = getNodeOutputParams(node)
      outputParams.forEach((param) => {
        if (param.type === 'Array' || param.type === 'array' || param.type?.includes('Array')) {
          arrayVars.push({
            label: `${param.name} - ${formatParamType(param)} (${node.name})`,
            value: `${node.id}.${param.name}`,
          })
        }
      })
    }
  })

  return arrayVars
}

// 缩放画布
const zoomIn = () => {
  canvas.scale = Math.min(2, canvas.scale + 0.1)
}

const zoomOut = () => {
  canvas.scale = Math.max(0.25, canvas.scale - 0.1)
}

const resetZoom = () => {
  canvas.scale = 1
  canvas.offsetX = 0
  canvas.offsetY = 0
}

// 处理缩放输入变化
const handleZoomInputChange = (value) => {
  const newScale = value / 100
  canvas.scale = Math.min(Math.max(newScale, 0.25), 2)
}

// 适应内容（重置视图）
const handleFitContent = () => {
  resetZoom()
}

// 处理滚轮缩放（以鼠标位置为中心）
const handleWheel = (event) => {
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.min(Math.max(canvas.scale + delta, 0.25), 2)

  if (newScale === canvas.scale) return

  // 获取鼠标在容器中的位置
  const rect = canvasContainerRef.value?.getBoundingClientRect()
  if (!rect) return

  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 计算鼠标在画布上的位置
  const canvasMouseX = (mouseX - canvas.offsetX) / canvas.scale
  const canvasMouseY = (mouseY - canvas.offsetY) / canvas.scale

  // 更新缩放
  canvas.scale = newScale

  // 调整偏移量，使鼠标位置保持不变
  canvas.offsetX = mouseX - canvasMouseX * newScale
  canvas.offsetY = mouseY - canvasMouseY * newScale
}

// 键盘事件处理
const handleKeyDown = (event) => {
  // 忽略输入框内的快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  // 空格键：进入平移模式
  if (event.code === 'Space' && !spaceKeyPressed.value) {
    event.preventDefault()
    spaceKeyPressed.value = true
    if (canvasContainerRef.value) {
      canvasContainerRef.value.style.cursor = 'grab'
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
      resetZoom()
    }
  }
}

// 键盘松开事件处理
const handleKeyUp = (event) => {
  if (event.code === 'Space') {
    spaceKeyPressed.value = false
    if (canvasContainerRef.value && !canvasDragState.isDragging) {
      canvasContainerRef.value.style.cursor = ''
    }
  }
}

// 返回列表
const goBack = () => {
  router.push('/workflow')
}

// 保存状态
const saveState = reactive({
  isSaving: false,
  lastSavedAt: null,
})

// 保存工作流
const saveWorkflow = async () => {
  if (saveState.isSaving) {
    ElMessage.warning('正在保存中，请稍候...')
    return
  }

  saveState.isSaving = true
  try {
    // 构建节点数据（转换为后端格式）
    const nodesData = nodes.value.map((node) => {
      // 基础节点数据
      const baseNode = {
        nodeUuid: node.id,
        type: node.type,
        name: node.name,
        positionX: Math.round(node.x),
        positionY: Math.round(node.y),
        inputPorts: JSON.stringify(node.inputs || []),
        outputPorts: JSON.stringify(node.outputs || []),
        inputParams: JSON.stringify(node.inputParams || []),
        outputParams: JSON.stringify(node.outputParams || []),
        config: JSON.stringify(node.config || {}),
        parentNodeUuid: node.parentNodeId || null,
      }

      // 如果是循环体节点，添加完整属性（包含内部画布的完整数据）
      if (node.type === 'loopBodyCanvas') {
        // 获取循环体画布的引用
        const loopBodyCanvasRef = loopBodyCanvasRefs.value[node.id]
        let loopBodyData = node.loopBody || null

        // 如果有画布组件引用，获取最新的内部节点和连线数据
        if (loopBodyCanvasRef && loopBodyCanvasRef.getLoopBodyData) {
          loopBodyData = loopBodyCanvasRef.getLoopBodyData()
        }

        baseNode.config = JSON.stringify({
          ...node.config,
          width: node.width || 500,
          height: node.height || 400,
          belongsTo: node.belongsTo,
          // 循环体完整数据：包含内部节点、连线、端口配置
          loopBody: loopBodyData ? {
            canvas: loopBodyData.canvas || { scale: 1, offsetX: 0, offsetY: 0 },
            nodes: (loopBodyData.nodes || []).map((innerNode) => ({
              id: innerNode.id,
              type: innerNode.type,
              name: innerNode.name,
              x: innerNode.x,
              y: innerNode.y,
              inputs: innerNode.inputs || [],
              outputs: innerNode.outputs || [],
              inputParams: innerNode.inputParams || [],
              outputParams: innerNode.outputParams || [],
              config: innerNode.config || {},
            })),
            connections: (loopBodyData.connections || []).map((innerConn) => ({
              id: innerConn.id,
              sourceId: innerConn.sourceId,
              sourcePort: innerConn.sourcePort,
              targetId: innerConn.targetId,
              targetPort: innerConn.targetPort,
              sourceParamIndex: innerConn.sourceParamIndex,
              targetParamIndex: innerConn.targetParamIndex,
              label: innerConn.label || null,
            })),
            leftPort: loopBodyData.leftPort || { id: 'port-left', name: '输入', type: 'input', y: 200, params: [] },
            rightPort: loopBodyData.rightPort || { id: 'port-right', name: '输出', type: 'output', y: 200, params: [] },
          } : null,
        })
      }

      return baseNode
    })

    // 构建连线数据（转换为后端格式）
    const connectionsData = connections.value.map((conn) => ({
      connectionUuid: conn.id,
      sourceNodeUuid: conn.sourceId,  // 前端节点 UUID
      sourcePortId: conn.sourcePort || '',  // 确保有默认值
      targetNodeUuid: conn.targetId,  // 前端节点 UUID
      targetPortId: conn.targetPort || '',  // 确保有默认值
      sourceParamIndex: conn.sourceParamIndex || null,
      targetParamIndex: conn.targetParamIndex || null,
      label: conn.label || null,
    }))

    // 构建关联数据（循环节点与循环体画布的关联）
    const associationsData = associations.value.map((assoc) => ({
      containerNodeUuid: assoc.sourceId,  // 循环节点的前端 UUID
      bodyNodeUuid: assoc.targetId,  // 循环体画布的前端 UUID
      associationType: assoc.associationType || 'LOOP_BODY',
    }))

    // console.log('保存时关联数据:', associationsData)

    const saveData = {
      nodes: nodesData,
      connections: connectionsData,
      associations: associationsData,
    }

    // 判断是新建还是更新
    const workflowId = workflow.id
    const isNewWorkflow = workflowId === 'new' || !workflowId

    if (isNewWorkflow) {
      // 创建工作流（一次性保存完整数据）
      const createResponse = await createWorkflow({
        name: workflow.name,
        description: workflow.description || '',
        createdBy: workflow.createdBy || 'admin',
        nodes: nodesData,
        connections: connectionsData,
        associations: associationsData,
      })
      if (createResponse && createResponse.data) {
        workflow.id = createResponse.data.id
        // 更新 URL 为工作流 ID，这样刷新页面时能正确加载
        router.replace(`/workflow/${createResponse.data.id}?projectName=${encodeURIComponent(workflow.name)}`)
      }
    } else {
      // 更新工作流数据
      await saveWorkflowData(workflowId, saveData)
    }

    saveState.lastSavedAt = new Date()
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存工作流失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saveState.isSaving = false
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
const addNode = async (type) => {
  // 处理 Skill 节点
  if (type.startsWith('skill-')) {
    await addSkillNode(type)
    return
  }

  const typeConfig = getNodeTypeConfig(type)
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    name: typeConfig.name,
    x: 200 + Math.random() * 300,
    y: 250 + Math.random() * 150,
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
    newNode.config.inputParams = []
  }

  // 循环节点特殊处理：自动创建循环体画布和关联线
  if (type === 'loop') {
    newNode.inputParams = [
      { name: 'times', type: 'Integer', required: false },
      { name: 'cycle_array', type: 'Array', required: false },
    ]
    newNode.outputParams = [
      { name: 'current_item', type: 'Any' },
      { name: 'current_index', type: 'Number' },
    ]
    newNode.config = {
      times: null,
      cycle_array: null,
    }

    // 创建循环体画布节点
    // 计算位置：循环体中心点横坐标与循环控制节点中心点一致
    // 循环体中心点纵坐标 = 循环控制节点中心点纵坐标 + 0.75 × 循环体高度
    const loopNodeWidth = 220
    const loopNodeHeight = 70
    const loopBodyWidth = 500
    const loopBodyHeight = 400
    const loopBodyX = newNode.x + (loopNodeWidth / 2) - (loopBodyWidth / 2)
    const loopBodyY = newNode.y + (loopNodeHeight / 2) + 0.25 * loopBodyHeight

    const loopBodyCanvas = {
      id: `loopBody-${newNode.id}`,
      type: 'loopBodyCanvas',
      name: '循环体',
      x: loopBodyX,
      y: loopBodyY,
      width: loopBodyWidth,
      height: loopBodyHeight,
      belongsTo: newNode.id,
      loopBody: {
        canvas: { scale: 1, offsetX: 0, offsetY: 0 },
        nodes: [],
        connections: [],
        leftPort: {
          id: 'port-left',
          name: '输入',
          type: 'input',
          y: 200,
          params: [],
        },
        rightPort: {
          id: 'port-right',
          name: '输出',
          type: 'output',
          y: 200,
          params: [],
        },
      },
    }
    // 先添加循环节点到数组
    nodes.value.push(newNode)
    // 再添加循环体画布节点
    nodes.value.push(loopBodyCanvas)
    // 创建关联线
    createAssociation(newNode.id, loopBodyCanvas.id)
  }

  // 裁判模型节点特殊处理
  if (type === 'judgeModel') {
    newNode.config = {
      modelValue: 'DeepSeekR1-32B',
      promptValue: '',
      toEvaluateType: 'String',
      toEvaluateValue: '',
      refType: 'String',
      refValue: '',
    }
  }

  // 表格生成节点特殊处理
  if (type === 'tableGenerate') {
    newNode.config = {
      inputParams: [],
    }
  }

  // 非循环节点在此添加
  if (type !== 'loop') {
    nodes.value.push(newNode)
  }

  selectedNode.value = newNode

  // 关闭添加节点弹窗
  showAddNodePopover.value = null
  insertConnection.value = null
}

// 添加 Skill 节点（从 Skill 库动态加载）
const addSkillNode = async (type) => {
  // 从 type 中提取 skillId（格式：skill-{skillId}）
  const skillId = type.replace('skill-', '')

  // 获取节点类型配置（包含 skillData）
  const typeConfig = getNodeTypeConfig(type)
  if (!typeConfig || !typeConfig.skillData) {
    ElMessage.error('Skill 数据不存在')
    return
  }

  try {
    // 获取 Skill 详情（包含入参出参）
    const skillDetail = await getSkillDetail(skillId)
    if (!skillDetail) {
      ElMessage.error('获取 Skill 详情失败')
      return
    }

    // 创建节点对象
    const newNode = {
      id: `skill-${Date.now()}`,
      nodeUuid: generateUuid(), // 使用标准 UUID 格式
      type: 'skill',
      nodeCategory: 'EXECUTION',
      name: skillDetail.name,
      description: skillDetail.description || '', // Skill 描述信息
      skillId: skillId,
      allowAddInputParams: skillDetail.allowAddInputParams || false, // 是否支持额外增加入参
      allowAddOutputParams: skillDetail.allowAddOutputParams || false, // 是否支持额外增加出参
      skillSnapshot: JSON.stringify({
        id: skillDetail.id,
        name: skillDetail.name,
        description: skillDetail.description || '',
        inputParameters: skillDetail.inputParameters || [],
        outputParameters: skillDetail.outputParameters || [],
      }),
      // 映射输入参数
      inputParams: (skillDetail.inputParameters || []).map((p) => ({
        name: p.paramName,
        type: p.paramType,
        required: p.required,
        description: p.description,
        defaultValue: p.defaultValue,
        valueSourceType: 'literal',
        value: p.defaultValue ?? '',
      })),
      // 映射输出参数
      outputParams: (skillDetail.outputParameters || []).map((p) => ({
        name: p.paramName,
        type: p.paramType,
        description: p.description,
      })),
      x: 200 + Math.random() * 300,
      y: 250 + Math.random() * 150,
      inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
      config: {},
    }

    // 添加节点到画布
    nodes.value.push(newNode)
    selectedNode.value = newNode

    // 关闭添加节点弹窗
    showAddNodePopover.value = null
    insertConnection.value = null

    ElMessage.success(`已添加技能节点：${skillDetail.name}`)
  } catch (error) {
    console.error('添加 Skill 节点失败:', error)
    ElMessage.error('系统服务异常！')
  }
}

// 重命名节点
const renameDialogVisible = ref(false)
const newNodeName = ref('')
const renamingNode = ref(null)  // 保存正在重命名的节点引用
const isEditingNodeName = ref(false)
const editingNodeName = ref('')

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
const aiChatConversationId = ref(null)

// AI聊天框拖拽调整宽度
const aiChatWidth = ref(400)
const aiChatMinWidth = 300
const aiChatMaxWidth = 600
const isDraggingAiChat = ref(false)

// 开始拖拽AI聊天框
const startDragAiChat = (e) => {
  e.stopPropagation()
  e.preventDefault()
  isDraggingAiChat.value = true
  document.addEventListener('mousemove', onDragAiChat)
  document.addEventListener('mouseup', stopDragAiChat)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ew-resize'
}

// 拖拽中
const onDragAiChat = (e) => {
  if (!isDraggingAiChat.value) return
  e.preventDefault()
  const panel = document.querySelector('.ai-chat-panel')
  if (!panel) return
  const panelRect = panel.getBoundingClientRect()
  const newWidth = panelRect.right - e.clientX
  if (newWidth >= aiChatMinWidth && newWidth <= aiChatMaxWidth) {
    aiChatWidth.value = newWidth
  }
}

// 停止拖拽
const stopDragAiChat = () => {
  isDraggingAiChat.value = false
  document.removeEventListener('mousemove', onDragAiChat)
  document.removeEventListener('mouseup', stopDragAiChat)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

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

// 发送AI消息（流式）
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

  // 创建AI消息占位符
  const aiMessageId = Date.now() + 1
  const aiMessage = {
    id: aiMessageId,
    type: 'ai',
    content: '',
    time: new Date(),
    isStreaming: true,
  }
  aiChatMessages.value.push(aiMessage)

  aiChatIsTyping.value = true

  try {
    // 使用流式API
    await sendMessageStream(
      {
        conversationId: aiChatConversationId.value,
        message: content,
        context: {
          source: 'workflow-editor',
          workflowId: workflow.id,  // 传递工作流ID，用于多轮会话
        },
      },
      {
        onChunk: (data) => {
          if (data.type === 'start') {
            aiChatConversationId.value = data.conversationId
          } else if (data.type === 'chunk') {
            // 找到AI消息并追加内容
            const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
            if (msg) {
              msg.content += data.content
              scrollAiChatToBottom()
            }
          }
        },
        onAction: (data) => {
          // 处理工作流更新事件
          if (data.type === 'workflow_update') {
            handleWorkflowUpdated(data)
          }
        },
        onDone: async (data) => {
          aiChatIsTyping.value = false
          const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
          if (msg) {
            msg.isStreaming = false
            msg.messageUuid = data.messageUuid
          }
          nextTick(() => scrollAiChatToBottom())

          // AI 回答完成后，刷新工作流数据
          await loadWorkflowData()
        },
        onError: (error) => {
          aiChatIsTyping.value = false
          const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
          if (msg) {
            msg.content = error || '抱歉，服务暂时不可用'
            msg.isStreaming = false
          }
          nextTick(() => scrollAiChatToBottom())
        },
        // 新增 onAction 回调处理 workflow_update 事件
        onAction: (data) => {
          if (data.type === 'workflow_update') {
            handleWorkflowUpdated(data)
          }
        },
      }
    )
  } catch (error) {
    aiChatIsTyping.value = false
    const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
    if (msg) {
      msg.content = aiReplies[Math.floor(Math.random() * aiReplies.length)]
      msg.isStreaming = false
    }
    nextTick(() => scrollAiChatToBottom())
  }
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

// 渲染Markdown内容
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (e) {
    return content
  }
}

// 清空AI聊天记录
const clearAiChat = () => {
  // 重置对话ID
  aiChatConversationId.value = null
  aiChatMessages.value = [
    {
      id: Date.now(),
      type: 'ai',
      content: '对话已清空，有什么新问题吗?',
      time: new Date(),
    },
  ]
}

// 处理工作流更新事件（来自 AI 助手）
const handleWorkflowUpdated = (data) => {
  console.log('收到工作流更新事件:', data)


  if (!data || !data.nodes) {
    console.warn('工作流更新数据格式不正确', data)
    return
  }

  // 遍历更新的节点，应用新配置
  data.nodes.forEach((nodeUpdate) => {
    // 根据 nodeUuid 查找对应的节点
    const nodeIndex = nodes.value.findIndex(n => n.nodeUuid === nodeUpdate.nodeUuid)
    if (nodeIndex !== -1) {
      const node = nodes.value[nodeIndex]
      // 更新节点配置
      if (nodeUpdate.config) {
        node.config = typeof nodeUpdate.config === 'string'
          ? nodeUpdate.config
          : JSON.stringify(nodeUpdate.config)
      }
      console.log('已更新节点配置:', node.name, nodeUpdate.config)
    }
  })

  // 显示系统提示消息
  aiChatMessages.value.push({
    id: Date.now(),
    type: 'system',
    content: '工作流节点配置已更新',
    time: new Date(),
  })
  nextTick(() => scrollAiChatToBottom())
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
  // 从右键菜单保存的节点获取选中的节点
  if (contextMenu.node) {
    selectedNode.value = contextMenu.node
  }
  hideContextMenu()
  showRenameDialog()
}

// 右键菜单操作：创建副本
const contextMenuDuplicate = () => {
  // 从右键菜单保存的节点获取选中的节点
  if (contextMenu.node) {
    selectedNode.value = contextMenu.node
  }
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

// 连线标签编辑对话框
const connectionLabelDialog = reactive({
  visible: false,
  label: '',
  connection: null,
})

// 连线右键菜单操作：编辑标签
const connectionMenuEditLabel = () => {
  if (!contextMenu.connection) return
  connectionLabelDialog.connection = contextMenu.connection
  connectionLabelDialog.label = contextMenu.connection.label || ''
  connectionLabelDialog.visible = true
  hideContextMenu()
}

// 保存连线标签
const saveConnectionLabel = () => {
  if (!connectionLabelDialog.connection) return
  const connection = connections.value.find((c) => c.id === connectionLabelDialog.connection.id)
  if (connection) {
    connection.label = connectionLabelDialog.label.trim() || null
  }
  connectionLabelDialog.visible = false
  connectionLabelDialog.connection = null
  connectionLabelDialog.label = ''
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
  // 保存节点引用到专用变量，避免被其他操作清除
  renamingNode.value = selectedNode.value
  newNodeName.value = selectedNode.value.name
  renameDialogVisible.value = true
}

const confirmRename = () => {
  const name = newNodeName.value?.trim() || ''
  if (!renamingNode.value || !name) return
  renamingNode.value.name = name
  renameDialogVisible.value = false
  renamingNode.value = null  // 清除引用
  ElMessage.success('重命名成功')
}

// 双击编辑节点名称
const nodeNameInput = ref(null)

const startEditNodeName = () => {
  if (!selectedNode.value) return
  // 排除开始节点、结束节点和循环体节点
  if (['start', 'end', 'loopBodyCanvas'].includes(selectedNode.value.type)) return
  editingNodeName.value = selectedNode.value.name
  isEditingNodeName.value = true
  // 自动聚焦输入框
  nextTick(() => {
    nodeNameInput.value?.focus()
    nodeNameInput.value?.select()
  })
}

// 完成节点名称编辑
const finishEditNodeName = () => {
  if (!selectedNode.value) return
  if (editingNodeName.value.trim()) {
    selectedNode.value.name = editingNodeName.value.trim()
  }
  isEditingNodeName.value = false
}

// 取消节点名称编辑
const cancelEditNodeName = () => {
  isEditingNodeName.value = false
  editingNodeName.value = ''
}

// 创建节点副本
const duplicateNode = () => {
  if (!selectedNode.value) return

  const originalNode = selectedNode.value
  const existingNames = getExistingNames(nodes.value)
  const newNode = {
    ...JSON.parse(JSON.stringify(originalNode)),
    id: `${originalNode.type}-${Date.now()}`,
    name: generateCopyName(originalNode.name, existingNames),
    x: originalNode.x + 50,
    y: originalNode.y + 50,
  }

  nodes.value.push(newNode)
  ElMessage.success('副本创建成功')
}

// ========== 剪贴板功能 ==========

// 节点剪贴板
const nodeClipboard = ref([])

// 全选所有节点
const selectAllNodes = () => {
  selectedNodeUuids.value = nodes.value
    .filter((n) => n.type !== 'loopBodyCanvas') // 不选择循环体画布
    .map((n) => n.id)
  selectedConnection.value = null
  if (selectedNodeUuids.value.length > 0) {
    const firstNode = nodes.value.find((n) => n.id === selectedNodeUuids.value[0])
    selectedNode.value = firstNode || null
  }
  ElMessage.success(`已选择 ${selectedNodeUuids.value.length} 个节点`)
}

// 复制选中的节点
const copySelectedNodes = () => {
  const nodeIds = selectedNodeUuids.value.length > 0
    ? [...selectedNodeUuids.value]
    : (selectedNode.value ? [selectedNode.value.id] : [])

  if (nodeIds.length === 0) {
    ElMessage.warning('请先选择要复制的节点')
    return
  }

  // 过滤掉不能复制的节点（start/end）
  const copyableNodes = nodeIds.filter((id) => {
    const node = nodes.value.find((n) => n.id === id)
    return node && node.type !== 'start' && node.type !== 'end' && node.type !== 'loopBodyCanvas'
  })

  if (copyableNodes.length === 0) {
    ElMessage.warning('选中的节点不支持复制')
    return
  }

  // 深拷贝节点到剪贴板
  nodeClipboard.value = copyableNodes.map((id) => {
    const node = nodes.value.find((n) => n.id === id)
    return JSON.parse(JSON.stringify(node))
  })

  ElMessage.success(`已复制 ${nodeClipboard.value.length} 个节点`)
}

// 粘贴节点
const pasteNodes = () => {
  if (nodeClipboard.value.length === 0) {
    ElMessage.warning('剪贴板为空')
    return
  }

  // 获取现有节点名称列表（用于去重）
  const existingNames = nodes.value.map((n) => n.name)

  // 创建新节点
  const newNodes = nodeClipboard.value.map((nodeData) => {
    const newNode = {
      ...nodeData,
      id: `${nodeData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: generateCopyName(nodeData.name, existingNames),
      x: nodeData.x + 30,
      y: nodeData.y + 30,
    }
    // 更新名称列表
    existingNames.push(newNode.name)
    return newNode
  })

  // 添加节点到画布
  newNodes.forEach((node) => {
    nodes.value.push(node)
  })

  // 选中新粘贴的节点
  selectedNodeUuids.value = newNodes.map((n) => n.id)
  selectedNode.value = newNodes[0]

  ElMessage.success(`已粘贴 ${newNodes.length} 个节点`)
}

// 删除选中的节点（支持批量删除）
const deleteSelectedNodes = async () => {
  // 获取要删除的节点 ID 列表
  const nodeIds = selectedNodeUuids.value.length > 0
    ? [...selectedNodeUuids.value]
    : (selectedNode.value ? [selectedNode.value.id] : [])

  if (nodeIds.length === 0) return

  // 检查是否包含 start/end 节点（不允许删除）
  const protectedNodes = nodeIds.filter((id) => {
    const node = nodes.value.find((n) => n.id === id)
    return node?.type === 'start' || node?.type === 'end'
  })

  if (protectedNodes.length > 0) {
    ElMessage.warning('开始和结束节点不能删除')
    return
  }

  // 处理循环节点和循环体画布的关联
  nodeIds.forEach((nodeId) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node?.type === 'loop') {
      const loopBodyId = getLoopBodyIdByLoopId(nodeId)
      if (loopBodyId) {
        // 删除循环体画布节点
        nodes.value = nodes.value.filter((n) => n.id !== loopBodyId)
        // 删除关联线
        associations.value = associations.value.filter((a) => a.sourceId !== nodeId)
      }
    }
    if (node?.type === 'loopBodyCanvas') {
      const loopId = node.belongsTo
      if (loopId) {
        // 删除关联线
        associations.value = associations.value.filter((a) => a.targetId !== nodeId)
      }
    }
  })

  // 删除节点
  nodes.value = nodes.value.filter((n) => !nodeIds.includes(n.id))

  // 删除相关连线（级联删除）
  connections.value = connections.value.filter(
    (c) => !nodeIds.includes(c.sourceId) && !nodeIds.includes(c.targetId)
  )

  // 清空选择状态
  selectedNode.value = null
  selectedNodeUuids.value = []

  ElMessage.success(`已删除 ${nodeIds.length} 个节点`)
}

// 兼容旧的单节点删除函数
const deleteSelectedNode = () => {
  deleteSelectedNodes()
}

// 删除选中连线
const deleteSelectedConnection = () => {
  if (!selectedConnection.value) return
  connections.value = connections.value.filter((c) => c.id !== selectedConnection.value.id)
  selectedConnection.value = null
}

// 多选节点 UUID 列表（用于批量操作）
const selectedNodeUuids = ref([])

// 选中节点（支持多选，单击不打开配置面板）
const selectNode = (node, event, multiSelect = false) => {
  event?.stopPropagation()
  hideContextMenu()
  selectedConnection.value = null

  // 多选模式：使用 Ctrl/Cmd + 点击
  if (multiSelect) {
    // 切换选中状态
    const index = selectedNodeUuids.value.indexOf(node.id)
    if (index > -1) {
      // 已选中则取消选中
      selectedNodeUuids.value.splice(index, 1)
      // 如果当前编辑的节点被取消选中，清空 selectedNode
      if (selectedNode.value?.id === node.id) {
        selectedNode.value = null
      }
    } else {
      // 未选中则添加
      selectedNodeUuids.value.push(node.id)
    }
  } else {
    // 单选模式：只选中节点，不打开配置面板
    selectedNodeUuids.value = [node.id]
    // 不再自动设置 selectedNode.value，避免打开配置面板
  }

  // 初始化条件判断节点配置
  if (node.type === 'condition') {
    initConditionConfig()
  }
  // 初始化文本清洗节点配置
  if (node.type === 'textClean') {
    initTextCleanConfig()
  }
  // 初始化循环节点配置
  if (node.type === 'loop') {
    initLoopConfig()
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
  selectedNodeUuids.value = []
}

// 检查节点是否选中
const isNodeSelected = (nodeId) => {
  return selectedNodeUuids.value.includes(nodeId)
}

// 处理节点点击事件（支持多选）
const handleNodeClick = (node, event) => {
  const multiSelect = event?.ctrlKey || event?.metaKey
  selectNode(node, event, multiSelect)
}

// 双击打开节点配置面板
const openNodeConfig = (node) => {
  selectedNode.value = node
  configDialogVisible.value = true
  // 初始化条件判断节点配置
  if (node.type === 'condition') {
    initConditionConfig()
  }
  // 初始化简单条件分支节点配置
  if (node.type === 'condition_simple') {
    initConditionSimpleConfig()
  }
  // 初始化多路分支节点配置
  if (node.type === 'condition_multi') {
    initConditionMultiConfig()
  }
  // 初始化文本清洗节点配置
  if (node.type === 'textClean') {
    initTextCleanConfig()
  }
}

// 处理配置弹窗关闭
const handleConfigDialogClose = () => {
  selectedNode.value = null
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

// 添加循环节点输出参数
const addLoopOutputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.loopOutputParams) {
    selectedNode.value.config.loopOutputParams = []
  }
  selectedNode.value.config.loopOutputParams.push({
    id: `loop-out-${Date.now()}`,
    name: '',
    elementType: '', // 类型由关联的变量自动推断
    value: '',
  })
}

// 删除循环节点输出参数
const removeLoopOutputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.config.loopOutputParams) return
  selectedNode.value.config.loopOutputParams.splice(index, 1)
}

// 格式化循环节点输出变量类型显示（Array<elementType>）
const formatLoopOutputType = (elementType) => {
  return `Array<${elementType || 'String'}>`
}

// 循环节点输出变量选择器索引
const loopOutputVariableIndex = ref(null)

// 循环节点输出变量选择器专用对话框
const showLoopOutputSelectorDialog = ref(false)
const loopOutputSelectorList = ref([])

// 获取循环节点输出变量可关联的变量列表（包含循环体、前置节点、开始节点）
const getLoopBodyNodeOutputs = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'loop') return []

  const outputs = []
  const addedVariables = new Set() // 用于去重

  // 辅助函数：添加变量（带去重）
  const addVariable = (item) => {
    const key = `${item.nodeName}.${item.param}`
    if (!addedVariables.has(key)) {
      addedVariables.add(key)
      outputs.push(item)
    }
  }

  // 1. 获取开始节点的初始变量
  const startNode = nodes.value.find((n) => n.type === 'start')
  if (startNode && startNode.outputParams) {
    startNode.outputParams.forEach((param) => {
      // 过滤掉数组类型的变量
      if (param.type === 'Array' || (param.type && param.type.startsWith('Array'))) return
      addVariable({
        nodeId: startNode.id,
        nodeName: startNode.name,
        param: param.name,
        type: param.type || 'String',
        variable: `\${${startNode.name}.${param.name}}`,
        source: 'start', // 标记来源：开始节点
      })
    })
  }

  // 2. 获取前置节点的输出变量
  const visitedNodes = new Set()
  const findUpstreamNodes = (nodeId) => {
    if (visitedNodes.has(nodeId)) return
    visitedNodes.add(nodeId)

    const incomingConns = connections.value.filter((c) => c.targetId === nodeId)
    incomingConns.forEach((conn) => {
      const sourceNode = nodes.value.find((n) => n.id === conn.sourceId)
      if (sourceNode && !visitedNodes.has(sourceNode.id) && sourceNode.type !== 'start') {
        const nodeOutputs = getNodeOutputParams(sourceNode)
        nodeOutputs.forEach((param) => {
          // 过滤掉数组类型的变量
          if (param.type && param.type.startsWith('Array')) return
          if (param.isPlaceholder) return
          addVariable({
            nodeId: sourceNode.id,
            nodeName: sourceNode.name,
            param: param.name,
            type: param.type,
            variable: `\${${sourceNode.name}.${param.name}}`,
            source: 'upstream', // 标记来源：前置节点
          })
        })
        findUpstreamNodes(sourceNode.id)
      }
    })
  }
  findUpstreamNodes(selectedNode.value.id)

  // 3. 获取循环体中节点的输出变量
  const loopBodyCanvasNode = nodes.value.find(
    (n) => n.type === 'loopBodyCanvas' && n.belongsTo === selectedNode.value.id
  )

  if (loopBodyCanvasNode) {
    // 优��从组件引用获取最新的 bodyNodes（包含实时编辑的数据）
    const canvasRef = loopBodyCanvasRefs.value[loopBodyCanvasNode.id]
    let loopBodyNodes = []

    if (canvasRef && canvasRef.bodyNodes) {
      // 从组件引用获取最新的节点数据
      // 注意：bodyNodes 在组件中是 ref，但通过 defineExpose 暴露后会自动解包
      const bodyNodesRef = canvasRef.bodyNodes
      loopBodyNodes = Array.isArray(bodyNodesRef) ? bodyNodesRef : (bodyNodesRef.value || bodyNodesRef || [])
    } else if (loopBodyCanvasNode.loopBody && loopBodyCanvasNode.loopBody.nodes) {
      // 回退到 loopBody 中存储的节点数据
      loopBodyNodes = loopBodyCanvasNode.loopBody.nodes
    }

    loopBodyNodes.forEach((node) => {
      // 特殊处理 HTTPS/HTTP 接口调用节点：展开所有属性字段
      if (node.type === 'apiAuto') {
        const treeOutputs = getNodeOutputParams(node)
        if (treeOutputs && treeOutputs.length > 0) {
          // 扁平化树形结构，获取所有属性
          const flatOutputs = flattenJsonTree(treeOutputs)
          flatOutputs.forEach((param) => {
            // 过滤掉数组类型的变量
            if (param.type && param.type.startsWith('Array')) return
            addVariable({
              nodeId: node.id,
              nodeName: node.name,
              param: param.name,
              type: param.type,
              variable: `\${${node.name}.${param.name}}`,
              source: 'loopBody', // 标记来源：循环体
              isNested: param.isNested, // 标记是否为嵌套属性
            })
          })
        }
      } else {
        // 其他节点：正常处理
        const nodeOutputs = getNodeOutputParams(node)
        nodeOutputs.forEach((param) => {
          // 过滤掉数组类型的变量
          if (param.type && param.type.startsWith('Array')) return
          if (param.isPlaceholder) return
          addVariable({
            nodeId: node.id,
            nodeName: node.name,
            param: param.name,
            type: param.type,
            variable: `\${${node.name}.${param.name}}`,
            source: 'loopBody', // 标记来源：循环体
          })
        })
      }
    })
  }

  return outputs
}

// 显示循环节点输出变量的变量选择器
const showLoopOutputVariableSelector = (index) => {
  loopOutputVariableIndex.value = index
  // 获取循环体节点输出变量列表
  loopOutputSelectorList.value = getLoopBodyNodeOutputs()
  showLoopOutputSelectorDialog.value = true
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

// 获取HTTPS/HTTP接口调用节点的输出参数（用于配置面板显示）
const getApiAutoOutputParams = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'apiAuto') {
    return []
  }
  return getNodeOutputParams(selectedNode.value)
}

// 刷新HTTPS/HTTP接口调用节点的输出变量（当response值变化时调用）
const refreshApiAutoOutputs = () => {
  // 这个函数会在response值变化时被调用
  // 输出参数会通过 getApiAutoOutputParams 自动更新
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

// ========== 简单条件分支 (condition_simple) 相关函数 ==========

// 操作符定义
const CONDITION_OPERATORS = [
  // 字符串操作符
  { value: 'equals', label: '等于', types: ['String', 'Integer', 'File'] },
  { value: 'notEquals', label: '不等于', types: ['String', 'Integer', 'File'] },
  { value: 'contains', label: '包含', types: ['String', 'Array'] },
  { value: 'startsWith', label: '开头是', types: ['String'] },
  { value: 'endsWith', label: '结尾是', types: ['String'] },
  { value: 'isEmpty', label: '为空', types: ['String', 'Array', 'Object'] },
  { value: 'isNotEmpty', label: '不为空', types: ['String', 'Array', 'Object'] },
  // 数值操作符
  { value: 'greaterThan', label: '大于', types: ['Integer'] },
  { value: 'lessThan', label: '小于', types: ['Integer'] },
  { value: 'greaterThanOrEqual', label: '大于等于', types: ['Integer'] },
  { value: 'lessThanOrEqual', label: '小于等于', types: ['Integer'] },
  { value: 'between', label: '区间', types: ['Integer'] },
  // 布尔操作符
  { value: 'isTrue', label: '为真', types: ['Boolean'] },
  { value: 'isFalse', label: '为假', types: ['Boolean'] },
  // 数组操作符
  { value: 'sizeEquals', label: '长度等于', types: ['Array'] },
  { value: 'sizeGreaterThan', label: '长度大于', types: ['Array'] },
]

// 初始化简单条件分支配置
const initConditionSimpleConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.conditionExpression) {
    selectedNode.value.config.conditionExpression = {
      leftOperand: '',
      leftOperandType: 'literal',
      operator: 'equals',
      rightOperand: '',
      rightOperandType: 'literal',
      rightOperandMin: '',
      rightOperandMax: '',
    }
  }
}

// 获取当前左操作数的类型
const getLeftOperandType = () => {
  if (!selectedNode.value || !selectedNode.value.config.conditionExpression) return null
  const leftOperand = selectedNode.value.config.conditionExpression.leftOperand
  if (!leftOperand || !leftOperand.startsWith('${')) return null

  // 解析变量引用
  const match = leftOperand.match(/^\$\{(.+)\.(.+)\}$/)
  if (!match) return null

  const nodeName = match[1]
  const paramName = match[2]

  // 查找变量类型
  const variables = getAvailableVariables()
  const variable = variables.find((v) => v.nodeName === nodeName && v.paramName === paramName)
  return variable?.type || null
}

// 根据左操作数类型过滤操作符
const getFilteredOperators = () => {
  const leftType = getLeftOperandType()
  if (!leftType) {
    // 类型未知时返回全部操作符
    return CONDITION_OPERATORS
  }

  // 提取基础类型（处理 Array<String>, File<Excel> 等格式）
  const baseType = leftType.match(/^(\w+)/)?.[1] || leftType

  return CONDITION_OPERATORS.filter((op) => op.types.includes(baseType))
}

// 判断是否需要显示右操作数
const showRightOperandInput = computed(() => {
  if (!selectedNode.value || !selectedNode.value.config.conditionExpression) return true
  const operator = selectedNode.value.config.conditionExpression.operator
  const unaryOperators = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse']
  return !unaryOperators.includes(operator)
})

// 左操作数变化处理
const onLeftOperandChange = (value) => {
  if (!selectedNode.value) return
  selectedNode.value.config.conditionExpression.leftOperand = value

  // 检测是否是变量引用
  if (value && value.startsWith('${')) {
    selectedNode.value.config.conditionExpression.leftOperandType = 'reference'
  } else {
    selectedNode.value.config.conditionExpression.leftOperandType = 'literal'
  }

  // 如果当前操作符不在可用列表中，重置为第一个可用操作符
  const filteredOps = getFilteredOperators()
  const currentOp = selectedNode.value.config.conditionExpression.operator
  const isOpAvailable = filteredOps.some((op) => op.value === currentOp)
  if (!isOpAvailable && filteredOps.length > 0) {
    selectedNode.value.config.conditionExpression.operator = filteredOps[0].value
  }
}

// 操作符变化处理
const onOperatorChange = (value) => {
  if (!selectedNode.value) return
  selectedNode.value.config.conditionExpression.operator = value
}

// 右操作数类型变化处理
const onRightOperandTypeChange = (type) => {
  if (!selectedNode.value) return
  selectedNode.value.config.conditionExpression.rightOperandType = type
  // 清空值
  selectedNode.value.config.conditionExpression.rightOperand = ''
  selectedNode.value.config.conditionExpression.rightOperandMin = ''
  selectedNode.value.config.conditionExpression.rightOperandMax = ''
}

// 打开变量选择器（用于条件表达式）
const conditionVarSelectorTarget = ref('left')
const openVariableSelectorForCondition = (target) => {
  conditionVarSelectorTarget.value = target
  // 使用现有的变量选择器
  variableSelectorField.value = `condition_${target}`
  variableSelectorFilterType.value = null
  variableSelectorFilterTypes.value = null
  showVariableSelectorDialog.value = true
}

// ========== 多路分支节点 (condition_multi) 相关函数 ==========

// 初始化多路分支配置
const initConditionMultiConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.conditions) {
    selectedNode.value.conditions = {
      type: 'MULTI',
      cases: [],
      defaultCase: {
        id: 'default',
        label: '默认分支'
      }
    }
  }
}

// 添加多路分支 case
const addMultiCase = () => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  const cases = selectedNode.value.conditions.cases
  const newPriority = cases.length > 0 ? Math.max(...cases.map(c => c.priority || 0)) + 1 : 1
  const newCase = {
    id: `case-${Date.now()}`,
    label: `分支${cases.length + 1}`,
    priority: newPriority,
    expression: {
      leftOperand: '',
      operator: 'equals',
      rightOperand: ''
    }
  }
  cases.push(newCase)
  // 按优先级排序
  sortCasesByPriority()
}

// 删除多路分支 case
const removeMultiCase = (index) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases.splice(index, 1)
}

// 按 priority 排序 cases
const sortCasesByPriority = () => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases.sort((a, b) => (a.priority || 0) - (b.priority || 0))
}

// 获取可用优先级选项
const getPriorityOptions = () => {
  if (!selectedNode.value || !selectedNode.value.conditions) return []
  const caseCount = selectedNode.value.conditions.cases.length
  return Array.from({ length: caseCount }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1
  }))
}

// 处理 case 名称变化
const onCaseLabelChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases[index].label = value
}

// 处理 case 优先级变化
const onCasePriorityChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases[index].priority = value
  sortCasesByPriority()
}

// 处理 case 左操作数变化
const onCaseLeftOperandChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases[index].expression.leftOperand = value
}

// 处理 case 操作符变化
const onCaseOperatorChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases[index].expression.operator = value
}

// 处理 case 右操作数变化
const onCaseRightOperandChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.cases[index].expression.rightOperand = value
}

// 处理默认分支名称变化
const onDefaultLabelChange = (value) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return
  selectedNode.value.conditions.defaultCase.label = value
}

// case 变量选择器相关状态
const conditionCaseIndex = ref(-1)
const conditionCaseOperand = ref('left')

// 打开 case 变量选择器
const openCaseVarSelector = (caseIndex, operand) => {
  conditionCaseIndex.value = caseIndex
  conditionCaseOperand.value = operand
  variableSelectorField.value = `condition_multi_${operand}_${caseIndex}`
  variableSelectorFilterType.value = null
  variableSelectorFilterTypes.value = null
  showVariableSelectorDialog.value = true
}

// 获取 case 的过滤后操作符列表
const getFilteredOperatorsForCase = (caseIndex) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return CONDITION_OPERATORS
  const caseItem = selectedNode.value.conditions.cases[caseIndex]
  if (!caseItem || !caseItem.expression.leftOperand) return CONDITION_OPERATORS

  const leftOperand = caseItem.expression.leftOperand
  if (!leftOperand.startsWith('${')) return CONDITION_OPERATORS

  // 解析变量引用，获取类型
  const match = leftOperand.match(/^\$\{(.+)\.(.+)\}$/)
  if (!match) return CONDITION_OPERATORS

  const nodeName = match[1]
  const paramName = match[2]
  const variables = getAvailableVariables()
  const variable = variables.find(v => v.nodeName === nodeName && v.paramName === paramName)

  if (!variable || !variable.type) return CONDITION_OPERATORS

  const baseType = variable.type.match(/^(\w+)/)?.[1] || variable.type
  return CONDITION_OPERATORS.filter((op) => op.types.includes(baseType))
}

// 判断 case 是否需要右操作数
const showCaseRightOperand = (caseIndex) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return true
  const caseItem = selectedNode.value.conditions.cases[caseIndex]
  if (!caseItem) return true
  const operator = caseItem.expression.operator
  const unaryOperators = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse']
  return !unaryOperators.includes(operator)
}

// 判断 case 是否需要两个右操作数（区间）
const showCaseTwoRightOperands = (caseIndex) => {
  if (!selectedNode.value || !selectedNode.value.conditions) return false
  const caseItem = selectedNode.value.conditions.cases[caseIndex]
  if (!caseItem) return false
  return caseItem.expression.operator === 'between'
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

// Dictionary columns缓存
const dictionaryColumnsCache = ref({})

// 展开的变量索引
const expandedVariableIndex = ref(new Set())

// 正在加载columns的变量索引
const loadingColumnsIndex = ref(new Set())

// 多选模式相关
const isMultiSelectMode = ref(false) // 是否为多选模式
const selectedColumns = ref(new Set()) // 多选模式下已选择的columns

// 裁判模型节点变量选择器相关
const judgeModelTypeField = ref(null) // 记录当前选择的类型字段

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
// 变量选择器类型过滤
const variableSelectorFilterType = ref(null)
const variableSelectorFilterTypes = ref(null) // 支持多类型过滤

// 判断两个类型是否匹配
const isTypeMatch = (varType, filterType) => {
  if (!filterType) return true // 没有过滤类型，显示所有变量

  // 完全匹配
  if (varType === filterType) return true

  // File 类型匹配（File 匹配 File<Excel>，File<Excel> 匹配 File<Excel>）
  if (filterType.startsWith('File') && varType.startsWith('File')) return true

  // Array 类型匹配
  if (filterType.startsWith('Array') && varType.startsWith('Array')) return true

  // Dictionary 类型匹配
  if (filterType.startsWith('Dictionary') && varType.startsWith('Dictionary')) return true

  return false
}

// 判断类型是否匹配多类型过滤
const isTypeMatchMultiple = (varType, filterTypes) => {
  if (!filterTypes || filterTypes.length === 0) return true
  return filterTypes.some(filterType => isTypeMatch(varType, filterType))
}

// 获取过滤后的前置节点输出变量
const getFilteredUpstreamOutputs = () => {
  const outputs = getUpstreamNodeOutputs()

  // 多类型过滤
  if (variableSelectorFilterTypes.value && variableSelectorFilterTypes.value.length > 0) {
    return outputs.filter(item => isTypeMatchMultiple(item.type, variableSelectorFilterTypes.value))
  }

  // 单类型过滤
  if (variableSelectorFilterType.value) {
    return outputs.filter(item => isTypeMatch(item.type, variableSelectorFilterType.value))
  }

  return outputs
}

const showVariableSelector = (field, multiSelect = false, filterType = null) => {
  variableSelectorField.value = field
  isMultiSelectMode.value = multiSelect
  variableSelectorFilterType.value = filterType
  variableSelectorFilterTypes.value = null
  selectedColumns.value = new Set() // 重置多选状态
  expandedVariableIndex.value = new Set() // 重置展开状态
  showVariableSelectorDialog.value = true
}

// 显示变量选择器（支持多类型过滤）
const showVariableSelectorWithTypes = (field, filterTypes, enableMultiSelectForDict = false) => {
  variableSelectorField.value = field
  // 如果过滤类型包含 Dictionary 且启用了���选，则开启多选模式
  isMultiSelectMode.value = enableMultiSelectForDict && filterTypes.some(t => t === 'Dictionary' || t.startsWith('Dictionary'))
  variableSelectorFilterType.value = null
  variableSelectorFilterTypes.value = filterTypes
  selectedColumns.value = new Set()
  expandedVariableIndex.value = new Set()
  showVariableSelectorDialog.value = true
}

// Skill 节点变量选择器相关
const skillVariableSelectorIndex = ref(null)
const skillVariableSelectorType = ref(null) // 'input' | 'output'

// 显示 Skill 节点的变量选择器
const showSkillVariableSelector = (index, type) => {
  skillVariableSelectorIndex.value = index
  skillVariableSelectorType.value = type
  variableSelectorField.value = `skill-${type}-${index}`
  isMultiSelectMode.value = false
  variableSelectorFilterType.value = null
  variableSelectorFilterTypes.value = null
  selectedColumns.value = new Set()
  expandedVariableIndex.value = new Set()
  showVariableSelectorDialog.value = true
}

// 处理 Skill 节点文件上传
const handleSkillFileUpload = (file, index) => {
  // 这里可以处理文件上传逻辑，暂时只保存文件名
  if (selectedNode.value && selectedNode.value.inputParams && selectedNode.value.inputParams[index]) {
    selectedNode.value.inputParams[index].value = file.name
    selectedNode.value.inputParams[index].valueSourceType = 'literal'
  }
  return false // 阻止自动上传
}

// Skill 节点添加额外输入参数
const addSkillInputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.inputParams) {
    selectedNode.value.inputParams = []
  }
  // 添加一个新的空参数
  selectedNode.value.inputParams.push({
    name: '',
    type: 'String',
    required: false,
    description: '',
    valueSourceType: 'literal',
    value: '',
    isExtra: true, // 标记为额外添加的参数
  })
}

// Skill 节点删除额外输入参数
const removeSkillInputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.inputParams) return
  selectedNode.value.inputParams.splice(index, 1)
}

// 获取 cols 变量的动态类型
const getColsDynamicType = () => {
  if (!selectedNode.value) return 'String'
  const colsValue = selectedNode.value.config.colsValue
  if (!colsValue) return 'String'

  // 如果是变量引用（以 ${ 开头）
  if (colsValue.startsWith('${')) {
    // 尝试从已存储的类型信息获取
    const colsType = selectedNode.value.config.colsType
    if (colsType) return colsType

    // 从前置节点输出中查找变量类型
    const upstreamOutputs = getUpstreamNodeOutputs()
    const matchedOutput = upstreamOutputs.find(item => item.variable === colsValue)
    if (matchedOutput) {
      return matchedOutput.type
    }
  }

  // 默认返回 String
  return 'String'
}

// 当 cols 值变化时，更新类型
const onColsValueChange = () => {
  if (!selectedNode.value) return
  const colsValue = selectedNode.value.config.colsValue

  // 如果不是变量引用，清除存储的类型
  if (!colsValue || !colsValue.startsWith('${')) {
    selectedNode.value.config.colsType = 'String'
    return
  }

  // 如果是变量引用，从前置节点输出中查找类型
  const upstreamOutputs = getUpstreamNodeOutputs()
  const matchedOutput = upstreamOutputs.find(item => item.variable === colsValue)
  if (matchedOutput) {
    selectedNode.value.config.colsType = matchedOutput.type
  }
}

// 显示裁判模型节点的变量选择器
const showJudgeModelVariableSelector = (field, typeField = null) => {
  variableSelectorField.value = field
  judgeModelTypeField.value = typeField
  showVariableSelectorDialog.value = true
}

// 处理裁判模型节点类型变化
const handleJudgeModelTypeChange = (typeField, value) => {
  if (!selectedNode.value) return
  selectedNode.value.config[typeField] = value
}

// 表格生成节点相关函数
const tableGenerateVariableIndex = ref(null)

// 添加表格生成节点输入参数
const addTableGenerateInputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.inputParams) {
    selectedNode.value.config.inputParams = []
  }
  selectedNode.value.config.inputParams.push({
    name: '',
    type: 'String',
    value: '',
  })
}

// 删除表格生成节点输入参数
const removeTableGenerateInputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.config.inputParams) return
  selectedNode.value.config.inputParams.splice(index, 1)
}

// 获取表格生成节点参数类型显示值
const getTableGenerateTypeValue = (param) => {
  if (!param.type) return 'String'
  if (param.type === 'Array') return 'Array<String>'
  if (param.type === 'Dictionary') return 'Dictionary'
  return param.type
}

// 处理表格生成节点类型变化
const handleTableGenerateTypeChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.config.inputParams) return
  const param = selectedNode.value.config.inputParams[index]
  if (!param) return

  if (value === 'Array<String>') {
    param.type = 'Array'
    param.elementType = 'String'
  } else if (value === 'Dictionary') {
    param.type = 'Dictionary'
    param.dictionaryType = '公文写作数据字典'
  } else {
    param.type = value
    delete param.elementType
    delete param.dictionaryType
  }
}

// 显示表格生成节点变量选择器
const showTableGenerateVariableSelector = (index) => {
  variableSelectorField.value = `tableGenerateInputParam_${index}`
  tableGenerateVariableIndex.value = index
  showVariableSelectorDialog.value = true
}

// ========== 结束节点输入参数相关函数 ==========

// 添加结束节点输入参数
const addEndInputParam = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.inputParams) {
    selectedNode.value.config.inputParams = []
  }
  selectedNode.value.config.inputParams.push({
    name: '',
    type: 'String',
    value: '',
  })
}

// 删除结束节点输入参数
const removeEndInputParam = (index) => {
  if (!selectedNode.value || !selectedNode.value.config.inputParams) return
  selectedNode.value.config.inputParams.splice(index, 1)
}

// 获取结束节点参数类型显示值
const getEndTypeValue = (param) => {
  if (!param.type) return 'String'
  if (param.type === 'Array') return 'Array<String>'
  if (param.type === 'Dictionary') return 'Dictionary'
  return param.type
}

// 处理结束节点类型变化
const handleEndTypeChange = (index, value) => {
  if (!selectedNode.value || !selectedNode.value.config.inputParams) return
  const param = selectedNode.value.config.inputParams[index]
  if (!param) return

  if (value === 'Array<String>') {
    param.type = 'Array'
    param.elementType = 'String'
  } else if (value === 'Dictionary') {
    param.type = 'Dictionary'
    param.dictionaryType = '公文写作数据字典'
  } else {
    param.type = value
    delete param.elementType
    delete param.dictionaryType
  }
}

// 结束节点变量选择器索引
const endVariableIndex = ref(null)

// 显示结束节点变量选择器
const showEndVariableSelector = (index) => {
  variableSelectorField.value = `endInputParam_${index}`
  endVariableIndex.value = index
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

// 根据变量值获取其类型
const getVariableType = (variableValue) => {
  if (!variableValue || !variableValue.startsWith('${')) return null

  const upstreamOutputs = getUpstreamNodeOutputs()
  const selectedOutput = upstreamOutputs.find((item) => item.variable === variableValue)
  return selectedOutput ? selectedOutput.type : null
}

// 选择循环输出变量（自动推断类型）
const selectLoopOutputVariable = (item) => {
  if (!selectedNode.value) return
  const index = loopOutputVariableIndex.value
  if (index !== null && selectedNode.value.config.loopOutputParams && selectedNode.value.config.loopOutputParams[index]) {
    // 设置变量值
    selectedNode.value.config.loopOutputParams[index].value = item.variable
    // 根据关联变量的类型自动推断输出类型（Array<elementType>）
    // item.type 是循环体节点输出的类型，如 String, Number 等
    selectedNode.value.config.loopOutputParams[index].elementType = item.type || 'String'
  }
  showLoopOutputSelectorDialog.value = false
  loopOutputVariableIndex.value = null
}

// 选择变量
const selectVariable = (variable) => {
  if (!selectedNode.value || !variableSelectorField.value) return

  // 处理简单条件分支节点的变量选择
  if (selectedNode.value.type === 'condition_simple') {
    if (variableSelectorField.value === 'condition_left') {
      selectedNode.value.config.conditionExpression.leftOperand = variable
      selectedNode.value.config.conditionExpression.leftOperandType = 'reference'
      // 从变量中获取类型
      const upstreamOutputs = getUpstreamNodeOutputs()
      const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
      if (selectedOutput) {
        selectedNode.value.config.conditionExpression.leftOperandDetectedType = selectedOutput.type || 'String'
      }
      showVariableSelectorDialog.value = false
      variableSelectorField.value = null
      return
    } else if (variableSelectorField.value === 'condition_right') {
      selectedNode.value.config.conditionExpression.rightOperand = variable
      selectedNode.value.config.conditionExpression.rightOperandType = 'reference'
      showVariableSelectorDialog.value = false
      variableSelectorField.value = null
      return
    }
  }

  // 处理多路分支节点的变量选择
  if (selectedNode.value.type === 'condition_multi' && variableSelectorField.value.startsWith('condition_multi_')) {
    // 解析 field: condition_multi_left_0 或 condition_multi_right_1
    const match = variableSelectorField.value.match(/condition_multi_(left|right)_(\d+)/)
    if (match) {
      const operand = match[1]
      const caseIndex = parseInt(match[2])
      const cases = selectedNode.value.conditions?.cases
      if (cases && cases[caseIndex]) {
        if (operand === 'left') {
          cases[caseIndex].expression.leftOperand = variable
          // 从变量中获取类型
          const upstreamOutputs = getUpstreamNodeOutputs()
          const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
          if (selectedOutput) {
            cases[caseIndex].expression.leftOperandDetectedType = selectedOutput.type || 'String'
          }
        } else {
          cases[caseIndex].expression.rightOperand = variable
        }
        showVariableSelectorDialog.value = false
        variableSelectorField.value = null
        return
      }
    }
  }

  // 处理循环节点输出变量的选择
  if (variableSelectorField.value.startsWith('loopOutputParam_')) {
    const index = loopOutputVariableIndex.value
    if (index !== null && selectedNode.value.config.loopOutputParams && selectedNode.value.config.loopOutputParams[index]) {
      selectedNode.value.config.loopOutputParams[index].value = variable
    }
  } else {
    selectedNode.value.config[variableSelectorField.value] = variable
  }

  // 处理裁判模型节点的类型自动调整
  if (selectedNode.value.type === 'judgeModel' && judgeModelTypeField.value) {
    // 从变量表达式中解析出节点名和参数名，获取变量类型
    const upstreamOutputs = getUpstreamNodeOutputs()
    const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
    if (selectedOutput) {
      // 根据选择的变量类型映射到裁判模型支持的类型
      let mappedType = 'String'
      const varType = selectedOutput.type || ''
      if (varType.includes('File') || varType.includes('Excel')) {
        mappedType = 'File(Excel)'
      } else if (varType.includes('Array') || varType.includes('[')) {
        mappedType = 'Array<String>'
      } else {
        mappedType = 'String'
      }
      selectedNode.value.config[judgeModelTypeField.value] = mappedType
    }
  }

  // 处理表格生成节点的变量选择和类型自动调整
  if (selectedNode.value.type === 'tableGenerate' && variableSelectorField.value.startsWith('tableGenerateInputParam_')) {
    const index = tableGenerateVariableIndex.value
    if (index !== null && selectedNode.value.config.inputParams && selectedNode.value.config.inputParams[index]) {
      selectedNode.value.config.inputParams[index].value = variable
      // 根据选择的变量类型自动调整参数类型
      const upstreamOutputs = getUpstreamNodeOutputs()
      const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
      if (selectedOutput) {
        const varType = selectedOutput.type || ''
        const param = selectedNode.value.config.inputParams[index]
        if (varType.includes('File')) {
          // File 类型，保留完整类型信息如 File<Excel>
          param.type = varType
          delete param.elementType
          delete param.dictionaryType
        } else if (varType.includes('Array') || varType.includes('[')) {
          param.type = 'Array'
          param.elementType = 'String'
        } else if (varType.includes('Dictionary') || varType.includes('数据字典')) {
          param.type = 'Dictionary'
          param.dictionaryType = '公文写作数据字典'
        } else {
          param.type = 'String'
          delete param.elementType
          delete param.dictionaryType
        }
      }
    }
  }

  // 处理结束节点的变量选择和类型自动调整
  if (selectedNode.value.type === 'end' && variableSelectorField.value.startsWith('endInputParam_')) {
    const index = endVariableIndex.value
    if (index !== null && selectedNode.value.config.inputParams && selectedNode.value.config.inputParams[index]) {
      selectedNode.value.config.inputParams[index].value = variable
      // 根据选择的变量类型自动调整参数类型
      const upstreamOutputs = getUpstreamNodeOutputs()
      const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
      if (selectedOutput) {
        const varType = selectedOutput.type || ''
        const param = selectedNode.value.config.inputParams[index]
        if (varType.includes('File')) {
          // File 类型，保留完整类型信息如 File<Excel>
          param.type = varType
          delete param.elementType
          delete param.dictionaryType
        } else if (varType.includes('Array') || varType.includes('[')) {
          param.type = 'Array'
          param.elementType = 'String'
        } else if (varType.includes('Dictionary') || varType.includes('数据字典')) {
          param.type = 'Dictionary'
          param.dictionaryType = '公文写作数据字典'
        } else {
          param.type = 'String'
          delete param.elementType
          delete param.dictionaryType
        }
      }
    }
  }

  // 处理文本清洗节点的 cols 变量选择和类型自动调整
  if (selectedNode.value.type === 'textClean' && variableSelectorField.value === 'colsValue') {
    // 检查是否是多选模式（数据字典多列选择）
    if (isMultiSelectMode.value && variable.includes(',')) {
      // 多选模式：类型为 Dictionary
      selectedNode.value.config.colsType = 'Dictionary'
    } else {
      // 单选模式：从前置节点输出中查找变量类型
      const upstreamOutputs = getUpstreamNodeOutputs()
      const selectedOutput = upstreamOutputs.find((item) => item.variable === variable)
      if (selectedOutput) {
        selectedNode.value.config.colsType = selectedOutput.type || 'String'
      }
    }
  }

  showVariableSelectorDialog.value = false
  variableSelectorField.value = null
  variableSelectorFilterType.value = null
  variableSelectorFilterTypes.value = null
  loopOutputVariableIndex.value = null
  judgeModelTypeField.value = null
  tableGenerateVariableIndex.value = null
  endVariableIndex.value = null
}

// 判断类型是否为Dictionary类型
const isDictionaryType = (type) => {
  if (!type) return false
  return type.startsWith('Dictionary(') || type.startsWith('Dictionary<')
}

// 从类型字符串中解析Dictionary名称
const parseDictionaryName = (type) => {
  if (!type) return null
  // 匹配 Dictionary(xxx) 或 Dictionary<xxx>
  const match = type.match(/Dictionary[<(](.+)[)>]/)
  return match ? match[1] : null
}

// 加载Dictionary的columns
const loadDictionaryColumns = async (type, index) => {
  const dictionaryName = parseDictionaryName(type)
  if (!dictionaryName) return

  // 检查缓存
  if (dictionaryColumnsCache.value[dictionaryName]) {
    return
  }

  // 标记正在加载
  loadingColumnsIndex.value.add(index)
  loadingColumnsIndex.value = new Set(loadingColumnsIndex.value)

  try {
    const response = await getDictionaryColumnsByName(dictionaryName)
    const columns = response.data || []
    // 存入缓存
    dictionaryColumnsCache.value[dictionaryName] = columns
  } catch (error) {
    console.error('获取Dictionary columns失败:', error)
    ElMessage.error('系统服务异常！')
    dictionaryColumnsCache.value[dictionaryName] = []
  } finally {
    // 移除加载标记
    loadingColumnsIndex.value.delete(index)
    loadingColumnsIndex.value = new Set(loadingColumnsIndex.value)
  }
}

// 切换变量展开状态
const toggleVariableExpand = async (index, item) => {
  const expandedSet = expandedVariableIndex.value

  if (expandedSet.has(index)) {
    // 折叠
    expandedSet.delete(index)
  } else {
    // 展开
    expandedSet.add(index)
    // 加载columns
    await loadDictionaryColumns(item.type, index)
  }

  // 强制更新视图
  expandedVariableIndex.value = new Set(expandedSet)
}

// 选择column作为变量值
const selectColumnAsVariable = (item, column) => {
  const variableValue = `${item.variable}.${column.key}`
  selectVariable(variableValue)
}

// 生成column选择的唯一key
const getColumnSelectionKey = (item, column) => {
  return `${item.variable}.${column.key}`
}

// 判断column是否已选中
const isColumnSelected = (item, column) => {
  const key = getColumnSelectionKey(item, column)
  return selectedColumns.value.has(key)
}

// 切换column选中状态
const toggleColumnSelection = (item, column) => {
  const key = getColumnSelectionKey(item, column)
  const newSet = new Set(selectedColumns.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }
  selectedColumns.value = newSet
}

// 处理column点击
const handleColumnClick = (item, column) => {
  if (isMultiSelectMode.value) {
    toggleColumnSelection(item, column)
  } else {
    selectColumnAsVariable(item, column)
  }
}

// 取消多选
const cancelMultiSelect = () => {
  showVariableSelectorDialog.value = false
  selectedColumns.value = new Set()
  isMultiSelectMode.value = false
}

// 确认多选
const confirmMultiSelect = () => {
  if (selectedColumns.value.size === 0) return

  // 将选中的columns拼接成数组格式的字符串
  const columnKeys = Array.from(selectedColumns.value)
  const variableValue = columnKeys.join(',')

  selectVariable(variableValue)
}

// 初始化文本清洗节点配置
const initTextCleanConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.inputType) {
    selectedNode.value.config.inputType = 'text' // 'text' | 'dataset'
    selectedNode.value.config.textContent = ''
    selectedNode.value.config.datasetId = ''
    selectedNode.value.config.datasetFields = [] // 支持多选字段
    // 清洗规则默认值 - Boolean类型全部默认为true
    selectedNode.value.config.removeExtraSpaces = true
    selectedNode.value.config.removeHtmlTags = true
    selectedNode.value.config.removeSpecialChars = true
    selectedNode.value.config.normalizeNewlines = true
    selectedNode.value.config.trimWhitespace = true
    selectedNode.value.config.standardizedNewlineChar = true
    selectedNode.value.config.trimFrontBack = true
    // 输出格式根据输入类型自动确定，无需手动配置
  }
}

// 初始化循环节点配置
const initLoopConfig = () => {
  if (!selectedNode.value) return
  if (!selectedNode.value.config.loopOutputParams) {
    selectedNode.value.config.loopOutputParams = []
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
  // 开始节点使用 outputParams 判断，其他节点使用 outputs 判断
  const outputCount = node.type === 'start' ? (node.outputParams?.length || 0) : node.outputs.length
  if (outputCount === 0) {
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

  // 检查节点是否可以添加连线
  // 开始节点：始终允许连线（即使没有定义初始变量）
  // 其他节点：需要有 outputs 才能连线
  if (node.type !== 'start') {
    const outputs = node.outputs || []
    if (outputs.length === 0) return
  }

  const outputParams = node.type === 'start' ? (node.outputParams || []) : node.outputs
  const port = outputParams[0] || { id: 'out-0', name: 'output' }

  // 立即禁用文本选择，防止长按检测期间文字被选中
  document.body.style.userSelect = 'none'

  // 直接从节点数据计算位置（避免 DOM 测量的时序问题）
  const portPos = getPortPosition(node, 0, 'output')
  const x = portPos.x
  const y = portPos.y

  longPressState.isLongPress = false
  longPressState.startTime = Date.now()
  longPressState.startX = event.clientX
  longPressState.startY = event.clientY
  longPressState.node = node
  longPressState.port = port

  // 设置长按计时器
  longPressState.timer = setTimeout(() => {
    longPressState.isLongPress = true
    longPressState.hasTriggeredDrag = true

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
    // 使用捕获模式确保 stopConnection 会被调用
    document.addEventListener('mouseup', stopConnection, { capture: true })

    // 禁用文本选择，防止拖拽过程中文字被选中
    document.body.style.userSelect = 'none'
  }, LONG_PRESS_THRESHOLD)
}

// 关闭添加节点弹窗
const closeAddPopover = () => {
  showAddNodePopover.value = null
  insertConnection.value = null
}

// 处理按钮释放
const handleActionBtnUp = (node, event) => {
  // 清除长按计时器
  const hadTimer = longPressState.timer !== null
  if (longPressState.timer) {
    clearTimeout(longPressState.timer)
    longPressState.timer = null
  }

  // 如果没有触发长按拖拽，则显示添加节点弹窗
  if (!longPressState.hasTriggeredDrag) {
    // 直接显示弹窗，不再检查 outputCount
    event.stopPropagation()
    showAddNodePopover.value = node.id
    popoverPosition.value = { x: event.clientX, y: event.clientY }
    longPressState.isLongPress = false
    // 恢复文本选择
    document.body.style.userSelect = ''
  }
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
const addConnectedNode = async (type) => {
  // 处理 Skill 节点
  if (type.startsWith('skill-')) {
    await addConnectedSkillNode(type)
    return
  }

  const parentNode = nodes.value.find((n) => n.id === showAddNodePopover.value)
  if (!parentNode) return

  const typeConfig = getNodeTypeConfig(type)

  // 节点宽度常量
  const nodeWidth = 220

  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    name: typeConfig.name,
    x: parentNode.x + nodeWidth + nodeWidth * 0.5, // 默认位置：源节点右侧，与源节点右边缘相隔0.5个节点宽度
    y: parentNode.y,
    inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
    outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
    config: {},
  }


  // 如果是从连线中间插入， 计算连线中点位置作为新节点位置
  let insertX = parentNode.x + nodeWidth + nodeWidth * 0.5  // 源节点右侧，与源节点右边缘相隔0.5个节点宽度
  let insertY = parentNode.y

  if (insertConnection.value) {
    const midpoint = getConnectionMidpoint(insertConnection.value)
    if (midpoint) {
      insertX = midpoint.x
      insertY = midpoint.y
    }
  }

  // 开始和结束节点特殊处理
  if (type === 'start') {
    newNode.inputs = []
    newNode.inputParams = []
  } else if (type === 'end') {
    newNode.outputs = []
    newNode.config.inputParams = []
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

  // 循环节点特殊处理：自动创建循环体画布和关联线
  if (type === 'loop') {
    newNode.inputParams = [
      { name: 'times', type: 'Integer', required: false },
      { name: 'cycle_array', type: 'Array', required: false },
    ]
    newNode.outputParams = [
      { name: 'current_item', type: 'Any' },
      { name: 'current_index', type: 'Number' },
    ]
    newNode.config = {
      times: null,
      cycle_array: null,
    }

    // 创建循环体画布节点
    // 计算位置：循环体中心点横坐标与循环控制节点中心点一致
    // 循环体中心点纵坐标 = 循环控制节点中心点纵坐标 + 0.75 × 循环体高度
    const loopNodeWidth = 220
    const loopNodeHeight = 70
    const loopBodyWidth = 500
    const loopBodyHeight = 400
    const loopBodyX = newNode.x + (loopNodeWidth / 2) - (loopBodyWidth / 2)
    const loopBodyY = newNode.y + (loopNodeHeight / 2) + 0.25 * loopBodyHeight

    const loopBodyCanvas = {
      id: `loopBody-${newNode.id}`,
      type: 'loopBodyCanvas',
      name: '循环体',
      x: loopBodyX,
      y: loopBodyY,
      width: loopBodyWidth,
      height: loopBodyHeight,
      belongsTo: newNode.id,
      loopBody: {
        canvas: { scale: 1, offsetX: 0, offsetY: 0 },
        nodes: [],
        connections: [],
        leftPort: {
          id: 'port-left',
          name: '输入',
          type: 'input',
          y: 200,
          params: [],
        },
        rightPort: {
          id: 'port-right',
          name: '输出',
          type: 'output',
          y: 200,
          params: [],
        },
      },
    }
    // 先添加循环节点
    nodes.value.push(newNode)
    // 再添加循环体画布节点
    nodes.value.push(loopBodyCanvas)
    // 创建关联线
    createAssociation(newNode.id, loopBodyCanvas.id)
  } else {
    // 非循环节点在此添加
    nodes.value.push(newNode)
  }

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
        sourceParamIndex: 0,
        targetParamIndex: 0,
      })
    }

    if (newOutputPort && targetPort && targetNode) {
      connections.value.push({
        id: `conn-${Date.now() + 1}`,
        sourceId: newNode.id,
        sourcePort: newOutputPort.id,
        targetId: targetNode.id,
        targetPort: targetPort.id,
        sourceParamIndex: 0,
        targetParamIndex: 0,
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
        sourceParamIndex: 0,
        targetParamIndex: 0,
      }
      connections.value.push(newConnection)
    }
  }

  showAddNodePopover.value = null
  insertConnection.value = null
  selectedNode.value = newNode
}

// 添加 Skill 子节点并自动连线
const addConnectedSkillNode = async (type) => {
  const parentNode = nodes.value.find((n) => n.id === showAddNodePopover.value)
  if (!parentNode) return

  // 从 type 中提取 skillId（格式：skill-{skillId}）
  const skillId = type.replace('skill-', '')

  try {
    // 获取 Skill 详情
    const skillDetail = await getSkillDetail(skillId)
    if (!skillDetail) {
      ElMessage.error('获取 Skill 详情失败')
      return
    }

    // 节点宽度常量
    const nodeWidth = 220

    // 计算新节点位置
    let insertX = parentNode.x + nodeWidth + nodeWidth * 0.5
    let insertY = parentNode.y

    if (insertConnection.value) {
      const midpoint = getConnectionMidpoint(insertConnection.value)
      if (midpoint) {
        insertX = midpoint.x
        insertY = midpoint.y
      }
    }

    // 创建节点对象
    const newNode = {
      id: `skill-${Date.now()}`,
      nodeUuid: generateUuid(), // 使用标准 UUID 格式
      type: 'skill',
      nodeCategory: 'EXECUTION',
      name: skillDetail.name,
      description: skillDetail.description || '', // Skill 描述信息
      skillId: skillId,
      allowAddInputParams: skillDetail.allowAddInputParams || false, // 是否支持额外增加入参
      allowAddOutputParams: skillDetail.allowAddOutputParams || false, // 是否支持额外增加出参
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
      x: insertX,
      y: insertY,
      inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
      config: {},
    }

    // 添加节点到画布
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
          sourceParamIndex: 0,
          targetParamIndex: 0,
        })
      }

      if (newOutputPort && targetPort && targetNode) {
        connections.value.push({
          id: `conn-${Date.now() + 1}`,
          sourceId: newNode.id,
          sourcePort: newOutputPort.id,
          targetId: targetNode.id,
          targetPort: targetPort.id,
          sourceParamIndex: 0,
          targetParamIndex: 0,
        })
      }
    } else {
      // 正常添加子节点，创建连线
      const sourcePort = parentNode.outputs[0]
      const targetPort = newNode.inputs[0]

      if (sourcePort && targetPort) {
        connections.value.push({
          id: `conn-${Date.now()}`,
          sourceId: parentNode.id,
          sourcePort: sourcePort.id,
          targetId: newNode.id,
          targetPort: targetPort.id,
          sourceParamIndex: 0,
          targetParamIndex: 0,
        })
      }
    }

    showAddNodePopover.value = null
    insertConnection.value = null
    selectedNode.value = newNode

    ElMessage.success(`已添加技能节点：${skillDetail.name}`)
  } catch (error) {
    console.error('添加 Skill 节点失败:', error)
    ElMessage.error('系统服务异常！')
  }
}

// 开始拖拽节点
const startDragNode = (node, event) => {
  event.stopPropagation()

  // 如果拖拽的节点不在选中列表中，则选中它
  if (!selectedNodeUuids.value.includes(node.id)) {
    selectNode(node, event, false)
  }

  // 支持多节点拖拽
  if (selectedNodeUuids.value.length > 1) {
    // 多节点拖拽
    dragState.isDragging = true
    dragState.node = null // 不单独跟踪一个节点
    dragState.isMultiDrag = true
    dragState.startX = event.clientX
    dragState.startY = event.clientY
    dragState.multiNodeStartPositions = {}
    selectedNodeUuids.value.forEach((id) => {
      const n = nodes.value.find((item) => item.id === id)
      if (n) {
        dragState.multiNodeStartPositions[id] = { x: n.x, y: n.y }
      }
    })
  } else {
    // 单节点拖拽
    dragState.isDragging = true
    dragState.node = node
    dragState.isMultiDrag = false
    dragState.startX = event.clientX
    dragState.startY = event.clientY
    dragState.offsetX = node.x
    dragState.offsetY = node.y
  }

  document.addEventListener('mousemove', onDragNode)
  document.addEventListener('mouseup', stopDragNode)

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'
}

// 拖拽节点
const onDragNode = (event) => {
  if (!dragState.isDragging) return

  const dx = (event.clientX - dragState.startX) / canvas.scale
  const dy = (event.clientY - dragState.startY) / canvas.scale

  // 标记已经移动
  dragState.hasMoved = Math.abs(dx) > 2 || Math.abs(dy) > 2

  if (dragState.isMultiDrag && dragState.multiNodeStartPositions) {
    // 多节点拖拽
    selectedNodeUuids.value.forEach((id) => {
      const node = nodes.value.find((n) => n.id === id)
      const startPos = dragState.multiNodeStartPositions[id]
      if (node && startPos) {
        node.x = Math.max(0, startPos.x + dx)
        node.y = Math.max(0, startPos.y + dy)
      }
    })
  } else if (dragState.node) {
    // 单节点拖拽
    dragState.node.x = Math.max(0, dragState.offsetX + dx)
    dragState.node.y = Math.max(0, dragState.offsetY + dy)
  }
}

// 停止拖拽节点
const stopDragNode = () => {
  // 拖拽只更新本地状态，用户需要手动保存
  // 重置状态
  dragState.isDragging = false
  dragState.node = null
  dragState.hasMoved = false
  dragState.isMultiDrag = false
  dragState.multiNodeStartPositions = {}

  document.removeEventListener('mousemove', onDragNode)
  document.removeEventListener('mouseup', stopDragNode)

  // 恢复文本选择
  document.body.style.userSelect = ''
}

// 循环体画布组件引用（用于获取最新的 bodyNodes）
const loopBodyCanvasRefs = ref({})

// 设置循环体画布组件引用
const setLoopBodyCanvasRef = (id, el) => {
  if (el) {
    loopBodyCanvasRefs.value[id] = el
  } else {
    delete loopBodyCanvasRefs.value[id]
  }
}

// 循环体画布拖拽状态
const loopBodyDragState = reactive({
  isDragging: false,
  node: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
})

// 开始拖拽循环体画布
const startDragLoopBodyCanvas = (event, loopBodyNode) => {
  if (!event || !loopBodyNode) return

  loopBodyDragState.isDragging = true
  loopBodyDragState.node = loopBodyNode
  loopBodyDragState.startX = event.clientX
  loopBodyDragState.startY = event.clientY
  loopBodyDragState.offsetX = loopBodyNode.x
  loopBodyDragState.offsetY = loopBodyNode.y

  document.addEventListener('mousemove', onDragLoopBodyCanvas)
  document.addEventListener('mouseup', stopDragLoopBodyCanvas)

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'
}

// 拖拽循环体画布
const onDragLoopBodyCanvas = (event) => {
  if (!loopBodyDragState.isDragging || !loopBodyDragState.node) return

  const dx = (event.clientX - loopBodyDragState.startX) / canvas.scale
  const dy = (event.clientY - loopBodyDragState.startY) / canvas.scale

  loopBodyDragState.node.x = loopBodyDragState.offsetX + dx
  loopBodyDragState.node.y = loopBodyDragState.offsetY + dy
}

// 停止拖拽循环体画布
const stopDragLoopBodyCanvas = () => {
  loopBodyDragState.isDragging = false
  loopBodyDragState.node = null
  document.removeEventListener('mousemove', onDragLoopBodyCanvas)
  document.removeEventListener('mouseup', stopDragLoopBodyCanvas)

  // 恢复文本选择
  document.body.style.userSelect = ''
}

// 处理循环体内节点选中（单击只选中，不打开配置面板）
const handleLoopBodyNodeSelect = (node) => {
  // 只选中节点，不打开配置面板
  // 循环体内的节点选中状态由 LoopBodyCanvas 组件内部管理
}

// 处理循环体内节点双击（打开配置面板）
const handleLoopBodyNodeDblClick = (node) => {
  openNodeConfig(node)
}

// 开始拖拽画布
const startDragCanvas = (event) => {
  // 空格键模式下，任何位置都可以拖拽
  if (spaceKeyPressed.value) {
    event.preventDefault()
    canvasDragState.isDragging = true
    canvasDragState.startX = event.clientX
    canvasDragState.startY = event.clientY
    canvasDragState.startOffsetX = canvas.offsetX
    canvasDragState.startOffsetY = canvas.offsetY

    document.addEventListener('mousemove', onDragCanvas)
    document.addEventListener('mouseup', stopDragCanvas)

    document.body.style.userSelect = 'none'
    if (canvasContainerRef.value) {
      canvasContainerRef.value.style.cursor = 'grabbing'
    }
    return
  }

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

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'
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

  // 恢复文本选择
  document.body.style.userSelect = ''

  // 恢复光标
  if (canvasContainerRef.value) {
    canvasContainerRef.value.style.cursor = spaceKeyPressed.value ? 'grab' : ''
  }
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

  // 禁用文本选择，防止拖拽过程中文字被选中
  document.body.style.userSelect = 'none'
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
  // 使用捕获模式移除监听器
  document.removeEventListener('mousemove', onDrawingConnection)
  document.removeEventListener('mouseup', stopConnection, { capture: true })

  // 恢复文本选择
  document.body.style.userSelect = ''

  // 如果触发了拖拽（长按计时器执行），检测是否拖拽到了某个节点的输入端口
  if (longPressState.hasTriggeredDrag) {
    const sourceNode = longPressState.node

    // 检测鼠标释放位置是否在某个节点的输入端口上
    const targetElement = event.target
    const inputPort = targetElement?.closest('.input-port')

    if (inputPort && sourceNode) {
      // 找到输入端口所属的节点
      const nodeElement = inputPort.closest('[data-node-id]')
      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-node-id')
        const targetNode = nodes.value.find((n) => n.id === targetNodeId)

        if (targetNode && targetNode.id !== sourceNode.id) {
          // 获取端口信息
          const sourcePort = sourceNode.outputs?.[0]
          const targetPort = targetNode.inputs?.[0]

          // 检查源节点是否是多路分支节点
          if (sourceNode.type === 'condition_multi') {
            // 保存待完成的连线信息
            pendingConnection.value = {
              sourceNode,
              sourceParam: sourcePort,
              sourceParamIndex: 0,
              targetNode,
              targetParam: targetPort,
              targetParamIndex: 0,
            }
            // 显示分支选择对话框
            showBranchSelectDialog.value = true
            drawingConnection.value = null
            longPressState.isLongPress = false
            longPressState.hasTriggeredDrag = false
            if (event) {
              event.stopPropagation()
            }
            return
          }

          // 创建连线
          const newConnection = {
            id: `conn-${Date.now()}`,
            sourceId: sourceNode.id,
            sourcePort: sourcePort?.id || `out-0`,
            sourceParamIndex: 0,
            targetId: targetNode.id,
            targetPort: targetPort?.id || `in-0`,
            targetParamIndex: 0,
          }

          // 检查是否已存在相同连线
          const existingConnection = connections.value.find(
            (c) =>
              c.sourceId === sourceNode.id &&
              c.targetId === targetNode.id
          )

          if (!existingConnection) {
            connections.value.push(newConnection)
          }

          // 阻止事件传播
          if (event) {
            event.stopPropagation()
          }

          drawingConnection.value = null
          longPressState.isLongPress = false
          longPressState.hasTriggeredDrag = false
          return
        }
      }
    }

    // 没有拖拽到输入端口，显示添加节点弹窗
    if (sourceNode) {
      showAddNodePopover.value = sourceNode.id
      popoverPosition.value = { x: event.clientX, y: event.clientY }
    }

    // 阻止事件传播，避免 deselectAll 被调用导致弹窗关闭
    if (event) {
      event.stopPropagation()
    }
  }

  drawingConnection.value = null
  longPressState.isLongPress = false
  longPressState.hasTriggeredDrag = false
}

// 在输入端口结束连线
const endConnection = (targetNode, targetParam, paramIndex, event) => {
  document.removeEventListener('mousemove', onDrawingConnection)
  document.removeEventListener('mouseup', stopConnection, { capture: true })

  if (!drawingConnection.value) return

  const { sourceNode, sourceParam, sourceParamIndex } = drawingConnection.value

  // 不能连接到自己
  if (sourceNode.id === targetNode.id) {
    drawingConnection.value = null
    longPressState.isLongPress = false
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

  // 检查源节点是否是多路分支节点
  if (sourceNode.type === 'condition_multi') {
    // 保存待完成的连线信息
    pendingConnection.value = {
      sourceNode,
      sourceParam,
      sourceParamIndex,
      targetNode,
      targetParam,
      targetParamIndex: paramIndex,
    }
    // 显示分支选择对话框
    showBranchSelectDialog.value = true
    drawingConnection.value = null
    return
  }

  // 创建新连线
  const newConnection = {
    id: `conn-${Date.now()}`,
    sourceId: sourceNode.id,
    sourcePort: sourceParam?.id || `out-${sourceParamIndex}`,
    sourceParamIndex: sourceParamIndex,
    targetId: targetNode.id,
    targetPort: targetParam?.id || `in-${paramIndex}`,
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
  // 忽略输入框内的快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  // Escape 键：取消选择和连线
  if (event.key === 'Escape') {
    deselectAll()
    drawingConnection.value = null
    return
  }

  // Delete/Backspace 键：删除选中的节点或连线
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    if (selectedNodeUuids.value.length > 0 || selectedNode.value) {
      deleteSelectedNodes()
    } else if (selectedConnection.value) {
      deleteSelectedConnection()
    }
    return
  }

  // 空格键：进入平移模式
  if (event.code === 'Space' && !spaceKeyPressed.value) {
    event.preventDefault()
    spaceKeyPressed.value = true
    if (canvasContainerRef.value) {
      canvasContainerRef.value.style.cursor = 'grab'
    }
    return
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
      resetZoom()
    } else if (event.key === 'a') {
      // Ctrl+A：全选节点
      event.preventDefault()
      selectAllNodes()
    } else if (event.key === 'c') {
      // Ctrl+C：复制节点
      event.preventDefault()
      copySelectedNodes()
    } else if (event.key === 'v') {
      // Ctrl+V：粘贴节点
      event.preventDefault()
      pasteNodes()
    }
  }
}

// 加载工作流数据（可复用函数）
const loadWorkflowData = async () => {
  if (route.params.id === 'new') return // 新建工作流不需要加载

  try {
    const response = await getWorkflowDetail(route.params.id)
    console.log('工作流详情响应:', response)
    // console.log('关联数据:', response?.associations)

    if (response) {
      // 更新工作流基本信息
      workflow.id = response.id
      workflow.name = response.name
      workflow.description = response.description || ''
      workflow.published = response.published || false
      workflow.hasRun = response.hasRun || false

      // 映射后端返回的节点数据到前端格式
      if (response.nodes && Array.isArray(response.nodes)) {
        const nodeIdMap = {}

        // 首先建立ID映射
        response.nodes.forEach((node) => {
          nodeIdMap[node.id] = node.nodeUuid
        })

        nodes.value = response.nodes.map((node) => {
          const typeConfig = getNodeTypeConfig(node.type)
          let nodeConfig = {}

          // 解析配置
          if (node.config) {
            try {
              nodeConfig = typeof node.config === 'string' ? JSON.parse(node.config) : node.config
            } catch (e) {
              nodeConfig = {}
            }
          }

          const baseNode = {
            id: node.nodeUuid,
            type: node.type,
            name: node.name,
            x: node.positionX,
            y: node.positionY,
            inputs: parseJsonField(node.inputPorts, []),
            outputs: parseJsonField(node.outputPorts, []),
            inputParams: parseJsonField(node.inputParams, []),
            outputParams: parseJsonField(node.outputParams, []),
            config: nodeConfig,
          }

          // 如果是循环体节点，添加完整属性
          if (node.type === 'loopBodyCanvas') {
            baseNode.width = nodeConfig.width || 500
            baseNode.height = nodeConfig.height || 400
            baseNode.belongsTo = nodeConfig.belongsTo

            // 添加循环体内部画布数据
            if (nodeConfig.loopBody) {
              baseNode.loopBody = nodeConfig.loopBody
            } else {
              baseNode.loopBody = {
                canvas: { scale: 1, offsetX: 0, offsetY: 0 },
                nodes: [],
                connections: [],
                leftPort: { id: 'port-left', name: '输入', type: 'input', y: 200, params: [] },
                rightPort: { id: 'port-right', name: '输出', type: 'output', y: 200, params: [] },
              }
            }
          }

          // 如果是循环节点，添加默认的 outputParams
          if (node.type === 'loop') {
            if (baseNode.outputParams.length === 0) {
              baseNode.outputParams = [
                { name: 'current_item', type: 'Any' },
                { name: 'current_index', type: 'Number' }
              ]
            }
          }

          return baseNode
        })

        // 映射后端返回的连接数据到前端格式
        if (response.connections && Array.isArray(response.connections)) {
          connections.value = response.connections.map((conn, index) => ({
            id: conn.connectionUuid || `conn-${Date.now() + index}`,
            sourceId: conn.sourceNodeUuid || nodeIdMap[conn.sourceNodeId] || conn.sourceNodeId,
            sourcePort: conn.sourcePortId,
            targetId: conn.targetNodeUuid || nodeIdMap[conn.targetNodeId] || conn.targetNodeId,
            targetPort: conn.targetPortId,
            sourceParamIndex: conn.sourceParamIndex,
            targetParamIndex: conn.targetParamIndex,
            label: conn.label || null,
            branchLabel: conn.branchLabel || null,
            config: {}
          }))
        }

        // 映射后端返回的关联数据到前端格式
        if (response.associations && Array.isArray(response.associations)) {
          associations.value = response.associations.map((assoc, index) => ({
            id: `assoc-${index}`,
            sourceId: nodeIdMap[assoc.containerNodeUuid] || assoc.containerNodeUuid,
            targetId: nodeIdMap[assoc.bodyNodeUuid] || assoc.bodyNodeUuid,
            associationType: assoc.associationType,
            config: {}
          }))
          // console.log('关联数据已加载:', associations.value)
        }
      }
    }

    // 强制触发响应式更新
    // 先清空再赋值，确保 Vue 检测到变化
    const tempNodes = [...nodes.value]
    nodes.value = []
    await nextTick()
    nodes.value = tempNodes

    // 触发连线重新渲染
    await nextTick()
    if (connections.value.length > 0) {
      const temp = [...connections.value]
      connections.value = temp
    }

    console.log('工作流数据已刷新，节点数量:', nodes.value.length)
  } catch (error) {
    console.error('加载工作流失败:', error)
    ElMessage.error('加载工作流失败')
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('keyup', handleKeyUp)

  // 加载变量类型数据
  variableTypeStore.loadVariableTypes()

  // 加载节点类型数据
  await loadNodeTypes()

  // 如果是新建工作流，创建默认节点
  if (route.params.id === 'new') {
    // 清空现有节点和连接
    nodes.value = []
    connections.value = []

    // 硬编码的默认节点数据（用于API调用失败时的回退）
    const fallbackDefaultNodes = [
      {
        id: 'start-1',
        type: 'start',
        name: '开始',
        x: 150,
        y: 250,
        inputs: [],
        outputs: [{ id: 'out-1', name: '输出' }],
        outputParams: [{ name: 'input', type: 'String', elementType: 'string' }],
        inputParams: [],
        config: {}
      },
      {
        id: 'textClean-1',
        type: 'textClean',
        name: '文本清洗',
        x: 400,
        y: 250,
        inputs: [{ id: 'in-1', name: '输入' }],
        outputs: [{ id: 'out-1', name: '输出' }],
        outputParams: [{ name: 'output_file', type: 'File', elementType: 'file' }],
        inputParams: [
          { name: 'input_file', type: 'File', elementType: 'file' },
          { name: 'cols', type: 'String', elementType: 'string' },
          { name: 'remove_extra_spaces', type: 'Boolean', elementType: 'boolean', defaultValue: true },
          { name: 'remove_html_tags', type: 'Boolean', elementType: 'boolean', defaultValue: false },
          { name: 'remove_special_chars', type: 'Boolean', elementType: 'boolean', defaultValue: false },
          { name: 'standardized_newline_char', type: 'Boolean', elementType: 'boolean', defaultValue: true },
          { name: 'trim_front_back', type: 'Boolean', elementType: 'boolean', defaultValue: true }
        ],
        config: {
          input_file: null,
          cols: '',
          remove_extra_spaces: true,
          remove_html_tags: false,
          remove_special_chars: false,
          standardized_newline_char: true,
          trim_front_back: true
        }
      },
      {
        id: 'loop-1',
        type: 'loop',
        name: '循环',
        x: 650,
        y: 250,
        inputs: [{ id: 'in-1', name: '输入' }],
        outputs: [{ id: 'out-1', name: '输出' }],
        outputParams: [
          { name: 'current_item', type: 'Any' },
          { name: 'current_index', type: 'Number' },
          { name: 'result', type: 'Any' }
        ],
        inputParams: [
          { name: 'times', type: 'Integer', required: false },
          { name: 'cycle_array', type: 'Array', required: false },
        ],
        config: {
          times: null,
          cycle_array: null,
        }
      },
      {
        id: 'judgeModel-1',
        type: 'judgeModel',
        name: '裁判模型',
        x: 900,
        y: 250,
        inputs: [{ id: 'in-1', name: '输入' }],
        outputs: [{ id: 'out-1', name: '输出' }],
        outputParams: [
          { name: 'output', type: 'Array', elementType: 'Object' }
        ],
        inputParams: [
          { name: 'model', type: 'String' },
          { name: 'prompt', type: 'String' },
          { name: 'to_evaluate', type: 'String' },
          { name: 'ref', type: 'String' }
        ],
        config: {
          modelValue: 'DeepSeekR1-32B',
          promptValue: '',
          toEvaluateType: 'String',
          toEvaluateValue: '',
          refType: 'String',
          refValue: '',
        }
      },
      {
        id: 'tableGenerate-1',
        type: 'tableGenerate',
        name: '表格生成',
        x: 1150,
        y: 250,
        inputs: [{ id: 'in-1', name: '输入' }],
        outputs: [{ id: 'out-1', name: '输出' }],
        outputParams: [
          { name: 'output_excel', type: 'File', fileType: 'Excel' }
        ],
        inputParams: [],
        config: {
          inputParams: []
        }
      },
      {
        id: 'end-1',
        type: 'end',
        name: '结束',
        x: 1400,
        y: 250,
        inputs: [{ id: 'in-1', name: '输入' }],
        outputs: [],
        outputParams: [],
        inputParams: [{ name: 'input', type: 'Any', elementType: 'any' }],
        config: {}
      }
    ]

    // 硬编码的默认连接数据（用于API调用失败时的回退）
    const fallbackDefaultConnections = [
      {
        id: `conn-${Date.now()}`,
        sourceId: 'start-1',
        sourcePort: 'out-1',
        targetId: 'textClean-1',
        targetPort: 'in-1',
        config: {}
      },
      {
        id: `conn-${Date.now() + 1}`,
        sourceId: 'textClean-1',
        sourcePort: 'out-1',
        targetId: 'loop-1',
        targetPort: 'in-1',
        config: {}
      },
      {
        id: `conn-${Date.now() + 2}`,
        sourceId: 'loop-1',
        sourcePort: 'out-1',
        targetId: 'judgeModel-1',
        targetPort: 'in-1',
        config: {}
      },
      {
        id: `conn-${Date.now() + 3}`,
        sourceId: 'judgeModel-1',
        sourcePort: 'out-1',
        targetId: 'tableGenerate-1',
        targetPort: 'in-1',
        config: {}
      },
      {
        id: `conn-${Date.now() + 4}`,
        sourceId: 'tableGenerate-1',
        sourcePort: 'out-1',
        targetId: 'end-1',
        targetPort: 'in-1',
        config: {}
      }
    ]

    // 尝试从后端API获取默认工作流
    let defaultNodes = []
    let defaultConnections = []
    let defaultAssociations = []

    try {
      const response = await getDefaultWorkflow()

      // 创建节点ID到nodeUuid的映射
      const nodeIdMap = {}
      const nodeUuidMap = {} // 反向映射：nodeUuid -> 节点信息

      // 映射后端返回的节点数据到前端格式
      if (response && response.nodes && Array.isArray(response.nodes)) {
        // 首先建立ID映射
        response.nodes.forEach((node) => {
          nodeIdMap[node.id] = node.nodeUuid
          nodeUuidMap[node.nodeUuid] = node
        })

        defaultNodes = response.nodes.map(node => {
          const nodeConfig = JSON.parse(node.config || '{}')
          const baseNode = {
            id: node.nodeUuid,
            type: node.type,
            name: node.name,
            x: node.positionX,
            y: node.positionY,
            inputs: JSON.parse(node.inputPorts || '[]'),
            outputs: JSON.parse(node.outputPorts || '[]'),
            inputParams: JSON.parse(node.inputParams || '[]'),
            outputParams: JSON.parse(node.outputParams || '[]'),
            config: nodeConfig
          }

          // 如果是循环节点，添加默认的 outputParams 和 config.loopOutputParams
          if (node.type === 'loop') {
            if (baseNode.outputParams.length === 0) {
              baseNode.outputParams = [
                { name: 'current_item', type: 'Any' },
                { name: 'current_index', type: 'Number' }
              ]
            }
            if (!baseNode.config.loopOutputParams) {
              baseNode.config.loopOutputParams = []
            }
          }

          // 如果是循环体节点，添加完整属性
          if (node.type === 'loopBodyCanvas') {
            baseNode.width = nodeConfig.width || 500
            baseNode.height = nodeConfig.height || 400
            // belongsTo 从 config 中获取，指向循环节点的 nodeUuid
            if (nodeConfig.belongsTo) {
              // 找到对应的循环节点UUID
              const loopNode = response.nodes.find(n => n.id === node.parentNodeId)
              baseNode.belongsTo = loopNode ? loopNode.nodeUuid : nodeConfig.belongsTo
            }
            // 添加循环体内部画布数据
            baseNode.loopBody = {
              canvas: { scale: 1, offsetX: 0, offsetY: 0 },
              nodes: [
                {
                  id: 'api-auto-loop-1',
                  type: 'apiAuto',
                  name: 'HTTPS/HTTP接口调用',
                  x: 200,
                  y: 150,
                  inputs: [{ id: 'in-1', name: '输入' }],
                  outputs: [{ id: 'out-1', name: '输出' }],
                  config: {}
                }
              ],
              connections: [
                {
                  id: `conn-loop-body-${Date.now()}-1`,
                  sourceId: 'port-left',
                  sourcePort: 'out',
                  targetId: 'api-auto-loop-1',
                  targetPort: 'in',
                  config: {}
                },
                {
                  id: `conn-loop-body-${Date.now()}-2`,
                  sourceId: 'api-auto-loop-1',
                  sourcePort: 'out',
                  targetId: 'port-right',
                  targetPort: 'in',
                  config: {}
                }
              ],
              leftPort: {
                id: 'port-left',
                name: '输入',
                type: 'input',
                y: 200,
                params: [],
              },
              rightPort: {
                id: 'port-right',
                name: '输出',
                type: 'output',
                y: 200,
                params: [],
              },
            }
          }

          return baseNode
        })

        // 映射后端返回的连接数据到前端格式
        if (response.connections && Array.isArray(response.connections)) {
          defaultConnections = response.connections.map((conn, index) => ({
            id: conn.connectionUuid || `conn-${Date.now() + index}`,
            sourceId: nodeIdMap[conn.sourceNodeId] || conn.sourceNodeId,
            sourcePort: conn.sourcePortId,
            targetId: nodeIdMap[conn.targetNodeId] || conn.targetNodeId,
            targetPort: conn.targetPortId,
            config: {}
          }))
        }

        // 映射后端返回的关联数据到前端格式
        if (response.associations && Array.isArray(response.associations)) {
          defaultAssociations = response.associations.map((assoc, index) => ({
            id: `assoc-${index}`,
            sourceId: nodeIdMap[assoc.containerNodeUuid] || assoc.containerNodeUuid,
            targetId: nodeIdMap[assoc.bodyNodeUuid] || assoc.bodyNodeUuid,
            associationType: assoc.associationType,
            config: {}
          }))
        }
      }

      // 如果API返回的数据为空，使用回退数据
      if (defaultNodes.length === 0) {
        defaultNodes = fallbackDefaultNodes
        defaultConnections = fallbackDefaultConnections
      }
    } catch (error) {
      // API调用失败，使用回退数据
      defaultNodes = fallbackDefaultNodes
      defaultConnections = fallbackDefaultConnections
    }

    // 添加节点
    nodes.value = defaultNodes

    // 创建连接
    connections.value = defaultConnections

    // 如果后端返回了关联数据，直接使用
    if (defaultAssociations.length > 0) {
      associations.value = defaultAssociations
    } else {
      // 如果没有关联数据（旧版后端或回退数据），创建默认关联
      // 查找循环节点和循环体节点
      const loopNode = defaultNodes.find(n => n.type === 'loop')
      const loopBodyNode = defaultNodes.find(n => n.type === 'loopBodyCanvas')

      if (loopNode && loopBodyNode) {
        associations.value.push({
          id: `assoc-${Date.now()}`,
          sourceId: loopNode.id,
          targetId: loopBodyNode.id,
          config: {}
        })
      }
    }
  } else {
    // 编辑已有工作流 - 从后端加载工作流数据
    try {
      const response = await getWorkflowDetail(route.params.id)

      if (response) {
        // 更新工作流基本信息
        workflow.id = response.id
        workflow.name = response.name
        workflow.description = response.description || ''
        workflow.published = response.published || false
        workflow.hasRun = response.hasRun || false

        // 映射后端返回的节点数据到前端格式
        if (response.nodes && Array.isArray(response.nodes)) {
          const nodeIdMap = {}

          // 首先建立ID映射
          response.nodes.forEach((node) => {
            nodeIdMap[node.id] = node.nodeUuid
          })

          nodes.value = response.nodes.map((node) => {
            const typeConfig = getNodeTypeConfig(node.type)
            let nodeConfig = {}

            // 解析配置
            if (node.config) {
              try {
                nodeConfig = typeof node.config === 'string' ? JSON.parse(node.config) : node.config
              } catch (e) {
                nodeConfig = {}
              }
            }

            const baseNode = {
              id: node.nodeUuid,
              type: node.type,
              name: node.name,
              x: node.positionX,
              y: node.positionY,
              inputs: parseJsonField(node.inputPorts, []),
              outputs: parseJsonField(node.outputPorts, []),
              inputParams: parseJsonField(node.inputParams, []),
              outputParams: parseJsonField(node.outputParams, []),
              config: nodeConfig,
            }

            // 如果是循环体节点，添加完整属性
            if (node.type === 'loopBodyCanvas') {
              baseNode.width = nodeConfig.width || 500
              baseNode.height = nodeConfig.height || 400
              baseNode.belongsTo = nodeConfig.belongsTo

              // 添加循环体内部画布数据
              if (nodeConfig.loopBody) {
                baseNode.loopBody = nodeConfig.loopBody
              } else {
                // 如果没有循环体数据，创建默认结构
                baseNode.loopBody = {
                  canvas: { scale: 1, offsetX: 0, offsetY: 0 },
                  nodes: [],
                  connections: [],
                  leftPort: { id: 'port-left', name: '输入', type: 'input', y: 200, params: [] },
                  rightPort: { id: 'port-right', name: '输出', type: 'output', y: 200, params: [] },
                }
              }
            }

            // 如果是循环节点，添加默认的 outputParams
            if (node.type === 'loop') {
              if (baseNode.outputParams.length === 0) {
                baseNode.outputParams = [
                  { name: 'current_item', type: 'Any' },
                  { name: 'current_index', type: 'Number' }
                ]
              }
            }

            return baseNode
          })

          // 映射后端返回的连接数据到前端格式
          if (response.connections && Array.isArray(response.connections)) {
            connections.value = response.connections.map((conn, index) => ({
              id: conn.connectionUuid || `conn-${Date.now() + index}`,
              sourceId: conn.sourceNodeUuid || nodeIdMap[conn.sourceNodeId] || conn.sourceNodeId,
              sourcePort: conn.sourcePortId,
              targetId: conn.targetNodeUuid || nodeIdMap[conn.targetNodeId] || conn.targetNodeId,
              targetPort: conn.targetPortId,
              sourceParamIndex: conn.sourceParamIndex,
              targetParamIndex: conn.targetParamIndex,
              label: conn.label || null,
              branchLabel: conn.branchLabel || null,
              config: {}
            }))
          }

          // 映射后端返回的关联数据到前端格式
          if (response.associations && Array.isArray(response.associations) && response.associations.length > 0) {
            associations.value = response.associations.map((assoc, index) => ({
              id: `assoc-${index}`,
              sourceId: nodeIdMap[assoc.containerNodeUuid] || assoc.containerNodeUuid,
              targetId: nodeIdMap[assoc.bodyNodeUuid] || assoc.bodyNodeUuid,
              associationType: assoc.associationType,
              config: {}
            }))
            // console.log('关联数据已加载 (onMounted):', associations.value)
            // console.log('nodeIdMap:', nodeIdMap)
            // console.log('原始 associations:', response.associations)
          } else {
            // 如果后端没有返回关联数据，根据节点自动创建关联
            // console.log('没有关联数据，自动创建关联')
            const loopNodes = nodes.value.filter(n => n.type === 'loop')
            const loopBodyNodes = nodes.value.filter(n => n.type === 'loopBodyCanvas')

            loopNodes.forEach(loopNode => {
              // 查找对应的循环体（通过 belongsTo 属性或 ID 匹配）
              const loopBodyNode = loopBodyNodes.find(body =>
                body.belongsTo === loopNode.id ||
                body.id === `loopBody-${loopNode.id}`
              )

              if (loopBodyNode) {
                associations.value.push({
                  id: `assoc-${Date.now()}-${loopNode.id}`,
                  sourceId: loopNode.id,
                  targetId: loopBodyNode.id,
                  associationType: 'LOOP_BODY',
                  config: {}
                })
                // console.log('自动创建关联:', loopNode.id, '->', loopBodyNode.id)
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('加载工作流失败:', error)
      ElMessage.error('加载工作流失败')
      // 加载失败时返回列表页
      router.push('/workflow')
    }
  }

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
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', onDragAiChat)
  document.removeEventListener('mouseup', stopDragAiChat)
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
        <el-button text :icon="ZoomOut" @click="zoomOut" title="缩小 (Ctrl+-)" />
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
            <span class="zoom-value">{{ Math.round(canvas.scale * 100) }}%</span>
          </template>
        </el-popover>
        <el-button text :icon="ZoomIn" @click="zoomIn" title="放大 (Ctrl+=)" />
        <el-button text :icon="FullScreen" @click="handleFitContent" title="适应内容" />
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
      <div ref="canvasContainerRef" class="canvas-container" :class="{ dragging: canvasDragState.isDragging, 'drawing-connection': drawingConnection }" @click="handleCanvasClick" @mousedown="startDragCanvas" @wheel.prevent="handleWheel">
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
              :key="conn.id + '-start-' + canvas.scale"
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

          <!-- 连线上的标签（分支标签或用户自定义标签） -->
          <div
            v-for="conn in connections"
            :key="'label-' + conn.id"
          >
            <div
              v-if="(conn.branchLabel || conn.label) && getConnectionMidpoint(conn)"
              class="connection-label"
              :class="{ 'user-label': conn.label && !conn.branchLabel }"
              :style="{
                left: `${getConnectionMidpoint(conn).x}px`,
                top: `${getConnectionMidpoint(conn).y}px`,
              }"
            >
              {{ conn.label || conn.branchLabel }}
            </div>
          </div>

          <!-- 节点层 -->
          <div
            v-for="node in nodes"
            :key="node.id"
            :data-node-id="node.id"
            :data-node-type="node.type"
            class="flow-node"
            :class="{ selected: isNodeSelected(node.id) }"
            :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            @mousedown="startDragNode(node, $event)"
            @click.stop="handleNodeClick(node, $event)"
            @dblclick.stop="openNodeConfig(node)"
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
                  class="output-port node-edge-port node-center-port node-start-action-btn"
                  title="output"
                  @mousedown.stop="handleActionBtnDown(node, $event)"
                  @mouseup.stop="handleActionBtnUp(node, $event)"
                  @click.stop.prevent
                >
                </div>
              </template>

              <!-- 结束节点：单行显示输出参数，左侧有端口 -->
              <template v-else-if="node.type === 'end'">
                <div class="input-port end-node-port" @mousedown.stop.prevent></div>
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
              <template v-else-if="node.type === 'loop'">
                <!-- 输入端口在节点左侧边缘垂直居中 -->
                <div
                  class="input-port node-edge-port node-center-port"
                  title="input"
                  @mousedown.stop.prevent
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
                  class="output-port node-edge-port node-center-port node-start-action-btn"
                  title="output"
                  @mousedown.stop="handleActionBtnDown(node, $event)"
                  @mouseup.stop="handleActionBtnUp(node, $event)"
                  @click.stop.prevent
                >
                </div>
              </template>

              <!-- 其他节点：分别显示输入和输出参数 -->
              <template v-else>
                <!-- 输入端口在节点左侧边缘垂直居中（循环体画布类型不显示） -->
                <div
                  v-if="node.type !== 'loopBodyCanvas'"
                  class="input-port node-edge-port node-center-port"
                  title="input"
                  @mousedown.stop.prevent
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
                  class="output-port node-edge-port node-center-port node-start-action-btn"
                  title="output"
                  @mousedown.stop="handleActionBtnDown(node, $event)"
                  @mouseup.stop="handleActionBtnUp(node, $event)"
                  @click.stop.prevent
                ></div>
              </template>
            </div>
          </div>

          <!-- 关联线层（循环节点与循环体画布之间的虚线） -->
          <svg class="associations-layer" :width="canvas.width" :height="canvas.height">
            <path
              v-for="assoc in associations"
              :key="assoc.id"
              :d="getAssociationPath(assoc)"
              class="association-path"
            />
          </svg>

          <!-- 循环体画布 -->
          <LoopBodyCanvas
            v-for="loopBodyNode in getLoopBodyNodes"
            :key="loopBodyNode.id"
            :ref="(el) => setLoopBodyCanvasRef(loopBodyNode.id, el)"
            :loop-body-node="loopBodyNode"
            :loop-node="nodes.find(n => n.id === loopBodyNode.belongsTo)"
            :node-types="nodeTypes"
            @canvas-drag-start="startDragLoopBodyCanvas($event, loopBodyNode)"
            @node-select="handleLoopBodyNodeSelect"
            @node-dblclick="handleLoopBodyNodeDblClick"
          />

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
              :key="conn.id + '-end-' + canvas.scale"
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
          <div class="context-menu-item" @click="connectionMenuEditLabel">
            <el-icon><Edit /></el-icon>
            <span>{{ contextMenu.connection?.label ? '编辑标签' : '添加标签' }}</span>
          </div>
          <div class="context-menu-divider" />
          <div class="context-menu-item danger" @click="connectionMenuDelete">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </div>
        </div>

        <!-- 连线标签编辑对话框 -->
        <el-dialog
          v-model="connectionLabelDialog.visible"
          title="编辑连线标签"
          width="400px"
          :close-on-click-modal="true"
          align-center
        >
          <el-input
            v-model="connectionLabelDialog.label"
            placeholder="请输入标签内容"
            maxlength="50"
            show-word-limit
            @keydown.enter="saveConnectionLabel"
          />
          <template #footer>
            <el-button @click="connectionLabelDialog.visible = false">取消</el-button>
            <el-button type="primary" @click="saveConnectionLabel">确定</el-button>
          </template>
        </el-dialog>

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

        <!-- 右侧AI助手面板 -->
        <div
          class="ai-chat-panel"
          :class="{ expanded: aiChatExpanded, dragging: isDraggingAiChat }"
          :style="aiChatExpanded ? { width: aiChatWidth + 'px' } : {}"
          @mousedown.stop
        >
          <!-- 折叠状态下的折叠指示器 - AI助手风格设计 -->
          <div
            v-if="!aiChatExpanded"
            class="ai-chat-collapse-indicator"
            @click="toggleAiChat"
          >
            <!-- AI火花装饰 -->
            <div class="ai-sparkle ai-sparkle-1"></div>
            <div class="ai-sparkle ai-sparkle-2"></div>
            <div class="ai-sparkle ai-sparkle-3"></div>

            <!-- AI图标区域 -->
            <div class="ai-icon-container">
              <div class="ai-icon-glow"></div>
              <el-icon class="ai-icon" :size="22">
                <ChatDotRound />
              </el-icon>
            </div>

            <!-- 文字区域 -->
            <div class="ai-text-container">
              <span class="ai-label">AI</span>
              <span class="ai-title">智能助手</span>
            </div>

            <!-- 展开提示 -->
            <div class="ai-expand-hint">
              <span class="hint-dot"></span>
              <span class="hint-text">点击展开</span>
            </div>
          </div>

          <!-- 拖拽调整手柄 -->
          <div
            v-if="aiChatExpanded"
            class="ai-chat-resize-handle"
            :class="{ active: isDraggingAiChat }"
            @mousedown="startDragAiChat"
          >
            <div class="resize-indicator"></div>
          </div>
          <div v-if="aiChatExpanded" class="ai-chat-header" @click="toggleAiChat">
            <div class="ai-chat-title">
              <div class="title-icon">
                <div class="icon-glow"></div>
                <el-icon :size="18"><ChatDotRound /></el-icon>
              </div>
              <div class="title-content">
                <span class="title-label">AI</span>
                <span class="title-text">智能助手</span>
              </div>
              <Transition name="fade">
                <span v-if="aiChatIsTyping" class="processing-badge">
                  <span class="badge-dot"></span>
                  <span class="badge-text">思考中</span>
                </span>
              </Transition>
            </div>
            <div class="ai-chat-header-right">
              <Transition name="fade">
                <span v-if="aiChatIsTyping" class="header-processing-indicator">
                  <span class="spinner-mini"></span>
                </span>
              </Transition>
              <div class="collapse-btn" @click.stop="toggleAiChat" title="收起面板">
                <el-icon :size="16">
                  <ArrowRight />
                </el-icon>
              </div>
            </div>
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
                <!-- 流式消息内容为空时显示思考动画 -->
                <template v-if="message.isStreaming && !message.content">
                  <div class="ai-message-bubble typing">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                </template>
                <!-- 有内容时显示消息气泡 -->
                <template v-else>
                  <div
                    class="ai-message-bubble"
                    :class="{ 'streaming': message.isStreaming }"
                    v-html="message.type === 'ai' ? renderMarkdown(message.content) : message.content"
                  ></div>
                  <!-- 流式输出光标 -->
                  <span v-if="message.isStreaming" class="streaming-cursor">|</span>
                </template>
                <div v-if="message.type === 'user'" class="ai-message-avatar user">
                  <span>我</span>
                </div>
              </div>
              <!-- 额外的思考动画（用于非流式场景） -->
              <div v-if="aiChatIsTyping && !aiChatMessages.some(m => m.isStreaming)" class="ai-message-item ai">
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
            <div class="ai-chat-input-area" :class="{ 'is-disabled': aiChatIsTyping }">
              <el-input
                v-model="aiChatInput"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
                size="small"
                @keydown.enter.exact.prevent="sendAiMessage"
              />
              <el-button type="primary" size="small" :icon="Position" @click="sendAiMessage" :disabled="!aiChatInput.trim() || aiChatIsTyping">发送</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 节点配置弹窗 -->
      <el-dialog
        v-model="configDialogVisible"
        width="560px"
        :close-on-click-modal="true"
        :close-on-press-escape="true"
        :show-close="false"
        @close="handleConfigDialogClose"
        class="node-config-dialog"
      >
        <template #header>
          <div class="dialog-header">
            <div class="dialog-title-area">
              <!-- 编辑模式 -->
              <input
                v-if="isEditingNodeName"
                v-model="editingNodeName"
                class="dialog-node-name-input"
                @blur="finishEditNodeName"
                @keyup.enter="finishEditNodeName"
                @keyup.escape="cancelEditNodeName"
                ref="nodeNameInput"
              />
              <!-- 显示模式 -->
              <span
                v-else
                class="dialog-node-name"
                :class="{ 'editable': !['start', 'end', 'loopBodyCanvas'].includes(selectedNode?.type) }"
                @dblclick="startEditNodeName"
              >{{ selectedNode?.name }}</span>
              <!-- 节点描述：优先使用节点自身的 description，其次使用 nodeDescriptions 映射 -->
              <span v-if="selectedNode && (selectedNode.description || nodeDescriptions[selectedNode.type])" class="dialog-node-desc">
                {{ selectedNode.description || nodeDescriptions[selectedNode.type] }}
              </span>
            </div>
            <div class="dialog-actions">
              <template v-if="selectedNode && !['start', 'end'].includes(selectedNode.type)">
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
              </template>
            </div>
          </div>
        </template>
        <div class="dialog-content" v-if="selectedNode">
          <!-- 开始节点 - 输出参数配置 -->
          <template v-if="selectedNode.type === 'start'">
            <div class="config-item">
              <div class="config-item-header">
                <label>初始变量</label>
                <el-button type="primary" text size="small" :icon="Plus" @click="addOutputParam">
                  添加变量
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

          <!-- 循环节点配置 -->
          <template v-if="selectedNode.type === 'loop'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[
                    { name: 'times', type: 'Integer', required: false, desc: '循环次数（正整数）', field: 'times' },
                    { name: 'cycle_array', type: 'Array', required: false, desc: '循环数组（从上游节点选择数组变量）', field: 'cycle_array' }
                  ]"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="140">
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
                  <el-table-column label="类型" width="120" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">
                        {{ row.field === 'cycle_array' && selectedNode.config.cycle_array
                           ? (getVariableType(selectedNode.config.cycle_array) || row.type)
                           : row.type }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row }">
                      <!-- times: 正整数输入框 -->
                      <div v-if="row.field === 'times'" class="param-value-input">
                        <el-input-number
                          v-model="selectedNode.config.times"
                          :min="1"
                          :precision="0"
                          placeholder="循环次数"
                          size="small"
                          style="width: 100%"
                          controls-position="right"
                        />
                      </div>
                      <!-- cycle_array: 弹窗选择数组变量 -->
                      <div v-else-if="row.field === 'cycle_array'" class="param-value-input">
                        <el-input
                          v-model="selectedNode.config.cycle_array"
                          placeholder="选择数组变量"
                          size="small"
                          class="param-input-with-btn"
                          readonly
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field, true)"><Link /></el-icon>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 输出参数（可增减，类型显示为 Array<元素类型>） -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输出</span>
                <el-button type="primary" text size="small" :icon="Plus" @click="addLoopOutputParam" style="margin-left: auto;">
                  添加变量
                </el-button>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.config.loopOutputParams"
                  size="small"
                  class="io-table"
                  empty-text="暂无输出变量，请添加"
                >
                  <el-table-column label="变量名" min-width="120">
                    <template #default="{ row }">
                      <el-input v-model="row.name" placeholder="请输入变量名" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" min-width="150" align="center">
                    <template #default="{ row }">
                      <span v-if="row.elementType" class="param-type-tag" v-text="'Array<' + row.elementType + '>'"></span>
                      <span v-else class="param-type-placeholder">关联后自动推断</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="140">
                    <template #default="{ row, $index }">
                      <div class="param-value-input">
                        <span v-if="row.value" class="param-value-text">{{ row.value }}</span>
                        <span v-else class="param-value-placeholder">点击关联</span>
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showLoopOutputVariableSelector($index)"><Link /></el-icon>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="60" align="center">
                    <template #default="{ $index }">
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeLoopOutputParam($index)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
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

          <!-- 简单条件分支节点配置 (condition_simple) -->
          <template v-if="selectedNode.type === 'condition_simple'">
            <div class="config-item">
              <div class="config-item-header">
                <label>条件表达式</label>
              </div>
              <div class="condition-simple-config">
                <!-- 左操作数 -->
                <div class="operand-row">
                  <label class="operand-label">左操作数</label>
                  <div class="operand-input-group">
                    <el-select
                      v-model="selectedNode.config.conditionExpression.leftOperand"
                      placeholder="选择变量"
                      size="small"
                      filterable
                      allow-create
                      class="operand-select"
                      @change="onLeftOperandChange"
                    >
                      <el-option
                        v-for="param in getAvailableVariables()"
                        :key="param.name"
                        :label="param.name"
                        :value="'${' + param.name + '}'"
                      />
                    </el-select>
                    <el-button type="primary" text size="small" @click="openVariableSelectorForCondition('left')">
                      选择
                    </el-button>
                  </div>
                  <div v-if="selectedNode.config.conditionExpression.leftOperandType" class="type-hint">
                    检测到类型：{{ selectedNode.config.conditionExpression.leftOperandType }}
                  </div>
                </div>

                <!-- 操作符 -->
                <div class="operand-row">
                  <label class="operand-label">操作符</label>
                  <el-select
                    v-model="selectedNode.config.conditionExpression.operator"
                    placeholder="选择操作符"
                    size="small"
                    class="operator-select"
                    @change="onOperatorChange"
                  >
                    <el-option
                      v-for="op in getFilteredOperators()"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>
                </div>

                <!-- 右操作数（动态显示） -->
                <div v-if="showRightOperandInput" class="operand-row">
                  <label class="operand-label">右操作数</label>
                  <div class="right-operand-config">
                    <!-- 值类型切换 -->
                    <el-radio-group
                      v-model="selectedNode.config.conditionExpression.rightOperandType"
                      size="small"
                      class="value-type-radio"
                      @change="onRightOperandTypeChange"
                    >
                      <el-radio-button value="literal">固定值</el-radio-button>
                      <el-radio-button value="reference">引用变量</el-radio-button>
                    </el-radio-group>

                    <!-- 固定值输入 -->
                    <div v-if="selectedNode.config.conditionExpression.rightOperandType === 'literal'" class="value-input-wrapper">
                      <!-- 区间操作符：两个输入框 -->
                      <template v-if="selectedNode.config.conditionExpression.operator === 'between'">
                        <div class="between-inputs">
                          <el-input
                            v-model="selectedNode.config.conditionExpression.rightOperandMin"
                            placeholder="最小值"
                            size="small"
                            type="number"
                          />
                          <span class="between-separator">至</span>
                          <el-input
                            v-model="selectedNode.config.conditionExpression.rightOperandMax"
                            placeholder="最大值"
                            size="small"
                            type="number"
                          />
                        </div>
                      </template>
                      <!-- 普通操作符：一个输入框 -->
                      <template v-else>
                        <el-input
                          v-model="selectedNode.config.conditionExpression.rightOperand"
                          placeholder="请输入固定值"
                          size="small"
                        />
                      </template>
                    </div>

                    <!-- 引用变量输入 -->
                    <div v-else class="operand-input-group">
                      <el-select
                        v-model="selectedNode.config.conditionExpression.rightOperand"
                        placeholder="选择变量"
                        size="small"
                        filterable
                        allow-create
                        class="operand-select"
                      >
                        <el-option
                          v-for="param in getAvailableVariables()"
                          :key="param.name"
                          :label="param.name"
                          :value="'${' + param.name + '}'"
                        />
                      </el-select>
                      <el-button type="primary" text size="small" @click="openVariableSelectorForCondition('right')">
                        选择
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 分支预览 -->
                <div class="branch-preview">
                  <div class="preview-title">分支预览</div>
                  <div class="preview-branches">
                    <div class="preview-branch true-branch">
                      <span class="branch-icon">✓</span>
                      <span class="branch-name">true</span>
                      <span class="branch-desc">条件成立时执行</span>
                    </div>
                    <div class="preview-branch false-branch">
                      <span class="branch-icon">✗</span>
                      <span class="branch-name">false</span>
                      <span class="branch-desc">条件不成立时执行</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 多路分支节点配置 (condition_multi) -->
          <template v-if="selectedNode.type === 'condition_multi'">
            <div class="config-item">
              <div class="config-item-header">
                <label>分支配置</label>
                <el-button type="primary" text size="small" :icon="Plus" @click="addMultiCase">
                  添加分支
                </el-button>
              </div>

              <div class="multi-cases-container">
                <!-- Case 分支列表 -->
                <div
                  v-for="(caseItem, index) in selectedNode.conditions.cases"
                  :key="caseItem.id"
                  class="multi-case-item"
                >
                  <div class="case-header">
                    <div class="case-title">
                      <span class="case-index">{{ index + 1 }}</span>
                      <el-input
                        v-model="caseItem.label"
                        placeholder="请输入分支名称"
                        size="small"
                        class="case-label-input"
                        @input="onCaseLabelChange(index, $event)"
                      />
                    </div>
                    <div class="case-actions">
                      <el-select
                        :model-value="caseItem.priority"
                        size="small"
                        class="case-priority-select"
                        @change="onCasePriorityChange(index, $event)"
                      >
                        <el-option
                          v-for="opt in getPriorityOptions()"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeMultiCase(index)"
                      />
                    </div>
                  </div>

                  <div class="case-expression">
                    <!-- 左操作数 -->
                    <div class="operand-row">
                      <label class="operand-label">左操作数</label>
                      <div class="operand-input-group">
                        <el-select
                          :model-value="caseItem.expression.leftOperand"
                          placeholder="选择变量"
                          size="small"
                          filterable
                          allow-create
                          class="operand-select"
                          @change="onCaseLeftOperandChange(index, $event)"
                        >
                          <el-option
                            v-for="param in getAvailableVariables()"
                            :key="param.name"
                            :label="param.name"
                            :value="'${' + param.name + '}'"
                          />
                        </el-select>
                        <el-button type="primary" text size="small" @click="openCaseVarSelector(index, 'left')">
                          选择
                        </el-button>
                      </div>
                    </div>

                    <!-- 操作符 -->
                    <div class="operand-row">
                      <label class="operand-label">操作符</label>
                      <el-select
                        :model-value="caseItem.expression.operator"
                        placeholder="选择操作符"
                        size="small"
                        class="operator-select"
                        @change="onCaseOperatorChange(index, $event)"
                      >
                        <el-option
                          v-for="op in getFilteredOperatorsForCase(index)"
                          :key="op.value"
                          :label="op.label"
                          :value="op.value"
                        />
                      </el-select>
                    </div>

                    <!-- 右操作数 -->
                    <div v-if="showCaseRightOperand(index)" class="operand-row">
                      <label class="operand-label">右操作数</label>
                      <div v-if="showCaseTwoRightOperands(index)" class="between-inputs">
                        <el-input
                          :model-value="Array.isArray(caseItem.expression.rightOperand) ? caseItem.expression.rightOperand[0] : ''"
                          placeholder="最小值"
                          size="small"
                          type="number"
                          @input="onCaseRightOperandChange(index, [$event, Array.isArray(caseItem.expression.rightOperand) ? caseItem.expression.rightOperand[1] : ''])"
                        />
                        <span class="between-separator">至</span>
                        <el-input
                          :model-value="Array.isArray(caseItem.expression.rightOperand) ? caseItem.expression.rightOperand[1] : ''"
                          placeholder="最大值"
                          size="small"
                          type="number"
                          @input="onCaseRightOperandChange(index, [Array.isArray(caseItem.expression.rightOperand) ? caseItem.expression.rightOperand[0] : '', $event])"
                        />
                      </div>
                      <div v-else class="operand-input-group">
                        <el-input
                          :model-value="caseItem.expression.rightOperand"
                          placeholder="请输入值"
                          size="small"
                          @input="onCaseRightOperandChange(index, $event)"
                        />
                        <el-button type="primary" text size="small" @click="openCaseVarSelector(index, 'right')">
                          选择
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 默认分支 -->
                <div class="multi-case-item default-case">
                  <div class="case-header">
                    <div class="case-title">
                      <span class="case-index default">默</span>
                      <el-input
                        :model-value="selectedNode.conditions.defaultCase.label"
                        placeholder="请输入默认分支名称"
                        size="small"
                        class="case-label-input"
                        @input="onDefaultLabelChange($event)"
                      />
                    </div>
                    <el-tag type="info" size="small" class="default-tag">默认分支</el-tag>
                  </div>
                  <div class="default-case-desc">
                    以上条件都不满足时执行此分支
                  </div>
                </div>
              </div>
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
                    { name: 'input', type: 'File<Excel>', required: false, desc: '需要被清洗的目标xlsx文件', field: 'inputFileValue' },
                    { name: 'cols', type: 'cols', required: true, desc: '指定xlsx文件中需要清洗的列（支持数据字典或String）', field: 'colsValue' },
                    { name: 'rm_extra_spaces', type: 'Boolean', required: false, desc: '是否去除多余空格', field: 'removeExtraSpaces' },
                    { name: 'rm_html_tags', type: 'Boolean', required: false, desc: '是否去除HTML标签', field: 'removeHtmlTags' },
                    { name: 'rm_special_chars', type: 'Boolean', required: false, desc: '是否去除特殊字符', field: 'removeSpecialChars' },
                    { name: 'std_newline', type: 'Boolean', required: false, desc: '是否标准化换行符', field: 'standardizedNewlineChar' },
                    { name: 'trim_whitespace', type: 'Boolean', required: false, desc: '是否去除首尾空白', field: 'trimFrontBack' }
                  ]"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="150">
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
                      <!-- cols 变量：动态显示类型 -->
                      <span v-if="row.type === 'cols'" class="param-type-tag">{{ getColsDynamicType() }}</span>
                      <!-- 其他变量：显示固定类型 -->
                      <span v-else class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="150">
                    <template #default="{ row }">
                      <!-- cols 变量：特殊处理，关联时只筛选 Dictionary 和 String，Dictionary 支持多选 -->
                      <div v-if="row.type === 'cols'" class="param-value-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                          @input="onColsValueChange"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出（仅数据字典和String）" @click="showVariableSelectorWithTypes(row.field, ['Dictionary', 'String'], true)"><Link /></el-icon>
                      </div>
                      <!-- Boolean 类型：下拉框 + 关联选择 -->
                      <div v-else-if="row.type === 'Boolean'" class="param-value-input">
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
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field, false, row.type)"><Link /></el-icon>
                      </div>
                      <!-- File 类型：只显示上传按钮和关联按钮 -->
                      <div v-else-if="row.type.includes('File')" class="param-value-input file-input">
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
                          <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field, false, row.type)"><Link /></el-icon>
                        </div>
                      </div>
                      <!-- 其他类型：输入框 + 关联选择 -->
                      <div v-else class="param-value-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field, false, row.type)"><Link /></el-icon>
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
                  :data="[{ name: 'output', type: 'File<Excel>', desc: '被清洗之后的xlsx文件' }]"
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
                    { name: 'file', type: 'File<Excel>', required: true, desc: '需要提取数据的表格文件', field: 'inputFileValue' }
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
                          <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field, false, row.type)"><Link /></el-icon>
                        </div>
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
                  :data="[{ name: 'output', type: 'Array<String>', desc: '从表格中提取的数据数组' }]"
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
                  <el-table-column label="类型" width="120" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

          <!-- HTTPS/HTTP接口调用节点配置 -->
          <template v-if="selectedNode.type === 'apiAuto'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[
                    { name: 'url', type: 'String', required: true, desc: '请求的URL地址', field: 'urlValue' },
                    { name: 'headers', type: 'String', required: false, desc: '请求头，JSON格式字符串', field: 'headersValue' },
                    { name: 'body', type: 'String', required: false, desc: '请求体内容', field: 'bodyValue' },
                    { name: 'param', type: 'String', required: false, desc: 'URL查询参数', field: 'paramValue' },
                    { name: 'response', type: 'String', required: false, desc: '响应信息示例（用于推断输出变量结构）', field: 'responseValue' }
                  ]"
                  size="small"
                  class="io-table"
                  table-layout="fixed"
                >
                  <el-table-column label="变量名" width="120">
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
                  <el-table-column label="类型" width="80" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row }">
                      <!-- Textarea 类型（response、body、headers): 文本域 + 关联按钮 -->
                      <div v-if="row.name === 'response' || row.name === 'body' || row.name === 'headers'" class="param-value-input textarea-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          :placeholder="row.name === 'response' ? '输入JSON示例以推断输出变量' : '输入或引用参数值'"
                          size="small"
                          type="textarea"
                          :rows="1"
                          class="param-textarea-with-btn"
                          @input="row.name === 'response' && refreshApiAutoOutputs()"
                        />
                        <el-icon
                          class="action-icon link-icon"
                          title="关联节点输出"
                          @click="showVariableSelector(row.field)"
                        ><Link /></el-icon>
                      </div>
                      <!-- 其他类型：输入框 + 关联选择 -->
                      <div v-else class="param-value-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showVariableSelector(row.field)"><Link /></el-icon>
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
                <span class="output-hint">（根据response示例自动推断）</span>
              </div>
              <div class="io-section-content">
                <JsonTreeView
                  :data="getApiAutoOutputParams()"
                  empty-text="请输入response示例以推断输出变量"
                />
              </div>
            </div>
          </template>

          <!-- 裁判模型节点配置 -->
          <template v-if="selectedNode.type === 'judgeModel'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="[
                    { name: 'model', type: 'String', required: true, desc: '所使用的底座大模型', field: 'modelValue' },
                    { name: 'prompt', type: 'String', required: true, desc: '裁判模型的评估规则', field: 'promptValue' },
                    { name: 'to_evaluate', type: selectedNode.config.toEvaluateType || 'String', required: true, desc: '待评估的内容', field: 'toEvaluateValue', isTypeSelectable: true, typeField: 'toEvaluateType' },
                    { name: 'ref', type: selectedNode.config.refType || 'String', required: false, desc: '参考内容（可选）', field: 'refValue', isTypeSelectable: true, typeField: 'refType' }
                  ]"
                  size="small"
                  class="io-table"
                  table-layout="fixed"
                >
                  <el-table-column label="变量名" width="110">
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
                  <el-table-column label="类型" width="110" align="center">
                    <template #default="{ row }">
                      <!-- model: 固定显示 String -->
                      <span v-if="row.name === 'model'" class="param-type-tag">{{ row.type }}</span>
                      <!-- prompt: 固定显示 String -->
                      <span v-else-if="row.name === 'prompt'" class="param-type-tag">{{ row.type }}</span>
                      <!-- to_evaluate/ref: 类型可选择 -->
                      <el-select
                        v-else
                        :model-value="selectedNode.config[row.typeField] || 'String'"
                        placeholder="选择类型"
                        size="small"
                        style="width: 100%"
                        @update:model-value="(val) => handleJudgeModelTypeChange(row.typeField, val)"
                      >
                        <el-option label="String" value="String" />
                        <el-option label="File(Excel)" value="File(Excel)" />
                        <el-option label="Array<String>" value="Array<String>" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="140">
                    <template #default="{ row }">
                      <!-- model: 下拉选择 -->
                      <div v-if="row.name === 'model'" class="param-value-input">
                        <el-select
                          v-model="selectedNode.config[row.field]"
                          placeholder="选择模型"
                          size="small"
                          style="width: 100%"
                        >
                          <el-option label="DeepSeekR1-32B" value="DeepSeekR1-32B" />
                        </el-select>
                      </div>
                      <!-- prompt: 文本域 + 关联按钮 -->
                      <div v-else-if="row.name === 'prompt'" class="param-value-input textarea-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入评估规则"
                          size="small"
                          type="textarea"
                          :rows="1"
                          class="param-textarea-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showJudgeModelVariableSelector(row.field)"><Link /></el-icon>
                      </div>
                      <!-- to_evaluate/ref: 输入框 + 关联按钮 -->
                      <div v-else class="param-value-input">
                        <el-input
                          v-model="selectedNode.config[row.field]"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showJudgeModelVariableSelector(row.field, row.typeField)"><Link /></el-icon>
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
                  :data="[{ name: 'output', type: 'Array<String>', desc: '评估结果，数组元素是JSON字符串' }]"
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
                  <el-table-column label="类型" width="120" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

          <!-- 表格生成节点配置 -->
          <template v-if="selectedNode.type === 'tableGenerate'">
            <!-- 输入参数（可增减） -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
                <el-button type="primary" text size="small" :icon="Plus" @click="addTableGenerateInputParam" style="margin-left: auto;">
                  添加变量
                </el-button>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.config.inputParams"
                  size="small"
                  class="io-table"
                  empty-text="暂无输入变量，请添加"
                >
                  <el-table-column label="变量名" width="100">
                    <template #default="{ row }">
                      <el-input v-model="row.name" placeholder="请输入变量名" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="变量类型" width="110">
                    <template #default="{ row, $index }">
                      <el-select
                        :model-value="getTableGenerateTypeValue(row)"
                        placeholder="选择类型"
                        size="small"
                        style="width: 100%"
                        @update:model-value="(val) => handleTableGenerateTypeChange($index, val)"
                      >
                        <el-option label="String" value="String" />
                        <el-option label="Array<String>" value="Array<String>" />
                        <el-option label="数据字典" value="Dictionary" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row, $index }">
                      <div class="param-value-input">
                        <el-input
                          v-model="row.value"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showTableGenerateVariableSelector($index)"><Link /></el-icon>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="50" align="center">
                    <template #default="{ $index }">
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeTableGenerateInputParam($index)"
                      />
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
                  :data="[{ name: 'output_excel', type: 'File<Excel>', desc: '生成的表格文件' }]"
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
                  <el-table-column label="类型" width="120" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

          <!-- Skill 节点配置 -->
          <template v-if="selectedNode.type === 'skill'">
            <!-- 输入参数 -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
                <!-- 当 allowAddInputParams 为 true 时显示添加参数按钮 -->
                <el-button
                  v-if="selectedNode.allowAddInputParams"
                  type="primary"
                  text
                  size="small"
                  :icon="Plus"
                  @click="addSkillInputParam"
                  style="margin-left: auto;"
                >
                  添加参数
                </el-button>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.inputParams"
                  size="small"
                  class="io-table"
                  empty-text="暂无输入参数"
                >
                  <el-table-column label="变量名" min-width="120">
                    <template #default="{ row }">
                      <div class="param-name-cell">
                        <span v-if="row.required" class="required-mark">*</span>
                        <!-- 额外添加的参数可编辑变量名 -->
                        <el-input
                          v-if="row.isExtra"
                          v-model="row.name"
                          placeholder="输入变量名"
                          size="small"
                          style="flex: 1"
                        />
                        <span v-else class="param-name-text">{{ row.name }}</span>
                        <el-tooltip v-if="row.description" :content="row.description" placement="top" :show-after="300">
                          <el-icon class="param-desc-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="120" align="center">
                    <template #default="{ row }">
                      <!-- 额外添加的参数可选择类型 -->
                      <el-select
                        v-if="row.isExtra"
                        v-model="row.type"
                        placeholder="选择类型"
                        size="small"
                        style="width: 100%"
                      >
                        <el-option label="String" value="String" />
                        <el-option label="Integer" value="Integer" />
                        <el-option label="Boolean" value="Boolean" />
                        <el-option label="Array" value="Array" />
                        <el-option label="Object" value="Object" />
                      </el-select>
                      <span v-else class="param-type-tag">{{ row.type || 'String' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row, $index }">
                      <!-- 布尔类型：下拉框 + 关联选择 -->
                      <div v-if="row.type === 'Boolean'" class="param-value-input">
                        <el-select
                          v-model="row.value"
                          placeholder="选择"
                          size="small"
                          class="param-select-with-btn"
                          clearable
                        >
                          <el-option label="true" :value="true" />
                          <el-option label="false" :value="false" />
                        </el-select>
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showSkillVariableSelector($index, 'input')"><Link /></el-icon>
                      </div>
                      <!-- 整数类型 -->
                      <div v-else-if="row.type === 'Integer'" class="param-value-input">
                        <el-input-number
                          v-model="row.value"
                          :min="0"
                          placeholder="输入数值"
                          size="small"
                          style="width: 100%"
                          controls-position="right"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showSkillVariableSelector($index, 'input')"><Link /></el-icon>
                      </div>
                      <!-- File 类型 -->
                      <div v-else-if="row.type && row.type.includes('File')" class="param-value-input file-input">
                        <span v-if="row.value" class="file-value">{{ row.value }}</span>
                        <span v-else class="file-placeholder">未选择文件</span>
                        <div class="file-actions">
                          <el-upload
                            :show-file-list="false"
                            accept=".xlsx,.xls,.txt,.csv"
                            :before-upload="(file) => handleSkillFileUpload(file, $index)"
                          >
                            <el-icon class="action-icon upload-icon" title="上传文件"><Upload /></el-icon>
                          </el-upload>
                          <el-icon class="action-icon link-icon" title="关联节点输出" @click="showSkillVariableSelector($index, 'input')"><Link /></el-icon>
                        </div>
                      </div>
                      <!-- 其他类型：输入框 + 关联选择 -->
                      <div v-else class="param-value-input">
                        <el-input
                          v-model="row.value"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showSkillVariableSelector($index, 'input')"><Link /></el-icon>
                      </div>
                    </template>
                  </el-table-column>
                  <!-- 额外添加的参数显示删除按钮 -->
                  <el-table-column v-if="selectedNode.allowAddInputParams" label="" width="50" align="center">
                    <template #default="{ row, $index }">
                      <!-- 只对额外添加的参数（非必填且非原始参数）显示删除按钮 -->
                      <el-button
                        v-if="!row.required && row.isExtra"
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeSkillInputParam($index)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 输出参数（只读） -->
            <div class="io-section" v-if="selectedNode.outputParams && selectedNode.outputParams.length > 0">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输出</span>
                <span class="io-section-hint">（只读，可供后续节点引用）</span>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.outputParams"
                  size="small"
                  class="io-table"
                >
                  <el-table-column label="变量名" min-width="150">
                    <template #default="{ row }">
                      <div class="param-name-cell">
                        <span class="param-name-text">{{ row.name }}</span>
                        <el-tooltip v-if="row.description" :content="row.description" placement="top" :show-after="300">
                          <el-icon class="param-desc-icon"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="150" align="center">
                    <template #default="{ row }">
                      <span class="param-type-tag">{{ row.type || 'String' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

          <!-- 结束节点配置 -->
          <template v-if="selectedNode.type === 'end'">
            <!-- 输入参数（可增减） -->
            <div class="io-section">
              <div class="io-section-header">
                <el-icon class="expand-icon"><ArrowDown /></el-icon>
                <span class="io-section-title">输入</span>
                <el-button type="primary" text size="small" :icon="Plus" @click="addEndInputParam" style="margin-left: auto;">
                  添加变量
                </el-button>
              </div>
              <div class="io-section-content">
                <el-table
                  :data="selectedNode.config.inputParams"
                  size="small"
                  class="io-table"
                  empty-text="暂无输入变量，请添加"
                >
                  <el-table-column label="变量名" width="100">
                    <template #default="{ row }">
                      <el-input v-model="row.name" placeholder="请输入变量名" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="变量类型" width="110">
                    <template #default="{ row, $index }">
                      <el-select
                        :model-value="getEndTypeValue(row)"
                        placeholder="选择类型"
                        size="small"
                        style="width: 100%"
                        @update:model-value="(val) => handleEndTypeChange($index, val)"
                      >
                        <el-option label="String" value="String" />
                        <el-option label="Array<String>" value="Array<String>" />
                        <el-option label="数据字典" value="Dictionary" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="变量值" min-width="160">
                    <template #default="{ row, $index }">
                      <div class="param-value-input">
                        <el-input
                          v-model="row.value"
                          placeholder="输入或引用参数值"
                          size="small"
                          class="param-input-with-btn"
                        />
                        <el-icon class="action-icon link-icon" title="关联节点输出" @click="showEndVariableSelector($index)"><Link /></el-icon>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="50" align="center">
                    <template #default="{ $index }">
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :icon="Delete"
                        @click="removeEndInputParam($index)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>

        </div>
      </el-dialog>
    </div>

    <!-- 变量选择器对话框 -->
    <el-dialog
      v-model="showVariableSelectorDialog"
      title="选择变量"
      width="500px"
      class="variable-selector-dialog"
    >
      <div class="variable-list">
        <div v-if="getFilteredUpstreamOutputs().length === 0" class="no-variables">
          暂无可关联的前置节点输出变量
        </div>
        <div
          v-for="(item, index) in getFilteredUpstreamOutputs()"
          :key="index"
          class="variable-item"
          :class="{ 'is-dictionary': isDictionaryType(item.type) }"
        >
          <!-- 普通变量项 -->
          <div
            v-if="!isDictionaryType(item.type)"
            class="variable-item-main"
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

          <!-- Dictionary类型变量项 -->
          <template v-else>
            <div class="variable-item-main dictionary-header">
              <div class="variable-info">
                <span class="variable-node">{{ item.nodeName }}</span>
                <span class="variable-arrow">→</span>
                <span class="variable-param">{{ item.param }}</span>
              </div>
              <div class="variable-meta">
                <span class="variable-type">{{ item.type }}</span>
                <span class="variable-expr">{{ item.variable }}</span>
                <span
                  class="variable-expand-btn"
                  @click.stop="toggleVariableExpand(index, item)"
                >
                  <el-icon v-if="loadingColumnsIndex.has(index)" class="is-loading">
                    <Loading />
                  </el-icon>
                  <el-icon v-else-if="expandedVariableIndex.has(index)">
                    <ArrowDown />
                  </el-icon>
                  <el-icon v-else>
                    <ArrowRight />
                  </el-icon>
                </span>
              </div>
            </div>

            <!-- Dictionary columns列表 -->
            <div
              v-if="expandedVariableIndex.has(index)"
              class="dictionary-columns"
            >
              <div
                v-for="column in dictionaryColumnsCache[parseDictionaryName(item.type)] || []"
                :key="column.key"
                class="dictionary-column-item"
                :class="{ 'is-multi-select': isMultiSelectMode, 'is-selected': isMultiSelectMode && isColumnSelected(item, column) }"
                @click="handleColumnClick(item, column)"
              >
                <el-checkbox
                  v-if="isMultiSelectMode"
                  :model-value="isColumnSelected(item, column)"
                  @click.stop
                  @change="toggleColumnSelection(item, column)"
                />
                <span v-else class="column-select-indicator"></span>
                <div class="column-info">
                  <span class="column-key">{{ column.key }}</span>
                  <span class="column-label">- {{ column.label }}</span>
                </div>
                <span class="column-type">{{ column.type }}</span>
              </div>
              <div
                v-if="!loadingColumnsIndex.has(index) && (!dictionaryColumnsCache[parseDictionaryName(item.type)] || dictionaryColumnsCache[parseDictionaryName(item.type)].length === 0)"
                class="no-columns"
              >
                暂无字段定义
              </div>
            </div>
          </template>
        </div>
      </div>
      <template v-if="isMultiSelectMode" #footer>
        <div class="dialog-footer">
          <span class="selected-count">已选择 {{ selectedColumns.size }} 项</span>
          <el-button @click="cancelMultiSelect">取消</el-button>
          <el-button type="primary" @click="confirmMultiSelect" :disabled="selectedColumns.size === 0">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 循环节点输出变量选择器对话框 -->
    <el-dialog
      v-model="showLoopOutputSelectorDialog"
      title="关联变量"
      width="500px"
      class="variable-selector-dialog"
    >
      <div class="variable-list">
        <div v-if="loopOutputSelectorList.length === 0" class="no-variables">
          暂无可关联的变量
        </div>
        <div
          v-for="(item, index) in loopOutputSelectorList"
          :key="index"
          class="variable-item"
          :class="{ 'nested-variable': item.isNested }"
          @click="selectLoopOutputVariable(item)"
        >
          <div class="variable-info">
            <span class="variable-source-tag" :class="'source-' + item.source">
              {{ item.source === 'start' ? '初始' : item.source === 'upstream' ? '前置' : '循环体' }}
            </span>
            <span class="variable-node">{{ item.nodeName }}</span>
            <span class="variable-arrow">→</span>
            <span class="variable-param" :class="{ 'nested-param': item.isNested }">{{ item.param }}</span>
          </div>
          <div class="variable-meta">
            <span class="variable-type">{{ item.type }}</span>
            <span class="variable-expr">{{ item.variable }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 分支选择对话框（多路分支节点连线时使用） -->
    <el-dialog
      v-model="showBranchSelectDialog"
      title="选择分支"
      width="400px"
      class="branch-select-dialog"
    >
      <div class="branch-list">
        <div
          v-for="branch in getSelectableBranches"
          :key="branch.id"
          class="branch-item"
          :class="{ 'is-default': branch.type === 'default' }"
          @click="handleBranchSelect(branch)"
        >
          <div class="branch-info">
            <el-icon v-if="branch.type === 'default'" class="branch-icon">
              <Right />
            </el-icon>
            <el-icon v-else class="branch-icon">
              <Switch />
            </el-icon>
            <span class="branch-label">{{ branch.label }}</span>
          </div>
          <el-tag v-if="branch.type === 'default'" type="info" size="small">默认</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelBranchSelect">取消</el-button>
      </template>
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
  flex-direction: row;
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

/* 绘制连线时，输入端口显示可连接样式 */
.canvas-container.drawing-connection .input-port {
  cursor: crosshair;
  transition: all 0.2s;
}

.canvas-container.drawing-connection .input-port:hover {
  background: #22d3ee;
  transform: translateY(-50%) scale(1.2);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
}

.canvas {
  position: relative;
  min-width: 100%;
  min-height: 100%;
  user-select: none;
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

/* 关联线层（循环节点与循环体画布之间的虚线） */
.associations-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 15;
}

.association-path {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-dasharray: 8, 4;
  opacity: 0.6;
  pointer-events: none;
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

/* 连线标签（分支标签或用户自定义标签） */
.connection-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: #6366f1;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

/* 用户自定义标签样式 */
.connection-label.user-label {
  background: #10b981;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
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
  user-select: none;
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
  cursor: not-allowed;
  transition: none;
  z-index: 5;
}

/* 左侧端口移除悬浮特效，不支持鼠标事件 */

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

/* 开始节点右侧的添加/连线按钮 */
.node-start-action-btn {
  right: -6px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 悬浮时放大 */
.flow-node:hover .node-start-action-btn {
  transform: translateY(-50%) scale(1.2);
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

/* 节点配置弹窗样式 */
.node-config-dialog :deep(.el-dialog__header) {
  padding: 0 !important;
  margin: 0;
}

.node-config-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
}

.dialog-content {
  padding: 16px 20px;
}

.dialog-title-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-node-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dialog-node-name.editable {
  cursor: pointer;
}

.dialog-node-name.editable:hover {
  color: #409eff;
}

.dialog-node-name-input {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 2px 8px;
  outline: none;
  background: #fff;
  width: 200px;
}

.dialog-node-desc {
  font-size: 12px;
  color: #6b7280;
}

.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 简单条件分支配置样式 */
.condition-simple-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operand-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operand-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.operand-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.operand-select {
  flex: 1;
}

.type-hint {
  font-size: 12px;
  color: #10b981;
}

.operator-select {
  width: 100%;
}

.right-operand-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.value-type-radio {
  display: flex;
}

.value-input-wrapper {
  width: 100%;
}

.between-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.between-inputs .el-input {
  flex: 1;
}

.between-separator {
  flex-shrink: 0;
  color: #6b7280;
  font-size: 14px;
}

.branch-preview {
  margin-top: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.preview-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.preview-branches {
  display: flex;
  gap: 16px;
}

.preview-branch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  flex: 1;
}

.preview-branch.true-branch {
  background: #ecfdf5;
  color: #059669;
}

.preview-branch.false-branch {
  background: #fef2f2;
  color: #dc2626;
}

.branch-icon {
  font-size: 14px;
  font-weight: bold;
}

.branch-name {
  font-weight: 500;
  font-size: 13px;
}

.branch-desc {
  font-size: 12px;
  opacity: 0.8;
}

/* 多路分支配置样式 */
.multi-cases-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.multi-case-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.multi-case-item.default-case {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.case-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.case-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.case-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  flex-shrink: 0;
}

.case-index.default {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.default-tag {
  margin-left: 32px;
}

.case-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 32px;
}

.case-label-input {
  flex: 1;
}

.case-priority-select {
  width: 80px;
}

.case-expression {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

.default-case-desc {
  font-size: 12px;
  color: #6b7280;
  padding: 8px 0;
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
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  z-index: 10;
  user-select: none;
}

.node-action-btn .el-icon {
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-node:hover .node-action-btn {
  right: -9px;
  width: 18px;
  height: 18px;
  opacity: 1;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.flow-node:hover .node-action-btn .el-icon {
  opacity: 1;
}

.node-action-btn:hover {
  background: #22d3ee;
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
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
  cursor: not-allowed;
  transition: none;
}

/* 左侧端口移除悬浮特效，不支持鼠标事件 */

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

/* AI助手面板样式 - 右侧显示 */
.ai-chat-panel {
  position: absolute;
  top: 60px;
  bottom: 0;
  right: 0;
  width: 52px;
  background: transparent;
  border-left: none;
  z-index: 99;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.ai-chat-panel.expanded {
  width: 400px;
  height: 70vh;
  top: 50%;
  transform: translateY(-50%);
  max-height: none;
  bottom: auto;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ai-chat-panel.dragging {
  transition: none;
}

/* 折叠状态下的折叠指示器 - AI助手风格设计 */
.ai-chat-collapse-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  gap: 8px;
  cursor: pointer;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: 16px 0 0 16px;
  box-shadow:
    -4px 0 24px rgba(99, 102, 241, 0.4),
    0 0 32px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
  overflow: visible;
}

/* AI发光背景 */
.ai-chat-collapse-indicator::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 19px 0 0 19px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  filter: blur(16px);
  opacity: 0.5;
  z-index: -1;
  animation: ai-glow-pulse 2.5s ease-in-out infinite;
}

@keyframes ai-glow-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.65;
    transform: scale(1.08);
  }
}

/* AI火花装饰 */
.ai-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: sparkle-twinkle 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px #fff, 0 0 16px rgba(255, 255, 255, 0.5);
}

.ai-sparkle-1 {
  top: 12px;
  right: 8px;
  animation-delay: 0s;
}

.ai-sparkle-2 {
  top: 45%;
  right: 4px;
  animation-delay: 0.5s;
}

.ai-sparkle-3 {
  bottom: 20px;
  right: 10px;
  animation-delay: 1s;
}

@keyframes sparkle-twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.6);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.ai-chat-collapse-indicator:hover {
  width: 64px;
  left: -4px;
  box-shadow:
    -6px 0 32px rgba(99, 102, 241, 0.5),
    0 0 48px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
}

.ai-chat-collapse-indicator:hover::before {
  opacity: 0.7;
}

.ai-chat-collapse-indicator:active {
  transform: translateY(-50%) scale(0.97);
}

/* AI图标容器 */
.ai-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.ai-icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  animation: icon-glow 2s ease-in-out infinite;
}

@keyframes icon-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.15);
  }
}

.ai-chat-collapse-indicator:hover .ai-icon-container {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.ai-chat-collapse-indicator .ai-icon {
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.ai-chat-collapse-indicator:hover .ai-icon {
  transform: rotate(-10deg) scale(1.1);
}

/* AI文字区域 */
.ai-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ai-label {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.ai-title {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ai-chat-collapse-indicator:hover .ai-label {
  letter-spacing: 3px;
}

/* 展开提示 */
.ai-expand-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.hint-dot {
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  animation: hint-pulse 1s ease-in-out infinite;
}

@keyframes hint-pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.hint-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.ai-chat-collapse-indicator:hover .ai-expand-hint {
  background: rgba(255, 255, 255, 0.25);
  opacity: 1;
}

/* 展开时隐藏折叠指示器 */
.ai-chat-panel.expanded .ai-chat-collapse-indicator {
  display: none;
}

/* 拖拽调整手柄 - 左侧边缘垂直拖拽 */
.ai-chat-resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-chat-panel.expanded .ai-chat-resize-handle {
  opacity: 1;
}

.ai-chat-resize-handle:hover,
.ai-chat-resize-handle.active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
}

.ai-chat-resize-handle:hover .resize-indicator,
.ai-chat-resize-handle.active .resize-indicator {
  background: #6366f1;
  height: 50px;
}

.resize-indicator {
  width: 3px;
  height: 30px;
  background: #d1d5db;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.ai-chat-resize-handle.active .resize-indicator {
  background: #6366f1;
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  cursor: pointer;
  user-select: none;
  border-bottom: none;
  min-height: 56px;
  flex-shrink: 0;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.ai-chat-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.ai-chat-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.ai-chat-header:hover {
  background: linear-gradient(135deg, #5558e3 0%, #7c3aed 100%);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.ai-chat-header:active {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

/* 折叠状态下隐藏header */
.ai-chat-panel:not(.expanded) .ai-chat-header {
  display: none;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.ai-chat-title .title-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  backdrop-filter: blur(4px);
  transition: all 0.25s ease;
}

.ai-chat-title .title-icon .icon-glow {
  position: absolute;
  inset: -3px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: 12px;
  animation: icon-glow-pulse 2s ease-in-out infinite;
}

@keyframes icon-glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.ai-chat-header:hover .title-icon {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.ai-chat-title .title-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ai-chat-title .title-label {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ai-chat-title .title-text {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5px;
}

.ai-chat-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* 收起按钮 */
.ai-chat-header .collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.ai-chat-header .collapse-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: scale(1.08) translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ai-chat-header .collapse-btn:active {
  transform: scale(0.95) translateX(2px);
}

/* 处理中状态徽章 - 新设计 */
.processing-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  margin-left: 8px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fef08a;
  box-shadow: 0 0 6px #fef08a;
  animation: dot-blink 1s ease-in-out infinite;
}

.badge-text {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes dot-blink {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
}

/* 头部处理中指示器 */
.header-processing-indicator {
  display: flex;
  align-items: center;
}

.spinner-mini {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-chat-header .expand-icon {
  color: #6366f1;
  transition: transform 0.3s ease;
}

/* 折叠状态下图标居中显示 */
.ai-chat-panel:not(.expanded) .ai-chat-header {
  justify-content: center;
  padding: 10px 0;
}

.ai-chat-panel:not(.expanded) .ai-chat-header .expand-icon {
  margin-top: 8px;
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
  min-height: 80px;
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

/* 流式输出光标 */
.streaming-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #6366f1;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 流式输出时的消息气泡 */
.ai-message-bubble.streaming {
  border-right: 2px solid #6366f1;
}

/* Markdown 内容样式 */
.ai-message-item.ai .ai-message-bubble :deep(p) {
  margin: 0 0 8px 0;
}

.ai-message-item.ai .ai-message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-message-item.ai .ai-message-bubble :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.ai-message-item.ai .ai-message-bubble :deep(pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.ai-message-item.ai .ai-message-bubble :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.ai-message-item.ai .ai-message-bubble :deep(ul),
.ai-message-item.ai .ai-message-bubble :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-message-item.ai .ai-message-bubble :deep(li) {
  margin: 4px 0;
}

.ai-message-item.ai .ai-message-bubble :deep(h1),
.ai-message-item.ai .ai-message-bubble :deep(h2),
.ai-message-item.ai .ai-message-bubble :deep(h3) {
  margin: 12px 0 8px 0;
  font-weight: 600;
}

.ai-message-item.ai .ai-message-bubble :deep(blockquote) {
  border-left: 3px solid #6366f1;
  margin: 8px 0;
  padding-left: 12px;
  color: #6b7280;
}

/* 处理中进度条 */
.ai-chat-processing-bar {
  position: relative;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-top: 1px solid #fcd34d;
  overflow: hidden;
}

.processing-progress-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
  background-size: 200% 100%;
  animation: progress-flow 1.5s linear infinite;
  width: 100%;
}

@keyframes progress-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.processing-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #fcd34d;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.processing-bar-text {
  font-size: 12px;
  color: #92400e;
  font-weight: 500;
}

/* 输入区域禁用状态 */
.ai-chat-input-area.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.ai-chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  transition: opacity 0.3s ease;
  min-height: 70px;
}

.ai-chat-input-area .el-input {
  flex: 1;
}

.ai-chat-input-area .el-input :deep(.el-input__wrapper) {
  padding: 8px 12px;
  min-height: 40px;
}

.ai-chat-input-area .el-input :deep(.el-input__inner) {
  line-height: 1.5;
}

.ai-chat-input-area .send-icon {
  cursor: pointer;
  color: #6366f1;
  transition: all 0.2s ease;
  padding: 8px;
  margin: -8px;
  font-size: 18px;
}

.ai-chat-input-area .send-icon:hover {
  color: #4f46e5;
  transform: scale(1.1);
}

.ai-chat-input-area .send-icon:active {
  transform: scale(0.95);
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

/* Vue 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
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

/* 级联选择器宽度 */
.io-table .el-cascader {
  width: 100%;
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
  white-space: nowrap;
}

.param-type-placeholder {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

/* 参数值输入样式 */
.param-value-input {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格生成节点：类型+变量值组合布局 */
.param-value-with-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-select-left {
  width: 95px;
  flex-shrink: 0;
}

.param-input-with-type {
  flex: 1;
}

.param-value-with-type .link-icon {
  flex-shrink: 0;
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

/* Textarea 类型输入样式 */
.param-value-input.textarea-input {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.param-textarea-with-btn {
  flex: 1;
}

.param-value-input.textarea-input .link-icon {
  margin-left: 0;
  margin-top: 6px;
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

.variable-selector-dialog .variable-item.nested-variable {
  background: #fafafa;
  border-left: 3px solid #d4d4d8;
}

.variable-selector-dialog .variable-item.nested-variable:hover {
  background: #f5f3ff;
  border-left-color: #6366f1;
}

.variable-selector-dialog .nested-param {
  color: #71717a;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.variable-selector-dialog .variable-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.variable-source-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.variable-source-tag.source-start {
  background: #dcfce7;
  color: #16a34a;
}

.variable-source-tag.source-upstream {
  background: #dbeafe;
  color: #2563eb;
}

.variable-source-tag.source-loopBody {
  background: #fef3c7;
  color: #d97706;
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

/* Dictionary类型变量项样式 */
.variable-selector-dialog .variable-item.is-dictionary {
  cursor: default;
  flex-direction: column;
  align-items: stretch;
}

.variable-selector-dialog .variable-item.is-dictionary:hover {
  border-color: #e5e7eb;
  background: #fff;
}

.variable-item-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-item-main.dictionary-header {
  cursor: pointer;
}

.variable-item-main.dictionary-header:hover {
  opacity: 0.85;
}

/* Dictionary展开/折叠按钮 */
.variable-expand-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  margin-left: auto;
  flex-shrink: 0;
}

.variable-expand-btn:hover {
  color: #6366f1;
}

.variable-expand-btn .is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dictionary columns列表 */
.dictionary-columns {
  margin-top: 10px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.dictionary-column-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dictionary-column-item:hover {
  background: #f5f3ff;
}

.dictionary-column-item.is-multi-select {
  cursor: pointer;
}

.dictionary-column-item.is-multi-select.is-selected {
  background: #f0f9ff;
  border: 1px solid #3b82f6;
}

.dictionary-column-item.is-multi-select .el-checkbox {
  flex-shrink: 0;
}

.column-select-indicator {
  width: 16px;
  height: 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
}

.dictionary-column-item:hover .column-select-indicator {
  border-color: #6366f1;
}

.column-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-key {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.column-label {
  font-size: 12px;
  color: #6b7280;
}

.column-type {
  font-size: 11px;
  color: #6b7280;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 3px;
}

.no-columns {
  text-align: center;
  color: #9ca3af;
  padding: 16px;
  font-size: 13px;
}

/* 多选模式对话框footer */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.selected-count {
  flex: 1;
  font-size: 13px;
  color: #6b7280;
}

/* HTTPS/HTTP接口调用节点样式 */
.output-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 8px;
}

.textarea-link-icon {
  position: absolute;
  right: 8px;
  bottom: 8px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.textarea-link-icon:hover {
  opacity: 1;
}

.param-value-input {
  position: relative;
}

/* 分支选择对话框样式 */
.branch-select-dialog .branch-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch-select-dialog .branch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.branch-select-dialog .branch-item:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.branch-select-dialog .branch-item.is-default {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.branch-select-dialog .branch-item.is-default:hover {
  border-color: #0ea5e9;
  background: #e0f2fe;
}

.branch-select-dialog .branch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}
</style>

<style>
/* 级联选择器下拉面板高度调整，避免滚动条 */
.el-cascader__dropdown.el-popper {
  overflow: visible !important;
}

.el-cascader__dropdown .el-cascader-panel {
  overflow: visible !important;
}

.el-cascader__dropdown .el-cascader-menu {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

.el-cascader__dropdown .el-cascader-menu__wrap {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

.el-cascader__dropdown .el-cascader-menu__list {
  overflow: visible !important;
  max-height: none !important;
}

/* 隐藏滚动条但保持内容可访问 */
.el-cascader__dropdown .el-scrollbar__wrap {
  overflow: visible !important;
  max-height: none !important;
}

.el-cascader__dropdown .el-scrollbar__view {
  overflow: visible !important;
}
</style>
