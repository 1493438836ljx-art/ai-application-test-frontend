import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { executeWorkflow, getExecutionDetail } from '@/api/workflow'

/**
 * 工作流执行功能 Composable
 * 管理工作流的运行、调试和发布功能
 *
 * @param {Object} options - 配置选项
 * @param {Object} options.workflow - 工作流信息对象
 * @param {Ref} options.nodes - 节点列表的 ref
 * @param {Ref} options.selectedNode - 当前选中的节点
 * @returns {Object} 工作流执行相关的状态和方法
 */
export function useWorkflowExecution(options = {}) {
  const {
    workflow = reactive({}),
    nodes = ref([]),
    selectedNode = ref(null),
  } = options

  // 运行状态
  const runState = reactive({
    isRunning: false,
    logs: [],
    currentStep: 0,
    totalSteps: 0,
  })

  // 调试状态
  const debugState = reactive({
    showDialog: false,
    currentNode: null,
    logs: [],
  })

  // 添加运行日志
  const addRunLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    runState.logs.push({
      id: Date.now(),
      type,
      message,
      timestamp,
    })
  }

  // 添加调试日志
  const addDebugLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    debugState.logs.push({
      id: Date.now(),
      type,
      message,
      timestamp,
    })
  }

  // 运行工作流
  const runWorkflow = async () => {
    runState.isRunning = true
    runState.logs = []
    runState.currentStep = 0
    runState.totalSteps = nodes.value.length

    addRunLog('info', '开始运行工作流...')
    addRunLog('info', `工作流名称: ${workflow.name}`)
    addRunLog('info', `节点总数: ${nodes.value.length}`)

    // 找到开始节点
    const startNode = nodes.value.find((n) => n.type === 'start')
    if (!startNode) {
      addRunLog('error', '未找到开始节点')
      runState.isRunning = false
      return
    }

    addRunLog('info', '正在提交到后端执行...')

    try {
      // 调用后端执行API
      const executionId = await executeWorkflow(workflow.id, {}, 'manual')
      addRunLog('success', `执行任务已提交，执行ID: ${executionId}`)

      // 轮询执行状态
      let completed = false
      let pollCount = 0
      const maxPolls = 60 // 最多轮询60次（约30秒）

      while (!completed && pollCount < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        pollCount++

        const execution = await getExecutionDetail(executionId)

        if (execution.status === 'SUCCESS') {
          completed = true
          addRunLog('success', '工作流执行成功')

          // 解析节点执行详情
          if (execution.nodeExecutions) {
            const nodeExecMap =
              typeof execution.nodeExecutions === 'string'
                ? JSON.parse(execution.nodeExecutions)
                : execution.nodeExecutions

            for (const [nodeUuid, nodeExec] of Object.entries(nodeExecMap)) {
              const node = nodes.value.find((n) => n.nodeUuid === nodeUuid)
              if (node) {
                if (nodeExec.status === 'SUCCESS') {
                  addRunLog('success', `节点 "${node.name}" 执行成功`)
                } else if (nodeExec.status === 'FAILED') {
                  addRunLog('error', `节点 "${node.name}" 执行失败: ${nodeExec.errorMessage || '未知错误'}`)
                }
              }
            }
          }

          workflow.hasRun = true
          runState.currentStep = runState.totalSteps
          ElMessage.success('工作流运行成功')
        } else if (execution.status === 'FAILED') {
          completed = true
          addRunLog('error', `工作流执行失败: ${execution.errorMessage || '未知错误'}`)
          ElMessage.error('工作流运行失败')
        } else if (execution.status === 'PARTIAL_SUCCESS') {
          completed = true
          addRunLog('warning', '工作流部分执行成功')

          // 解析节点执行详情
          if (execution.nodeExecutions) {
            const nodeExecMap =
              typeof execution.nodeExecutions === 'string'
                ? JSON.parse(execution.nodeExecutions)
                : execution.nodeExecutions

            for (const [nodeUuid, nodeExec] of Object.entries(nodeExecMap)) {
              const node = nodes.value.find((n) => n.nodeUuid === nodeUuid)
              if (node) {
                if (nodeExec.status === 'SUCCESS') {
                  addRunLog('success', `节点 "${node.name}" 执行成功`)
                } else if (nodeExec.status === 'FAILED') {
                  addRunLog('error', `节点 "${node.name}" 执行失败: ${nodeExec.errorMessage || '未知错误'}`)
                }
              }
            }
          }

          workflow.hasRun = true
          ElMessage.warning('工作流部分执行成功')
        }

        // 更新进度
        runState.currentStep = Math.min(
          Math.floor((pollCount / maxPolls) * runState.totalSteps),
          runState.totalSteps - 1
        )
      }

      if (!completed) {
        addRunLog('warning', '执行超时，请稍后刷新查看结果')
        ElMessage.warning('执行超时')
      }
    } catch (error) {
      addRunLog('error', `执行失败: ${error.message || '系统服务异常'}`)
      ElMessage.error('系统服务异常！')
    } finally {
      runState.isRunning = false
    }
  }

  // 运行工作流（带日志）
  const runWorkflowWithLogs = () => {
    runState.isRunning = true
    runState.logs = []
    runState.currentStep = 0
    runState.totalSteps = nodes.value.length

    addRunLog('info', '开始运行工作流...')
    addRunLog('info', `工作流名称: ${workflow.name}`)
    addRunLog('info', `节点总数: ${nodes.value.length}`)

    // 找到开始节点
    const startNode = nodes.value.find((n) => n.type === 'start')
    if (!startNode) {
      addRunLog('error', '未找到开始节点')
      runState.isRunning = false
      return
    }

    addRunLog('info', '正在初始化工作流...')

    // 模拟运行过程
    let delay = 500
    nodes.value.forEach((node, index) => {
      setTimeout(() => {
        runState.currentStep = index + 1
        addRunLog('info', `正在执行节点 [${index + 1}/${nodes.value.length}]: ${node.name}`)

        // 模拟每个节点的执行
        setTimeout(() => {
          if (node.type === 'start') {
            addRunLog('success', '开始节点初始化完成')
          } else if (node.type === 'end') {
            addRunLog('success', '工作流执行完成')
            workflow.hasRun = true
            runState.isRunning = false
          } else {
            addRunLog('success', `节点 "${node.name}" 执行成功`)
          }
        }, 300)
      }, delay)
      delay += 800
    })
  }

  // 停止运行
  const stopRun = () => {
    runState.isRunning = false
    addRunLog('warning', '工作流运行已停止')
  }

  // 清空运行日志
  const clearRunLogs = () => {
    runState.logs = []
  }

  // 调试节点
  const debugNode = () => {
    if (!selectedNode.value) return

    debugState.showDialog = true
    debugState.currentNode = selectedNode.value
    debugState.logs = []

    // 添加调试开始日志
    addDebugLog('info', `开始调试节点: ${selectedNode.value.name}`)

    // 模拟调试过程
    setTimeout(() => {
      addDebugLog('info', '正在初始化节点配置...')
    }, 300)

    setTimeout(() => {
      addDebugLog('info', `节点类型: ${selectedNode.value.type}`)
      if (selectedNode.value.config) {
        addDebugLog('info', `配置参数: ${JSON.stringify(selectedNode.value.config)}`)
      }
    }, 600)

    setTimeout(() => {
      addDebugLog('info', '正在执行节点逻辑...')
    }, 1000)

    setTimeout(() => {
      addDebugLog('success', `节点 "${selectedNode.value.name}" 执行完成`)
    }, 1500)
  }

  // 停止调试
  const stopDebug = () => {
    debugState.showDialog = false
    debugState.currentNode = null
  }

  // 清空调试日志
  const clearDebugLogs = () => {
    debugState.logs = []
  }

  // 发布工作流
  const publishWorkflow = () => {
    if (!workflow.hasRun) {
      ElMessage.warning('请先运行工作流')
      return
    }

    ElMessageBox.confirm('确定要发布此工作流吗？发布后可在任务管理中创建执行任务。', '确认发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
      .then(() => {
        workflow.published = true
        ElMessage.success('工作流发布成功')
      })
      .catch(() => {
        // 用户取消
      })
  }

  return {
    // 运行状态
    runState,
    debugState,

    // 运行方法
    runWorkflow,
    runWorkflowWithLogs,
    stopRun,
    clearRunLogs,
    addRunLog,

    // 调试方法
    debugNode,
    stopDebug,
    clearDebugLogs,
    addDebugLog,

    // 发布方法
    publishWorkflow,
  }
}
