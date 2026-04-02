/**
 * UUID 生成工具
 */

/**
 * 生成 UUID v4
 * @returns {string} UUID 字符串
 */
export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成短 UUID（用于节点 ID）
 * @returns {string} 短 UUID 字符串
 */
export function generateShortUuid() {
  return Math.random().toString(36).substring(2, 10)
}
