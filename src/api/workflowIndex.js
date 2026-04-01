/**
 * 工作流相关 API 统一导出
 * 提供便捷的导入方式
 */

// 工作流管理
export {
  getWorkflowList,
  getWorkflowDetail,
  getDefaultWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  copyWorkflow,
  publishWorkflow,
  unpublishWorkflow,
  saveWorkflowData,
  getWorkflowListByStatus,
  searchWorkflows,
  getNodeTypeList,
} from './workflow.js'

// 节点管理
export {
  getNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  batchCreateNodes,
  batchUpdateNodes,
  batchDeleteNodes,
  getNodesBySkillId,
} from './workflowNode.js'

// 连线管理
export {
  getConnections,
  getConnection,
  createConnection,
  deleteConnection,
  batchCreateConnections,
  batchDeleteConnections,
  getConnectionsBySourceNode,
  getConnectionsByTargetNode,
} from './workflowConnection.js'

// 验证相关
export {
  validateWorkflow,
  getPredecessors,
  getAvailableVariables,
  checkReference,
  getExecutionOrder,
} from './workflowValidation.js'

// 关联管理（辅助函数）
export {
  createAssociationData,
  extractAssociationsFromNodes,
  getChildNodes,
  isContainerNode,
  AssociationType,
} from './workflowAssociation.js'
