/**
 * 数据字典 API 服务
 * 用于获取和管理数据字典数据
 */
import { get, post, put, del } from '@/utils/request'

const BASE_URL = 'http://localhost:8080/api/dictionaries'

/**
 * 获取数据字典列表
 * @param {Object} params - 查询参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页条数
 * @returns {Promise<Object>} 数据字典列表
 */
export async function getDictionaryList(params = {}) {
  return get(BASE_URL, params)
}

/**
 * 获取数据字典详情
 * @param {string|number} id - 数据字典ID
 * @returns {Promise<Object>} 数据字典详情
 */
export async function getDictionaryDetail(id) {
  return get(`${BASE_URL}/${id}`)
}

/**
 * 创建数据字典
 * @param {Object} data - 数据字典数据
 * @param {string} data.name - 字典名称
 * @param {string} data.description - 字典描述
 * @param {Array} data.columns - 字段定义列表
 * @returns {Promise<Object>} 创建结果
 */
export async function createDictionary(data) {
  return post(BASE_URL, data)
}

/**
 * 更新数据字典
 * @param {string|number} id - 数据字典ID
 * @param {Object} data - 更新的数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateDictionary(id, data) {
  return put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除数据字典
 * @param {string|number} id - 数据字典ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteDictionary(id) {
  return del(`${BASE_URL}/${id}`)
}

/**
 * 获取数据字典关联状态
 * @param {string|number} id - 数据字典ID
 * @returns {Promise<Object>} 关联状态信息
 */
export async function getDictionaryLinkStatus(id) {
  return get(`${BASE_URL}/${id}/link-status`)
}

/**
 * 获取所有数据字典（下拉选择用）
 * @returns {Promise<Array>} 数据字典列表
 */
export async function getAllDictionaries() {
  return get(`${BASE_URL}/all`)
}
