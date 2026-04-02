/**
 * 关联线逻辑 Composable
 * 管理循环节点与循环体画布之间的虚线关联
 */
import { computed } from 'vue'

export function useAssociations(associations, nodes, getLoopBodyNodes, getNodeHeight) {
  // 计算关联线路径（虚线）
  const getAssociationPath = (association) => {
    const sourceNode = nodes.value.find((n) => n.id === association.sourceId)
    const targetNode = getLoopBodyNodes?.value?.find((n) => n.id === association.targetId)

    if (!sourceNode || !targetNode) return ''

    // 起点：循环节点底部正中间（使用数据坐标，避免缩放问题）
    const nodeWidth = 220
    // 使用传入的 getNodeHeight 函数计算节点实际高度
    const nodeHeight = getNodeHeight ? getNodeHeight(sourceNode) : 70
    let x1, y1, x2, y2

    x1 = sourceNode.x + nodeWidth / 2
    y1 = sourceNode.y + nodeHeight

    // 终点：循环体顶部正中间
    const canvasWidth = targetNode.width || 500
    x2 = targetNode.x + canvasWidth / 2
    y2 = targetNode.y

    // 虚线路径 - 使用折线
    const midY = y1 + (y2 - y1) / 2

    return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`
  }

  // 创建关联线
  const createAssociation = (sourceId, targetId) => {
    const newAssoc = {
      id: `assoc-${Date.now()}`,
      sourceId,
      targetId,
      type: 'loop',
    }
    associations.value.push(newAssoc)
    return newAssoc
  }

  // 删除关联线（同时删除循环体画布）
  const deleteAssociation = (associationId) => {
    const assoc = associations.value.find((a) => a.id === associationId)
    if (assoc) {
      associations.value = associations.value.filter((a) => a.id !== associationId)
      return assoc.targetId // 返回循环体画布ID，用于删除
    }
    return null
  }

  // 根据循环节点ID获取关联的循环体画布ID
  const getLoopBodyIdByLoopId = (loopId) => {
    const assoc = associations.value.find((a) => a.sourceId === loopId)
    return assoc?.targetId || null
  }

  // 根据循环体画布ID获取关联的循环节点ID
  const getLoopIdByBodyId = (bodyId) => {
    const assoc = associations.value.find((a) => a.targetId === bodyId)
    return assoc?.sourceId || null
  }

  return {
    getAssociationPath,
    createAssociation,
    deleteAssociation,
    getLoopBodyIdByLoopId,
    getLoopIdByBodyId,
  }
}
