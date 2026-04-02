/**
 * 节点拖拽管理 Composable
 * 处理节点的拖拽移动逻辑
 */
import { reactive, ref } from 'vue'

/**
 * 节点拖拽管理
 * @param {Object} options - 配置选项
 * @param {Object} options.getNodeByUuid - 通过 UUID 获取节点的方法
 * @param {Object} options.updateNode - 更新节点的方法
 * @param {Object} options.scale - 画布缩放比例
 * @param {Object} options.canvasOffset - 画布偏移量
 * @param {Object} options.canvasWidth - 画布宽度
 * @param {Object} options.canvasHeight - 画布高度
 * @returns {Object} 拖拽状态和方法
 */
export function useNodeDrag(options) {
  const {
    getNodeByUuid,
    updateNode,
    scale = 1,
    canvasOffset = { x: 0, y: 0 },
    canvasWidth = 3000,
    canvasHeight = 2000,
  } = options

  // 拖拽状态
  const dragState = reactive({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
    hasMoved: false, // 是否真正移动了（用于区分点击和拖拽）
  })

  // 多节点拖拽状态
  const multiDragState = reactive({
    isDragging: false,
    nodeIds: [],
    startX: 0,
    startY: 0,
    nodeStartPositions: {}, // 记录每个节点的起始位置
    hasMoved: false,
  })

  /**
   * 开始拖拽单个节点
   * @param {Event} event - 鼠标事件
   * @param {Object} node - 节点对象
   */
  const startDrag = (event, node) => {
    if (!node || !event) return

    dragState.isDragging = true
    dragState.nodeId = node.id
    dragState.startX = event.clientX
    dragState.startY = event.clientY
    dragState.nodeStartX = node.x
    dragState.nodeStartY = node.y
    dragState.hasMoved = false
  }

  /**
   * 开始拖拽多个节点
   * @param {Event} event - 鼠标事件
   * @param {Array} nodeIds - 节点 ID 数组
   */
  const startMultiDrag = (event, ids) => {
    if (!ids || ids.length === 0 || !event) return

    multiDragState.isDragging = true
    multiDragState.nodeIds = [...ids]
    multiDragState.startX = event.clientX
    multiDragState.startY = event.clientY
    multiDragState.hasMoved = false

    // 记录每个节点的起始位置
    multiDragState.nodeStartPositions = {}
    ids.forEach((id) => {
      const node = getNodeByUuid(id)
      if (node) {
        multiDragState.nodeStartPositions[id] = {
          x: node.x,
          y: node.y,
        }
      }
    })
  }

  /**
   * 处理拖拽移动
   * @param {Event} event - 鼠标事件
   * @returns {Object|null} 移动后的位置 { deltaX, deltaY, }
   */
  const handleDragMove = (event) => {
    if (!dragState.isDragging && !multiDragState.isDragging) return null

    const currentScale = typeof scale === 'object' ? scale.value : scale
    const offsetX = typeof canvasOffset === 'object' ? canvasOffset.value?.x : canvasOffset
    const offsetY = typeof canvasOffset === 'object' ? canvasOffset.value?.y : canvasOffset

    if (dragState.isDragging) {
      // 单节点拖拽
      const deltaX = (event.clientX - dragState.startX) / currentScale
      const deltaY = (event.clientY - dragState.startY) / currentScale

      const node = getNodeByUuid(dragState.nodeId)
      if (node) {
        // 标记已经移动
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          dragState.hasMoved = true
        }

        // 讣算新位置
        let newX = dragState.nodeStartX + deltaX
        let newY = dragState.nodeStartY + deltaY

        // 边界约束 - 不能移出画布
        newX = Math.max(0, Math.min(newX, canvasWidth - 220))
        newY = Math.max(0, Math.min(newY, canvasHeight - 70))

        // 更新本地状态（不调用 API)
        node.x = newX
        node.y = newY

        return { deltaX, deltaY, newX, newY }
      }
    } else if (multiDragState.isDragging) {
      // 多节点拖拽
      const deltaX = (event.clientX - multiDragState.startX) / currentScale
      const deltaY = (event.clientY - multiDragState.startY) / currentScale

      // 标记已经移动
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        multiDragState.hasMoved = true
      }

      const positions = {}
      multiDragState.nodeIds.forEach((id) => {
        const startPos = multiDragState.nodeStartPositions[id]
        const node = getNodeByUuid(id)
        if (startPos && node) {
          let newX = startPos.x + deltaX
          let newY = startPos.y + deltaY
          // 边界约束
          newX = Math.max(0, Math.min(newX, canvasWidth - 220))
          newY = Math.max(0, Math.min(newY, canvasHeight - 70))
          node.x = newX
          node.y = newY
          positions[id] = { x: newX, y: newY }
        }
      })

      return { deltaX, deltaY, positions }
    }
    return null
  }

  /**
   * 结束拖拽（单节点）
   * @returns {Object|null} 节点最终位置
   */
  const endDrag = () => {
    if (!dragState.isDragging) return null

    const result = {
      nodeId: dragState.nodeId,
      hasMoved: dragState.hasMoved,
      finalX: null,
      finalY: null,
    }

    if (dragState.hasMoved) {
      const node = getNodeByUuid(dragState.nodeId)
      if (node) {
        result.finalX = node.x
        result.finalY = node.y
      }
    }

    // 重置状态
    dragState.isDragging = false
    dragState.nodeId = null
    dragState.startX = 0
    dragState.startY = 0
    dragState.nodeStartX = 0
    dragState.nodeStartY = 0
    dragState.hasMoved = false

    return result
  }

  /**
   * 结束多节点拖拽
   * @returns {Object|null} 多节点最终位置
   */
  const endMultiDrag = () => {
    if (!multiDragState.isDragging) return null

    const result = {
      nodeIds: [...multiDragState.nodeIds],
      hasMoved: multiDragState.hasMoved,
      positions: {},
    }

    if (multiDragState.hasMoved) {
      multiDragState.nodeIds.forEach((id) => {
        const node = getNodeByUuid(id)
        if (node) {
          result.positions[id] = { x: node.x, y: node.y }
        }
      })
    }

    // 重置状态
    multiDragState.isDragging = false
    multiDragState.nodeIds = []
    multiDragState.startX = 0
    multiDragState.startY = 0
    multiDragState.nodeStartPositions = {}
    multiDragState.hasMoved = false

    return result
  }

  /**
   * 取消拖拽
   */
  const cancelDrag = () => {
    dragState.isDragging = false
    dragState.nodeId = null
    dragState.startX = 0
    dragState.startY = 0
    dragState.nodeStartX = 0
    dragState.nodeStartY = 0
    dragState.hasMoved = false

    multiDragState.isDragging = false
    multiDragState.nodeIds = []
    multiDragState.startX = 0
    multiDragState.startY = 0
    multiDragState.nodeStartPositions = {}
    multiDragState.hasMoved = false
  }

  /**
   * 检查是否正在拖拽
   */
  const isDragging = () => {
    return dragState.isDragging || multiDragState.isDragging
  }

  /**
   * 检查节点是否正在被拖拽
   * @param {string} nodeId - 节点 ID
   */
  const isNodeDragging = (nodeId) => {
    return dragState.nodeId === nodeId || multiDragState.nodeIds.includes(nodeId)
  }

  return {
    // 状态
    dragState,
    multiDragState,

    // 方法
    startDrag,
    startMultiDrag,
    handleDragMove,
    endDrag,
    endMultiDrag,
    cancelDrag,
    isDragging,
    isNodeDragging,
  }
}
