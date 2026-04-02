/**
 * 坐标转换工具
 */

/**
 * 屏幕坐标转画布坐标
 */
export function screenToCanvas(screenX, screenY, canvasState) {
  const { offsetX, offsetY, scale } = canvasState
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  }
}

/**
 * 画布坐标转屏幕坐标
 */
export function canvasToScreen(canvasX, canvasY, canvasState) {
  const { offsetX, offsetY, scale } = canvasState
  return {
    x: canvasX * scale + offsetX,
    y: canvasY * scale + offsetY,
  }
}

/**
 * 计算以指定点为中心的缩放后的新偏移量
 */
export function calculateZoomOffset(currentScale, newScale, offsetX, offsetY, pivotX, pivotY) {
  const canvasPivotX = (pivotX - offsetX) / currentScale
  const canvasPivotY = (pivotY - offsetY) / currentScale

  const newOffsetX = pivotX - canvasPivotX * newScale
  const newOffsetY = pivotY - canvasPivotY * newScale

  return { offsetX: newOffsetX, offsetY: newOffsetY }
}

/**
 * 限制缩放比例在有效范围内
 */
export function clampScale(scale, minScale = 0.25, maxScale = 2) {
  return Math.min(Math.max(scale, minScale), maxScale)
}
