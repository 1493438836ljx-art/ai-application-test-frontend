/**
 * 循环体画布逻辑 Composable
 * 管理循环体内的节点、连线、端口状态
 */
import { ref, reactive, computed } from 'vue'

// 循环体画布尺寸常量
export const LOOP_BODY_DIMENSIONS = {
  DEFAULT_WIDTH: 500,
  DEFAULT_HEIGHT: 400,
  MIN_WIDTH: 400,
  MIN_HEIGHT: 300,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 800,
  PADDING: 105,          // 内边距（1.5倍节点高度)（节点与画布边缘的最小距离）
  HEADER_HEIGHT: 30,     // 标题栏高度
  NODE_WIDTH: 220,       // 节点宽度
  NODE_HEIGHT: 70,       // 节点高度（估算值）
}

export function useLoopBody(loopBodyNode, loopNode) {
  // 循环体画布状态
  const loopBodyCanvas = reactive({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  // 循环体节点列表
  const bodyNodes = ref(loopBodyNode?.loopBody?.nodes || [])

  // 循环体连线列表
  const bodyConnections = ref(loopBodyNode?.loopBody?.connections || [])

  // 左侧端口（简化：不显示参数）
  const leftPort = reactive(
    loopBodyNode?.loopBody?.leftPort || {
      id: 'port-left',
      name: '输入',
      type: 'input',
      y: 200,
      params: [],
    },
  )

  // 右侧端口（简化：不显示参数）
  const rightPort = reactive(
    loopBodyNode?.loopBody?.rightPort || {
      id: 'port-right',
      name: '输出',
      type: 'output',
      y: 200,
      params: [],
    },
  )

  // 添加循环体节点
  const addBodyNode = (nodeType, nodeConfig) => {
    const newNode = {
      id: `body-node-${Date.now()}`,
      type: nodeType,
      name: nodeConfig?.name || nodeType,
      x: 160,
      y: 100 + bodyNodes.value.length * 120,
      inputs: [{ id: `in-${Date.now()}`, name: '输入', type: 'Any' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出', type: 'Any' }],
      config: nodeConfig || {},
    }

    console.log('Adding body node:', newNode)
    bodyNodes.value.push(newNode)
    console.log('Body nodes after push:', bodyNodes.value)

    // 添加节点后检查是否需要扩展画布
    const bounds = calculateRequiredBounds()
    const currentWidth = loopBodyNode?.width || LOOP_BODY_DIMENSIONS.DEFAULT_WIDTH
    const currentHeight = loopBodyNode?.height || LOOP_BODY_DIMENSIONS.DEFAULT_HEIGHT

    if (bounds.width > currentWidth || bounds.height > currentHeight) {
      updateCanvasDimensions(
        Math.max(currentWidth, bounds.width),
        Math.max(currentHeight, bounds.height),
      )
    }

    saveLoopBodyState()
    return newNode
  }

  // 删除循环体节点
  const deleteBodyNode = (nodeId) => {
    bodyNodes.value = bodyNodes.value.filter((n) => n.id !== nodeId)
    // 删除与该节点相关的连线
    bodyConnections.value = bodyConnections.value.filter(
      (c) => c.sourceId !== nodeId && c.targetId !== nodeId,
    )
    // 收缩画布（如果需要）
    shrinkCanvasIfNeeded()
    saveLoopBodyState()
  }

  // 创建循环体内部连线（支持边界检查）
  const createBodyConnection = (sourceId, targetId, sourcePort, targetPort) => {
    // 验证：只能在循环体内部创建连线
    const validation = validateLoopBodyConnection(sourceId, targetId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const newConnection = {
      id: `body-conn-${Date.now()}`,
      sourceId,
      sourcePort,
      targetId,
      targetPort,
      sourceParamIndex: 0,
      targetParamIndex: 0,
      isInternal: true,
    }

    bodyConnections.value.push(newConnection)
    saveLoopBodyState()
    return { success: true, connection: newConnection }
  }

  // 删除循环体内部连线
  const deleteBodyConnection = (connectionId) => {
    bodyConnections.value = bodyConnections.value.filter((c) => c.id !== connectionId)
    saveLoopBodyState()
  }

  // 验证循环体内部连线
  const validateLoopBodyConnection = (sourceId, targetId) => {
    const bodyNodeIds = bodyNodes.value.map((n) => n.id)

    // 允许的连接源：左侧端口和循环体内节点
    const validSources = [leftPort.id, ...bodyNodeIds]
    // 允许的连接目标：右侧端口和循环体内节点
    const validTargets = [rightPort.id, ...bodyNodeIds]

    if (!validSources.includes(sourceId)) {
      return { valid: false, error: '无效的连接源' }
    }

    if (!validTargets.includes(targetId)) {
      return { valid: false, error: '无效的连接目标' }
    }

    // 右侧端口不能作为源
    if (sourceId === rightPort.id) {
      return { valid: false, error: '输出端口只能作为连接目标' }
    }

    // 左侧端口不能作为目标
    if (targetId === leftPort.id) {
      return { valid: false, error: '输入端口只能作为连接源' }
    }

    // 不能连接自己
    if (sourceId === targetId) {
      return { valid: false, error: '不能连接自己' }
    }

    return { valid: true }
  }

  // 保存循环体状态到父节点
  const saveLoopBodyState = () => {
    if (loopBodyNode) {
      loopBodyNode.loopBody = {
        canvas: { ...loopBodyCanvas },
        nodes: JSON.parse(JSON.stringify(bodyNodes.value)),
        connections: JSON.parse(JSON.stringify(bodyConnections.value)),
        leftPort: { ...leftPort },
        rightPort: { ...rightPort },
      }
    }
  }

  // 移动循环体节点
  const moveBodyNode = (nodeId, newX, newY) => {
    const node = bodyNodes.value.find((n) => n.id === nodeId)
    if (!node) return

    node.x = newX
    node.y = newY

    // 动态调整画布尺寸（扩展或收缩）
    const bounds = calculateRequiredBounds()
    const currentWidth = loopBodyNode?.width || LOOP_BODY_DIMENSIONS.DEFAULT_WIDTH
    const currentHeight = loopBodyNode?.height || LOOP_BODY_DIMENSIONS.DEFAULT_HEIGHT

    // 如果计算出的边界与当前尺寸不同，则更新画布尺寸
    if (bounds.width !== currentWidth || bounds.height !== currentHeight) {
      updateCanvasDimensions(bounds.width, bounds.height)
    }

    saveLoopBodyState()
  }

  /**
   * 计算所需的画布尺寸（基于所有节点位置）
   */
  const calculateRequiredBounds = () => {
    if (bodyNodes.value.length === 0) {
      return {
        width: LOOP_BODY_DIMENSIONS.DEFAULT_WIDTH,
        height: LOOP_BODY_DIMENSIONS.DEFAULT_HEIGHT,
      }
    }

    let maxRight = 0
    let maxBottom = 0

    bodyNodes.value.forEach((node) => {
      const nodeRight = node.x + LOOP_BODY_DIMENSIONS.NODE_WIDTH
      const nodeBottom = node.y + LOOP_BODY_DIMENSIONS.NODE_HEIGHT
      if (nodeRight > maxRight) maxRight = nodeRight
      if (nodeBottom > maxBottom) maxBottom = nodeBottom
    })

    return {
      width: Math.max(LOOP_BODY_DIMENSIONS.MIN_WIDTH, maxRight + LOOP_BODY_DIMENSIONS.PADDING),
      // 高度需要加上标题栏高度，确保节点不被标题栏遮挡
      height: Math.max(
        LOOP_BODY_DIMENSIONS.MIN_HEIGHT,
        maxBottom + LOOP_BODY_DIMENSIONS.PADDING + LOOP_BODY_DIMENSIONS.HEADER_HEIGHT,
      ),
    }
  }

  /**
   * 更新画布尺寸（带边界限制）
   */
  const updateCanvasDimensions = (newWidth, newHeight) => {
    const clampedWidth = Math.max(
      LOOP_BODY_DIMENSIONS.MIN_WIDTH,
      Math.min(LOOP_BODY_DIMENSIONS.MAX_WIDTH, newWidth),
    )
    const clampedHeight = Math.max(
      LOOP_BODY_DIMENSIONS.MIN_HEIGHT,
      Math.min(LOOP_BODY_DIMENSIONS.MAX_HEIGHT, newHeight),
    )

    if (loopBodyNode) {
      loopBodyNode.width = clampedWidth
      loopBodyNode.height = clampedHeight
    }
  }

  /**
   * 收缩画布（删除节点后重新计算）
   */
  const shrinkCanvasIfNeeded = () => {
    const bounds = calculateRequiredBounds()
    const currentWidth = loopBodyNode?.width || LOOP_BODY_DIMENSIONS.DEFAULT_WIDTH
    const currentHeight = loopBodyNode?.height || LOOP_BODY_DIMENSIONS.DEFAULT_HEIGHT

    if (bounds.width < currentWidth || bounds.height < currentHeight) {
      updateCanvasDimensions(bounds.width, bounds.height)
    }
  }

  return {
    loopBodyCanvas,
    bodyNodes,
    bodyConnections,
    leftPort,
    rightPort,
    addBodyNode,
    deleteBodyNode,
    createBodyConnection,
    deleteBodyConnection,
    validateLoopBodyConnection,
    saveLoopBodyState,
    moveBodyNode,
    // 新增导出
    calculateRequiredBounds,
    updateCanvasDimensions,
    shrinkCanvasIfNeeded,
    LOOP_BODY_DIMENSIONS,
  }
}
