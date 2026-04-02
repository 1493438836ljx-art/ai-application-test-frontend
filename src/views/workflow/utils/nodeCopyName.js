/**
 * 节点复制命名工具
 */

/**
 * 生成节点副本名称
 * @param {string} baseName - 原节点名称
 * @param {string[]} existingNames - 已存在的名称列表
 * @returns {string} 新名称
 */
export function generateCopyName(baseName, existingNames) {
  const copyBase = `${baseName}-副本`
  // 使用动态正则，转义 baseName 中的特殊字符
  const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^${escapedBase}-副本(\\d*)$`)

  // 查找最大序号
  let maxNum = 0
  let hasCopy = false

  for (const name of existingNames) {
    if (name === copyBase) {
      hasCopy = true
    } else {
      const match = name.match(regex)
      if (match) {
        hasCopy = true
        const num = parseInt(match[1]) || 0
        maxNum = Math.max(maxNum, num)
      }
    }
  }

  if (!hasCopy) {
    return copyBase
  }

  return `${copyBase}${maxNum + 1}`
}

/**
 * 获取所有节点名称列表
 * @param {Array} nodes - 节点列表
 * @returns {string[]} 名称列表
 */
export function getExistingNames(nodes) {
  return nodes.map((node) => node.name)
}
