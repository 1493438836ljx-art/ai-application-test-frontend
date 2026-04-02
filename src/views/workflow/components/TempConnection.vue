<template>
  <g v-if="visible && pathData" class="temp-connection">
    <!-- 虚线连线路径 -->
    <path
      :d="pathData"
      class="temp-connection-path"
      fill="none"
      stroke="#6366f1"
      stroke-width="2"
      stroke-dasharray="8 4"
      stroke-linecap="round"
    />

    <!-- 动画效果：流动的虚线 -->
    <path
      :d="pathData"
      class="temp-connection-animated"
      fill="none"
      stroke="rgba(99, 102, 241, 0.5)"
      stroke-width="2"
      stroke-dasharray="4 8"
      stroke-linecap="round"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="24"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>

    <!-- 起点圆形指示器 -->
    <circle
      v-if="sourceNode"
      :cx="startPoint.x"
      :cy="startPoint.y"
      r="6"
      fill="#6366f1"
      stroke="#fff"
      stroke-width="2"
      class="start-point"
    />

    <!-- 终点圆形指示器 -->
    <circle
      v-if="endPoint"
      :cx="endPoint.x"
      :cy="endPoint.y"
      r="6"
      fill="#10b981"
      stroke="#fff"
      stroke-width="2"
      class="end-point"
    >
      <animate
        attributeName="r"
        values="6;8;6"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  </g>
</template>

<script setup>
import { computed } from 'vue'
import {
  getOutputPortPosition,
  calculateTempConnectionPath,
} from '../utils/connectionPath'

const props = defineProps({
  // 是否可见
  visible: {
    type: Boolean,
    default: false,
  },
  // 源节点
  sourceNode: {
    type: Object,
    default: null,
  },
  // 终点坐标
  endPoint: {
    type: Object,
    default: null,
  },
})

// 计算起点坐标
const startPoint = computed(() => {
  if (!props.sourceNode) return { x: 0, y: 0 }
  return getOutputPortPosition(props.sourceNode)
})

// 计算临时连线路径
const pathData = computed(() => {
  if (!props.visible || !props.sourceNode || !props.endPoint) {
    return ''
  }
  return calculateTempConnectionPath(props.sourceNode, props.endPoint)
})
</script>

<style scoped>
.temp-connection {
  pointer-events: none;
}

.temp-connection-path {
  opacity: 0.8;
}

.temp-connection-animated {
  opacity: 0.6;
}

.start-point {
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3));
}

.end-point {
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
}
</style>
