/**
 * 工作流 API 服务
 * 用于获取和管理工作流数据
 */
import { get } from '@/utils/request'

const BASE_URL = 'http://localhost:8080/api/workflow'

/**
 * 获取默认工作流详情
 * @returns {Promise<Object>} 默认工作流数据
 */
export async function getDefaultWorkflow() {
  return get(`${BASE_URL}/default`)
}
