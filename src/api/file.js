/**
 * 文件上传 API
 */
import { get, post, del } from '@/utils/request'

const BASE_URL = '/api/file'

/**
 * 上传文件
 * @param {File} file - 要上传的文件
 * @returns {Promise<Object>} 文件信息 { fileId, fileName, filePath, fileSize, contentType }
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
  })

  if (!response.ok) {
    throw new Error('文件上传失败')
  }

  return response.json()
}

/**
 * 获取文件下载URL
 * @param {string} fileId - 文件ID
 * @returns {string} 文件下载URL
 */
export function getFileDownloadUrl(fileId) {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${BASE_URL}/download/${fileId}`
}

/**
 * 获取文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件信息
 */
export async function getFileInfo(fileId) {
  return get(`${BASE_URL}/info/${fileId}`)
}

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteFile(fileId) {
  return del(`${BASE_URL}/${fileId}`)
}
