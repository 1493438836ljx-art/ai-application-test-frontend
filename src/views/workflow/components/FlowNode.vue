<template>
  <div
    class="flow-node"
    :class="{
      selected: isSelected,
      'loop-body-node': isInsideLoopBody,
    }"
    :style="nodeStyle"
    :data-node-id="node.id"
    :data-body-node-id="isInsideLoopBody ? node.id : undefined"
    @mousedown="handleMouseDown"
    @click.stop="handleClick"
    @dblclick.stop="handleDblClick"
    @contextmenu="handleContextMenu"
  >
    <!-- 节点内容 -->
    <div class="node-content">
      <!-- 节点头部 -->
      <div class="node-header">
        <div
          class="node-icon"
          :style="{
            background: `${nodeTypeConfig.color}15`,
            color: nodeTypeConfig.color,
          }"
        >
          <el-icon :size="16">
            <component :is="iconComponent" />
          </el-icon>
        </div>
        <span class="node-name">{{ node.name }}</span>
      </div>

      <!-- 开始节点：单行显示输入参数 -->
      <template v-if="node.type === 'start'">
        <div
          v-if="outputParams.length > 0"
          class="node-params inline-params"
        >
          <span class="params-label">输入</span>
          <span class="params-inline-list">
            <span
              v-for="(param, idx) in outputParams"
              :key="'inout-' + idx"
              class="param-inline-item"
              :title="param.name + ': ' + param.type"
            >
              {{ param.name || '新建参数' }}
            </span>
          </span>
        </div>
        <!-- 开始节点右侧的添加/连线按钮 -->
        <div
          class="output-port node-edge-port node-center-port node-start-action-btn"
          title="output"
          @mousedown.stop="handleOutputPortMouseDown"
          @mouseup.stop="handleOutputPortMouseUp"
          @click.stop.prevent
        ></div>
      </template>

      <!-- 结束节点：单行显示输出参数，左侧有端口 -->
      <template v-else-if="node.type === 'end'">
        <div class="input-port end-node-port" @mousedown.stop.prevent></div>
        <div
          v-if="inputParams.length > 0"
          class="node-params inline-params end-inline-params"
        >
          <span class="params-label">输出</span>
          <span class="params-inline-list">
            <span
              v-for="(param, idx) in inputParams"
              :key="'inout-' + idx"
              class="param-inline-item"
              :title="param.name + ': ' + param.type"
            >
              {{ param.name || '新建参数' }}
            </span>
          </span>
        </div>
      </template>

      <!-- 其他节点：分别显示输入和输出参数 -->
      <template v-else>
        <!-- 输入端口在节点左侧边缘垂直居中（循环体画布类型不显示） -->
        <div
          v-if="node.type !== 'loopBodyCanvas'"
          class="input-port node-edge-port node-center-port"
          title="input"
          @mousedown.stop.prevent
        ></div>

        <!-- 输入参数：单行显示 -->
        <div
          v-if="inputParams.length > 0"
          class="node-params inline-params input-inline-params"
        >
          <span class="params-label">输入</span>
          <span class="params-inline-list">
            <span
              v-for="(param, idx) in inputParams"
              :key="'in-' + idx"
              class="param-inline-item"
              :title="param.name + ': ' + param.type"
            >
              {{ param.name || '新建参数' }}
            </span>
          </span>
        </div>

        <!-- 输出参数：单行显示 -->
        <div
          v-if="outputParams.length > 0"
          class="node-params inline-params output-inline-params"
        >
          <span class="params-label">输出</span>
          <span class="params-inline-list">
            <span
              v-for="(param, idx) in outputParams"
              :key="'out-' + idx"
              class="param-inline-item"
              :title="param.name + ': ' + param.type"
            >
              {{ param.name || '新建参数' }}
            </span>
          </span>
        </div>

        <!-- 输出端口在节点右侧边缘垂直居中 -->
        <div
          class="output-port node-edge-port node-center-port"
          :class="{ 'node-start-action-btn': !isInsideLoopBody }"
          title="output"
          @mousedown.stop="handleOutputPortMouseDown"
          @mouseup.stop="handleOutputPortMouseUp"
          @click.stop.prevent
        ></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import {
  VideoPlay,
  CircleCheck,
  Brush,
  Timer,
  Document,
  Files,
  EditPen,
  ChatDotRound,
  Picture,
  Crop,
  DataLine,
  Film,
  Microphone,
  DocumentAdd,
  Monitor,
  Connection,
  Cpu,
  DataAnalysis,
  Stopwatch,
  TrendCharts,
} from '@element-plus/icons-vue'
import { useNodeParams } from '../composables/useNodeParams'

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isInsideLoopBody: {
    type: Boolean,
    default: false,
  },
  // 节点位置（相对于父容器）
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  // 节点类型配置
  nodeTypes: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'node-mousedown',
  'node-click',
  'node-dblclick',
  'node-contextmenu',
  'output-port-mousedown',
  'output-port-mouseup',
])

// 图标组件映射
const iconComponents = {
  VideoPlay,
  CircleCheck,
  Brush,
  Timer,
  Document,
  Files,
  EditPen,
  ChatDotRound,
  Picture,
  Crop,
  DataLine,
  Film,
  Microphone,
  DocumentAdd,
  Monitor,
  Connection,
  Cpu,
  DataAnalysis,
  Stopwatch,
  TrendCharts,
}

// 使用 useNodeParams 获取参数
const { getNodeInputParams, getNodeOutputParams } = useNodeParams()

// 计算节点样式
const nodeStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}))

// 获取节点类型配置
const nodeTypeConfig = computed(() => {
  const config = props.nodeTypes.find((t) => t.type === props.node.type)
  return config || { type: 'unknown', name: '未知', icon: 'Document', color: '#6b7280' }
})

// 获取图标组件
const iconComponent = computed(() => {
  const iconName = nodeTypeConfig.value.icon
  return iconComponents[iconName] || Document
})

// 获取输入参数
const inputParams = computed(() => getNodeInputParams(props.node))

// 获取输出参数
const outputParams = computed(() => getNodeOutputParams(props.node))

// 事件处理
const handleMouseDown = (event) => {
  emit('node-mousedown', { event, node: props.node })
}

const handleClick = (event) => {
  // 支持 Ctrl/Cmd + 点击进行多选
  const multiSelect = event.ctrlKey || event.metaKey
  emit('node-click', { event, node: props.node, multiSelect })
}

const handleDblClick = (event) => {
  emit('node-dblclick', { event, node: props.node })
}

const handleContextMenu = (event) => {
  event.preventDefault()
  emit('node-contextmenu', { event, node: props.node })
}

const handleOutputPortMouseDown = (event) => {
  emit('output-port-mousedown', { event, node: props.node })
}

const handleOutputPortMouseUp = (event) => {
  emit('output-port-mouseup', { event, node: props.node })
}
</script>

<style scoped>
/* 节点基础样式 - 与循环体外节点保持一致 */
.flow-node {
  position: absolute;
  width: 220px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  cursor: move;
  transition: border-color 0.2s, box-shadow 0.2s;
  z-index: 10;
  user-select: none;
}

.flow-node:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.flow-node.selected {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

.node-content {
  padding: 12px 14px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

/* 参数显示样式 */
.node-params.inline-params {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.node-params.inline-params .params-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  width: 32px;
}

.node-params.inline-params .params-inline-list {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.node-params.inline-params .param-inline-item {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

/* 输入参数样式 - 紫色 */
.node-params.inline-params.input-inline-params .params-label {
  color: #6366f1;
}

.node-params.inline-params.input-inline-params .param-inline-item {
  background: #eef2ff;
  color: #6366f1;
}

/* 输出参数样式 - 绿色 */
.node-params.inline-params.output-inline-params .params-label {
  color: #10b981;
}

.node-params.inline-params.output-inline-params .param-inline-item {
  background: #ecfdf5;
  color: #10b981;
}

/* 开始节点输入参数样式 - 紫色 */
.node-params.inline-params:not(.input-inline-params):not(.output-inline-params):not(.end-inline-params) .params-label {
  color: #6366f1;
}

.node-params.inline-params:not(.input-inline-params):not(.output-inline-params):not(.end-inline-params) .param-inline-item {
  background: #eef2ff;
  color: #6366f1;
}

/* 结束节点输出参数样式 - 绿色 */
.node-params.inline-params.end-inline-params .params-label {
  color: #10b981;
}

.node-params.inline-params.end-inline-params .param-inline-item {
  background: #ecfdf5;
  color: #10b981;
}

.input-inline-params {
  margin-left: 8px;
}

.output-inline-params {
  margin-left: 8px;
  margin-right: 8px;
}

/* 端口样式 */
.node-edge-port {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 5;
}

.node-center-port {
  top: 50%;
  transform: translateY(-50%);
}

.input-port {
  left: -6px;
  background: #6366f1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  cursor: not-allowed;
  transition: none;
}

.end-node-port {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.output-port {
  right: -6px;
  background: #10b981;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
}

.output-port:hover {
  background: #059669;
  transform: translateY(-50%) scale(1.2);
}

.node-start-action-btn {
  cursor: crosshair;
}
</style>
