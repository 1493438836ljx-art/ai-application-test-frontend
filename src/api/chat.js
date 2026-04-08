/**
 * AI聊天相关API
 */
import { get, post } from '@/utils/request'
import { API_BASE_URL } from './config'

const BASE_URL = `${API_BASE_URL}/api/chat`

/**
 * 发送消息
 * @param {Object} params - 发送参数
 * @param {string} params.conversationId - 对话ID（可选，为空则创建新对话）
 * @param {string} params.message - 消息内容
 * @param {Object} params.context - 上下文信息（可选）
 * @param {string} params.userId - 用户ID（可选）
 * @returns {Promise<Object>} 发送响应
 */
export async function sendMessage(params) {
  return post(`${BASE_URL}/send`, params)
}

/**
 * 流式发送消息（SSE）
 * @param {Object} params - 发送参数
 * @param {Object} callbacks - 回调函数集合
 * @param {function} callbacks.onStart - 会话开始时的回调
 * @param {function} callbacks.onChunk - 接收到数据块时的回调
 * @param {function} callbacks.onAction - 接收到action事件时的回调（如workflow_update）
 * @param {function} callbacks.onDone - 完成时的回调
 * @param {function} callbacks.onError - 错误时的回调
 * @returns {Promise<void>}
 */
export async function sendMessageStream(params, { onStart, onChunk, onAction, onDone, onError }) {
  try {
    const response = await fetch(`${BASE_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 解析SSE事件
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.substring(5).trim()
          if (data) {
            try {
              const parsed = JSON.parse(data)

              // 根据事件类型分发回调
              if (parsed.type === 'start') {
                onStart && onStart(parsed)
                // 兼容旧的 onChunk 方式
                onChunk && onChunk({ type: 'start', conversationId: parsed.conversationId })
              } else if (parsed.type === 'chunk') {
                // 传递完整的 chunk 信息，包括 contentType
                onChunk && onChunk({
                  type: 'chunk',
                  content: parsed.content,
                  contentType: parsed.contentType, // thinking, text, tool_use, result
                  toolName: parsed.toolName,
                  toolInput: parsed.toolInput
                })
              } else if (parsed.type === 'workflow_update') {
                // 处理工作流更新事件
                onAction && onAction(parsed)
              } else if (parsed.type === 'done') {
                onDone && onDone(parsed)
              } else if (parsed.type === 'error') {
                onError && onError(parsed.message)
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }
    }
  } catch (error) {
    onError && onError(error.message)
  }
}

/**
 * 创建新对话
 * @param {Object} params - 创建参数
 * @param {string} params.userId - 用户ID（可选）
 * @param {string} params.title - 对话标题（可选）
 * @returns {Promise<Object>} 对话信息
 */
export async function createConversation(params = {}) {
  const query = new URLSearchParams()
  if (params.userId) query.append('userId', params.userId)
  if (params.title) query.append('title', params.title)
  return post(`${BASE_URL}/conversations?${query.toString()}`)
}

/**
 * 获取对话列表
 * @param {Object} params - 查询参数
 * @param {string} params.userId - 用户ID（可选）
 * @param {string} params.status - 状态（可选）
 * @param {number} params.page - 页码（默认0）
 * @param {number} params.size - 每页大小（默认20）
 * @returns {Promise<Object>} 对话分页列表
 */
export async function getConversations(params = {}) {
  return get(`${BASE_URL}/conversations`, params)
}

/**
 * 获取对话详情
 * @param {string} uuid - 对话UUID
 * @returns {Promise<Object>} 对话详情（包含所有消息）
 */
export async function getConversation(uuid) {
  return get(`${BASE_URL}/conversations/${uuid}`)
}

/**
 * 更新对话标题
 * @param {string} uuid - 对话UUID
 * @param {string} title - 新标题
 * @returns {Promise<Object>} 更新后的对话信息
 */
export async function updateConversationTitle(uuid, title) {
  return post(`${BASE_URL}/conversations/${uuid}?title=${encodeURIComponent(title)}`, {}, { method: 'PUT' })
}

/**
 * 归档对话
 * @param {string} uuid - 对话UUID
 * @returns {Promise<void>}
 */
export async function archiveConversation(uuid) {
  return post(`${BASE_URL}/conversations/${uuid}/archive`)
}

/**
 * 删除对话
 * @param {string} uuid - 对话UUID
 * @returns {Promise<void>}
 */
export async function deleteConversation(uuid) {
  return post(`${BASE_URL}/conversations/${uuid}`, {}, { method: 'DELETE' })
}

/**
 * 获取快捷问题列表
 * @returns {Promise<Array>} 快捷问题列表
 */
export async function getQuickQuestions() {
  return get(`${BASE_URL}/quick-questions`)
}

/**
 * 提交消息反馈
 * @param {string} messageUuid - 消息UUID
 * @param {Object} params - 反馈参数
 * @param {number} params.rating - 评分
 * @param {string} params.feedbackType - 反馈类型
 * @param {string} params.comment - 评论（可选）
 * @param {string} params.userId - 用户ID（可选）
 * @returns {Promise<void>}
 */
export async function submitFeedback(messageUuid, params) {
  return post(`${BASE_URL}/messages/${messageUuid}/feedback`, params)
}
