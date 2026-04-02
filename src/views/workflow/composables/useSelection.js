/**
 * 选择状态管理 Composable
 * 管理节点和连线的选择状态
 */
import { ref, computed } from 'vue'

export function useSelection() {
  // 选中的节点 UUID 集合
  const selectedNodeUuids = ref(new Set())

  // 选中的连线 UUID（单选）
  const selectedConnectionUuid = ref(null)

  /**
   * 选择节点
   * @param {string} nodeUuid - 节点 UUID
   * @param {boolean} [multi=false] - 是否多选模式（Ctrl+点击）
   */
  const selectNode = (nodeUuid, multi = false) => {
    if (multi) {
      // 多选模式：切换选中状态
      if (selectedNodeUuids.value.has(nodeUuid)) {
        selectedNodeUuids.value.delete(nodeUuid)
      } else {
        selectedNodeUuids.value.add(nodeUuid)
      }
    } else {
      // 单选模式：清空其他，只选中当前
      selectedNodeUuids.value.clear()
      selectedNodeUuids.value.add(nodeUuid)
    }
    // 选中节点时清除连线选择
    selectedConnectionUuid.value = null
  }

  /**
   * 取消选择节点
   * @param {string} nodeUuid - 节点 UUID
   */
  const deselectNode = (nodeUuid) => {
    selectedNodeUuids.value.delete(nodeUuid)
  }

  /**
   * 切换节点选择状态
   * @param {string} nodeUuid - 节点 UUID
   */
  const toggleNodeSelection = (nodeUuid) => {
    selectNode(nodeUuid, true)
  }

  /**
   * 选择连线
   * @param {string} connectionUuid - 连线 UUID
   */
  const selectConnection = (connectionUuid) => {
    selectedConnectionUuid.value = connectionUuid
    // 选中连线时清除节点选择
    selectedNodeUuids.value.clear()
  }

  /**
   * 清空所有选择
   */
  const clearSelection = () => {
    selectedNodeUuids.value.clear()
    selectedConnectionUuid.value = null
  }

  /**
   * 检查节点是否选中
   * @param {string} nodeUuid - 节点 UUID
   * @returns {boolean}
   */
  const isNodeSelected = (nodeUuid) => {
    return selectedNodeUuids.value.has(nodeUuid)
  }

  /**
   * 检查连线是否选中
   * @param {string} connectionUuid - 连线 UUID
   * @returns {boolean}
   */
  const isConnectionSelected = (connectionUuid) => {
    return selectedConnectionUuid.value === connectionUuid
  }

  /**
   * 是否有选中项
   */
  const hasSelection = computed(() => {
    return selectedNodeUuids.value.size > 0 || selectedConnectionUuid.value !== null
  })

  /**
   * 选中的节点数量
   */
  const selectedNodeCount = computed(() => {
    return selectedNodeUuids.value.size
  })

  /**
   * 获取选中的节点 UUID 列表
   */
  const selectedNodeUuidList = computed(() => {
    return Array.from(selectedNodeUuids.value)
  })

  /**
   * 全选所有节点
   * @param {Array} allNodeUuids - 所有节点 UUID 列表
   */
  const selectAllNodes = (allNodeUuids) => {
    selectedNodeUuids.value = new Set(allNodeUuids)
    selectedConnectionUuid.value = null
  }

  /**
   * 删除选中的节点时，从选择集中移除
   * @param {string} nodeUuid - 被删除的节点 UUID
   */
  const removeFromSelection = (nodeUuid) => {
    selectedNodeUuids.value.delete(nodeUuid)
  }

  return {
    selectedNodeUuids,
    selectedConnectionUuid,
    selectNode,
    deselectNode,
    toggleNodeSelection,
    selectConnection,
    clearSelection,
    isNodeSelected,
    isConnectionSelected,
    hasSelection,
    selectedNodeCount,
    selectedNodeUuidList,
    selectAllNodes,
    removeFromSelection,
  }
}
