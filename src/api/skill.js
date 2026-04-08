/**
 * Skill API 服务
 * 用于获取和管理 Skill 数据
 */
import { get, post, del, upload, uploadPut } from '@/utils/request'
import { API_BASE_URL } from './config'

const BASE_URL = `${API_BASE_URL}/api/skill`

/**
 * 获取Skill列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页条数
 * @param {string} params.name - 名称搜索
 * @param {string} params.category - 分类筛选
 * @param {string} params.status - 状态筛选
 * @returns {Promise<Object>} Skill列表数据
 */
export async function getSkillList(params = {}) {
  const { page = 1, size = 10, name = '', category = '', status = '' } = params
  const queryParams = {
    page,
    size,
  }
  if (name) {
    queryParams.name = name
  }
  if (category) {
    queryParams.category = category
  }
  if (status) {
    queryParams.status = status
  }
  return get(`${BASE_URL}/search`, queryParams)
}

/**
 * 获取Skill详情
 * @param {string} id - Skill ID
 * @returns {Promise<Object>} Skill详情数据
 */
export async function getSkillDetail(id) {
  return get(`${BASE_URL}/${id}`)
}

/**
 * 创建Skill（带文件上传）
 * @param {Object} data - Skill数据
 * @param {File} [file] - 执行套件文件
 * @returns {Promise<Object>} 创建结果
 */
export async function createSkill(data, file = null) {
  if (file) {
    // 使用 FormData 上传文件和数据
    const formData = new FormData()
    formData.append('file', file)
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    return upload(`${BASE_URL}`, formData)
  }
  return post(`${BASE_URL}`, data)
}

/**
 * 更新Skill（支持文件上传）
 * @param {string} id - Skill ID
 * @param {Object} data - 更新数据
 * @param {File} [file] - 执行套件文件（可选）
 * @returns {Promise<Object>} 更新结果
 */
export async function updateSkill(id, data, file = null) {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  return uploadPut(`${BASE_URL}/${id}`, formData)
}

/**
 * 删除Skill
 * @param {string} id - Skill ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteSkill(id) {
  return del(`${BASE_URL}/${id}`)
}

/**
 * 发布Skill
 * @param {string} id - Skill ID
 * @returns {Promise<Object>} 发布结果
 */
export async function publishSkill(id) {
  return post(`${BASE_URL}/${id}/publish`)
}

/**
 * 取消发布Skill
 * @param {string} id - Skill ID
 * @returns {Promise<Object>} 取消发布结果
 */
export async function unpublishSkill(id) {
  return post(`${BASE_URL}/${id}/unpublish`)
}

/**
 * 复制Skill
 * @param {string} id - 源Skill ID
 * @returns {Promise<Object>} 复制结果
 */
export async function copySkill(id) {
  return post(`${BASE_URL}/${id}/copy`)
}

/**
 * 下载执行套件
 * @param {string} id - Skill ID
 * @returns {string} 下载URL
 */
export function getDownloadSuiteUrl(id) {
  return `${BASE_URL}/${id}/download`
}
