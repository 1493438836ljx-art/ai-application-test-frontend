/**
 * 统一请求工具类
 * 封装 fetch API，统一处理错误和响应
 */
import { ElMessage } from 'element-plus'

/**
 * 基础请求函数
 * @param {string} url - 请求地址
 * @param {Object} options - fetch 选项
 * @returns {Promise<any>} 响应数据
 */
async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    // 检查 HTTP 状态码
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 解析响应
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    return response
  } catch (error) {
    // 统一提示系统服务异常
    ElMessage.error('系统服务异常！')
    throw error
  }
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {Object} params - 查询参数
 * @param {Object} options - 额外选项
 * @returns {Promise<any>}
 */
export async function get(url, params = {}, options = {}) {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url
  return request(fullUrl, { ...options, method: 'GET' })
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求体数据
 * @param {Object} options - 额外选项
 * @returns {Promise<any>}
 */
export async function post(url, data = {}, options = {}) {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求体数据
 * @param {Object} options - 额外选项
 * @returns {Promise<any>}
 */
export async function put(url, data = {}, options = {}) {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 请求
 * @param {string} url - 请求地址
 * @param {Object} options - 额外选项
 * @returns {Promise<any>}
 */
export async function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' })
}

/**
 * 上传文件
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {Object} options - 额外选项
 * @returns {Promise<any>}
 */
export async function upload(url, formData, options = {}) {
  // 上传文件时不设置 Content-Type，让浏览器自动设置
  const { headers, ...restOptions } = options
  const { 'Content-Type': _, ...restHeaders } = headers || {}

  return request(url, {
    ...restOptions,
    method: 'POST',
    headers: restHeaders,
    body: formData,
  })
}

export default request
