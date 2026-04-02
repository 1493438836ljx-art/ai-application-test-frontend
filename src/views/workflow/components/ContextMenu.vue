<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        class="context-menu"
        :style="menuStyle"
        @click.stop
        @contextmenu.prevent
      >
        <div
          v-for="item in items"
          :key="item.key"
          class="context-menu-item"
          :class="{ danger: item.danger }"
          @click="handleItemClick(item)"
        >
          <el-icon v-if="item.icon" :size="16">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select', 'close'])

// 菜单定位样式
const menuStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}))

/**
 * 处理菜单项点击
 */
const handleItemClick = (item) => {
  emit('select', {
    key: item.key,
    action: item.action ? item.action() : item.key,
  })
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 140px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  border: 1px solid #e5e7eb;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background 0.15s;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}

/* 过渡动画 */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
