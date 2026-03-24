/**
 * 工作流 API 服务
 * 用于获取和管理工作流数据
 */
import { get, post, put, del } from '@/utils/request'

const BASE_URL = 'http://localhost:8080/api/workflow'

/**
 * 获取工作流列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页条数
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.status - 状态筛选
 * @returns {Promise<Object>} 工作流列表数据
 */
export async function getWorkflowList(params = {}) {
  const { page = 1, size = 10, keyword = '', status = '' } = params
  const queryParams = {
    page,
    size,
  }
  if (keyword) {
    queryParams.keyword = keyword
  }
  if (status) {
    queryParams.status = status
  }
  return get(`${BASE_URL}/list`, queryParams)
}

/**
 * 获取工作流详情
 * @param {string} id - 工作流ID
 * @returns {Promise<Object>} 工作流详情数据
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
 * 创建工作流（包含完整数据）
 * @param {Object} data - 工作流数据
 * @param {string} data.name - 工作流名称
 * @param {string} [data.description] - 工作流描述
 * @param {string} [data.createdBy] - 创建人
 * @param {Array} [data.nodes] - 节点列表
 * @param {Array} [data.connections] - 连线列表
 * @param {Array} [data.associations] - 关联列表
 * @returns {Promise<Object>} 创建结果（包含完整工作流信息）
 */
export async function createWorkflow(data) {
  return post(`${BASE_URL}`, data)
}

/**
 * 更新工作流基本信息
 * @param {string} id - 工作流ID
 * @param {Object} data - 更新数据
 * @param {string} data.name - 工作流名称
 * @param {string} data.description - 工作流描述
 * @returns {Promise<Object>} 更新结果
 */
export async function updateWorkflow(id, data) {
  return put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteWorkflow(id) {
  return del(`${BASE_URL}/${id}`)
}

/**
 * 复制工作流
 * @param {string} id - 源工作流ID
 * @returns {Promise<Object>} 复制结果（包含新工作流信息）
 */
export async function copyWorkflow(id) {
  return post(`${BASE_URL}/${id}/copy`)
}

/**
 * 发布工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<Object>} 发布结果
 */
export async function publishWorkflow(id) {
  return post(`${BASE_URL}/${id}/publish`)
}

/**
 * 保存工作流数据（节点、连线、关联）- JSON格式
 * @param {string} id - 工作流ID
 * @param {Object} data - 工作流完整数据
 * @param {Array} data.nodes - 节点列表
 * @param {Array} data.connections - 连线列表
 * @param {Array} data.associations - 关联配置
 * @returns {Promise<Object>} 保存结果
 */
export async function saveWorkflowData(id, data) {
  return post(`${BASE_URL}/${id}/data/json`, data)
}

/**
 * 获取节点类型列表
 * @returns {Promise<Object>} 节点类型列表
 */
export async function getNodeTypeList() {
  return get(`${BASE_URL}/node-types`)
}

/**
 * 运行工作流
 * @param {string} id - 工作流ID
 * @param {Object} params - 运行参数（开始节点的初始变量）
 * @returns {Promise<Object>} 运行结果
 */
export async function runWorkflow(id, params = {}) {
  return post(`${BASE_URL}/${id}/run`, params)
}
