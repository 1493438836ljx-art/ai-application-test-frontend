/**
 * 连线管理 Composable
 * 管理工作流节点间的连线
 *
 * 功能：
 * - 连线 CRUD 操作
 * - 拖拽创建连线
 * - 连线验证（自环、重复、环检测）
 * - 悬停显示添加按钮
 * - 中点插入节点
 */
import { ref, reactive, computed } from 'vue'
import { generateUuid } from '../utils/uuid'

export function useConnections() {
  // 连线列表
  const connections = ref([])

  // 悬停的连线（用于显示添加按钮）
  const hoveredConnection = ref(null)

  // 悬停延迟计时器
  let hoverTimer = null

  // 临时连线状态（拖拽中）
  const tempConnection = reactive({
    isDrawing: false,
    sourceId: null,
    sourcePort: null,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  })

  /**
   * 创建连线对象
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @param {Object} options - 额外选项
   * @returns {Object} 连线对象
   */
  const createConnectionObject = (sourceId, targetId, options = {}) => {
    return {
      uuid: generateUuid(),
      sourceId,
      targetId,
      sourcePort: options.sourcePort || 'out-1',
      targetPort: options.targetPort || 'in-1',
      branchLabel: options.branchLabel || null,
      ...options,
      createdAt: Date.now(),
    }
  }

  /**
   * 验证连线是否合法
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @returns {Object} { valid: boolean, error?: string }
   */
  const validateConnection = (sourceId, targetId) => {
    // 1. 不能连接自己
    if (sourceId === targetId) {
      return { valid: false, error: '不能连接自己' }
    }

    // 2. 检查连线是否已存在
    const exists = connections.value.some(
      (conn) => conn.sourceId === sourceId && conn.targetId === targetId
    )
    if (exists) {
      return { valid: false, error: '连线已存在' }
    }

    return { valid: true }
  }

  /**
   * 检查是否会形成环（可选，对于 DAG 工作流需要）
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @returns {boolean} 是否会形成环
   */
  const wouldCreateCycle = (sourceId, targetId) => {
    const visited = new Set()
    const stack = [targetId]

    while (stack.length > 0) {
      const current = stack.pop()
      if (current === sourceId) return true
      if (visited.has(current)) continue
      visited.add(current)

      // 找到当前节点的所有下游节点
      const downstreamConnections = connections.value.filter((c) => c.sourceId === current)
      stack.push(...downstreamConnections.map((c) => c.targetId))
    }

    return false
  }

  /**
   * 添加连线（检查重复和自环）
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @param {Object} options - 额外选项
   * @returns {Object|null} 添加的连线对象，如果添加失败返回 null
   */
  const addConnection = (sourceId, targetId, options = {}) => {
    const validation = validateConnection(sourceId, targetId)
    if (!validation.valid) {
      console.warn('Connection validation failed:', validation.error)
      return null
    }

    const connection = createConnectionObject(sourceId, targetId, options)
    connections.value.push(connection)
    return connection
  }

  /**
   * 批量添加连线
   * @param {Array} connectionList - 连线列表
   */
  const addConnections = (connectionList) => {
    if (!Array.isArray(connectionList)) return

    connectionList.forEach((conn) => {
      // 支持两种格式：{ sourceId, targetId } 或 { uuid, sourceId, targetId }
      const sourceId = conn.sourceId || conn.source
      const targetId = conn.targetId || conn.target

      if (sourceId && targetId) {
        // 检查是否已存在
        const exists = connections.value.some(
          (c) => c.sourceId === sourceId && c.targetId === targetId
        )
        if (!exists && sourceId !== targetId) {
          const connection = conn.uuid
            ? { uuid: conn.uuid, sourceId, targetId, sourcePort: conn.sourcePort || 'out-1', targetPort: conn.targetPort || 'in-1' }
            : createConnectionObject(sourceId, targetId, conn)
          connections.value.push(connection)
        }
      }
    })
  }

  /**
   * 删除连线
   * @param {string} connectionUuid - 连线 UUID
   * @returns {boolean} 是否删除成功
   */
  const deleteConnection = (connectionUuid) => {
    const index = connections.value.findIndex((conn) => conn.uuid === connectionUuid)
    if (index !== -1) {
      connections.value.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 删除节点相关的所有连线
   * @param {string} nodeId - 节点 ID
   * @returns {Array} 被删除的连线列表
   */
  const deleteConnectionsByNode = (nodeId) => {
    const removed = connections.value.filter(
      (conn) => conn.sourceId === nodeId || conn.targetId === nodeId
    )
    connections.value = connections.value.filter(
      (conn) => conn.sourceId !== nodeId && conn.targetId !== nodeId
    )
    return removed
  }

  /**
   * 根据 UUID 获取连线
   * @param {string} uuid - 连线 UUID
   * @returns {Object|undefined} 连线对象
   */
  const getConnectionByUuid = (uuid) => {
    return connections.value.find((conn) => conn.uuid === uuid)
  }

  /**
   * 获取节点的所有出边
   * @param {string} nodeId - 节点 ID
   * @returns {Array} 出边列表
   */
  const getConnectionsBySource = (nodeId) => {
    return connections.value.filter((conn) => conn.sourceId === nodeId)
  }

  /**
   * 获取节点的所有入边
   * @param {string} nodeId - 节点 ID
   * @returns {Array} 入边列表
   */
  const getConnectionsByTarget = (nodeId) => {
    return connections.value.filter((conn) => conn.targetId === nodeId)
  }

  /**
   * 获取节点相关的所有连线（入边 + 出边）
   * @param {string} nodeId - 节点 ID
   * @returns {Array} 连线列表
   */
  const getConnectionsByNode = (nodeId) => {
    return connections.value.filter(
      (conn) => conn.sourceId === nodeId || conn.targetId === nodeId
    )
  }

  /**
   * 在连线中间插入节点
   * @param {string} connectionUuid - 原连线 UUID
   * @param {string} newNodeId - 新节点 ID
   * @returns {Object} 包含两条新连线的对象 { sourceToNew, newToTarget }
   */
  const insertNodeBetween = (connectionUuid, newNodeId) => {
    const connection = getConnectionByUuid(connectionUuid)
    if (!connection) {
      console.warn('Connection not found')
      return null
    }

    const { sourceId, targetId, branchLabel } = connection

    // 删除原连线
    deleteConnection(connectionUuid)

    // 创建两条新连线（继承原连线的分支标签）
    const sourceToNew = addConnection(sourceId, newNodeId, { branchLabel })
    const newToTarget = addConnection(newNodeId, targetId)

    return { sourceToNew, newToTarget }
  }

  /**
   * 清空所有连线
   */
  const clearConnections = () => {
    connections.value = []
  }

  /**
   * 设置连线列表（覆盖）
   * @param {Array} connectionList - 连线列表
   */
  const setConnections = (connectionList) => {
    connections.value = Array.isArray(connectionList) ? connectionList : []
  }

  /**
   * 检查两个节点是否已连接
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @returns {boolean} 是否已连接
   */
  const isConnected = (sourceId, targetId) => {
    return connections.value.some(
      (conn) => conn.sourceId === sourceId && conn.targetId === targetId
    )
  }

  // ========== 悬停管理 ==========

  /**
   * 鼠标进入连线
   * @param {Object} connection - 连线对象
   */
  const handleConnectionMouseEnter = (connection) => {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
    hoveredConnection.value = connection
  }

  /**
   * 鼠标离开连线
   */
  const handleConnectionMouseLeave = () => {
    // 延迟清除，避免鼠标移动到添加按钮时闪烁
    hoverTimer = setTimeout(() => {
      hoveredConnection.value = null
    }, 100)
  }

  /**
   * 取消悬停延迟（用于鼠标移入添加按钮时）
   */
  const cancelHoverDelay = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }

  // ========== 临时连线（拖拽） ==========

  /**
   * 开始绘制临时连线
   * @param {string} sourceId - 源节点 ID
   * @param {string} sourcePort - 源端口
   * @param {number} startX - 起点X
   * @param {number} startY - 起点Y
   */
  const startTempConnection = (sourceId, sourcePort, startX, startY) => {
    tempConnection.isDrawing = true
    tempConnection.sourceId = sourceId
    tempConnection.sourcePort = sourcePort
    tempConnection.startX = startX
    tempConnection.startY = startY
    tempConnection.endX = startX
    tempConnection.endY = startY
  }

  /**
   * 更新临时连线终点
   * @param {number} endX - 终点X
   * @param {number} endY - 终点Y
   */
  const updateTempConnection = (endX, endY) => {
    if (!tempConnection.isDrawing) return
    tempConnection.endX = endX
    tempConnection.endY = endY
  }

  /**
   * 结束绘制临时连线
   * @returns {Object|null} 临时连线数据
   */
  const endTempConnection = () => {
    if (!tempConnection.isDrawing) return null
    const result = { ...tempConnection }
    tempConnection.isDrawing = false
    tempConnection.sourceId = null
    tempConnection.sourcePort = null
    return result
  }

  /**
   * 取消临时连线
   */
  const cancelTempConnection = () => {
    tempConnection.isDrawing = false
    tempConnection.sourceId = null
    tempConnection.sourcePort = null
  }

  // ========== 计算属性 ==========

  /**
   * 是否正在绘制连线
   */
  const isDrawing = computed(() => tempConnection.isDrawing)

  return {
    // 状态
    connections,
    hoveredConnection,
    tempConnection,
    isDrawing,

    // CRUD 操作
    createConnectionObject,
    addConnection,
    addConnections,
    deleteConnection,
    deleteConnectionsByNode,
    getConnectionByUuid,
    getConnectionsBySource,
    getConnectionsByTarget,
    getConnectionsByNode,
    insertNodeBetween,
    clearConnections,
    setConnections,
    isConnected,

    // 验证
    validateConnection,
    wouldCreateCycle,

    // 悬停管理
    handleConnectionMouseEnter,
    handleConnectionMouseLeave,
    cancelHoverDelay,

    // 临时连线
    startTempConnection,
    updateTempConnection,
    endTempConnection,
    cancelTempConnection,
  }
}
