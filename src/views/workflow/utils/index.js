/**
 * 工作流工具函数索引
 */

// UUID 生成
export { generateUuid, generateShortUuid } from './uuid'

// 节点复制命名
export { generateCopyName, getExistingNames } from './nodeCopyName'

// 连线路径计算
export {
  getOutputPortPosition,
  getInputPortPosition,
  calculateBezierPath,
  calculateMiddlePoint,
  calculateConnectionPath,
  calculateTempConnectionPath,
} from './connectionPath'

// 坐标转换
export { screenToCanvas, canvasToScreen, calculateZoomOffset, clampScale } from './coordinateTransform'
