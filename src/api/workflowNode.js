/**
 * 工作流节点管理 API
 * 对接后端 WorkflowNodeController
 */
import { get, post, put, del } from '@/utils/request'

/**
 * 获取基础URL
 * @param {number|string} workflowId - 工作流ID
 * @returns {string} 基础URL
 */
const getBaseUrl = (workflowId) => `/api/workflows/${workflowId}/nodes`

// ==================== 单个节点操作 ====================

/**
 * 获取工作流的所有节点
 * @param {number|string} workflowId - 工作流ID
 * @returns {Promise<NodeResponse[]>} 节点列表
 */
export async function getNodes(workflowId) {
  return get(getBaseUrl(workflowId))
}

/**
 * 获取单个节点详情
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @returns {Promise<NodeResponse>} 节点详情
 */
export async function getNode(workflowId, nodeUuid) {
  return get(`${getBaseUrl(workflowId)}/${nodeUuid}`)
}

/**
 * 创建节点
 * @param {number|string} workflowId - 工作流ID
 * @param {NodeCreateRequest} data - 节点创建数据
 * @returns {Promise<NodeResponse>} 创建的节点信息
 */
export async function createNode(workflowId, data) {
  return post(getBaseUrl(workflowId), data)
}

/**
 * 更新节点
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @param {NodeUpdateRequest} data - 节点更新数据
 * @returns {Promise<NodeResponse>} 更新后的节点信息
 */
export async function updateNode(workflowId, nodeUuid, data) {
  return put(`${getBaseUrl(workflowId)}/${nodeUuid}`, data)
}

/**
 * 删除节点
 * @param {number|string} workflowId - 工作流ID
 * @param {string} nodeUuid - 节点UUID
 * @returns {Promise<void>}
 */
export async function deleteNode(workflowId, nodeUuid) {
  return del(`${getBaseUrl(workflowId)}/${nodeUuid}`)
}

// ==================== 批量操作 ====================

/**
 * 批量创建节点
 * @param {number|string} workflowId - 工作流ID
 * @param {NodeCreateRequest[]} nodes - 节点创建数据列表
 * @returns {Promise<void>}
 */
export async function batchCreateNodes(workflowId, nodes) {
  return post(`${getBaseUrl(workflowId)}/batch`, nodes)
}

/**
 * 批量更新节点
 * @param {number|string} workflowId - 工作流ID
 * @param {NodeUpdateRequest[]} nodes - 节点更新数据列表
 * @returns {Promise<void>}
 */
export async function batchUpdateNodes(workflowId, nodes) {
  return put(`${getBaseUrl(workflowId)}/batch`, nodes)
}

/**
 * 批量删除节点
 * @param {number|string} workflowId - 工作流ID
 * @param {string[]} nodeUuids - 节点UUID列表
 * @returns {Promise<void>}
 */
export async function batchDeleteNodes(workflowId, nodeUuids) {
  // 后端期望直接发送数组作为请求体
  return del(`${getBaseUrl(workflowId)}/batch`, nodeUuids)
}

// ==================== 按条件查询 ====================

/**
 * 根据Skill ID查询节点
 * @param {string} skillId - Skill ID
 * @returns {Promise<NodeResponse[]>} 节点列表
 */
export async function getNodesBySkillId(skillId) {
  return get(`/api/workflows/nodes/by-skill/${skillId}`)
}

// ==================== 数据结构定义（供参考）====================

/**
 * @typedef {Object} NodeResponse
 * @property {number} id - 节点ID
 * @property {string} nodeUuid - 节点UUID
 * @property {string} nodeName - 节点名称
 * @property {string} nodeType - 节点类型
 * @property {string} [nodeCategory] - 节点分类（BASIC/LOGIC/EXECUTION）
 * @property {number} [positionX] - X坐标
 * @property {number} [positionY] - Y坐标
 * @property {string} [skillId] - 引用的Skill ID
 * @property {string} [skillSnapshot] - Skill快照（JSON格式）
 * @property {string} [inputPorts] - 输入端口（JSON格式）
 * @property {string} [outputPorts] - 输出端口（JSON格式）
 * @property {string} [inputParams] - 输入参数（JSON格式）
 * @property {string} [outputParams] - 输出参数（JSON格式）
 * @property {string} [executionLocation] - 执行位置（CLIENT/SERVICE）
 * @property {string} [errorStrategy] - 错误策略（STOP/SKIP/RETRY/ERROR_BRANCH）
 * @property {number} [retryCount] - 重试次数
 * @property {number} [retryInterval] - 重试间隔（毫秒）
 * @property {number} [errorBranchId] - 错误分支节点ID
 * @property {string} [conditionType] - 条件类型
 * @property {string} [conditions] - 条件配置（JSON格式）
 * @property {string} [loopType] - 循环类型
 * @property {string} [loopConfig] - 循环配置（JSON格式）
 * @property {string} [batchConfig] - 批处理配置（JSON格式）
 * @property {string} [asyncConfig] - 异步处理配置（JSON格式）
 * @property {string} [collectConfig] - 结果收集配置（JSON格式）
 * @property {string} [compatibilityStatus] - 兼容性状态
 * @property {string} [createdAt] - 创建时间
 * @property {string} [updatedAt] - 更新时间
 */

/**
 * @typedef {Object} NodeCreateRequest
 * @property {string} [nodeUuid] - 节点UUID（可选，不提供则自动生成）
 * @property {string} type - 节点类型
 * @property {string} [typeId] - 节点类型ID
 * @property {string} name - 节点名称
 * @property {number} [positionX] - X坐标
 * @property {number} [positionY] - Y坐标
 * @property {string} [inputPorts] - 输入端口（JSON格式）
 * @property {string} [outputPorts] - 输出端口（JSON格式）
 * @property {string} [inputParams] - 输入参数（JSON格式）
 * @property {string} [outputParams] - 输出参数（JSON格式）
 * @property {string} [config] - 配置（JSON格式）
 * @property {string} [parentNodeUuid] - 父节点UUID
 * @property {string} [skillId] - 引用的Skill ID
 * @property {string} [skillSnapshot] - Skill快照（JSON格式）
 * @property {string} [executionLocation] - 执行位置（CLIENT/SERVICE）
 * @property {string} [errorStrategy] - 错误策略
 * @property {number} [retryCount] - 重试次数
 * @property {number} [retryInterval] - 重试间隔（毫秒）
 * @property {string} [conditionType] - 条件类型
 * @property {string} [conditions] - 条件配置（JSON格式）
 * @property {string} [loopType] - 循环类型
 * @property {string} [loopConfig] - 循环配置（JSON格式）
 * @property {string} [batchConfig] - 批处理配置（JSON格式）
 * @property {string} [asyncConfig] - 异步处理配置（JSON格式）
 * @property {string} [collectConfig] - 结果收集配置（JSON格式）
 * @property {string} [nodeCategory] - 节点分类
 */

/**
 * @typedef {Object} NodeUpdateRequest
 * @property {string} nodeUuid - 节点UUID（必填，用于标识要更新的节点）
 * @property {string} [name] - 节点名称
 * @property {number} [positionX] - X坐标
 * @property {number} [positionY] - Y坐标
 * @property {string} [inputPorts] - 输入端口（JSON格式）
 * @property {string} [outputPorts] - 输出端口（JSON格式）
 * @property {string} [inputParams] - 输入参数（JSON格式）
 * @property {string} [outputParams] - 输出参数（JSON格式）
 * @property {string} [config] - 配置（JSON格式）
 * @property {string} [skillId] - 引用的Skill ID
 * @property {string} [skillSnapshot] - Skill快照（JSON格式）
 * @property {string} [executionLocation] - 执行位置
 * @property {string} [errorStrategy] - 错误策略
 * @property {number} [retryCount] - 重试次数
 * @property {number} [retryInterval] - 重试间隔（毫秒）
 * @property {number} [errorBranchId] - 错误分支节点ID
 * @property {string} [conditionType] - 条件类型
 * @property {string} [conditions] - 条件配置（JSON格式）
 * @property {string} [loopType] - 循环类型
 * @property {string} [loopConfig] - 循环配置（JSON格式）
 * @property {string} [batchConfig] - 批处理配置（JSON格式）
 * @property {string} [asyncConfig] - 异步处理配置（JSON格式）
 * @property {string} [collectConfig] - 结果收集配置（JSON格式）
 */
