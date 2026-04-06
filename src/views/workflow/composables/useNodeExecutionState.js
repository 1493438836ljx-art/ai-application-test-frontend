/**
 * 节点执行状态管理 Composable
 * 管理工作流执行时节点的视觉状态
 */
import { ref, computed } from 'vue'

/**
 * 节点执行状态管理
 */
export function useNodeExecutionState() {
  // 节点执行状态映射 { nodeUuid: { status, startTime, endTime, outputs, errorMessage } }
  const nodeExecutions = ref({})

  // 是否正在执行
  const isExecuting = ref(false)

  // 当前正在执行的节点UUID
  const currentRunningNodeUuid = computed(() => {
    for (const [uuid, data] of Object.entries(nodeExecutions.value)) {
      if (data.status === 'RUNNING') {
        return uuid
      }
    }
    return null
  })

  /**
   * 获取节点执行状态
   * @param {string} nodeUuid - 节点UUID
   * @returns {string|null} 状态值
   */
  const getNodeStatus = (nodeUuid) => {
    return nodeExecutions.value[nodeUuid]?.status || null
  }

  /**
   * 批量更新节点执行状态（从API响应更新）
   * @param {Object|string} executions - 执行状态映射
   */
  const updateNodeExecutions = (executions) => {
    if (typeof executions === 'string') {
      try {
        executions = JSON.parse(executions)
      } catch (e) {
        console.error('解析节点执行状态失败:', e)
        return
      }
    }
    nodeExecutions.value = executions || {}
  }

  /**
   * 重置所有节点状态（重新执行前调用）
   */
  const resetNodeExecutions = () => {
    nodeExecutions.value = {}
    isExecuting.value = false
  }

  /**
   * 设置执行状态
   * @param {boolean} executing - 是否正在执行
   */
  const setExecuting = (executing) => {
    isExecuting.value = executing
  }

  /**
   * 获取节点状态CSS类名
   * @param {string} nodeUuid - 节点UUID
   * @returns {string} CSS类名
   */
  const getNodeStatusClass = (nodeUuid) => {
    const status = getNodeStatus(nodeUuid)
    if (!status) return ''
    return `status-${status.toLowerCase()}`
  }

  /**
   * 获取连线状态（基于源节点和目标节点的执行状态）
   * @param {string} sourceUuid - 源节点UUID
   * @param {string} targetUuid - 目标节点UUID
   * @returns {string} 连线状态：'active' | 'completed' | ''
   */
  const getConnectionStatus = (sourceUuid, targetUuid) => {
    const sourceStatus = getNodeStatus(sourceUuid)
    const targetStatus = getNodeStatus(targetUuid)

    // 如果目标节点正在执行，连线显示为活动状态（数据流动）
    if (targetStatus === 'RUNNING' && (sourceStatus === 'SUCCESS' || sourceStatus === 'RUNNING')) {
      return 'active'
    }

    // 如果两个节点都执行成功，连线显示为完成状态
    if (sourceStatus === 'SUCCESS' && targetStatus === 'SUCCESS') {
      return 'completed'
    }

    return ''
  }

  /**
   * 获取连线状态CSS类名
   * @param {string} sourceUuid - 源节点UUID
   * @param {string} targetUuid - 目标节点UUID
   * @returns {string} CSS类名
   */
  const getConnectionStatusClass = (sourceUuid, targetUuid) => {
    const status = getConnectionStatus(sourceUuid, targetUuid)
    if (!status) return ''
    return `connection-status-${status}`
  }

  return {
    nodeExecutions,
    isExecuting,
    currentRunningNodeUuid,
    getNodeStatus,
    updateNodeExecutions,
    resetNodeExecutions,
    setExecuting,
    getNodeStatusClass,
    getConnectionStatus,
    getConnectionStatusClass,
  }
}
