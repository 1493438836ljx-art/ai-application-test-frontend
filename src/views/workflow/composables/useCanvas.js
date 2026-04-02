/**
 * 画布状态管理 Composable
 * 提供画布的缩放、平移、尺寸等状态管理
 */
import { reactive, computed } from 'vue'
import { calculateZoomOffset, clampScale } from '../utils/coordinateTransform'

/**
 * 创建画布状态管理
 * @param {Object} options 配置选项
 * @param {number} options.initialScale 初始缩放比例，默认1
 * @param {number} options.initialOffsetX 初始X偏移，默认0
 * @param {number} options.initialOffsetY 初始Y偏移，默认0
 * @param {number} options.width 画布宽度，默认3000
 * @param {number} options.height 画布高度，默认2000
 * @param {number} options.minScale 最小缩放比例，默认0.25
 * @param {number} options.maxScale 最大缩放比例，默认2
 * @param {number} options.scaleStep 缩放步长，默认0.1
 * @returns {Object} 画布状态和方法
 */
export function useCanvas(options = {}) {
  const {
    initialScale = 1,
    initialOffsetX = 0,
    initialOffsetY = 0,
    width = 3000,
    height = 2000,
    minScale = 0.25,
    maxScale = 2,
    scaleStep = 0.1,
  } = options

  // 画布状态
  const state = reactive({
    scale: initialScale,
    offsetX: initialOffsetX,
    offsetY: initialOffsetY,
    width,
    height,
    isPanning: false,
  })

  // 缩放百分比（计算属性）
  const scalePercent = computed(() => Math.round(state.scale * 100))

  // transform样式（计算属性）
  const transformStyle = computed(() => ({
    transform: `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`,
    transformOrigin: '0 0',
    width: `${state.width}px`,
    height: `${state.height}px`,
  }))

  /**
   * 放大
   */
  const zoomIn = () => {
    state.scale = clampScale(state.scale + scaleStep, minScale, maxScale)
  }

  /**
   * 缩小
   */
  const zoomOut = () => {
    state.scale = clampScale(state.scale - scaleStep, minScale, maxScale)
  }

  /**
   * 以指定点为中心缩放
   * @param {number} newScale 新的缩放比例
   * @param {number} pivotX 缩放中心点X（屏幕坐标）
   * @param {number} pivotY 缩放中心点Y（屏幕坐标）
   */
  const zoomToPoint = (newScale, pivotX, pivotY) => {
    const clampedScale = clampScale(newScale, minScale, maxScale)

    if (clampedScale === state.scale) return

    const { offsetX, offsetY } = calculateZoomOffset(
      state.scale,
      clampedScale,
      state.offsetX,
      state.offsetY,
      pivotX,
      pivotY,
    )

    state.scale = clampedScale
    state.offsetX = offsetX
    state.offsetY = offsetY
  }

  /**
   * 设置缩放比例
   * @param {number} scale 新的缩放比例
   */
  const setScale = (scale) => {
    state.scale = clampScale(scale, minScale, maxScale)
  }

  /**
   * 设置偏移量
   * @param {number} x X偏移
   * @param {number} y Y偏移
   */
  const setOffset = (x, y) => {
    state.offsetX = x
    state.offsetY = y
  }

  /**
   * 平移画布
   * @param {number} dx X方向位移量
   * @param {number} dy Y方向位移量
   */
  const pan = (dx, dy) => {
    state.offsetX += dx
    state.offsetY += dy
  }

  /**
   * 重置视图
   */
  const resetView = () => {
    state.scale = initialScale
    state.offsetX = initialOffsetX
    state.offsetY = initialOffsetY
  }

  /**
   * 适配内容到视口
   * @param {Object} viewportSize 视口尺寸 { width, height }
   * @param {Object} contentBounds 内容边界 { minX, minY, maxX, maxY }
   * @param {number} padding 边距，默认50
   */
  const fitContent = (viewportSize, contentBounds, padding = 50) => {
    const { width: viewportWidth, height: viewportHeight } = viewportSize
    const { minX, minY, maxX, maxY } = contentBounds

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    if (contentWidth === 0 || contentHeight === 0) {
      resetView()
      return
    }

    // 计算缩放比例以适应视口
    const scaleX = (viewportWidth - padding * 2) / contentWidth
    const scaleY = (viewportHeight - padding * 2) / contentHeight
    const newScale = Math.min(scaleX, scaleY, 1) // 最大不超过1

    // 计算偏移以居中显示
    const scaledContentWidth = contentWidth * newScale
    const scaledContentHeight = contentHeight * newScale
    const offsetX = (viewportWidth - scaledContentWidth) / 2 - minX * newScale
    const offsetY = (viewportHeight - scaledContentHeight) / 2 - minY * newScale

    state.scale = clampScale(newScale, minScale, maxScale)
    state.offsetX = offsetX
    state.offsetY = offsetY
  }

  /**
   * 设置画布尺寸
   * @param {number} newWidth 新宽度
   * @param {number} newHeight 新高度
   */
  const setSize = (newWidth, newHeight) => {
    state.width = newWidth
    state.height = newHeight
  }

  /**
   * 开始平移
   */
  const startPanning = () => {
    state.isPanning = true
  }

  /**
   * 结束平移
   */
  const stopPanning = () => {
    state.isPanning = false
  }

  /**
   * 将指定节点居中显示
   * @param {Object} node - 目标节点 { x, y, width, height }
   * @param {Object} viewportSize - 视口尺寸 { width, height }
   */
  const centerOnNode = (node, viewportSize) => {
    const nodeCenterX = node.x + node.width / 2
    const nodeCenterY = node.y + node.height / 2

    state.offsetX = viewportSize.width / 2 - nodeCenterX * state.scale
    state.offsetY = viewportSize.height / 2 - nodeCenterY * state.scale
  }

  return {
    state,
    scalePercent,
    transformStyle,
    zoomIn,
    zoomOut,
    zoomToPoint,
    setScale,
    setOffset,
    pan,
    resetView,
    fitContent,
    setSize,
    startPanning,
    stopPanning,
    centerOnNode,
  }
}
