/**
 * 工作流关联管理 API
 * 关联用于表示容器节点与子节点之间的关系（如循环节点与其内部节点）
 *
 * 注意：当前后端没有独立的 AssociationController，
 * 关联数据通过 WorkflowController 的 saveWorkflowData 接口一起保存。
 * 此文件提供一些辅助函数用于前端操作关联数据。
 */

// ==================== 辅助函数（用于前端操作关联数据）====================

/**
 * 创建关联数据对象
 * @param {string} containerNodeUuid - 容器节点UUID
 * @param {string} bodyNodeUuid - 子节点UUID
 * @param {string} associationType - 关联类型（LOOP_BODY/BATCH_BODY/ASYNC_BODY）
 * @returns {AssociationDTO} 关联数据对象
 */
export function createAssociationData(containerNodeUuid, bodyNodeUuid, associationType) {
  return {
    containerNodeUuid,
    bodyNodeUuid,
    associationType,
  }
}

/**
 * 从节点列表中提取关联数据
 * 用于处理循环节点、批处理节点等容器节点与子节点的关系
 *
 * @param {Array} nodes - 节点列表
 * @returns {AssociationDTO[]} 关联数据列表
 */
export function extractAssociationsFromNodes(nodes) {
  const associations = []

  nodes.forEach((node) => {
    // 检查节点是否是容器节点（循环节点、批处理节点、异步节点）
    if (node.parentNodeUuid) {
      // 子节点的 parentNodeUuid 指向容器节点
      let associationType = 'LOOP_BODY' // 默认

      // 根据容器节点类型确定关联类型
      const containerNode = nodes.find((n) => n.nodeUuid === node.parentNodeUuid)
      if (containerNode) {
        if (containerNode.type === 'batch' || containerNode.type === 'batch-node') {
          associationType = 'BATCH_BODY'
        } else if (containerNode.type === 'async' || containerNode.type === 'async-node') {
          associationType = 'ASYNC_BODY'
        }
      }

      associations.push({
        containerNodeUuid: node.parentNodeUuid,
        bodyNodeUuid: node.nodeUuid,
        associationType,
      })
    }
  })

  return associations
}

/**
 * 过滤出指定容器节点的子节点
 * @param {Array} nodes - 节点列表
 * @param {Array} associations - 关联列表
 * @param {string} containerNodeUuid - 容器节点UUID
 * @returns {Array} 子节点列表
 */
export function getChildNodes(nodes, associations, containerNodeUuid) {
  const childUuids = associations
    .filter((a) => a.containerNodeUuid === containerNodeUuid)
    .map((a) => a.bodyNodeUuid)

  return nodes.filter((n) => childUuids.includes(n.nodeUuid))
}

/**
 * 检查节点是否是容器节点
 * @param {Object} node - 节点对象
 * @returns {boolean} 是否是容器节点
 */
export function isContainerNode(node) {
  const containerTypes = ['loop', 'loop-node', 'batch', 'batch-node', 'async', 'async-node']
  return containerTypes.includes(node.type)
}

// ==================== 数据结构定义（供参考）====================

/**
 * @typedef {Object} AssociationDTO
 * @property {number} [id] - 关联ID（查询时返回）
 * @property {string} containerNodeUuid - 容器节点UUID
 * @property {string} bodyNodeUuid - 子节点UUID
 * @property {string} associationType - 关联类型（LOOP_BODY/BATCH_BODY/ASYNC_BODY）
 */

/**
 * 关联类型枚举
 * @readonly
 * @enum {string}
 */
export const AssociationType = {
  /** 循环节点体 */
  LOOP_BODY: 'LOOP_BODY',
  /** 批处理节点体 */
  BATCH_BODY: 'BATCH_BODY',
  /** 异步节点体 */
  ASYNC_BODY: 'ASYNC_BODY',
}
