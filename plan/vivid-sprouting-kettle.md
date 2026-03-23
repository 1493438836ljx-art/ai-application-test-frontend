# 循环节点功能重新设计 - 实现计划

## Context

当前工作流编排系统中的循环节点功能需要重新设计。目标是：

1. **循环节点保持紧凑**：与其他节点大小一致，不因为内部内容而变大
2. **循环体内容可视化**：通过关联的独立画布展示循环体内的节点和连线
3. **数据流清晰**：通过端口和连线明确数据的流动路径

### 最终确认的设计方案

```
主画布布局：
┌─────┐
│ 节点 │
└──┬──┘
   │ 普通连线
   ▼
┌─────────────────┐
│   循环(loop-1)   │    ← 循环节点（与其他节点大小一致）
│ 次数:5 数组:data │
└────┬─────────────┘
     │ ····· (关联虚线)
     ▼
┌─────────────────────────────────────────────┐
│        循环体 (loop-1)                       │
│  ○  ┌─────────────────────────────────┐  ●  │
│  左  │                                 │  右 │
│  侧  │          [子画布]                │  侧 │
│  端  │                                 │  端 │
│  口  │   ┌───┐    ┌───┐               │  口 │
│  接  │   │ A │───│ B │               │  输 │
│  收  │   └───┘    └───┘               │  出 │
│      │                                 │     │
│  ○  │                                 │  ●  │
└──────┴─────────────────────────────────┴─────┘

数据流：
循环节点输入 → 画布左侧端口（数据源）
              ↓（自动创建连线）
        循环体内第一个节点的输入
              ↓
        循环体内节点执行
              ↓（用户拖拽创建连线）
        画布右侧端口（输出目的地）
              ↓
        循环节点输出
```

## 实现计划

### 一、数据结构设计

#### 1.1 扩展主画布节点数据

```javascript
// 循环节点（保持现有结构，更新 config）
{
  id: 'loop-1',
  type: 'loop',
  name: '循环',
  x: 100, y: 100,
  inputs: [{ id: 'in-1', name: '输入' }],
  outputs: [{ id: 'out-1', name: '输出' }],
  config: {
    loopCount: 5,              // 循环次数
    arrayVariable: 'data',      // 循环数组变量名
    arrayElementType: 'string', // 数组元素类型
  },
}

// 循环体画布节点（新增类型）
{
  id: 'loopBody-1',
  type: 'loopBodyCanvas',
  name: '循环体',
  x: 100, y: 400,
  width: 500,
  height: 400,
  belongsTo: 'loop-1',  // 所属循环节点ID
  loopBody: {
    canvas: { scale: 1, offsetX: 0, offsetY: 0 },
    nodes: [],           // 循环体内的节点
    connections: [],     // 循环体内的连线
    leftPort: {          // 左侧端口（数据源）
      id: 'port-left',
      name: '数据源',
      type: 'input',
      x: 0,
      y: 200,
      params: [],
    },
    rightPort: {         // 右侧端口（输出目的地）
      id: 'port-right',
      name: '输出目的地',
      type: 'output',
      x: 500,
      y: 200,
      params: [],
    },
  },
}

// 关联线（区别于普通连线）
const associations = ref([
  {
    id: 'assoc-1',
    sourceId: 'loop-1',
    targetId: 'loopBody-1',
    type: 'loop',
  },
])
```

#### 1.2 循环体内部连线数据结构

```javascript
// 循环体内连线
{
  id: 'body-conn-1',
  sourceId: 'port-left',  // 左侧端口ID 或 循环体内节点ID
  sourcePort: 'port-left',
  targetId: 'body-node-1',
  targetPort: 'in-1',
  sourceParamIndex: 0,
  targetParamIndex: 0,
  isInternal: true,  // 标记为循环体内部连线
  isAutoCreated: true, // 标记为自动创建（第一个节点时）
}
```

### 二、需要新建的文件

#### 2.1 `src/views/workflow/composables/useLoopBody.js`
```javascript
/**
 * 循环体画布逻辑 Composable
 * 管理循环体内的节点、连线、端口状态
 */
export function useLoopBody(loopBodyNode, loopNode, parentNodes) {
  // 循环体画布状态
  const loopBodyCanvas = reactive({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  // 循环体节点列表
  const bodyNodes = ref(loopBodyNode?.loopBody?.nodes || [])

  // 循环体连线列表
  const bodyConnections = ref(loopBodyNode?.loopBody?.connections || [])

  // 左侧端口（数据源）
  const leftPort = reactive({
    id: 'port-left',
    name: '数据源',
    type: 'input',
    params: [],
  })

  // 右侧端口（输出目的地）
  const rightPort = reactive({
    id: 'port-right',
    name: '输出目的地',
    type: 'output',
    params: [],
  })

  // 添加循环体节点（自动创建左侧端口→节点的连线）
  const addBodyNode = (type) => {
    // 创建新节点
    const newNode = { /* ... */ }
    bodyNodes.value.push(newNode)

    // 第一个节点，自动创建左侧端口→节点的连线
    if (bodyNodes.value.length === 1) {
      const autoConnection = {
        id: `auto-conn-${Date.now()}`,
        sourceId: leftPort.id,
        targetId: newNode.id,
        isAutoCreated: true,
      }
      bodyConnections.value.push(autoConnection)
    }

    saveLoopBodyState()
  }

  // 创建循环体内部连线（支持边界检查）
  const createBodyConnection = (sourceId, targetId) => {
    // 验证：只能在循环体内部创建连线
    // 允许：左侧端口→节点、节点→节点、节点→右侧端口
    const validation = validateLoopBodyConnection(sourceId, targetId)
    if (!validation.valid) {
      ElMessage.warning(validation.error)
      return
    }

    const newConnection = { /* ... */ }
    bodyConnections.value.push(newConnection)
    saveLoopBodyState()
  }

  // 保存循环体状态到父节点
  const saveLoopBodyState = () => {
    loopBodyNode.value.loopBody = {
      canvas: { ...loopBodyCanvas },
      nodes: JSON.parse(JSON.stringify(bodyNodes.value)),
      connections: JSON.parse(JSON.stringify(bodyConnections.value)),
      leftPort: { ...leftPort },
      rightPort: { ...rightPort },
    }
  }

  return {
    loopBodyCanvas,
    bodyNodes,
    bodyConnections,
    leftPort,
    rightPort,
    addBodyNode,
    createBodyConnection,
    saveLoopBodyState,
  }
}
```

#### 2.2 `src/views/workflow/composables/useAssociations.js`
```javascript
/**
 * 关联线逻辑 Composable
 * 管理循环节点与循环体画布之间的虚线关联
 */
export function useAssociations(associations, nodes, getLoopBodyNodes) {
  // 计算关联线路径（虚线）
  const getAssociationPath = (association) => {
    const sourceNode = nodes.value.find((n) => n.id === association.sourceId)
    const targetNode = getLoopBodyNodes.value?.find((n) => n.id === association.targetId)

    if (!sourceNode || !targetNode) return ''

    const x1 = sourceNode.x + 220  // 循环节点右侧边缘
    const y1 = sourceNode.y + 50   // 循环节点垂直居中
    const x2 = targetNode.x          // 循环体画布左侧
    const y2 = targetNode.y + 200  // 循环体画布垂直居中

    // 虚线路径
    const midX = x1 + 30
    const midY = y1 + (y2 - y1) / 2

    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${midY} L ${x2 - 20} ${midY} L ${x2 - 20} ${y2} L ${x2} ${y2}`
  }

  // 创建关联线
  const createAssociation = (sourceId, targetId) => {
    associations.value.push({
      id: `assoc-${Date.now()}`,
      sourceId,
      targetId,
      type: 'loop',
    })
  }

  // 删除关联线（同时删除循环体画布）
  const deleteAssociation = (associationId) => {
    const assoc = associations.value.find((a) => a.id === associationId)
    if (assoc) {
      associations.value = associations.value.filter((a) => a.id !== associationId)
      return assoc.targetId // 返回循环体画布ID，用于删除
    }
  }

  return {
    getAssociationPath,
    createAssociation,
    deleteAssociation,
  }
}
```

#### 2.3 `src/views/workflow/components/LoopBodyCanvas.vue`
```vue
<template>
  <div
    class="loop-body-canvas"
    :style="{
      left: loopBodyNode.x + 'px',
      top: loopBodyNode.y + 'px',
      width: loopBodyNode.width + 'px',
      height: loopBodyNode.height + 'px',
    }"
    :data-node-id="loopBodyNode.id"
  >
    <!-- 标题栏 -->
    <div class="loop-body-header">
      <span>{{ loopBodyNode.name }}</span>
      <span class="belongs-to">({{ loopNode?.name }})</span>
    </div>

    <!-- 左侧端口 -->
    <LoopBodyPort
      :port="leftPort"
      :is-left="true"
      :canvas="loopBodyCanvas"
      @port-drag-start="handlePortDragStart"
    />

    <!-- 右侧端口 -->
    <LoopBodyPort
      :port="rightPort"
      :is-left="false"
      :canvas="loopBodyCanvas"
      @port-drag-start="handlePortDragStart"
    />

    <!-- 子画布区域 -->
    <div class="loop-body-workspace">
      <!-- 循环体内节点 -->
      <div
        v-for="node in bodyNodes"
        :key="node.id"
        class="loop-body-node"
        :style="{
          left: (node.x + loopBodyCanvas.offsetX) + 'px',
          top: (node.y + loopBodyCanvas.offsetY) + 'px',
        }"
        :data-node-id="node.id"
        @mousedown="startDragNode($event, node)"
      >
        {{ node.name }}
        <!-- 节点输入/输出端口 -->
        <div v-for="(input, idx) in node.inputs" :key="'in-' + idx" class="port input-port"></div>
        <div v-for="(output, idx) in node.outputs" :key="'out-' + idx" class="port output-port"></div>
      </div>

      <!-- 循环体内连线 SVG -->
      <svg
        class="loop-body-connections"
        :width="loopBodyNode.width"
        :height="loopBodyNode.height"
      >
        <path
          v-for="conn in bodyConnections"
          :key="conn.id"
          :d="getBodyConnectionPath(conn)"
          class="connection-path"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import LoopBodyPort from './LoopBodyPort.vue'
import { useLoopBody } from '../composables/useLoopBody'

const props = defineProps({
  loopBodyNode: Object,
  loopNode: Object,
  parentNodes: Array,
})

const emit = defineEmits(['port-drag-start', 'node-select'])

const {
  loopBodyCanvas,
  bodyNodes,
  bodyConnections,
  leftPort,
  rightPort,
  addBodyNode,
  saveLoopBodyState,
} = useLoopBody(props.loopBodyNode, props.loopNode, props.parentNodes)

// 获取循环体内部连线路径
const getBodyConnectionPath = (connection) => {
  // 实现类似主画布的贝塞尔曲线路径计算
  // ...
}
</script>

<style scoped>
.loop-body-canvas {
  position: absolute;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background: #f8fafc;
  z-index: 10;
}

.loop-body-header {
  padding: 8px 12px;
  background: #3b82f6;
  color: white;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
}

.belongs-to {
  opacity: 0.8;
  font-size: 12px;
}

.loop-body-workspace {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
                    linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
}

.loop-body-node {
  position: absolute;
  width: 220px;
  padding: 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: move;
}

.port {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  cursor: crosshair;
}

.input-port { left: -5px; top: 50%; transform: translateY(-50%); }
.output-port { right: -5px; top: 50%; transform: translateY(-50%); }

.loop-body-connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-path {
  fill: none;
  stroke: #6b7280;
  stroke-width: 2;
}
</style>
```

#### 2.4 `src/views/workflow/components/LoopBodyPort.vue`
```vue
<template>
  <div
    class="loop-body-port"
    :class="{ 'left-port': isLeft, 'right-port': !isLeft }"
    :style="{
      left: isLeft ? '0' : 'auto',
      right: isLeft ? 'auto' : '0',
      top: (port.y + canvas.offsetY) + 'px',
    }"
    @mousedown="handlePortMouseDown"
  >
    <div class="port-icon"></div>
    <div class="port-name">{{ port.name }}</div>
    <!-- 参数列表 -->
    <div v-if="port.params && port.params.length > 0" class="port-params">
      <div v-for="(param, idx) in port.params" :key="idx" class="param-item">
        <span class="param-name">{{ param.name }}</span>
        <span class="param-type">{{ formatType(param) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  port: Object,
  isLeft: Boolean,
  canvas: Object,
})

const emit = defineEmits(['port-drag-start'])

const handlePortMouseDown = (event) => {
  emit('port-drag-start', event, props.port, props.isLeft)
}

const formatType = (param) => {
  // 格式化参数类型显示
  return param.type
}
</script>

<style scoped>
.loop-body-port {
  position: absolute;
  width: 140px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  padding: 8px;
  z-index: 20;
}

.left-port {
  border-left: none;
  border-radius: 0 6px 6px 0;
}

.right-port {
  border-right: none;
  border-radius: 6px 0 0 6px;
}

.port-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  margin-bottom: 4px;
}

.port-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.port-params {
  margin-top: 6px;
  border-top: 1px solid #e5e7eb;
  padding-top: 4px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
}
</style>
```

### 三、需要修改的文件

#### 3.1 `src/views/workflow/config/workflowConfig.js`
**修改内容**：添加循环体画布节点类型
```javascript
// 在 nodeTypes 数组中添加（不在弹窗中显示的类别）
{ type: 'loopBodyCanvas', name: '循环体', icon: 'Grid', color: '#3b82f6', category: 'special' }
```

#### 3.2 `src/views/workflow/composables/useWorkflowState.js`
**修改内容**：添加关联线状态和循环体画布节点获取
```javascript
// 添加关联线状态
const associations = ref([])

// 添加获取循环体画布节点的 computed
const getLoopBodyNodes = computed(() => {
  return nodes.value.filter((n) => n.type === 'loopBodyCanvas')
})

// 修改删除节点逻辑，删除循环节点时同时删除关联线和循环体画布
const deleteSelectedNode = () => {
  if (!selectedNode.value) return

  const nodeId = selectedNode.value.id

  // 如果是循环节点，删除关联的循环体画布
  if (selectedNode.value.type === 'loop') {
    const assoc = associations.value.find((a) => a.sourceId === nodeId)
    if (assoc) {
      // 删除循环体画布节点
      nodes.value = nodes.value.filter((n) => n.id !== assoc.targetId)
      // 删除关联线
      associations.value = associations.value.filter((a) => a.id !== assoc.id)
    }
  }

  nodes.value = nodes.value.filter((n) => n.id !== nodeId)
  connections.value = connections.value.filter(
    (c) => c.sourceId !== nodeId && c.targetId !== nodeId
  )
  selectedNode.value = null
}

// 在 return 中添加
return {
  // ... 原有导出
  associations,
  getLoopBodyNodes,
}
```

#### 3.3 `src/views/workflow/composables/useNodes.js`
**修改内容**：添加循环节点时自动创建循环体画布和关联线
```javascript
// 修改 addNode 函数，添加循环节点特殊处理
const addNode = (type) => {
  const newNode = { /* ... 创建节点逻辑 ... */ }

  nodes.value.push(newNode)

  // 如果是循环节点，自动创建循环体画布和关联线
  if (type === 'loop') {
    const loopBodyCanvas = {
      id: `loopBody-${newNode.id}`,
      type: 'loopBodyCanvas',
      name: '循环体',
      x: newNode.x,
      y: newNode.y + 300,
      width: 500,
      height: 400,
      belongsTo: newNode.id,
      loopBody: {
        canvas: { scale: 1, offsetX: 0, offsetY: 0 },
        nodes: [],
        connections: [],
        leftPort: {
          id: 'port-left',
          name: '数据源',
          type: 'input',
          params: [
            { name: 'times', type: 'Number', description: '循环次数' },
            { name: 'cycle_array', type: 'Array', description: '循环数组' },
          ],
        },
        rightPort: {
          id: 'port-right',
          name: '输出目的地',
          type: 'output',
          params: [],
        },
      },
    }
    nodes.value.push(loopBodyCanvas)

    // 创建关联线
    const associations = /* 需要从外部传入或通过参数获取 */
    associations.push({
      id: `assoc-${newNode.id}`,
      sourceId: newNode.id,
      targetId: loopBodyCanvas.id,
      type: 'loop',
    })
  }

  selectedNode.value = newNode
}
```

#### 3.4 `src/views/workflow/composables/useConnections.js`
**修改内容**：添加循环体端口连线路径计算和边界检查
```javascript
// 新增：获取循环体端口位置
const getLoopBodyPortPosition = (portId, portType, loopBodyNode) => {
  if (!loopBodyNode) return null

  const bodyCanvas = loopBodyNode.loopBody?.canvas
  const port = portType === 'input'
    ? loopBodyNode.loopBody?.leftPort
    : loopBodyNode.loopBody?.rightPort

  if (!port) return null

  return {
    x: (port.x || (portType === 'input' ? 0 : 500)) + (bodyCanvas?.offsetX || 0),
    y: (port.y || 200) + (bodyCanvas?.offsetY || 0),
  }
}

// 修改：getConnectionPath 支持循环体端口
const getConnectionPath = (connection) => {
  const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
  const targetNode = nodes.value.find((n) => n.id === connection.targetId)

  if (!sourceNode || !targetNode) return ''

  // 检查是否是循环体端口
  let x1, y1, x2, y2

  // 源是循环体端口
  if (connection.sourceId.startsWith('port-')) {
    const loopBodyNode = nodes.value.find((n) => n.loopBody?.leftPort?.id === connection.sourceId)
    const pos = getLoopBodyPortPosition(connection.sourceId, 'input', loopBodyNode)
    if (pos) {
      x1 = pos.x + loopBodyNode.x
      y1 = pos.y + loopBodyNode.y
    }
  } else {
    // 原有逻辑
    // ...
  }

  // 目标是循环体端口
  if (connection.targetId.startsWith('port-')) {
    const loopBodyNode = nodes.value.find((n) => n.loopBody?.rightPort?.id === connection.targetId)
    const pos = getLoopBodyPortPosition(connection.targetId, 'output', loopBodyNode)
    if (pos) {
      x2 = pos.x + loopBodyNode.x
      y2 = pos.y + loopBodyNode.y
    }
  } else {
    // 原有逻辑
    // ...
  }

  // 贝塞尔曲线路径计算
  const distance = Math.abs(x2 - x1)
  const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`
}

// 新增：循环体连线边界检查
const validateLoopBodyConnection = (sourceId, targetId, loopBodyNode) => {
  if (!loopBodyNode?.loopBody) return { valid: false }

  const { leftPort, rightPort } = loopBodyNode.loopBody
  const bodyNodeIds = loopBodyNode.loopBody.nodes.map((n) => n.id)

  // 允许的连接
  const validSources = [leftPort.id, ...bodyNodeIds]
  const validTargets = [rightPort.id, ...bodyNodeIds]

  if (!validSources.includes(sourceId) || !validTargets.includes(targetId)) {
    return { valid: false, error: '只能在循环体内部创建连线' }
  }

  // 右侧端口不能作为源
  if (sourceId === rightPort.id) {
    return { valid: false, error: '输出端口只能作为连接目标' }
  }

  return { valid: true }
}

// 在 return 中添加
return {
  // ... 原有导出
  getLoopBodyPortPosition,
  validateLoopBodyConnection,
}
```

#### 3.5 `src/views/workflow/WorkflowEditorView.vue`
**修改内容**：
1. 导入新增的 composable 和组件
2. 集成关联线渲染（虚线）
3. 集成循环体画布渲染
4. 添加创建循环节点时自动创建循环体画布和关联线的逻辑

```vue
<template>
  <!-- 主画布 SVG 层 -->
  <svg class="connections-layer" :width="canvas.width" :height="canvas.height">
    <!-- 普通连线 -->
    <path
      v-for="conn in connections"
      :key="conn.id"
      :d="getConnectionPath(conn)"
      class="connection-path"
      :class="{ selected: selectedConnection?.id === conn.id }"
      @click="selectConnection(conn, $event)"
      @contextmenu="showConnectionContextMenu(conn, $event)"
      @mouseenter="handleConnectionMouseEnter(conn)"
      @mouseleave="handleConnectionMouseLeave"
    />
    <!-- 关联线（虚线） -->
    <path
      v-for="assoc in associations"
      :key="assoc.id"
      :d="getAssociationPath(assoc)"
      class="association-path"
      stroke-dasharray="5,5"
      stroke="#3b82f6"
    />
    <!-- 临时连线 -->
    <path
      v-if="drawingConnection"
      :d="tempConnectionPath"
      class="temp-connection-path"
    />
  </svg>

  <!-- 主画布 DOM 层 -->
  <div class="nodes-layer">
    <!-- 普通节点（包括循环节点） -->
    <div
      v-for="node in nodes.filter(n => n.type !== 'loopBodyCanvas')"
      :key="node.id"
      class="node"
      :style="{ left: node.x + 'px', top: node.y + 'px' }"
      :data-node-id="node.id"
      @mousedown="startDragNode($event, node)"
      @contextmenu="showContextMenu(node, $event)"
    >
      <!-- 节点内容渲染 -->
    </div>

    <!-- 循环体画布 -->
    <LoopBodyCanvas
      v-for="loopBodyNode in getLoopBodyNodes"
      :key="loopBodyNode.id"
      :loop-body-node="loopBodyNode"
      :loop-node="nodes.find(n => n.id === loopBodyNode.belongsTo)"
      :parent-nodes="nodes"
    />
  </div>
</template>

<script setup>
// 导入新增的内容
import { useAssociations } from './composables/useAssociations'
import LoopBodyCanvas from './components/LoopBodyCanvas.vue'

// 获取关联线逻辑
const { getAssociationPath } = useAssociations(associations, nodes, getLoopBodyNodes)
</script>

<style scoped>
/* 关联线样式 */
.association-path {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  opacity: 0.5;
  pointer-events: none;
}
</style>
```

### 四、实现步骤

#### Phase 1: 基础架构（核心）
1. 修改 `workflowConfig.js`，添加 `loopBodyCanvas` 节点类型
2. 修改 `useWorkflowState.js`，添加 `associations` 状态和 `getLoopBodyNodes` computed
3. 创建 `useAssociations.js`，实现关联线逻辑

#### Phase 2: 组件开发
4. 创建 `LoopBodyPort.vue` 组件（左右端口）
5. 创建 `LoopBodyCanvas.vue` 组件（循环体画布）
6. 在 LoopBodyCanvas 中集成端口渲染和子画布逻辑

#### Phase 3: Composable 逻辑
7. 创建 `useLoopBody.js`，实现循环体画布状态管理
8. 实现自动连线逻辑（第一个节点自动连接左侧端口）
9. 实现边界检查逻辑（循环体内外隔离）

#### Phase 4: 主画布集成
10. 修改 `useNodes.js`，添加循环节点时自动创建循环体画布和关联线
11. 修改 `useConnections.js`，支持循环体端口连线路径计算
12. 修改 `WorkflowEditorView.vue`，集成循环体画布渲染和关联线渲染

#### Phase 5: 状态同步
13. 实现循环体状态保存到父节点的逻辑
14. 实现循环节点参数变化时更新循环体左侧端口参数
15. 实现删除循环节点时联动删除循环体画布和关联线

#### Phase 6: 配置面板（可选）
16. 修改 `useConfigPanel.js`，添加循环体右侧端口参数配置
17. 添加右侧端口参数管理（添加/删除输出参数）

#### Phase 7: 测试与调试
18. 测试创建循环节点时自动创建循环体画布和关联线
19. 测试循环体画布内添加节点时的自动连线
20. 测试循环体画布内连线的边界检查
21. 测试删除循环节点时的联动删除
22. 测试关联线的渲染和动态更新

### 五、关键文件路径

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/views/workflow/config/workflowConfig.js` | 修改 | 添加 loopBodyCanvas 节点类型 |
| `src/views/workflow/composables/useWorkflowState.js` | 修改 | 添加 associations 状态 |
| `src/views/workflow/composables/useNodes.js` | 修改 | 添加循环节点特殊处理 |
| `src/views/workflow/composables/useConnections.js` | 修改 | 支持循环体端口连线 |
| `src/views/workflow/composables/useAssociations.js` | 新建 | 关联线逻辑 |
| `src/views/workflow/composables/useLoopBody.js` | 新建 | 循环体画布逻辑 |
| `src/views/workflow/components/LoopBodyCanvas.vue` | 新建 | 循环体画布组件 |
| `src/views/workflow/components/LoopBodyPort.vue` | 新建 | 循环体端口组件 |
| `src/views/workflow/WorkflowEditorView.vue` | 修改 | 集成循环体画布和关联线 |

### 六、验证方案

1. **功能验证**：
   - 创建循环节点，自动生成循环体画布和虚线关联
   - 在循环体画布中添加节点，自动连接左侧端口
   - 从节点拖拽连线到右侧端口
   - 尝试跨边界连线，验证边界检查
   - 删除循环节点，验证联动删除

2. **视觉验证**：
   - 循环节点与其他节点大小一致
   - 循环体画布独立渲染，风格与主画布一致
   - 关联线虚线正确连接循环节点和循环体画布
   - 拖拽节点时连线正确重绘

3. **数据验证**：
   - 保存工作流后重新加载，循环体数据正确恢复
   - 循环体内状态正确同步到父节点

## 七、复用现有函数

以下现有函数可以在新功能中复用：

- `formatParamType()` from `useNodes.js` - 格式化参数类型显示
- `getNodeTypeConfig()` from `workflowConfig.js` - 获取节点类型配置
- `getTypeValue()` / `handleTypeChange()` from `workflowConfig.js` - 类型选择器处理
- 贝塞尔曲线路径计算算法（复用 `getConnectionPath` 的逻辑）
