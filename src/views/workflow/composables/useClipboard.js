import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { generateCopyName } from '../utils/nodeCopyName'

/**
 * 剪贴板功能 Composable
 * 管理节点的复制、粘贴、剪切等操作
 *
 * @param {Object} options - 配置选项
 * @param {Ref} options.nodes - 节点列表的 ref
 * @param {Ref} options.connections - 连线列表的 ref
 * @param {Ref} options.associations - 关联线列表的 ref
 * @param {Ref} options.selectedNode - 当前选中的节点
 * @param {Ref} options.selectedNodeUuids - 多选节点 UUID 列表
 * @param {Ref} options.selectedConnection - 当前选中的连线
 * @param {Function} options.getLoopBodyIdByLoopId - 根据循环节点ID获取循环体画布ID
 * @returns {Object} 剪贴板相关的状态和方法
 */
export function useClipboard(options = {}) {
  const {
    nodes = ref([]),
    connections = ref([]),
    associations = ref([]),
    selectedNode = ref(null),
    selectedNodeUuids = ref([]),
    selectedConnection = ref(null),
    getLoopBodyIdByLoopId = () => null,
  } = options

  // 节点剪贴板
  const nodeClipboard = ref([])

  // 全选所有节点
  const selectAllNodes = () => {
    selectedNodeUuids.value = nodes.value
      .filter((n) => n.type !== 'loopBodyCanvas') // 不选择循环体画布
      .map((n) => n.id)
    selectedConnection.value = null
    if (selectedNodeUuids.value.length > 0) {
      const firstNode = nodes.value.find((n) => n.id === selectedNodeUuids.value[0])
      selectedNode.value = firstNode || null
    }
    ElMessage.success(`已选择 ${selectedNodeUuids.value.length} 个节点`)
  }

  // 复制选中的节点
  const copySelectedNodes = () => {
    const nodeIds = selectedNodeUuids.value.length > 0
      ? [...selectedNodeUuids.value]
      : (selectedNode.value ? [selectedNode.value.id] : [])

    if (nodeIds.length === 0) {
      ElMessage.warning('请先选择要复制的节点')
      return
    }

    // 过滤掉不能复制的节点（start/end/loopBodyCanvas）
    const copyableNodes = nodeIds.filter((id) => {
      const node = nodes.value.find((n) => n.id === id)
      return node && node.type !== 'start' && node.type !== 'end' && node.type !== 'loopBodyCanvas'
    })

    if (copyableNodes.length === 0) {
      ElMessage.warning('选中的节点不支持复制')
      return
    }

    // 深拷贝节点到剪贴板
    nodeClipboard.value = copyableNodes.map((id) => {
      const node = nodes.value.find((n) => n.id === id)
      return JSON.parse(JSON.stringify(node))
    })

    ElMessage.success(`已复制 ${nodeClipboard.value.length} 个节点`)
  }

  // 粘贴节点
  const pasteNodes = () => {
    if (nodeClipboard.value.length === 0) {
      ElMessage.warning('剪贴板为空')
      return
    }

    // 获取现有节点名称列表（用于去重）
    const existingNames = nodes.value.map((n) => n.name)

    // 创建新节点
    const newNodes = nodeClipboard.value.map((nodeData) => {
      const newNode = {
        ...nodeData,
        id: `${nodeData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: generateCopyName(nodeData.name, existingNames),
        x: nodeData.x + 30,
        y: nodeData.y + 30,
      }
      // 更新名称列表
      existingNames.push(newNode.name)
      return newNode
    })

    // 添加节点到画布
    newNodes.forEach((node) => {
      nodes.value.push(node)
    })

    // 选中新粘贴的节点
    selectedNodeUuids.value = newNodes.map((n) => n.id)
    selectedNode.value = newNodes[0]

    ElMessage.success(`已粘贴 ${newNodes.length} 个节点`)
  }

  // 剪切选中的节点
  const cutNodes = () => {
    const nodeIds = selectedNodeUuids.value.length > 0
      ? [...selectedNodeUuids.value]
      : (selectedNode.value ? [selectedNode.value.id] : [])

    if (nodeIds.length === 0) {
      ElMessage.warning('请先选择要剪切的节点')
      return
    }

    // 先复制
    copySelectedNodes()

    // 再删除（但不删除 start/end 节点）
    const cutableNodeIds = nodeIds.filter((id) => {
      const node = nodes.value.find((n) => n.id === id)
      return node && node.type !== 'start' && node.type !== 'end' && node.type !== 'loopBodyCanvas'
    })

    if (cutableNodeIds.length === 0) {
      return
    }

    // 删除节点
    nodes.value = nodes.value.filter((n) => !cutableNodeIds.includes(n.id))

    // 删除相关连线
    connections.value = connections.value.filter(
      (c) => !cutableNodeIds.includes(c.sourceId) && !cutableNodeIds.includes(c.targetId)
    )

    // 清空选择状态
    selectedNode.value = null
    selectedNodeUuids.value = []

    ElMessage.success(`已剪切 ${cutableNodeIds.length} 个节点`)
  }

  // 删除选中的节点（支持批量删除）
  const deleteSelectedNodes = async () => {
    // 获取要删除的节点 ID 列表
    const nodeIds = selectedNodeUuids.value.length > 0
      ? [...selectedNodeUuids.value]
      : (selectedNode.value ? [selectedNode.value.id] : [])

    if (nodeIds.length === 0) return

    // 检查是否包含 start/end 节点（不允许删除）
    const protectedNodes = nodeIds.filter((id) => {
      const node = nodes.value.find((n) => n.id === id)
      return node?.type === 'start' || node?.type === 'end'
    })

    if (protectedNodes.length > 0) {
      ElMessage.warning('开始和结束节点不能删除')
      return
    }

    // 处理循环节点和循环体画布的关联
    nodeIds.forEach((nodeId) => {
      const node = nodes.value.find((n) => n.id === nodeId)
      if (node?.type === 'loop') {
        const loopBodyId = getLoopBodyIdByLoopId(nodeId)
        if (loopBodyId) {
          // 删除循环体画布节点
          nodes.value = nodes.value.filter((n) => n.id !== loopBodyId)
          // 删除关联线
          associations.value = associations.value.filter((a) => a.sourceId !== nodeId)
        }
      }
      if (node?.type === 'loopBodyCanvas') {
        const loopId = node.belongsTo
        if (loopId) {
          // 删除关联线
          associations.value = associations.value.filter((a) => a.targetId !== nodeId)
        }
      }
    })

    // 删除节点
    nodes.value = nodes.value.filter((n) => !nodeIds.includes(n.id))

    // 删除相关连线（级联删除）
    connections.value = connections.value.filter(
      (c) => !nodeIds.includes(c.sourceId) && !nodeIds.includes(c.targetId)
    )

    // 清空选择状态
    selectedNode.value = null
    selectedNodeUuids.value = []

    ElMessage.success(`已删除 ${nodeIds.length} 个节点`)
  }

  // 兼容旧的单节点删除函数
  const deleteSelectedNode = () => {
    deleteSelectedNodes()
  }

  // 删除选中连线
  const deleteSelectedConnection = () => {
    if (!selectedConnection.value) return
    connections.value = connections.value.filter((c) => c.id !== selectedConnection.value.id)
    selectedConnection.value = null
  }

  return {
    // 状态
    nodeClipboard,

    // 方法
    selectAllNodes,
    copySelectedNodes,
    pasteNodes,
    cutNodes,
    deleteSelectedNodes,
    deleteSelectedNode,
    deleteSelectedConnection,
  }
}
