<template>
  <Teleport to="body">
    <Transition name="node-selector">
      <div
        v-if="visible"
        class="node-selector-overlay"
        @click.self="handleClose"
        @contextmenu.prevent
      >
        <div class="node-selector" :style="selectorStyle">
          <!-- 搜索框 -->
          <div class="node-selector-header">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索节点..."
              :prefix-icon="Search"
              size="small"
              clearable
            />
          </div>

          <!-- 节点分类列表 -->
          <div class="node-selector-body">
            <div
              v-for="category in filteredCategories"
              :key="category.key"
              class="node-category"
            >
              <div class="category-title">{{ category.name }}</div>
              <div class="category-nodes">
                <div
                  v-for="nodeType in category.nodeTypes"
                  :key="nodeType.type"
                  class="node-type-item"
                  @click="handleSelect(nodeType)"
                >
                  <div class="node-type-icon" :style="{ background: nodeType.color + '15', color: nodeType.color }">
                    <el-icon :size="18">
                      <component :is="getIconComponent(nodeType.icon)" />
                    </el-icon>
                  </div>
                  <div class="node-type-info">
                    <div class="node-type-name">{{ nodeType.name }}</div>
                    <div v-if="nodeType.description" class="node-type-desc">
                      {{ nodeType.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无搜索结果 -->
            <div v-if="filteredCategories.length === 0" class="no-result">
              <el-empty description="未找到匹配的节点" :image-size="60" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import {
  VideoPlay,
  CircleCheck,
  Timer,
  Document,
  Connection,
  DataAnalysis,
  Edit,
  Picture,
  Microphone,
  Grid,
  Refresh,
  Share,
  Scissors,
  CopyDocument,
  EditPen,
  Crop,
  MagicStick,
  Headset,
  VideoCamera,
  List,
  Cpu,
  Clock,
  FolderAdd,
  DataLine,
  Files,
  Setting,
  Promotion,
  CirclePlus,
  Filter,
  Operation,
  Rank,
} from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  nodeTypes: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  excludeTypes: {
    type: Array,
    default: () => ['start', 'end'],
  },
})

const emit = defineEmits(['select', 'close'])

// 搜索关键字
const searchKeyword = ref('')

// 图标组件映射
const iconComponentMap = {
  VideoPlay,
  CircleCheck,
  Timer,
  Document,
  Connection,
  DataAnalysis,
  Edit,
  Picture,
  Microphone,
  Grid,
  Refresh,
  Share,
  Scissors,
  CopyDocument,
  EditPen,
  Crop,
  MagicStick,
  Headset,
  VideoCamera,
  List,
  Cpu,
  Clock,
  FolderAdd,
  DataLine,
  Files,
  Setting,
  Promotion,
  CirclePlus,
  Filter,
  Operation,
  Rank,
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponentMap[iconName] || Document
}

// 弹窗定位样式
const selectorStyle = computed(() => {
  const x = Math.min(props.position.x, window.innerWidth - 360)
  const y = Math.min(props.position.y, window.innerHeight - 400)
  return {
    left: `${Math.max(16, x)}px`,
    top: `${Math.max(16, y)}px`,
  }
})

// 过滤可添加的节点类型
const availableNodeTypes = computed(() => {
  return props.nodeTypes.filter((t) => !props.excludeTypes.includes(t.type))
})

// 按分类过滤和分组
const filteredCategories = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()

  return props.categories
    .map((category) => {
      const categoryNodes = availableNodeTypes.value.filter(
        (t) => t.category === category.key
      )

      // 搜索过滤
      const filteredNodes = keyword
        ? categoryNodes.filter(
            (t) =>
              t.name.toLowerCase().includes(keyword) ||
              (t.description && t.description.toLowerCase().includes(keyword))
          )
        : categoryNodes

      return {
        ...category,
        nodeTypes: filteredNodes,
      }
    })
    .filter((category) => category.nodeTypes.length > 0)
})

// 重置搜索
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      searchKeyword.value = ''
    }
  }
)

/**
 * 处理选择节点类型
 */
const handleSelect = (nodeType) => {
  emit('select', {
    type: nodeType.type,
    name: nodeType.name,
    config: nodeType,
  })
}

/**
 * 处理关闭
 */
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.node-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.1);
}

.node-selector {
  position: fixed;
  z-index: 9999;
  width: 320px;
  max-height: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.node-selector-header {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.node-selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.node-category {
  margin-bottom: 8px;
}

.category-title {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-nodes {
  padding: 0 8px;
}

.node-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.node-type-item:hover {
  background: #f3f4f6;
}

.node-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-type-info {
  flex: 1;
  min-width: 0;
}

.node-type-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.node-type-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-result {
  padding: 24px;
}

/* 过渡动画 */
.node-selector-enter-active,
.node-selector-leave-active {
  transition: opacity 0.2s;
}

.node-selector-enter-active .node-selector,
.node-selector-leave-active .node-selector {
  transition: transform 0.2s, opacity 0.2s;
}

.node-selector-enter-from,
.node-selector-leave-to {
  opacity: 0;
}

.node-selector-enter-from .node-selector,
.node-selector-leave-to .node-selector {
  opacity: 0;
  transform: scale(0.95);
}
</style>
