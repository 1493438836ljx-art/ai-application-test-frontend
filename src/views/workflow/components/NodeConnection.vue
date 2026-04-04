<template>
  <g
    class="node-connection"
    :class="{ selected: isSelected }"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 连线路径（不可见，用于扩大点击区域） -->
    <path
      :d="pathData"
      class="connection-hitbox"
      fill="none"
      stroke="transparent"
      stroke-width="20"
    />

    <!-- 连线路径（可见） -->
    <path
      :d="pathData"
      class="connection-path"
      :class="{ 'is-selected': isSelected }"
      fill="none"
      :stroke="isSelected ? '#6366f1' : '#94a3b8'"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- 分支标签 -->
    <g
      v-if="connection.branchLabel"
      :transform="`translate(${middlePoint.x}, ${middlePoint.y})`"
      class="branch-label-group"
    >
      <rect
        :x="-labelWidth / 2 - 4"
        y="-10"
        :width="labelWidth + 8"
        height="20"
        rx="4"
        fill="#6366f1"
      />
      <text
        x="0"
        y="0"
        text-anchor="middle"
        dominant-baseline="middle"
        style="font-size: 12px; fill: #fff; font-weight: 500"
      >{{ connection.branchLabel }}</text>
    </g>

    <!-- 中间的添加节点按钮（悬停时显示） -->
    <g
      v-if="showAddButton"
      class="add-node-button"
      @click.stop="handleAddNode"
    >
      <circle
        :cx="middlePoint.x"
        :cy="middlePoint.y"
        r="12"
        fill="#6366f1"
        stroke="#fff"
        stroke-width="2"
        class="add-btn-circle"
      />
      <line
        :x1="middlePoint.x - 5"
        :y1="middlePoint.y"
        :x2="middlePoint.x + 5"
        :y2="middlePoint.y"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
      />
      <line
        :x1="middlePoint.x"
        :y1="middlePoint.y - 5"
        :x2="middlePoint.x"
        :y2="middlePoint.y + 5"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>
  </g>
</template>

<script setup>
import { computed, ref } from 'vue'
import { calculateConnectionPath } from '../utils/connectionPath'

const props = defineProps({
  // 连线数据
  connection: {
    type: Object,
    required: true,
  },
  // 源节点
  sourceNode: {
    type: Object,
    required: true,
  },
  // 目标节点
  targetNode: {
    type: Object,
    required: true,
  },
  // 是否选中
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click', 'add-node', 'mouseenter', 'mouseleave'])

// 悬停状态
const isHovered = ref(false)

// 是否显示添加按钮
const showAddButton = computed(() => isHovered.value)

// 计算标签宽度
const labelWidth = computed(() => {
  const label = props.connection.branchLabel
  if (!label) return 0
  // 估算文字宽度（中文字符约14px，英文约8px）
  let width = 0
  for (const char of label) {
    width += /[\u4e00-\u9fa5]/.test(char) ? 14 : 8
  }
  return width
})

// 计算连线路径
const { pathData, middlePoint } = computed(() => {
  const result = calculateConnectionPath(props.sourceNode, props.targetNode)
  return {
    pathData: result.path,
    middlePoint: result.middlePoint,
  }
})

// 点击连线
const handleClick = (event) => {
  emit('click', {
    event,
    connection: props.connection,
  })
}

// 点击添加节点按钮
const handleAddNode = (event) => {
  emit('add-node', {
    event,
    connection: props.connection,
    middlePoint: middlePoint.value,
    sourceNode: props.sourceNode,
    targetNode: props.targetNode,
  })
}

// 鼠标进入
const handleMouseEnter = (event) => {
  isHovered.value = true
  emit('mouseenter', {
    event,
    connection: props.connection,
  })
}

// 鼠标离开
const handleMouseLeave = (event) => {
  isHovered.value = false
  emit('mouseleave', {
    event,
    connection: props.connection,
  })
}
</script>

<style scoped>
.node-connection {
  cursor: pointer;
}

.connection-path {
  transition:
    stroke 0.2s,
    stroke-width 0.2s;
}

.connection-path:hover,
.connection-path.is-selected {
  stroke-width: 3;
}

.connection-hitbox {
  cursor: pointer;
}

.add-node-button {
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.node-connection:hover .add-node-button {
  opacity: 1;
}

.add-btn-circle {
  transition:
    transform 0.2s,
    fill 0.2s;
}

.add-node-button:hover .add-btn-circle {
  transform: scale(1.1);
  fill: #4f46e5;
}
</style>
