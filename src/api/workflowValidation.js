/**
 * 工作流验证 API
 * 对接后端 WorkflowValidationController
 */
import { get, post } from '@/utils/request'

/**
 * 获取基础URL
 * @param {number|string} workflowId - 工作流ID
 * @returns {string} 基础URL
 */
const getBaseUrl = (workflowId) => `/api/workflows/${workflowId}`

// ==================== 验证相关 ====================

/**
 * 验证工作流
 * @param {number|string} workflowId - 工作流ID
 * @returns {Promise<ValidationResult>} 验证结果
 */
export async function validateWorkflow(workflowId) {
  return post(`${getBaseUrl(workflowId)}/validate`)
}

/**
 * 获取节点的前置节点列表
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @returns {Promise<NodeResponse[]>} 前置节点列表
 */
export async function getPredecessors(workflowId, nodeUuid) {
  return get(`${getBaseUrl(workflowId)}/predecessors/${nodeUuid}`)
}

/**
 * 获取节点可引用的变量列表
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @returns {Promise<AvailableVariable[]>} 可用变量列表
 */
export async function getAvailableVariables(workflowId, nodeUuid) {
  return get(`${getBaseUrl(workflowId)}/available-variables/${nodeUuid}`)
}

/**
 * 检查参数引用是否有效
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @param {string} reference - 参数引用表达式（如：${节点名称.参数名}）
 * @returns {Promise<ReferenceCheckResult>} 引用检查结果
 */
export async function checkReference(workflowId, nodeUuid, reference) {
  return get(`${getBaseUrl(workflowId)}/check-reference/${nodeUuid}`, { reference })
}

/**
 * 获取工作流的拓扑排序（执行顺序）
 * @param {number|string} workflowId - 工作流ID
 * @returns {Promise<NodeResponse[]>} 节点执行顺序列表
 */
export async function getExecutionOrder(workflowId) {
  return get(`${getBaseUrl(workflowId)}/execution-order`)
}

// ==================== 数据结构定义（供参考）====================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否验证通过
 * @property {ValidationError[]} [errors] - 错误列表
 * @property {ValidationWarning[]} [warnings] - 警告列表
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} code - 错误码
 * @property {string} message - 错误信息
 * @property {string} [nodeUuid] - 相关节点UUID
 * @property {string} [field] - 相关字段
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} code - 警告码
 * @property {string} message - 警告信息
 * @property {string} [nodeUuid] - 相关节点UUID
 */

/**
 * @typedef {Object} AvailableVariable
 * @property {string} nodeName - 节点名称
 * @property {string} nodeUuid - 节点UUID
 * @property {string} paramName - 参数名称
 * @property {string} paramType - 参数类型
 * @property {string} [paramDescription] - 参数描述
 * @property {string} reference - 引用表达式（${节点名.参数名}）
 */

/**
 * @typedef {Object} ReferenceCheckResult
 * @property {boolean} valid - 是否有效
 * @property {string} [message] - 错误信息
 * @property {string} [sourceNodeUuid] - 源节点UUID
 * @property {string} [sourceNodeName] - 源节点名称
 * @property {string} [paramName] - 参数名称
 * @property {string} [paramType] - 参数类型
 */

/**
 * @typedef {Object} NodeResponse
 * @property {number} id - 节点ID
 * @property {string} nodeUuid - 节点UUID
 * @property {string} nodeName - 节点名称
 * @property {string} nodeType - 节点类型
 */
