/**
 * 节点配置面板管理 Composable
 * 管理配置面板的显示、隐藏和数据传递
 */
import { ref } from 'vue'

/**
 * 节点配置面板管理
 * @returns {Object} 配置面板管理API
 */
export function useNodeConfig() {
  // 配置面板可见性
  const configPanelVisible = ref(false)

  // 当前正在配置的节点
  const currentNode = ref(null)

  // 可用变量列表（来自前置节点）
  const availableVariables = ref([])

  /**
   * 打开配置面板
   * @param {Object} node - 要配置的节点
   * @param {Array} nodes - 所有节点列表
   * @param {Array} connections - 所有连线列表
   */
  const openConfigPanel = (node, nodes, connections) => {
    currentNode.value = node
    configPanelVisible.value = true

    // 计算前置节点并生成可用变量列表
    availableVariables.value = computeAvailableVariables(node, nodes, connections)
  }

  /**
   * 关闭配置面板
   */
  const closeConfigPanel = () => {
    configPanelVisible.value = false
    currentNode.value = null
    availableVariables.value = []
  }

  /**
   * 更新节点配置
   * @param {Object} payload - 包含 nodeUuid 和 updates
   */
  const updateNodeConfig = (payload, nodes) => {
    const { nodeUuid, updates } = payload
    const node = nodes.find((n) => (n.nodeUuid || n.id) === nodeUuid)
    if (node) {
      Object.assign(node, updates, { updatedAt: Date.now() })
      return true
    }
    return false
  }

  return {
    configPanelVisible,
    currentNode,
    availableVariables,
    openConfigPanel,
    closeConfigPanel,
    updateNodeConfig,
  }
}

/**
 * 计算节点的可用变量列表
 * @param {Object} targetNode - 目标节点
 * @param {Array} nodes - 所有节点列表
 * @param {Array} connections - 所有连线列表
 * @returns {Array} 可用变量列表
 */
function computeAvailableVariables(targetNode, nodes, connections) {
  const predecessors = computePredecessorNodes(targetNode.id, nodes, connections)
  const variables = []

  // 节点类型到图标/颜色的映射
  const typeConfig = {
    start: { icon: 'VideoPlay', color: '#22c55e' },
    end: { icon: 'CircleCheck', color: '#ef4444' },
    loop: { icon: 'Timer', color: '#8b5cf6' },
    condition_simple: { icon: 'Share', color: '#f59e0b' },
    condition_multi: { icon: 'Grid', color: '#f97316' },
    batch: { icon: 'DataLine', color: '#3b82f6' },
    async: { icon: 'Connection', color: '#0ea5e9' },
    collect: { icon: 'FolderAdd', color: '#14b8a6' },
    skill: { icon: 'Cpu', color: '#6366f1' },
  }

  // 遍历前置节点，收集输出参数
  predecessors.forEach((predId) => {
    const predNode = nodes.find((n) => n.id === predId)
    if (!predNode) return

    const config = typeConfig[predNode.type] || { icon: 'Document', color: '#6366f1' }
    const outputParams = predNode.outputParams || []

    outputParams.forEach((param) => {
      variables.push({
        nodeId: predNode.id,
        node: predNode.name,
        nodeType: predNode.type,
        nodeIcon: config.icon,
        nodeColor: config.color,
        param: param.name,
        type: formatParamType(param),
        description: param.description,
        compatible: true, // 默认兼容，实际应根据类型检查
      })
    })

    // 如果是循环节点，添加特殊变量
    if (predNode.type === 'loop') {
      variables.push({
        nodeId: predNode.id,
        node: predNode.name,
        nodeType: 'loop',
        nodeIcon: 'Timer',
        nodeColor: '#8b5cf6',
        param: 'current_item',
        type: 'Object',
        description: '当前循环元素',
        compatible: true,
      })
      variables.push({
        nodeId: predNode.id,
        node: predNode.name,
        nodeType: 'loop',
        nodeIcon: 'Timer',
        nodeColor: '#8b5cf6',
        param: 'current_index',
        type: 'Integer',
        description: '当前循环索引',
        compatible: true,
      })
    }
  })

  return variables
}

/**
 * 计算节点的前置节点列表（反向遍历）
 * @param {string} nodeId - 目标节点 ID
 * @param {Array} nodes - 所有节点列表
 * @param {Array} connections - 所有连线列表
 * @returns {Array} 前置节点 ID 列表
 */
function computePredecessorNodes(nodeId, nodes, connections) {
  const predecessors = new Set()
  const visited = new Set()

  // 构建反向邻接表
  const reverseAdj = new Map()
  connections.forEach((conn) => {
    if (!reverseAdj.has(conn.targetId)) {
      reverseAdj.set(conn.targetId, [])
    }
    reverseAdj.get(conn.targetId).push(conn.sourceId)
  })

  // DFS 遍历
  function dfs(currentId) {
    if (visited.has(currentId)) return
    visited.add(currentId)

    const sources = reverseAdj.get(currentId) || []
    sources.forEach((sourceId) => {
      predecessors.add(sourceId)
      dfs(sourceId)
    })
  }

  dfs(nodeId)

  // 移除自己
  predecessors.delete(nodeId)

  return Array.from(predecessors)
}

/**
 * 格式化参数类型显示
 * @param {Object} param - 参数对象
 * @returns {string} 格式化后的类型字符串
 */
function formatParamType(param) {
  if (!param.type) return 'Unknown'
  if (param.type === 'Array' && param.elementType) {
    return `Array<${param.elementType}>`
  }
  if (param.type === 'File' && param.fileType) {
    return `File<${param.fileType}>`
  }
  return param.type
}
