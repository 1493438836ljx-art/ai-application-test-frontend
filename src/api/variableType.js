/**
 * 变量类型 API 服务
 * 用于获取工作流节点变量类型
 */
import { get } from '@/utils/request'
import { API_BASE_URL } from './config'

const BASE_URL = `${API_BASE_URL}/api/workflow/variable-types`

/**
 * 获取所有启用的变量类型
 * @returns {Promise<Array>} 变量类型列表
 */
export async function getVariableTypes() {
  return get(BASE_URL)
}

/**
 * 获取变量类型分类列表
 * @returns {Promise<Array>} 分类列表
 */
export async function getVariableTypeCategories() {
  return get(`${BASE_URL}/categories`)
}

/**
 * 按分类获取变量类型
 * @param {string} category - 分类名称 (basic, array, file)
 * @returns {Promise<Array>} 该分类下的变量类型列表
 */
export async function getVariableTypesByCategory(category) {
  return get(`${BASE_URL}/category/${category}`)
}
