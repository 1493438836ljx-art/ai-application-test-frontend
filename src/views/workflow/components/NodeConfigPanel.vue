<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="680px"
    :close-on-click-modal="false"
    destroy-on-close
    class="node-config-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <div v-if="node" class="config-panel">
      <!-- 基本信息 -->
      <div class="config-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>基本信息</span>
        </div>
        <el-form :model="formData" label-width="80px" label-position="left">
          <el-form-item label="节点名称">
            <el-input
              v-model="formData.name"
              placeholder="请输入节点名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="节点类型">
            <div class="type-display">
              <el-icon :style="{ color: nodeTypeConfig?.color || '#6366f1' }">
                <component :is="getNodeIcon(node.type)" />
              </el-icon>
              <span>{{ nodeTypeName }}</span>
              <el-tag size="small" :type="categoryTagType">
                {{ categoryLabel }}
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item v-if="node.skillId" label="关联技能">
            <el-tag type="info" effect="plain">
              {{ node.skillId }}
            </el-tag>
          </el-form-item>
        </el-form>
      </div>

      <!-- 条件表达式（仅条件分支节点显示） -->
      <div v-if="node.type === 'condition_simple'" class="config-section">
        <div class="section-title">
          <el-icon><Share /></el-icon>
          <span>条件表达式</span>
        </div>

        <div class="condition-expression">
          <!-- 左操作数 -->
          <div class="operand-group">
            <label class="operand-label">左操作数</label>
            <div class="operand-input-wrapper">
              <el-input
                :model-value="conditionData.expression.leftOperand"
                placeholder="${节点名.参数名}"
                clearable
                @update:model-value="handleLeftOperandChange"
              >
                <template #prefix>
                  <el-icon class="reference-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="openConditionVarSelector('left')">
                选择
              </el-button>
            </div>
            <div v-if="leftOperandVarType" class="type-hint">
              检测到类型：{{ leftOperandVarType }}
            </div>
          </div>

          <!-- 操作符 -->
          <div class="operand-group">
            <label class="operand-label">操作符</label>
            <el-select
              :model-value="conditionData.expression.operator"
              placeholder="选择操作符"
              style="width: 100%"
              @update:model-value="updateOperator"
            >
              <el-option
                v-for="op in availableOperators"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
          </div>

          <!-- 右操作数（动态显示） -->
          <div v-if="showRightOperand" class="operand-group">
            <label class="operand-label">右操作数</label>

            <!-- 值类型切换 -->
            <div class="value-type-toggle">
              <el-radio-group
                :model-value="conditionData.expression.rightOperandType"
                size="small"
                @update:model-value="handleRightOperandTypeChange"
              >
                <el-radio-button value="literal">固定值</el-radio-button>
                <el-radio-button value="reference">引用变量</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 固定值输入 -->
            <div v-if="conditionData.expression.rightOperandType === 'literal'" class="operand-input-wrapper">
              <!-- 区间操作符：两个输入框 -->
              <template v-if="showTwoRightOperands">
                <div class="between-inputs">
                  <el-input
                    v-model="conditionData.expression.rightOperand"
                    placeholder="最小值"
                    type="number"
                  />
                  <span class="between-separator">至</span>
                  <el-input
                    v-model="rightOperandSecond"
                    placeholder="最大值"
                    type="number"
                  />
                </div>
              </template>
              <!-- 普通操作符：一个输入框 -->
              <template v-else>
                <el-input
                  v-model="conditionData.expression.rightOperand"
                  placeholder="请输入固定值"
                  clearable
                />
              </template>
            </div>

            <!-- 引用变量输入 -->
            <div v-else class="operand-input-wrapper">
              <el-input
                :model-value="conditionData.expression.rightOperand"
                placeholder="${节点名.参数名}"
                clearable
                @update:model-value="updateRightOperand($event, 'reference')"
              >
                <template #prefix>
                  <el-icon class="reference-icon"><Link /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="openConditionVarSelector('right')">
                选择
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入参数 -->
      <div class="config-section">
        <div class="section-title">
          <el-icon><EditPen /></el-icon>
          <span>输入参数</span>
          <el-tag size="small" type="info" class="section-badge">
            {{ inputParams.length }} 项
          </el-tag>
        </div>

        <div v-if="inputParams.length > 0" class="params-list">
          <div
            v-for="(param, index) in inputParams"
            :key="param.name + index"
            class="param-config-item"
          >
            <!-- 参数头部 -->
            <div class="param-header">
              <div class="param-info">
                <span class="param-name">{{ param.name }}</span>
                <el-tag size="small" effect="plain">{{ formatParamType(param) }}</el-tag>
                <el-tag v-if="param.required" size="small" type="danger">必填</el-tag>
              </div>
              <div class="value-type-switch">
                <el-radio-group
                  v-model="param.valueSourceType"
                  size="small"
                  @change="handleValueTypeChange(param)"
                >
                  <el-radio-button value="literal">固定值</el-radio-button>
                  <el-radio-button value="reference">引用变量</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- 固定值输入 -->
            <div v-if="param.valueSourceType === 'literal'" class="param-value-input">
              <!-- 字符串类型 -->
              <el-input
                v-if="param.type === 'String'"
                v-model="param.value"
                placeholder="请输入固定值"
                clearable
              />
              <!-- 布尔类型 -->
              <el-switch
                v-else-if="param.type === 'Boolean'"
                v-model="param.value"
                active-text="true"
                inactive-text="false"
              />
              <!-- 整数类型 -->
              <el-input-number
                v-else-if="param.type === 'Integer'"
                v-model="param.value"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
              <!-- 对象/数组类型 -->
              <el-input
                v-else-if="param.type === 'Object' || param.type === 'Array'"
                v-model="param.value"
                type="textarea"
                :rows="3"
                placeholder="请输入 JSON"
              />
              <!-- 文件类型（不支持固定值） -->
              <div v-else-if="param.type === 'File'" class="file-type-hint">
                <el-icon><WarningFilled /></el-icon>
                <span>文件类型参数只能通过引用传递</span>
              </div>
              <!-- 默认 -->
              <el-input
                v-else
                v-model="param.value"
                placeholder="请输入固定值"
                clearable
              />
            </div>

            <!-- 引用变量输入 -->
            <div v-else class="param-value-input">
              <div class="reference-input-wrapper">
                <el-input
                  v-model="param.value"
                  placeholder="${节点名.参数名}"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="reference-icon"><Link /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="openVariableSelector(param, index)">
                  选择
                </el-button>
              </div>
            </div>

            <!-- 参数说明 -->
            <div v-if="param.description" class="param-description">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ param.description }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="无输入参数" :image-size="40" />
      </div>

      <!-- 输出参数（只读） -->
      <div class="config-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>输出参数</span>
          <span class="section-hint">（只读，可供后续节点引用）</span>
        </div>

        <div v-if="outputParams.length > 0" class="output-params-list">
          <div
            v-for="(param, index) in outputParams"
            :key="param.name + index"
            class="output-param-item"
          >
            <div class="param-main">
              <span class="param-name">{{ param.name }}</span>
              <el-tag size="small" type="info">{{ formatParamType(param) }}</el-tag>
            </div>
            <div v-if="param.description" class="param-desc">
              {{ param.description }}
            </div>
          </div>
        </div>
        <el-empty v-else description="无输出参数" :image-size="40" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 变量选择器 -->
  <VariableSelector
    v-model:visible="variableSelectorVisible"
    :param="currentEditParam"
    :available-variables="availableVariables"
    @select="handleVariableSelect"
    @close="variableSelectorVisible = false"
  />

  <!-- 条件表达式变量选择器 -->
  <VariableSelector
    v-model:visible="conditionVarSelectorVisible"
    :param="{}"
    :available-variables="availableVariables"
    @select="handleConditionVarSelect"
    @close="conditionVarSelectorVisible = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Setting,
  EditPen,
  Document,
  Link,
  InfoFilled,
  WarningFilled,
  VideoPlay,
  CircleCheck,
  Timer,
  Connection,
  DataAnalysis,
  Cpu,
  Grid,
  Share,
  FolderAdd,
  DataLine,
  Refresh,
} from '@element-plus/icons-vue'
import VariableSelector from './VariableSelector.vue'
import { useConditionConfig } from '../composables/useConditionConfig'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  node: {
    type: Object,
    default: null,
  },
  nodeTypes: {
    type: Array,
    default: () => [],
  },
  // 可用变量列表（来自前置节点）
  availableVariables: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update', 'close'])

// 表单数据
const formData = ref({
  name: '',
})

// 输入参数列表（可编辑）
const inputParams = ref([])

// 变量选择器状态
const variableSelectorVisible = ref(false)
const currentEditParam = ref(null)
const currentEditIndex = ref(-1)

// 条件配置 composable
const {
  conditionData,
  leftOperandVarType,
  rightOperandSecond,
  availableOperators,
  showRightOperand,
  showTwoRightOperands,
  updateLeftOperand,
  updateOperator,
  updateRightOperand,
  updateRightOperandSecond,
  initConditionData,
  getConditionForSave,
  resetConditionData,
} = useConditionConfig()

// 条件表达式变量选择器状态
const conditionVarSelectorVisible = ref(false)
const currentEditOperand = ref(null) // 'left' | 'right'

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

// 获取节点图标
const getNodeIcon = (type) => {
  return iconComponentMap[props.nodeTypes.find((t) => t.type === type)?.icon] || Document
}

// 监听节点变化，初始化表单
watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      formData.value.name = newNode.name

      // 初始化输入参数
      if (newNode.inputParams && Array.isArray(newNode.inputParams)) {
        inputParams.value = newNode.inputParams.map((p) => ({
          ...p,
          valueSourceType: p.valueSourceType || (p.value ? 'literal' : 'reference'),
          value: p.value ?? p.defaultValue ?? '',
        }))
      } else {
        inputParams.value = []
      }

      // 初始化条件表达式数据（仅条件分支节点）
      if (newNode.type === 'condition_simple') {
        initConditionData(newNode.conditions)
      } else {
        resetConditionData()
      }
    }
  },
  { immediate: true }
)

// 对话框标题
const dialogTitle = computed(() => {
  return props.node ? `配置节点：${props.node.name}` : '配置节点'
})

// 节点类型配置
const nodeTypeConfig = computed(() => {
  if (!props.node) return null

  // 对于 Skill 节点，使用 skillId 查找对应的 Skill 类型配置
  if (props.node.type === 'skill' && props.node.skillId) {
    const skillType = `skill-${props.node.skillId}`
    return props.nodeTypes.find((t) => t.type === skillType)
  }

  return props.nodeTypes.find((t) => t.type === props.node.type)
})

// 节点类型名称
const nodeTypeName = computed(() => {
  return nodeTypeConfig.value?.name || props.node?.type || ''
})

// 分类标签
const categoryLabel = computed(() => {
  const categoryMap = {
    BASIC: '基础',
    LOGIC: '逻辑控制',
    EXECUTION: '执行',
    DATA_PREPARE: '数据准备',
    TEXT: '文本处理',
    IMAGE: '图像处理',
    AUDIO_VIDEO: '音视频',
    TEST_DESIGN: '测试设计',
    TEST_EXEC: '测试执行',
    EVALUATE: '评估',
    OUTPUT: '输出',
    REPORT: '报告',
  }
  // 优先从节点类型配置获取，其次从节点本身的 nodeCategory 获取
  const category = nodeTypeConfig.value?.category || props.node?.nodeCategory
  return categoryMap[category] || '其他'
})

// 分类标签类型
const categoryTagType = computed(() => {
  const typeMap = {
    BASIC: 'success',
    LOGIC: 'warning',
    EXECUTION: 'primary',
  }
  // 优先从节点类型配置获取，其次从节点本身的 nodeCategory 获取
  const category = nodeTypeConfig.value?.category || props.node?.nodeCategory
  return typeMap[category] || 'info'
})

// 解析输出参数
const outputParams = computed(() => {
  if (!props.node) return []
  if (props.node.outputParams && Array.isArray(props.node.outputParams)) {
    return props.node.outputParams
  }
  return []
})

// 格式化参数类型
const formatParamType = (param) => {
  if (param.type === 'Array' && param.elementType) {
    return `Array<${param.elementType}>`
  }
  if (param.type === 'File' && param.fileType) {
    return `File<${param.fileType}>`
  }
  return param.type || 'Unknown'
}

// 处理值类型切换
const handleValueTypeChange = (param) => {
  // 切换时清空值
  if (param.valueSourceType === 'literal') {
    param.value = param.defaultValue ?? ''
  } else {
    param.value = ''
  }
}

// 打开变量选择器
const openVariableSelector = (param, index) => {
  currentEditParam.value = param
  currentEditIndex.value = index
  variableSelectorVisible.value = true
}

// 处理变量选择
const handleVariableSelect = (variable) => {
  if (currentEditIndex.value >= 0) {
    // 设置引用表达式
    inputParams.value[currentEditIndex.value].value = `\${${variable.node}.${variable.param}}`
  }
  variableSelectorVisible.value = false
}

/**
 * 处理保存
 */
const handleSave = () => {
  if (!props.node) return

  // 构建更新数据
  const updates = {
    name: formData.value.name,
    inputParams: inputParams.value.map((p) => ({
      name: p.name,
      type: p.type,
      elementType: p.elementType,
      fileType: p.fileType,
      required: p.required,
      description: p.description,
      valueSourceType: p.valueSourceType,
      value: p.value,
    })),
  }

  // 条件分支节点添加条件配置
  if (props.node.type === 'condition_simple') {
    updates.conditions = getConditionForSave()
  }

  emit('update', {
    nodeUuid: props.node.nodeUuid || props.node.id,
    updates,
  })
  handleClose()
}

// ========== 条件表达式相关方法 ==========

/**
 * 打开条件变量选择器
 * @param {string} operand - 'left' | 'right'
 */
const openConditionVarSelector = (operand) => {
  currentEditOperand.value = operand
  conditionVarSelectorVisible.value = true
}

/**
 * 处理条件变量选择
 * @param {Object} variable - 选中的变量
 */
const handleConditionVarSelect = (variable) => {
  if (currentEditOperand.value === 'left') {
    updateLeftOperand(variable.expression, props.availableVariables)
  } else if (currentEditOperand.value === 'right') {
    updateRightOperand(variable.expression, 'reference')
  }
  conditionVarSelectorVisible.value = false
}

/**
 * 处理左操作数输入变化
 * @param {string} value - 输入值
 */
const handleLeftOperandChange = (value) => {
  updateLeftOperand(value, props.availableVariables)
}

/**
 * 处理右操作数值类型切换
 * @param {string} type - 'literal' | 'reference'
 */
const handleRightOperandTypeChange = (type) => {
  updateRightOperand('', type)
}

/**
 * 处理关闭
 */
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.node-config-dialog :deep(.el-dialog__body) {
  padding: 16px 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-badge {
  font-weight: normal;
}

.section-hint {
  font-size: 12px;
  font-weight: normal;
  color: #9ca3af;
}

.type-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-config-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.param-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.param-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.param-info .param-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.param-value-input {
  margin-top: 8px;
}

.reference-input-wrapper {
  display: flex;
  gap: 8px;
}

.reference-input-wrapper .el-input {
  flex: 1;
}

.reference-icon {
  color: #6366f1;
}

.file-type-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
}

.param-description {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
  font-size: 12px;
  color: #6b7280;
}

.output-params-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.output-param-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.output-param-item .param-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-param-item .param-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.output-param-item .param-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 条件表达式样式 */
.condition-expression {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operand-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operand-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.operand-input-wrapper {
  display: flex;
  gap: 8px;
}

.operand-input-wrapper .el-input {
  flex: 1;
}

.type-hint {
  font-size: 12px;
  color: #10b981;
}

.value-type-toggle {
  margin-bottom: 8px;
}

.between-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.between-inputs .el-input {
  flex: 1;
}

.between-separator {
  flex-shrink: 0;
  color: #6b7280;
  font-size: 14px;
}

.reference-icon {
  color: #6366f1;
}
</style>
