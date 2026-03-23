/**
 * 循环体画布逻辑 Composable
 * 管理循环体内的节点、连线、端口状态
 */
import { ref, reactive, computed } from 'vue'

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
    if (node) {
      node.x = newX
      node.y = newY
      saveLoopBodyState()
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
  }
}
