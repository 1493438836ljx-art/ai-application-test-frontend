<script setup>
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  }
})

// 展开状态管理
const expandedKeys = ref(new Set())

// 切换展开状态
const toggleExpand = (key) => {
  const newSet = new Set(expandedKeys.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }
  expandedKeys.value = newSet
}

// 判断是否展开
const isExpanded = (key) => {
  return expandedKeys.value.has(key)
}

// 获取类型显示文本
const getTypeText = (item) => {
  if (!item.type) return 'Any'
  if (item.type === 'Array' && item.elementType) {
    return `Array<${item.elementType}>`
  }
  return item.type
}

// 判断是否有子节点
const hasChildren = (item) => {
  return item.children && item.children.length > 0
}

// 获取类型样式类
const getTypeClass = (type) => {
  if (!type) return 'type-any'
  const typeLower = type.toLowerCase()
  const validTypes = ['string', 'number', 'boolean', 'object', 'array']
  return validTypes.includes(typeLower) ? `type-${typeLower}` : 'type-any'
}
</script>

<template>
  <div class="json-tree-view">
    <div v-if="data.length === 0" class="empty-text">
      {{ emptyText }}
    </div>
    <div v-else class="tree-container">
      <!-- 根节点 -->
      <div v-for="(item, index) in data" :key="item.key" class="tree-node root-node">
        <div
          class="node-content"
          :class="{ clickable: hasChildren(item) }"
          @click="hasChildren(item) && toggleExpand(item.key)"
        >
          <span class="node-name">{{ item.name }}</span>
          <span class="node-colon">:</span>
          <span class="node-type" :class="getTypeClass(item.type)">{{ getTypeText(item) }}</span>
          <el-icon
            v-if="hasChildren(item)"
            class="expand-icon"
            :class="{ expanded: isExpanded(item.key) }"
          >
            <ArrowRight />
          </el-icon>
        </div>

        <!-- 子节点容器 -->
        <div v-if="hasChildren(item) && isExpanded(item.key)" class="node-children">
          <template v-for="(child, childIndex) in item.children" :key="child.key">
            <div class="child-item">
              <span class="tree-branch">{{ childIndex === item.children.length - 1 ? '└──' : '├──' }}</span>
              <span
                class="node-content inline"
                :class="{ clickable: hasChildren(child) }"
                @click="hasChildren(child) && toggleExpand(child.key)"
              >
                <span class="node-name">{{ child.name }}</span>
                <span class="node-colon">:</span>
                <span class="node-type" :class="getTypeClass(child.type)">{{ getTypeText(child) }}</span>
                <el-icon
                  v-if="hasChildren(child)"
                  class="expand-icon"
                  :class="{ expanded: isExpanded(child.key) }"
                >
                  <ArrowRight />
                </el-icon>
              </span>
              <!-- 第三层子节点 -->
              <div v-if="hasChildren(child) && isExpanded(child.key)" class="node-children level-2">
                <template v-for="(grandChild, grandIndex) in child.children" :key="grandChild.key">
                  <div class="child-item">
                    <span class="tree-branch">{{ grandIndex === child.children.length - 1 ? '└──' : '├──' }}</span>
                    <span
                      class="node-content inline"
                      :class="{ clickable: hasChildren(grandChild) }"
                      @click="hasChildren(grandChild) && toggleExpand(grandChild.key)"
                    >
                      <span class="node-name">{{ grandChild.name }}</span>
                      <span class="node-colon">:</span>
                      <span class="node-type" :class="getTypeClass(grandChild.type)">{{ getTypeText(grandChild) }}</span>
                      <el-icon
                        v-if="hasChildren(grandChild)"
                        class="expand-icon"
                        :class="{ expanded: isExpanded(grandChild.key) }"
                      >
                        <ArrowRight />
                      </el-icon>
                    </span>
                    <!-- 第四层子节点 -->
                    <div v-if="hasChildren(grandChild) && isExpanded(grandChild.key)" class="node-children level-3">
                      <template v-for="(ggChild, ggIndex) in grandChild.children" :key="ggChild.key">
                        <div class="child-item">
                          <span class="tree-branch">{{ ggIndex === grandChild.children.length - 1 ? '└──' : '├──' }}</span>
                          <span class="node-content inline">
                            <span class="node-name">{{ ggChild.name }}</span>
                            <span class="node-colon">:</span>
                            <span class="node-type" :class="getTypeClass(ggChild.type)">{{ getTypeText(ggChild) }}</span>
                          </span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-tree-view {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  padding: 8px 0;
}

.empty-text {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.tree-container {
  background: #fafafa;
  border-radius: 4px;
  padding: 12px;
}

.tree-node {
  position: relative;
}

.node-content {
  display: inline-flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.node-content.clickable {
  cursor: pointer;
}

.node-content.clickable:hover {
  background-color: #f0f0f0;
}

.node-content.inline {
  display: inline-flex;
}

.node-name {
  color: #303133;
  font-weight: 500;
}

.node-colon {
  color: #909399;
  margin: 0 2px;
}

.node-type {
  color: #909399;
  font-style: italic;
}

.node-type.type-string {
  color: #42b983;
}

.node-type.type-number {
  color: #e6a23c;
}

.node-type.type-boolean {
  color: #409eff;
}

.node-type.type-object {
  color: #f56c6c;
}

.node-type.type-array {
  color: #909399;
}

.node-type.type-any {
  color: #909399;
}

.expand-icon {
  margin-left: 6px;
  font-size: 12px;
  color: #909399;
  transition: transform 0.2s;
  opacity: 0.6;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.node-children {
  margin-left: 0;
  padding-left: 4px;
  margin-top: 2px;
  border-left: 1px dashed #dcdfe6;
}

.node-children.level-2 {
  margin-left: 0;
  padding-left: 4px;
}

.node-children.level-3 {
  margin-left: 0;
  padding-left: 4px;
}

.child-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.tree-branch {
  color: #dcdfe6;
  font-family: monospace;
  font-size: 12px;
  margin-right: 4px;
  width: 28px;
  flex-shrink: 0;
}
</style>
