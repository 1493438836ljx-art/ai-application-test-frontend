/**
 * 节点类型 API 服务
 * 用于获取工作流节点类型
 */
import { get } from '@/utils/request'
import { API_BASE_URL } from './config'

const BASE_URL = `${API_BASE_URL}/api/workflow/node-types`

/**
 * 获取所有启用的节点类型
 * @returns {Promise<Array>} 节点类型列表
 */
export async function getNodeTypes() {
  return get(BASE_URL)
}
