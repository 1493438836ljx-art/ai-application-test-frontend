/**
 * 工作流连线管理 API
 * 对接后端 WorkflowConnectionController
 */
import { get, post, del } from '@/utils/request'

/**
 * 获取基础URL
 * @param {number|string} workflowId - 工作流ID
 * @returns {string} 基础URL
 */
const getBaseUrl = (workflowId) => `/api/workflows/${workflowId}/connections`

// ==================== 单个连线操作 ====================

/**
 * 获取工作流的所有连线
 * @param {number|string} workflowId - 工作流ID
 * @returns {Promise<ConnectionResponse[]>} 连线列表
 */
export async function getConnections(workflowId) {
  return get(getBaseUrl(workflowId))
}

/**
 * 获取单个连线详情
 * @param {number|string} workflowId - 工作流ID
 * @param {string} connectionUuid - 连线UUID
 * @returns {Promise<ConnectionResponse>} 连线详情
 */
export async function getConnection(workflowId, connectionUuid) {
  return get(`${getBaseUrl(workflowId)}/${connectionUuid}`)
}

/**
 * 创建连线
 * @param {number|string} workflowId - 工作流ID
 * @param {ConnectionDTO} data - 连线数据
 * @returns {Promise<ConnectionResponse>} 创建的连线信息
 */
export async function createConnection(workflowId, data) {
  return post(getBaseUrl(workflowId), data)
}

/**
 * 删除连线
 * @param {number|string} workflowId - 工作流ID
 * @param {string} connectionUuid - 连线UUID
 * @returns {Promise<void>}
 */
export async function deleteConnection(workflowId, connectionUuid) {
  return del(`${getBaseUrl(workflowId)}/${connectionUuid}`)
}

// ==================== 批量操作 ====================

/**
 * 批量创建连线
 * @param {number|string} workflowId - 工作流ID
 * @param {ConnectionDTO[]} connections - 连线数据列表
 * @returns {Promise<void>}
 */
export async function batchCreateConnections(workflowId, connections) {
  return post(`${getBaseUrl(workflowId)}/batch`, connections)
}

/**
 * 批量删除连线
 * @param {number|string} workflowId - 工作流ID
 * @param {string[]} connectionUuids - 连线UUID列表
 * @returns {Promise<void>}
 */
export async function batchDeleteConnections(workflowId, connectionUuids) {
  // 后端期望直接发送数组作为请求体
  return del(`${getBaseUrl(workflowId)}/batch`, connectionUuids)
}

// ==================== 按节点查询 ====================

/**
 * 获取节点的出边（以指定节点为源的所有连线）
 * 注意：后端使用的是节点ID（数据库ID），不是UUID
 * @param {number|string} workflowId - 工作流ID
 * @param {number} nodeId - 源节点ID（数据库ID）
 * @returns {Promise<ConnectionResponse[]>} 连线列表
 */
export async function getConnectionsBySourceNode(workflowId, nodeId) {
  return get(`${getBaseUrl(workflowId)}/source/${nodeId}`)
}

/**
 * 获取节点的入边（以指定节点为目标的所有连线）
 * 注意：后端使用的是节点ID（数据库ID），不是UUID
 * @param {number|string} workflowId - 工作流ID
 * @param {number} nodeId - 目标节点ID（数据库ID）
 * @returns {Promise<ConnectionResponse[]>} 连线列表
 */
export async function getConnectionsByTargetNode(workflowId, nodeId) {
  return get(`${getBaseUrl(workflowId)}/target/${nodeId}`)
}

// ==================== 数据结构定义（供参考）====================

/**
 * @typedef {Object} ConnectionResponse
 * @property {number} id - 连线ID
 * @property {string} connectionUuid - 连线UUID
 * @property {string} sourceNodeUuid - 源节点UUID
 * @property {string} targetNodeUuid - 目标节点UUID
 * @property {string} [sourcePort] - 源端口ID
 * @property {string} [targetPort] - 目标端口ID
 * @property {string} [branchLabel] - 分支标签（true/false/case1/case2/default）
 * @property {number} [branchPriority] - 分支优先级
 * @property {string} [createdAt] - 创建时间
 */

/**
 * @typedef {Object} ConnectionDTO
 * @property {string} [connectionUuid] - 连线UUID（可选，不提供则自动生成）
 * @property {string} sourceNodeUuid - 源节点UUID（必填）
 * @property {string} [sourcePortId] - 源端口ID
 * @property {string} targetNodeUuid - 目标节点UUID（必填）
 * @property {string} [targetPortId] - 目标端口ID
 * @property {number} [sourceParamIndex] - 源参数索引
 * @property {number} [targetParamIndex] - 目标参数索引
 * @property {string} [label] - 标签
 * @property {string} [branchLabel] - 分支标签
 * @property {number} [branchPriority] - 分支优先级
 */
