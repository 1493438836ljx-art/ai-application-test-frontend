/**
 * 连线路径计算工具
 * 用于计算 SVG 贝塞尔曲线路径
 */

/**
 * 获取节点的输出端口位置（画布坐标）
 */
export function getOutputPortPosition(node) {
  const width = node.width || 200
  const height = node.height || 80
  return {
    x: node.positionX + width,
    y: node.positionY + height / 2,
  }
}

/**
 * 获取节点的输入端口位置（画布坐标）
 */
export function getInputPortPosition(node) {
  const height = node.height || 80
  return {
    x: node.positionX,
    y: node.positionY + height / 2,
  }
}

/**
 * 计算贝塞尔曲线路径
 */
export function calculateBezierPath(source, target, curvature = 0.5) {
  const dx = target.x - source.x
  const controlPointOffset = Math.min(Math.abs(dx) * curvature, 150)

  return `M ${source.x} ${source.y} C ${source.x + controlPointOffset} ${source.y}, ${target.x - controlPointOffset} ${target.y}, ${target.x} ${target.y}`
}

/**
 * 计算贝塞尔曲线上的点（t=0.5 时的近似中点）
 */
export function calculateMiddlePoint(source, target, curvature = 0.5) {
  const dx = target.x - source.x
  const controlPointOffset = Math.min(Math.abs(dx) * curvature, 150)

  const cp1x = source.x + controlPointOffset
  const cp1y = source.y
  const cp2x = target.x - controlPointOffset
  const cp2y = target.y

  const t = 0.5
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t

  const x = mt3 * source.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * target.x
  const y = mt3 * source.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * target.y

  return { x, y }
}

/**
 * 计算两个节点之间的连线路径
 */
export function calculateConnectionPath(sourceNode, targetNode, curvature = 0.5) {
  const source = getOutputPortPosition(sourceNode)
  const target = getInputPortPosition(targetNode)
  const path = calculateBezierPath(source, target, curvature)
  const middlePoint = calculateMiddlePoint(source, target, curvature)

  return { path, middlePoint }
}

/**
 * 计算临时连线（拖拽中）的路径
 */
export function calculateTempConnectionPath(sourceNode, mousePosition) {
  const source = getOutputPortPosition(sourceNode)
  return calculateBezierPath(source, mousePosition)
}
