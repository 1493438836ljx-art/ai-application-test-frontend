/**
 * 右键菜单管理 Composable
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CopyDocument, Delete, Edit } from '@element-plus/icons-vue'

export function useContextMenu() {
  // 菜单显示状态
  const visible = ref(false)
  const position = reactive({ x: 0, y: 0 })
  const targetNodeUuid = ref(null)
  const targetType = ref(null) // 'node' | 'connection' | 'canvas'

  /**
   * 显示节点右键菜单
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   * @param {string} nodeUuid - 节点 UUID
   */
  const showNodeMenu = (x, y, nodeUuid) => {
    position.x = x
    position.y = y
    targetNodeUuid.value = nodeUuid
    targetType.value = 'node'
    visible.value = true
  }

  /**
   * 显示连线右键菜单
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   * @param {string} connectionUuid - 连线 UUID
   */
  const showConnectionMenu = (x, y, connectionUuid) => {
    position.x = x
    position.y = y
    targetNodeUuid.value = connectionUuid // 复用变量
    targetType.value = 'connection'
    visible.value = true
  }

  /**
   * 显示画布右键菜单
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   */
  const showCanvasMenu = (x, y) => {
    position.x = x
    position.y = y
    targetNodeUuid.value = null
    targetType.value = 'canvas'
    visible.value = true
  }

  /**
   * 隐藏菜单
   */
  const hide = () => {
    visible.value = false
    targetNodeUuid.value = null
    targetType.value = null
  }

  /**
   * 节点菜单项
   */
  const nodeMenuItems = computed(() => [
    {
      key: 'copy',
      label: '复制节点',
      icon: CopyDocument,
      action: () => 'copy',
    },
    {
      key: 'delete',
      label: '删除节点',
      icon: Delete,
      action: () => 'delete',
      danger: true,
    },
  ])

  /**
   * 连线菜单项
   */
  const connectionMenuItems = computed(() => [
    {
      key: 'delete',
      label: '删除连线',
      icon: Delete,
      action: () => 'delete',
      danger: true,
    },
  ])

  /**
   * 画布菜单项
   */
  const canvasMenuItems = computed(() => [
    {
      key: 'select-all',
      label: '全选',
      icon: null,
      action: () => 'select-all',
    },
  ])

  /**
   * 当前菜单项
   */
  const currentMenuItems = computed(() => {
    switch (targetType.value) {
      case 'node':
        return nodeMenuItems.value
      case 'connection':
        return connectionMenuItems.value
      case 'canvas':
        return canvasMenuItems.value
      default:
        return []
    }
  })

  /**
   * 处理菜单项点击
   * @param {string} actionKey - 操作 key
   * @returns {Object} 操作信息
   */
  const handleMenuAction = (actionKey) => {
    const result = {
      action: actionKey,
      targetType: targetType.value,
      targetUuid: targetNodeUuid.value,
    }
    hide()
    return result
  }

  // 点击外部关闭菜单
  const handleDocumentClick = (event) => {
    if (visible.value) {
      hide()
    }
  }

  // 注册全局点击事件
  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
  })

  return {
    visible,
    position,
    targetNodeUuid,
    targetType,
    currentMenuItems,
    showNodeMenu,
    showConnectionMenu,
    showCanvasMenu,
    hide,
    handleMenuAction,
  }
}
