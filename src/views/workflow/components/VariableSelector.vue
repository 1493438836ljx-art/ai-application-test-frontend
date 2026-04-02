<template>
  <el-dialog
    :model-value="visible"
    title="选择引用变量"
    width="480px"
    :modal="false"
    append-to-body
    :close-on-click-modal="true"
    class="variable-selector-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <!-- 搜索框 -->
    <el-input
      v-model="searchKeyword"
      placeholder="搜索变量..."
      :prefix-icon="Search"
      clearable
      class="search-input"
    />

    <!-- 变量列表 -->
    <div class="variable-list">
      <template v-for="group in filteredGroups" :key="group.nodeId">
        <!-- 节点分组 -->
        <div class="variable-group">
          <div class="group-header">
            <el-icon class="group-icon" :style="{ color: group.nodeColor }">
              <component :is="getIconComponent(group.nodeIcon)" />
            </el-icon>
            <span class="group-name">{{ group.nodeName }}</span>
            <el-tag size="small" type="info" effect="plain">{{ group.nodeTypeLabel }}</el-tag>
          </div>

          <!-- 变量项 -->
          <div class="group-items">
            <div
              v-for="variable in group.variables"
              :key="`${variable.nodeId}-${variable.param}`"
              class="variable-item"
              :class="{ disabled: !variable.compatible, selected: isSelected(variable) }"
              @click="handleSelect(variable)"
            >
              <div class="variable-main">
                <span class="variable-name">{{ variable.param }}</span>
                <el-tag size="small" effect="plain">{{ variable.typeLabel }}</el-tag>
              </div>
              <div v-if="!variable.compatible" class="incompatible-hint">
                <el-icon><WarningFilled /></el-icon>
                <span>类型不匹配</span>
              </div>
              <div v-if="variable.description" class="variable-desc">
                {{ variable.description }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-if="filteredGroups.length === 0"
        :description="emptyText"
        :image-size="60"
      />
    </div>

    <!-- 预览区域 -->
    <div v-if="selectedVariable" class="preview-area">
      <span class="preview-label">引用表达式：</span>
      <code class="preview-code">${{ selectedVariable.node }}.{{ selectedVariable.param }}</code>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, WarningFilled, VideoPlay, CircleCheck, Timer, Document, Connection, DataAnalysis, Cpu, Grid, Share, FolderAdd, DataLine, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  // 当前要配置的参数信息
  param: {
    type: Object,
    default: () => ({}),
  },
  // 可用变量列表
  availableVariables: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'select', 'close'])

// 搜索关键字
const searchKeyword = ref('')

// 选中的变量
const selectedVariable = ref(null)

// 图标组件映射
const iconComponentMap = {
  VideoPlay,
  CircleCheck,
  Timer,
  Document,
  Connection,
  DataAnalysis,
  Cpu,
  Grid,
  Share,
  FolderAdd,
  DataLine,
  Refresh,
}

// 节点类型标签映射
const nodeTypeLabels = {
  start: '开始',
  end: '结束',
  loop: '循环',
  condition_simple: '条件分支',
  condition_multi: '多路分支',
  batch: '批处理',
  async: '异步处理',
  collect: '结果收集',
  skill: '技能',
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponentMap[iconName] || Document
}

// 空状态文本
const emptyText = computed(() => {
  if (searchKeyword.value) {
    return '未找到匹配的变量'
  }
  return '没有可用的变量'
})

// 过滤并分组的变量
const filteredGroups = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()

  // 按节点分组
  const groupMap = new Map()

  props.availableVariables.forEach((variable) => {
    // 搜索过滤
    if (keyword) {
      const matchNode = variable.node?.toLowerCase().includes(keyword)
      const matchParam = variable.param?.toLowerCase().includes(keyword)
      if (!matchNode && !matchParam) {
        return
      }
    }

    // 过滤不兼容的变量（可选，目前显示所有但标记为禁用）
    const enrichedVariable = {
      ...variable,
      typeLabel: formatTypeLabel(variable.type),
    }

    if (!groupMap.has(variable.nodeId)) {
      groupMap.set(variable.nodeId, {
        nodeId: variable.nodeId,
        nodeName: variable.node,
        nodeType: variable.nodeType,
        nodeTypeLabel: nodeTypeLabels[variable.nodeType] || variable.nodeType,
        nodeIcon: variable.nodeIcon || 'Document',
        nodeColor: variable.nodeColor || '#6366f1',
        variables: [],
      })
    }
    groupMap.get(variable.nodeId).variables.push(enrichedVariable)
  })

  return Array.from(groupMap.values())
})

// 格式化类型标签
const formatTypeLabel = (type) => {
  if (!type) return 'Unknown'
  // 处理 File<Excel>, Array<String> 等类型
  if (type.includes('<')) {
    return type
  }
  return type
}

// 检查是否选中
const isSelected = (variable) => {
  if (!selectedVariable.value) return false
  return (
    selectedVariable.value.nodeId === variable.nodeId &&
    selectedVariable.value.param === variable.param
  )
}

// 处理选择
const handleSelect = (variable) => {
  if (!variable.compatible) {
    return
  }

  selectedVariable.value = variable

  // 直接确认选择
  emit('select', {
    node: variable.node,
    nodeId: variable.nodeId,
    param: variable.param,
    type: variable.type,
    expression: `\${${variable.node}.${variable.param}}`,
  })

  handleClose()
}

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 重置状态
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      searchKeyword.value = ''
      selectedVariable.value = null
    }
  }
)
</script>

<style scoped>
.variable-selector-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.search-input {
  margin-bottom: 16px;
}

.variable-list {
  max-height: 400px;
  overflow-y: auto;
}

.variable-group {
  margin-bottom: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.group-icon {
  font-size: 16px;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.group-items {
  padding: 8px 0;
}

.variable-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 4px;
}

.variable-item:hover:not(.disabled) {
  background: #f5f3ff;
}

.variable-item.selected {
  background: #ede9fe;
  border: 1px solid #a78bfa;
}

.variable-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.variable-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.variable-name {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.incompatible-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #f59e0b;
}

.variable-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.preview-area {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 13px;
  color: #6b7280;
}

.preview-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #6366f1;
  background: #ede9fe;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 空状态 */
:deep(.el-empty) {
  padding: 24px 0;
}
</style>
