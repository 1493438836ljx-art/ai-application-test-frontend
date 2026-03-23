/**
 * 节点类型 API 服务
 * 用于获取工作流节点类型
 */
import { get } from '@/utils/request'

const BASE_URL = 'http://localhost:8080/api/workflow/node-types'

/**
 * 获取所有启用的节点类型
 * @returns {Promise<Array>} 节点类型列表
 */
export async function getNodeTypes() {
  return get(BASE_URL)
}
