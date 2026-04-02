/**
 * 节点类型管理 Composable
 * 管理节点类型列表和分类
 *
 * 节点类型体系：
 * - BASIC (基础节点): start, end
 * - LOGIC (逻辑控制节点): condition_simple, condition_multi, loop, batch, async, collect
 * - EXECUTION (执行节点): skill (从 Skill 库动态加载)
 */
import { ref, computed } from 'vue'
import { getNodeTypes } from '@/api/nodeType'

// 节点分类配置（核心3个分类）
export const NODE_CATEGORIES = [
  { key: 'BASIC', name: '基础节点', description: '工作流起始和结束节点' },
  { key: 'LOGIC', name: '逻辑控制', description: '条件分支、循环、批处理等' },
  { key: 'EXECUTION', name: '执行节点', description: '从 Skill 库加载的执行节点' },
]

// 节点类型详细定义（设计文档规定的9种核心类型）
export const NODE_TYPE_DEFINITIONS = {
  // ========== 基础节点 ==========
  start: {
    type: 'start',
    name: '开始',
    category: 'BASIC',
    icon: 'VideoPlay',
    color: '#22c55e',
    width: 220,
    height: 70,
    allowInput: false,
    allowOutput: true,
    maxOutputs: 1,
    description: '工作流入口，定义初始参数',
  },
  end: {
    type: 'end',
    name: '结束',
    category: 'BASIC',
    icon: 'CircleCheck',
    color: '#ef4444',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: false,
    description: '工作流出口，定义输出参数',
  },

  // ========== 逻辑控制节点 ==========
  loop: {
    type: 'loop',
    name: '循环',
    category: 'LOGIC',
    icon: 'Timer',
    color: '#8b5cf6',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    hasLoopBody: true,
    description: '顺序遍历执行，支持计数循环和数组遍历',
  },
  condition_simple: {
    type: 'condition_simple',
    name: '条件分支',
    category: 'LOGIC',
    icon: 'Share',
    color: '#f59e0b',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    maxOutputs: 2,
    description: '二分支条件判断，true/false 两个分支',
  },
  condition_multi: {
    type: 'condition_multi',
    name: '多路分支',
    category: 'LOGIC',
    icon: 'Grid',
    color: '#f97316',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    maxOutputs: -1, // -1 表示不限制
    description: '多路条件分支，支持多个 case 和 default',
  },
  batch: {
    type: 'batch',
    name: '批处理',
    category: 'LOGIC',
    icon: 'DataLine',
    color: '#3b82f6',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    description: '批量并行处理，提高执行效率',
  },
  async: {
    type: 'async',
    name: '异步处理',
    category: 'LOGIC',
    icon: 'Connection',
    color: '#0ea5e9',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    description: '异步执行节点，不阻塞主流程',
  },
  collect: {
    type: 'collect',
    name: '结果收集',
    category: 'LOGIC',
    icon: 'FolderAdd',
    color: '#14b8a6',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    description: '收集多个分支的执行结果',
  },

  // ========== 执行节点 ==========
  skill: {
    type: 'skill',
    name: '技能',
    category: 'EXECUTION',
    icon: 'Cpu',
    color: '#6366f1',
    width: 220,
    height: 70,
    allowInput: true,
    allowOutput: true,
    description: '从 Skill 库加载的执行节点',
  },
}

// 默认节点类型配置（核心9种类型，用于后端未返回时的回退）
const DEFAULT_NODE_TYPES = [
  // 基础节点
  NODE_TYPE_DEFINITIONS.start,
  NODE_TYPE_DEFINITIONS.end,
  // 逻辑控制节点
  NODE_TYPE_DEFINITIONS.loop,
  NODE_TYPE_DEFINITIONS.condition_simple,
  NODE_TYPE_DEFINITIONS.condition_multi,
  NODE_TYPE_DEFINITIONS.batch,
  NODE_TYPE_DEFINITIONS.async,
  NODE_TYPE_DEFINITIONS.collect,
  // 执行节点
  NODE_TYPE_DEFINITIONS.skill,
  // 循环体画布（特殊类型，不在选择器中显示）
  { type: 'loopBodyCanvas', name: '循环体', icon: 'Grid', color: '#3b82f6', category: 'BASIC', hidden: true },
]

/**
 * 节点类型管理 Composable
 * @returns {Object} 节点类型管理API
 */
export function useNodeTypes() {
  // 节点类型列表
  const nodeTypes = ref([...DEFAULT_NODE_TYPES])

  // 加载状态
  const loading = ref(false)

  // 错误信息
  const error = ref(null)

  /**
   * 从后端加载节点类型
   */
  const loadNodeTypes = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await getNodeTypes()
      if (response && Array.isArray(response) && response.length > 0) {
        // 合并后端返回的类型和默认类型（后端优先）
        const backendTypes = response.map((type) => ({
          type: type.type || type.code,
          name: type.name || type.typeName,
          icon: type.icon || 'Document',
          color: type.color || '#6366f1',
          category: type.category || 'BASIC',
        }))

        // 保留默认类型中后端没有的类型
        const defaultTypeKeys = new Set(backendTypes.map((t) => t.type))
        const mergedTypes = [
          ...backendTypes,
          ...DEFAULT_NODE_TYPES.filter((t) => !defaultTypeKeys.has(t.type)),
        ]

        nodeTypes.value = mergedTypes
      }
    } catch (err) {
      console.error('加载节点类型失败:', err)
      error.value = err.message || '加载节点类型失败'
      // 加载失败时使用默认配置
      nodeTypes.value = [...DEFAULT_NODE_TYPES]
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取所有节点类型
   * @returns {Array} 节点类型列表
   */
  const getAllNodeTypes = () => nodeTypes.value

  /**
   * 根据类型获取节点配置
   * @param {string} type - 节点类型
   * @returns {Object|undefined} 节点配置
   */
  const getNodeTypeConfig = (type) => {
    return nodeTypes.value.find((t) => t.type === type)
  }

  /**
   * 根据分类获取节点类型列表
   * @param {string} category - 分类key
   * @returns {Array} 该分类下的节点类型列表
   */
  const getNodeTypesByCategory = (category) => {
    return nodeTypes.value.filter((t) => t.category === category)
  }

  /**
   * 获取非基础节点类型（用于节点选择面板）
   * @returns {Array} 非基础节点类型列表
   */
  const getNonBasicNodeTypes = () => {
    return nodeTypes.value.filter((t) => t.category !== 'BASIC' || t.type === 'loopBodyCanvas')
  }

  /**
   * 获取分类信息
   * @param {string} key - 分类key
   * @returns {Object|undefined} 分类配置
   */
  const getCategoryByKey = (key) => {
    return NODE_CATEGORIES.find((c) => c.key === key)
  }

  /**
   * 获取所有分类
   * @returns {Array} 分类列表
   */
  const getAllCategories = () => NODE_CATEGORIES

  /**
   * 检查节点类型是否存在
   * @param {string} type - 节点类型
   * @returns {boolean} 是否存在
   */
  const hasNodeType = (type) => {
    return nodeTypes.value.some((t) => t.type === type)
  }

  /**
   * 获取节点图标
   * @param {string} type - 节点类型
   * @returns {string} 图标名称
   */
  const getNodeIcon = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.icon || 'Document'
  }

  /**
   * 获取节点颜色
   * @param {string} type - 节点类型
   * @returns {string} 颜色值
   */
  const getNodeColor = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.color || '#6366f1'
  }

  /**
   * 获取节点名称
   * @param {string} type - 节点类型
   * @returns {string} 节点名称
   */
  const getNodeName = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.name || '未知节点'
  }

  // 计算属性：按分类分组的节点类型
  const nodeTypesByCategory = computed(() => {
    const grouped = {}
    NODE_CATEGORIES.forEach((category) => {
      grouped[category.key] = nodeTypes.value.filter((t) => t.category === category.key)
    })
    return grouped
  })

  // 计算属性：基础节点类型
  const basicNodeTypes = computed(() => {
    return nodeTypes.value.filter((t) => t.category === 'BASIC')
  })

  // 计算属性：开始节点配置
  const startNodeType = computed(() => {
    return getNodeTypeConfig('start')
  })

  // 计算属性：结束节点配置
  const endNodeType = computed(() => {
    return getNodeTypeConfig('end')
  })

  // ========== 新增方法：节点选择器相关 ==========

  /**
   * 获取可用于添加的节点类型（排除 start/end/loopBodyCanvas）
   * @returns {Array} 可添加的节点类型列表
   */
  const getAddableNodeTypes = () => {
    return nodeTypes.value.filter((t) => !['start', 'end', 'loopBodyCanvas'].includes(t.type) && !t.hidden)
  }

  /**
   * 获取可作为后继节点的类型（排除 start）
   * @returns {Array} 可作为后继的节点类型列表
   */
  const getSuccessorNodeTypes = () => {
    return nodeTypes.value.filter((t) => t.type !== 'start' && !t.hidden)
  }

  /**
   * 获取可插入连线中间的节点类型（排除 start/end）
   * @returns {Array} 可插入的节点类型列表
   */
  const getInsertableNodeTypes = () => {
    return nodeTypes.value.filter((t) => !['start', 'end', 'loopBodyCanvas'].includes(t.type) && !t.hidden)
  }

  /**
   * 检查节点类型是否允许输入连接
   * @param {string} type - 节点类型
   * @returns {boolean} 是否允许输入
   */
  const allowsInput = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.allowInput !== false
  }

  /**
   * 检查节点类型是否允许输出连接
   * @param {string} type - 节点类型
   * @returns {boolean} 是否允许输出
   */
  const allowsOutput = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.allowOutput !== false
  }

  /**
   * 获取节点最大输出数量
   * @param {string} type - 节点类型
   * @returns {number} 最大输出数量，-1 表示不限制
   */
  const getMaxOutputs = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.maxOutputs ?? 1
  }

  /**
   * 检查节点是否有循环体
   * @param {string} type - 节点类型
   * @returns {boolean} 是否有循环体
   */
  const hasLoopBody = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.hasLoopBody === true
  }

  /**
   * 获取节点描述
   * @param {string} type - 节点类型
   * @returns {string} 节点描述
   */
  const getNodeDescription = (type) => {
    const config = getNodeTypeConfig(type)
    return config?.description || ''
  }

  /**
   * 获取节点尺寸
   * @param {string} type - 节点类型
   * @returns {Object} 尺寸 { width, height }
   */
  const getNodeSize = (type) => {
    const config = getNodeTypeConfig(type)
    return {
      width: config?.width || 220,
      height: config?.height || 70,
    }
  }

  /**
   * 获取节点类型定义（从 NODE_TYPE_DEFINITIONS）
   * @param {string} type - 节点类型
   * @returns {Object|undefined} 节点类型定义
   */
  const getNodeTypeDefinition = (type) => {
    return NODE_TYPE_DEFINITIONS[type]
  }

  return {
    // 状态
    nodeTypes,
    loading,
    error,

    // 分类
    NODE_CATEGORIES,
    NODE_TYPE_DEFINITIONS,

    // 方法
    loadNodeTypes,
    getAllNodeTypes,
    getNodeTypeConfig,
    getNodeTypesByCategory,
    getNonBasicNodeTypes,
    getCategoryByKey,
    getAllCategories,
    hasNodeType,
    getNodeIcon,
    getNodeColor,
    getNodeName,
    getNodeDescription,
    getNodeSize,

    // 节点选择器相关
    getAddableNodeTypes,
    getSuccessorNodeTypes,
    getInsertableNodeTypes,

    // 连接验证相关
    allowsInput,
    allowsOutput,
    getMaxOutputs,
    hasLoopBody,

    // 类型定义
    getNodeTypeDefinition,

    // 计算属性
    nodeTypesByCategory,
    basicNodeTypes,
    startNodeType,
    endNodeType,
  }
}
