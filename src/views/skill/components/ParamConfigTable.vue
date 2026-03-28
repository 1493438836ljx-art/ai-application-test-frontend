<script setup>
import { computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  isOutput: {
    type: Boolean,
    default: false,
  },
  allowAddParams: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update:allowAddParams'])

// 本地参数列表
const params = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
})

// 基本类型选项（不含 Array 和 File）
const basicTypeOptions = [
  { value: 'String', label: 'String' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Object', label: 'Object' },
  { value: 'Times', label: 'Times' },
]

// 数组元素类型选项
const arrayElementTypeOptions = [
  { value: 'String', label: 'String' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Time', label: 'Time' },
  { value: 'Object', label: 'Object' },
]

// 文件类型选项
const fileTypeOptions = [
  { value: 'Zip', label: 'Zip' },
  { value: 'Doc', label: 'Doc' },
  { value: 'Docx', label: 'Docx' },
  { value: 'Excel', label: 'Excel' },
  { value: 'Pdf', label: 'PDF' },
  { value: 'Txt', label: 'Txt' },
]

// 级联选择器选项
const typeOptions = computed(() => {
  const options = []

  // 基本类型
  basicTypeOptions.forEach((t) => {
    options.push(t)
  })

  // Array 复合类型
  const arrayChildren = []
  arrayElementTypeOptions.forEach((t) => {
    arrayChildren.push(t)
  })
  // Array<File<FileType>>
  const fileChildren = fileTypeOptions.map((t) => ({
    value: t.value,
    label: t.label,
  }))
  arrayChildren.push({
    value: 'File',
    label: 'File',
    children: fileChildren,
  })
  options.push({
    value: 'Array',
    label: 'Array',
    children: arrayChildren,
  })

  // File 复合类型
  options.push({
    value: 'File',
    label: 'File',
    children: fileTypeOptions,
  })

  return options
})

// 解析类型字符串
const parseType = (typeStr) => {
  if (!typeStr) return { baseType: 'String', elementType: '', fileType: '' }

  // 匹配 Array<File<SubType>>
  const arrayFileMatch = typeStr.match(/^Array<File<(.+)>>$/)
  if (arrayFileMatch) {
    return { baseType: 'Array', elementType: 'File', fileType: arrayFileMatch[1] }
  }

  // 匹配 Array<Element>
  const arrayMatch = typeStr.match(/^Array<(.+)>$/)
  if (arrayMatch) {
    return { baseType: 'Array', elementType: arrayMatch[1], fileType: '' }
  }

  // 匹配 File<SubType>
  const fileMatch = typeStr.match(/^File<(.+)>$/)
  if (fileMatch) {
    return { baseType: 'File', elementType: '', fileType: fileMatch[1] }
  }

  return { baseType: typeStr, elementType: '', fileType: '' }
}

// 获取级联选择器的值
const getTypeValue = (param) => {
  if (!param.paramType) return ['String']

  const parsed = parseType(param.paramType)

  if (parsed.baseType === 'Array') {
    if (parsed.elementType === 'File' && parsed.fileType) {
      return ['Array', 'File', parsed.fileType]
    }
    return ['Array', parsed.elementType]
  }

  if (parsed.baseType === 'File' && parsed.fileType) {
    return ['File', parsed.fileType]
  }

  return [parsed.baseType]
}

// 处理类型变化
const handleTypeChange = (index, val) => {
  if (!val) {
    updateParam(index, 'paramType', 'String')
    return
  }

  // val 是数组路径，如 ['String'], ['Array', 'String'], ['Array', 'File', 'Excel'], ['File', 'Zip']
  let newType = 'String'

  if (val.length === 1) {
    // 基本类型
    newType = val[0]
  } else if (val.length === 2) {
    // Array<ElementType> 或 File<FileType>
    if (val[0] === 'Array') {
      newType = `Array<${val[1]}>`
    } else if (val[0] === 'File') {
      newType = `File<${val[1]}>`
    }
  } else if (val.length === 3) {
    // Array<File<FileType>>
    if (val[0] === 'Array' && val[1] === 'File') {
      newType = `Array<File<${val[2]}>>`
    }
  }

  updateParam(index, 'paramType', newType)
}

// 添加参数
const addParam = () => {
  const newParam = {
    paramName: '',
    paramType: 'String',
    required: false,
    defaultValue: '',
    description: '',
  }
  params.value = [...params.value, newParam]
}

// 删除参数
const removeParam = (index) => {
  const newParams = [...params.value]
  newParams.splice(index, 1)
  params.value = newParams
}

// 更新参数字段
const updateParam = (index, field, value) => {
  const newParams = [...params.value]
  newParams[index] = { ...newParams[index], [field]: value }
  params.value = newParams
}
</script>

<template>
  <div class="param-config-table">
    <div class="table-header">
      <el-button type="primary" text :icon="Plus" size="small" @click="addParam">
        添加参数
      </el-button>
      <span class="allow-add-switch">
        <el-switch
          :model-value="allowAddParams"
          size="small"
          @change="(val) => emit('update:allowAddParams', val)"
        />
        <span class="switch-label">支持额外增加</span>
      </span>
    </div>

    <el-table
      :data="params"
      border
      size="small"
      v-if="params.length > 0"
      table-layout="fixed"
      :row-style="{ height: '48px' }"
    >
      <el-table-column label="参数名称" width="120">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.paramName"
            placeholder="请输入"
            size="small"
            @change="(val) => updateParam($index, 'paramName', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="参数类型" width="150">
        <template #default="{ row, $index }">
          <el-cascader
            :model-value="getTypeValue(row)"
            :options="typeOptions"
            :props="{
              expandTrigger: 'hover',
              emitPath: true,
              checkStrictly: false,
            }"
            placeholder="选择类型"
            size="small"
            style="width: 100%"
            popper-class="param-type-cascader"
            clearable
            @update:model-value="(val) => handleTypeChange($index, val)"
          />
        </template>
      </el-table-column>

      <!-- 入参才显示必填和默认值 -->
      <el-table-column v-if="!isOutput" label="必填" width="60" align="center">
        <template #default="{ row, $index }">
          <el-switch
            v-model="row.required"
            size="small"
            @change="(val) => updateParam($index, 'required', val)"
          />
        </template>
      </el-table-column>

      <el-table-column v-if="!isOutput" label="默认值" min-width="100">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.defaultValue"
            placeholder="请输入默认值"
            size="small"
            @change="(val) => updateParam($index, 'defaultValue', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="描述" min-width="180">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.description"
            placeholder="请输入描述"
            size="small"
            @change="(val) => updateParam($index, 'description', val)"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="50" align="center">
        <template #default="{ $index }">
          <el-button type="danger" text :icon="Delete" size="small" @click="removeParam($index)" />
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="empty-params">
      <span class="empty-text">暂无参数，点击上方按钮添加</span>
    </div>
  </div>
</template>

<style scoped>
.param-config-table {
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.allow-add-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 12px;
  color: #606266;
}

.empty-params {
  padding: 24px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
}

.empty-text {
  color: #909399;
  font-size: 13px;
}
</style>

<style>
/* 全局样式：参数类型下拉框加高 */
.param-type-cascader .el-cascader-panel,
.el-cascader-menu__wrap.el-scrollbar__wrap {
  height: 250px !important;
}

.param-type-cascader .el-cascader-menu {
  height: 100% !important;
  max-height: 400px !important;
}
</style>
