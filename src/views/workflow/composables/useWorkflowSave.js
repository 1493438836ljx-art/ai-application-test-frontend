import { ref, reactive, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getWorkflowDetail, saveWorkflowData, createWorkflow } from '@/api/workflow.js'

/**
 * 工作流保存功能 Composable
 * 管理工作流的保存、加载和数据转换
 *
 * @param {Object} options - 配置选项
 * @param {Object} options.workflow - 工作流信息对象（reactive）
 * @param {Ref} options.nodes - 节点列表的 ref
 * @param {Ref} options.connections - 连线列表的 ref
 * @param {Ref} options.associations - 关联线列表的 ref
 * @param {Ref} options.loopBodyCanvasRefs - 循环体画布组件引用
 * @param {Function} options.parseJsonField - 解析JSON字段
 * @returns {Object} 工作流保存相关的状态和方法
 */
export function useWorkflowSave(options = {}) {
  const {
    workflow = reactive({}),
    nodes = ref([]),
    connections = ref([]),
    associations = ref([]),
    loopBodyCanvasRefs = ref({}),
    parseJsonField = (field, defaultValue) => defaultValue,
  } = options

  const router = useRouter()
  const route = useRoute()

  // 保存状态
  const saveState = reactive({
    isSaving: false,
    lastSavedAt: null,
  })

  // 返回列表
  const goBack = () => {
    router.push('/workflow')
  }

  // 构建节点保存数据
  const buildNodesData = () => {
    return nodes.value.map((node) => {
      // 基础节点数据
      const baseNode = {
        nodeUuid: node.id,
        type: node.type,
        name: node.name,
        positionX: Math.round(node.x),
        positionY: Math.round(node.y),
        inputPorts: JSON.stringify(node.inputs || []),
        outputPorts: JSON.stringify(node.outputs || []),
        inputParams: JSON.stringify(node.inputParams || []),
        outputParams: JSON.stringify(node.outputParams || []),
        config: JSON.stringify(node.config || {}),
        parentNodeUuid: node.parentNodeId || null,
      }

      // 如果是循环体节点，添加完整属性（包含内部画布的完整数据）
      if (node.type === 'loopBodyCanvas') {
        // 获取循环体画布的引用
        const loopBodyCanvasRef = loopBodyCanvasRefs.value[node.id]
        let loopBodyData = node.loopBody || null

        // 如果有画布组件引用，获取最新的内部节点和连线数据
        if (loopBodyCanvasRef && loopBodyCanvasRef.getLoopBodyData) {
          loopBodyData = loopBodyCanvasRef.getLoopBodyData()
        }

        baseNode.config = JSON.stringify({
          ...node.config,
          width: node.width || 500,
          height: node.height || 400,
          belongsTo: node.belongsTo,
          // 循环体完整数据：包含内部节点、连线、端口配置
          loopBody: loopBodyData ? {
            canvas: loopBodyData.canvas || { scale: 1, offsetX: 0, offsetY: 0 },
            nodes: (loopBodyData.nodes || []).map((innerNode) => ({
              id: innerNode.id,
              type: innerNode.type,
              name: innerNode.name,
              x: innerNode.x,
              y: innerNode.y,
              inputs: innerNode.inputs || [],
              outputs: innerNode.outputs || [],
              inputParams: innerNode.inputParams || [],
              outputParams: innerNode.outputParams || [],
              config: innerNode.config || {},
            })),
            connections: (loopBodyData.connections || []).map((innerConn) => ({
              id: innerConn.id,
              sourceId: innerConn.sourceId,
              sourcePort: innerConn.sourcePort,
              targetId: innerConn.targetId,
              targetPort: innerConn.targetPort,
              sourceParamIndex: innerConn.sourceParamIndex,
              targetParamIndex: innerConn.targetParamIndex,
            })),
            leftPort: loopBodyData.leftPort || { id: 'port-left', name: '输入', type: 'input', y: 200, params: [] },
            rightPort: loopBodyData.rightPort || { id: 'port-right', name: '输出', type: 'output', y: 200, params: [] },
          } : null,
        })
      }

      return baseNode
    })
  }

  // 构建连线保存数据
  const buildConnectionsData = () => {
    return connections.value.map((conn) => ({
      connectionUuid: conn.id,
      sourceNodeUuid: conn.sourceId,
      sourcePortId: conn.sourcePort,
      targetNodeUuid: conn.targetId,
      targetPortId: conn.targetPort,
      sourceParamIndex: conn.sourceParamIndex || null,
      targetParamIndex: conn.targetParamIndex || null,
      label: conn.label || null,
    }))
  }

  // 构建关联保存数据
  const buildAssociationsData = () => {
    return associations.value.map((assoc) => ({
      loopNodeUuid: assoc.sourceId,
      bodyNodeUuid: assoc.targetId,
      associationType: assoc.associationType || 'LOOP',
    }))
  }

  // 保存工作流
  const saveWorkflow = async () => {
    if (saveState.isSaving) {
      ElMessage.warning('正在保存中，请稍候...')
      return
    }

    saveState.isSaving = true
    try {
      // 构建保存数据
      const nodesData = buildNodesData()
      const connectionsData = buildConnectionsData()
      const associationsData = buildAssociationsData()

      const saveData = {
        nodes: nodesData,
        connections: connectionsData,
        associations: associationsData,
      }

      // 判断是新建还是更新
      const workflowId = workflow.id
      const isNewWorkflow = workflowId === 'new' || !workflowId

      if (isNewWorkflow) {
        // 创建工作流（一次性保存完整数据）
        const createResponse = await createWorkflow({
          name: workflow.name,
          description: workflow.description || '',
          createdBy: workflow.createdBy || 'admin',
          nodes: nodesData,
          connections: connectionsData,
          associations: associationsData,
        })
        if (createResponse && createResponse.data) {
          workflow.id = createResponse.data.id
          // 更新 URL 为工作流 ID，这样刷新页面时能正确加载
          router.replace(`/workflow/${createResponse.data.id}?projectName=${encodeURIComponent(workflow.name)}`)
        }
      } else {
        // 更新工作流数据
        await saveWorkflowData(workflowId, saveData)
      }

      saveState.lastSavedAt = new Date()
      ElMessage.success('保存成功')
    } catch (error) {
      console.error('保存工作流失败:', error)
      ElMessage.error('保存失败')
    } finally {
      saveState.isSaving = false
    }
  }

  // 加载工作流数据
  const loadWorkflowData = async () => {
    if (route.params.id === 'new') return // 新建工作流不需要加载

    try {
      const response = await getWorkflowDetail(route.params.id)

      if (response) {
        // 更新工作流基本信息
        workflow.id = response.id
        workflow.name = response.name
        workflow.description = response.description || ''
        workflow.published = response.published || false
        workflow.hasRun = response.hasRun || false

        // 映射后端返回的节点数据到前端格式
        if (response.nodes && Array.isArray(response.nodes)) {
          const nodeIdMap = {}

          // 首先建立ID映射
          response.nodes.forEach((node) => {
            nodeIdMap[node.id] = node.nodeUuid
          })

          nodes.value = response.nodes.map((node) => {
            // 获取节点类型配置（用于后续扩展）
            // const typeConfig = getNodeTypeConfig(node.type)
            let nodeConfig = {}

            // 解析配置
            if (node.config) {
              try {
                nodeConfig = typeof node.config === 'string' ? JSON.parse(node.config) : node.config
              } catch {
                nodeConfig = {}
              }
            }

            const baseNode = {
              id: node.nodeUuid,
              type: node.type,
              name: node.name,
              x: node.positionX,
              y: node.positionY,
              inputs: parseJsonField(node.inputPorts, []),
              outputs: parseJsonField(node.outputPorts, []),
              inputParams: parseJsonField(node.inputParams, []),
              outputParams: parseJsonField(node.outputParams, []),
              config: nodeConfig,
            }

            // 如果是循环体节点，添加完整属性
            if (node.type === 'loopBodyCanvas') {
              baseNode.width = nodeConfig.width || 500
              baseNode.height = nodeConfig.height || 400
              baseNode.belongsTo = nodeConfig.belongsTo

              // 添加循环体内部画布数据
              if (nodeConfig.loopBody) {
                baseNode.loopBody = nodeConfig.loopBody
              } else {
                baseNode.loopBody = {
                  canvas: { scale: 1, offsetX: 0, offsetY: 0 },
                  nodes: [],
                  connections: [],
                  leftPort: { id: 'port-left', name: '输入', type: 'input', y: 200, params: [] },
                  rightPort: { id: 'port-right', name: '输出', type: 'output', y: 200, params: [] },
                }
              }
            }

            // 如果是循环节点，添加默认的 outputParams
            if (node.type === 'loop') {
              if (baseNode.outputParams.length === 0) {
                baseNode.outputParams = [
                  { name: 'current_item', type: 'Any' },
                  { name: 'current_index', type: 'Number' }
                ]
              }
            }

            return baseNode
          })

          // 映射后端返回的连接数据到前端格式
          if (response.connections && Array.isArray(response.connections)) {
            connections.value = response.connections.map((conn, index) => ({
              id: conn.connectionUuid || `conn-${Date.now() + index}`,
              sourceId: nodeIdMap[conn.sourceNodeId] || conn.sourceNodeId,
              sourcePort: conn.sourcePortId,
              targetId: nodeIdMap[conn.targetNodeId] || conn.targetNodeId,
              targetPort: conn.targetPortId,
              sourceParamIndex: conn.sourceParamIndex,
              targetParamIndex: conn.targetParamIndex,
              config: {}
            }))
          }

          // 映射后端返回的关联数据到前端格式
          if (response.associations && Array.isArray(response.associations)) {
            associations.value = response.associations.map((assoc, index) => ({
              id: `assoc-${index}`,
              sourceId: nodeIdMap[assoc.containerNodeUuid] || assoc.containerNodeUuid,
              targetId: nodeIdMap[assoc.bodyNodeUuid] || assoc.bodyNodeUuid,
              associationType: assoc.associationType,
              config: {}
            }))
          }
        }
      }

      // 强制触发响应式更新
      const tempNodes = [...nodes.value]
      nodes.value = []
      await nextTick()
      nodes.value = tempNodes

      // 触发连线重新渲染
      await nextTick()
      if (connections.value.length > 0) {
        const temp = [...connections.value]
        connections.value = temp
      }

      console.log('工作流数据已加载，节点数量:', nodes.value.length)
    } catch (error) {
      console.error('加载工作流失败:', error)
      ElMessage.error('加载工作流失败')
    }
  }

  return {
    // 状态
    saveState,

    // 方法
    goBack,
    saveWorkflow,
    loadWorkflowData,
    buildNodesData,
    buildConnectionsData,
    buildAssociationsData,
  }
}
