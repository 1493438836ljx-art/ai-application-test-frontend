/**
 * 节点管理 Composable
 * 提供节点的 CRUD 操作和位置计算功能
 */
import { ref, computed } from 'vue'
import { generateUuid } from '../utils/uuid'
import { generateCopyName, getExistingNames } from '../utils/nodeCopyName'

// 默认节点尺寸
const DEFAULT_NODE_WIDTH = 220
const DEFAULT_NODE_HEIGHT = 70

// 节点间距配置
const NODE_SPACING = {
  horizontal: 280, // 节点水平间距
  vertical: 100, // 节点垂直间距
  portOffset: 50, // 从端口添加时的偏移量
}

/**
 * 创建新节点对象
 * @param {Object} options - 节点配置选项
 * @param {string} options.type - 节点类型
 * @param {string} options.name - 节点名称
 * @param {number} options.x - X 坐标
 * @param {number} options.y - Y 坐标
 * @param {Object} options.config - 节点配置
 * @param {Array} options.inputParams - 输入参数
 * @param {Array} options.outputParams - 输出参数
 * @returns {Object} 节点对象
 */
export function createNodeObject(options) {
  const {
    type,
    name,
    x = 0,
    y = 0,
    config = {},
    inputParams = [],
    outputParams = [],
  } = options

  const node = {
    id: generateUuid(),
    type,
    name: name || getDefaultNodeName(type),
    x,
    y,
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
    config,
    inputParams,
    outputParams,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // 特殊节点类型的默认配置
  if (type === 'start') {
    node.outputParams = outputParams.length > 0 ? outputParams : []
  } else if (type === 'end') {
    node.config = {
      inputParams: inputParams.length > 0 ? inputParams : [],
      ...config,
    }
  } else if (type === 'loop') {
    node.config = {
      loopOutputParams: [],
      ...config,
    }
  }

  return node
}

/**
 * 获取节点默认名称
 * @param {string} type - 节点类型
 * @returns {string} 默认名称
 */
function getDefaultNodeName(type) {
  const nameMap = {
    start: '开始',
    end: '结束',
    loop: '循环',
    loopBodyCanvas: '循环体',
    textClean: '文本清洗',
    tableExtract: '表格提取',
    apiAuto: 'HTTPS/HTTP接口调用',
    judgeModel: '裁判模型',
    tableGenerate: '表格生成',
  }
  return nameMap[type] || '未命名节点'
}

/**
 * 节点管理 Composable
 * @param {Array} initialNodes - 初始节点列表
 * @returns {Object} 节点管理API
 */
export function useNodes(initialNodes = []) {
  // 节点列表
  const nodes = ref([...initialNodes])

  /**
   * 添加单个节点
   * @param {Object} node - 节点对象
   * @returns {Object} 添加的节点
   */
  const addNode = (node) => {
    nodes.value.push(node)
    return node
  }

  /**
   * 批量添加节点
   * @param {Array} newNodes - 节点数组
   * @returns {Array} 添加的节点列表
   */
  const addNodes = (newNodes) => {
    newNodes.forEach((node) => {
      nodes.value.push(node)
    })
    return newNodes
  }

  /**
   * 更新节点
   * @param {string} nodeId - 节点ID
   * @param {Object} updates - 更新内容
   * @returns {Object|null} 更新后的节点
   */
  const updateNode = (nodeId, updates) => {
    const index = nodes.value.findIndex((n) => n.id === nodeId)
    if (index !== -1) {
      nodes.value[index] = {
        ...nodes.value[index],
        ...updates,
        updatedAt: Date.now(),
      }
      return nodes.value[index]
    }
    return null
  }

  /**
   * 删除节点
   * @param {string} nodeId - 节点ID
   * @returns {boolean} 是否删除成功
   */
  const deleteNode = (nodeId) => {
    const index = nodes.value.findIndex((n) => n.id === nodeId)
    if (index !== -1) {
      nodes.value.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 复制节点（自动命名）
   * @param {string} nodeId - 要复制的节点ID
   * @param {Object} options - 复制选项
   * @param {number} options.offsetX - X偏移量
   * @param {number} options.offsetY - Y偏移量
   * @returns {Object|null} 新节点
   */
  const copyNode = (nodeId, options = { offsetX: 20, offsetY: 20 }) => {
    const originalNode = nodes.value.find((n) => n.id === nodeId)
    if (!originalNode) return null

    // 生成新名称
    const existingNames = getExistingNames(nodes.value)
    const newName = generateCopyName(originalNode.name, existingNames)

    // 创建新节点
    const newNode = {
      ...originalNode,
      id: generateUuid(),
      name: newName,
      x: originalNode.x + (options.offsetX || 20),
      y: originalNode.y + (options.offsetY || 20),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // 深拷贝 config 和参数数组
    if (originalNode.config) {
      newNode.config = JSON.parse(JSON.stringify(originalNode.config))
    }
    if (originalNode.inputParams) {
      newNode.inputParams = JSON.parse(JSON.stringify(originalNode.inputParams))
    }
    if (originalNode.outputParams) {
      newNode.outputParams = JSON.parse(JSON.stringify(originalNode.outputParams))
    }

    nodes.value.push(newNode)
    return newNode
  }

  /**
   * 移动节点
   * @param {string} nodeId - 节点ID
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   * @returns {Object|null} 更新后的节点
   */
  const moveNode = (nodeId, x, y) => {
    return updateNode(nodeId, { x, y })
  }

  /**
   * 根据UUID获取节点
   * @param {string} nodeId - 节点ID
   * @returns {Object|undefined} 节点对象
   */
  const getNodeByUuid = (nodeId) => {
    return nodes.value.find((n) => n.id === nodeId)
  }

  /**
   * 根据类型获取节点列表
   * @param {string} type - 节点类型
   * @returns {Array} 节点列表
   */
  const getNodesByType = (type) => {
    return nodes.value.filter((n) => n.type === type)
  }

  /**
   * 根据名称获取节点
   * @param {string} name - 节点名称
   * @returns {Object|undefined} 节点对象
   */
  const getNodeByName = (name) => {
    return nodes.value.find((n) => n.name === name)
  }

  /**
   * 计算从端口添加节点的位置
   * @param {Object} sourceNode - 源节点
   * @param {string} portType - 端口类型 ('input' | 'output')
   * @returns {Object} 位置 {x, y}
   */
  const calculatePortAddPosition = (sourceNode, portType = 'output') => {
    if (!sourceNode) {
      return { x: 100, y: 100 }
    }

    const nodeWidth = sourceNode.width || DEFAULT_NODE_WIDTH
    const nodeHeight = sourceNode.height || DEFAULT_NODE_HEIGHT

    if (portType === 'output') {
      // 从输出端口添加：在节点右侧
      return {
        x: sourceNode.x + nodeWidth + NODE_SPACING.portOffset,
        y: sourceNode.y,
      }
    } else {
      // 从输入端口添加：在节点左侧
      return {
        x: sourceNode.x - nodeWidth - NODE_SPACING.portOffset,
        y: sourceNode.y,
      }
    }
  }

  /**
   * 计算插入节点的位置（在两个节点之间）
   * @param {Object} sourceNode - 源节点
   * @param {Object} targetNode - 目标节点
   * @returns {Object} 位置 {x, y}
   */
  const calculateInsertPosition = (sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) {
      return { x: 100, y: 100 }
    }

    // 计算两个节点的中点
    const sourceCenterX = sourceNode.x + (sourceNode.width || DEFAULT_NODE_WIDTH) / 2
    const targetCenterX = targetNode.x + (targetNode.width || DEFAULT_NODE_WIDTH) / 2

    return {
      x: (sourceCenterX + targetCenterX) / 2 - DEFAULT_NODE_WIDTH / 2,
      y: Math.max(sourceNode.y, targetNode.y) + NODE_SPACING.vertical,
    }
  }

  /**
   * 计算添加新节点的默认位置
   * @param {number} canvasWidth - 画布宽度
   * @param {number} canvasHeight - 画布高度
   * @returns {Object} 位置 {x, y}
   */
  const calculateDefaultPosition = (canvasWidth = 3000, canvasHeight = 2000) => {
    if (nodes.value.length === 0) {
      // 第一个节点放在画布中心偏左上
      return {
        x: canvasWidth / 2 - DEFAULT_NODE_WIDTH / 2 - 200,
        y: canvasHeight / 2 - 100,
      }
    }

    // 找到最右侧的节点，在其右边添加
    const rightMostNode = nodes.value.reduce((rightmost, node) => {
      if (!rightmost) return node
      const rightmostRight = rightmost.x + (rightmost.width || DEFAULT_NODE_WIDTH)
      const nodeRight = node.x + (node.width || DEFAULT_NODE_WIDTH)
      return nodeRight > rightmostRight ? node : rightmost
    }, null)

    if (rightMostNode) {
      return {
        x: rightMostNode.x + (rightMostNode.width || DEFAULT_NODE_WIDTH) + NODE_SPACING.horizontal,
        y: rightMostNode.y,
      }
    }

    return {
      x: 100,
      y: 100,
    }
  }

  /**
   * 获取开始节点
   * @returns {Object|undefined} 开始节点
   */
  const getStartNode = computed(() => {
    return nodes.value.find((n) => n.type === 'start')
  })

  /**
   * 获取结束节点
   * @returns {Object|undefined} 结束节点
   */
  const getEndNode = computed(() => {
    return nodes.value.find((n) => n.type === 'end')
  })

  /**
   * 清空所有节点
   */
  const clearNodes = () => {
    nodes.value = []
  }

  /**
   * 设置节点列表
   * @param {Array} newNodes - 新的节点列表
   */
  const setNodes = (newNodes) => {
    nodes.value = [...newNodes]
  }

  /**
   * 获取节点数量
   * @returns {number} 节点数量
   */
  const getNodeCount = () => {
    return nodes.value.length
  }

  /**
   * 检查节点是否存在
   * @param {string} nodeId - 节点ID
   * @returns {boolean} 是否存在
   */
  const hasNode = (nodeId) => {
    return nodes.value.some((n) => n.id === nodeId)
  }

  /**
   * 批量删除节点
   * @param {Array} nodeIds - 节点ID数组
   * @returns {number} 删除的节点数量
   */
  const deleteNodes = (nodeIds) => {
    const idsSet = new Set(nodeIds)
    const originalLength = nodes.value.length
    nodes.value = nodes.value.filter((n) => !idsSet.has(n.id))
    return originalLength - nodes.value.length
  }

  /**
   * 获取所有节点ID
   * @returns {Array} 节点ID列表
   */
  const getNodeIds = () => {
    return nodes.value.map((n) => n.id)
  }

  /**
   * 获取所有节点名称
   * @returns {Array} 节点名称列表
   */
  const getNodeNames = () => {
    return nodes.value.map((n) => n.name)
  }

  /**
   * 更新节点配置
   * @param {string} nodeId - 节点ID
   * @param {Object} configUpdates - 配置更新
   * @returns {Object|null} 更新后的节点
   */
  const updateNodeConfig = (nodeId, configUpdates) => {
    const node = getNodeByUuid(nodeId)
    if (node) {
      return updateNode(nodeId, {
        config: {
          ...node.config,
          ...configUpdates,
        },
      })
    }
    return null
  }

  return {
    // 状态
    nodes,

    // CRUD 操作
    addNode,
    addNodes,
    updateNode,
    deleteNode,
    deleteNodes,
    copyNode,
    moveNode,
    clearNodes,
    setNodes,

    // 查询方法
    getNodeByUuid,
    getNodesByType,
    getNodeByName,
    hasNode,
    getNodeCount,
    getNodeIds,
    getNodeNames,

    // 位置计算
    calculatePortAddPosition,
    calculateInsertPosition,
    calculateDefaultPosition,

    // 配置更新
    updateNodeConfig,

    // 计算属性
    getStartNode,
    getEndNode,
  }
}
