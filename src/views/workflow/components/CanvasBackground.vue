<template>
  <svg class="canvas-background" :width="width" :height="height">
    <defs>
      <!-- 小网格图案 -->
      <pattern
        id="smallGrid"
        :width="gridSize"
        :height="gridSize"
        patternUnits="userSpaceOnUse"
      >
        <path
          :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
          fill="none"
          stroke="var(--grid-small-color, #e5e7eb)"
          stroke-width="0.5"
        />
      </pattern>
      <!-- 大网格图案（5倍小网格） -->
      <pattern
        id="largeGrid"
        :width="gridSize * 5"
        :height="gridSize * 5"
        patternUnits="userSpaceOnUse"
      >
        <rect
          :width="gridSize * 5"
          :height="gridSize * 5"
          fill="url(#smallGrid)"
        />
        <path
          :d="`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`"
          fill="none"
          stroke="var(--grid-large-color, #d1d5db)"
          stroke-width="1"
        />
      </pattern>
    </defs>
    <!-- 绘制网格背景 -->
    <rect width="100%" height="100%" fill="url(#largeGrid)" />
  </svg>
</template>

<script setup>
/**
 * 画布网格背景组件
 * 使用 SVG pattern 绘制网格，小网格 20px，大网格 100px
 */
defineProps({
  width: {
    type: Number,
    default: 3000,
  },
  height: {
    type: Number,
    default: 2000,
  },
  gridSize: {
    type: Number,
    default: 20,
  },
})
</script>

<style scoped>
.canvas-background {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}
</style>
