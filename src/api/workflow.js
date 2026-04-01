/**
 * 工作流管理 API
 * 对接后端 WorkflowController
 */
import { get, post, put, del } from '@/utils/request'

const BASE_URL = '/api/workflow'

// ==================== 工作流管理 ====================

/**
 * 获取工作流列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码（从1开始）
 * @param {number} [params.size=10] - 每页条数
 * @param {string} [params.sort='createdAt'] - 排序字段
 * @param {string} [params.direction='DESC'] - 排序方向 ASC/DESC
 * @returns {Promise<Object>} 工作流分页数据
 */
export async function getWorkflowList(params = {}) {
  const { page = 1, size = 10, sort = 'createdAt', direction = 'DESC' } = params
  return get(`${BASE_URL}/list`, { page, size, sort, direction })
}

/**
 * 获取工作流详情
 * @param {number|string} id - 工作流ID
 * @returns {Promise<Object>} 工作流详情数据（包含nodes、connections、associations）
 */
export async function getWorkflowDetail(id) {
  return get(`${BASE_URL}/${id}`)
}

/**
 * 获取默认工作流详情
 * @returns {Promise<Object>} 默认工作流数据
 */
export async function getDefaultWorkflow() {
  return get(`${BASE_URL}/default`)
}

/**
 * 创建工作流
 * @param {Object} data - 工作流数据
 * @param {string} data.name - 工作流名称
 * @param {string} [data.description] - 工作流描述
 * @param {string} [data.createdBy] - 创建人
 * @returns {Promise<Object>} 创建的工作流信息
 */
export async function createWorkflow(data) {
  return post(`${BASE_URL}`, data)
}

/**
 * 更新工作流基本信息
 * @param {number|string} id - 工作流ID
 * @param {Object} data - 更新数据
 * @param {string} [data.name] - 工作流名称
 * @param {string} [data.description] - 工作流描述
 * @param {string} [data.triggerType] - 触发类型
 * @param {string} [data.triggerConfig] - 触发配置
 * @returns {Promise<Object>} 更新后的工作流信息
 */
export async function updateWorkflow(id, data) {
  return put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除工作流
 * @param {number|string} id - 工作流ID
 * @returns {Promise<void>}
 */
export async function deleteWorkflow(id) {
  return del(`${BASE_URL}/${id}`)
}

/**
 * 复制工作流
 * @param {number|string} id - 源工作流ID
 * @returns {Promise<Object>} 复制后的新工作流信息
 */
export async function copyWorkflow(id) {
  return post(`${BASE_URL}/${id}/copy`)
}

/**
 * 发布工作流
 * @param {number|string} id - 工作流ID
 * @returns {Promise<Object>} 发布后的工作流信息
 */
export async function publishWorkflow(id) {
  return post(`${BASE_URL}/${id}/publish`)
}

/**
 * 取消发布工作流
 * @param {number|string} id - 工作流ID
 * @returns {Promise<Object>} 取消发布后的工作流信息
 */
export async function unpublishWorkflow(id) {
  return post(`${BASE_URL}/${id}/unpublish`)
}

/**
 * 保存工作流完整数据（节点、连线、关联）- JSON格式
 * @param {number|string} id - 工作流ID
 * @param {Object} data - 工作流完整数据
 * @param {Array} [data.nodes] - 节点列表
 * @param {Array} [data.connections] - 连线列表
 * @param {Array} [data.associations] - 关联列表
 * @returns {Promise<Object>} 保存后的工作流信息
 */
export async function saveWorkflowData(id, data) {
  return post(`${BASE_URL}/${id}/data/json`, data)
}

// ==================== 工作流查询 ====================

/**
 * 根据状态获取工作流列表
 * @param {string} status - 工作流状态（DRAFT/PUBLISHED/ARCHIVED）
 * @param {Object} params - 分页参数
 * @param {number} [params.page=0] - 页码（从0开始）
 * @param {number} [params.size=10] - 每页条数
 * @returns {Promise<Object>} 工作流分页数据
 */
export async function getWorkflowListByStatus(status, params = {}) {
  const { page = 0, size = 10 } = params
  return get(`${BASE_URL}/status/${status}`, { page, size })
}

/**
 * 搜索工作流
 * @param {string} name - 名称关键字
 * @param {Object} params - 分页参数
 * @param {number} [params.page=0] - 页码（从0开始）
 * @param {number} [params.size=10] - 每页条数
 * @returns {Promise<Object>} 工作流分页数据
 */
export async function searchWorkflows(name, params = {}) {
  const { page = 0, size = 10 } = params
  return get(`${BASE_URL}/search`, { name, page, size })
}

/**
 * 获取节点类型列表
 * @returns {Promise<Object>} 节点类型列表
 */
export async function getNodeTypeList() {
  return get(`${BASE_URL}/node-types`)
}

// ==================== 数据结构定义（供参考）====================

/**
 * @typedef {Object} WorkflowResponse
 * @property {number} id - 工作流ID
 * @property {string} name - 工作流名称
 * @property {string} [description] - 工作流描述
 * @property {boolean} published - 是否已发布
 * @property {boolean} hasRun - 是否已运行
 * @property {number} version - 版本号
 * @property {string} status - 状态（DRAFT/PUBLISHED/ARCHIVED）
 * @property {string} [triggerType] - 触发类型
 * @property {string} [triggerConfig] - 触发配置
 * @property {string} [publishedAt] - 发布时间
 * @property {string} [publishedBy] - 发布人
 * @property {string} [createdBy] - 创建人
 * @property {string} [createdAt] - 创建时间
 * @property {string} [updatedBy] - 更新人
 * @property {string} [updatedAt] - 更新时间
 * @property {NodeDTO[]} [nodes] - 节点列表
 * @property {ConnectionDTO[]} [connections] - 连线列表
 * @property {AssociationDTO[]} [associations] - 关联列表
 */

/**
 * @typedef {Object} NodeDTO
 * @property {number} [id] - 节点ID
 * @property {string} nodeUuid - 节点UUID
 * @property {string} type - 节点类型
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
 * @property {string} [nodeCategory] - 节点分类（BASIC/LOGIC/EXECUTION）
 */

/**
 * @typedef {Object} ConnectionDTO
 * @property {number} [id] - 连线ID
 * @property {string} [connectionUuid] - 连线UUID
 * @property {number} [sourceNodeId] - 源节点ID（查询时返回）
 * @property {string} sourceNodeUuid - 源节点UUID（保存时使用）
 * @property {string} [sourcePortId] - 源端口ID
 * @property {number} [targetNodeId] - 目标节点ID（查询时返回）
 * @property {string} targetNodeUuid - 目标节点UUID（保存时使用）
 * @property {string} [targetPortId] - 目标端口ID
 * @property {number} [sourceParamIndex] - 源参数索引
 * @property {number} [targetParamIndex] - 目标参数索引
 * @property {string} [label] - 标签
 * @property {string} [branchLabel] - 分支标签
 * @property {number} [branchPriority] - 分支优先级
 */

/**
 * @typedef {Object} AssociationDTO
 * @property {number} [id] - 关联ID
 * @property {number} [containerNodeId] - 容器节点ID
 * @property {string} containerNodeUuid - 容器节点UUID
 * @property {number} [bodyNodeId] - 子节点ID
 * @property {string} bodyNodeUuid - 子节点UUID
 * @property {string} associationType - 关联类型（LOOP_BODY/BATCH_BODY/ASYNC_BODY）
 */
