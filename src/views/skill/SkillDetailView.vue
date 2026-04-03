<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Download, Upload, ArrowLeft, Check, Close, Plus, Delete } from '@element-plus/icons-vue'
import { getSkillDetail, getDownloadSuiteUrl, publishSkill, unpublishSkill, updateSkill, createSkill } from '@/api/skill'

// 定义 props
const props = defineProps({
  skillId: {
    type: String,
    default: null,
  },
  autoEdit: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
})

// 定义 emit 事件
const emit = defineEmits(['back', 'updated'])

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 编辑状态
const isEditing = ref(false)

// Skill详情数据
const skill = ref(null)

// 表单数据
const form = ref({
  name: '',
  description: '',
  executionType: 'AUTOMATED',
  category: 'USER',
  accessType: 'PRIVATE',
  isContainer: false,
  allowAddInputParams: false,
  allowAddOutputParams: false,
  inputParameters: [],
  outputParameters: [],
})

// 上传的文件
const uploadedFile = ref(null)

// 获取Skill详情
const fetchSkillDetail = async () => {
  if (!props.skillId) {
    ElMessage.error('Skill ID 不存在')
    goBack()
    return
  }

  loading.value = true
  try {
    skill.value = await getSkillDetail(props.skillId)
  } catch {
    // 错误已在 request.js 中统一处理
  } finally {
    loading.value = false
  }
}

// 返回列表
const goBack = () => {
  emit('back')
}

// 进入编辑模式
const enterEditMode = () => {
  if (!skill.value) return

  // 复制数据到表单
  form.value = {
    name: skill.value.name || '',
    description: skill.value.description || '',
    executionType: skill.value.executionType || 'AUTOMATED',
    category: skill.value.category || 'USER',
    accessType: skill.value.accessType || 'PUBLIC',
    isContainer: skill.value.isContainer || false,
    inputParameters: JSON.parse(JSON.stringify(skill.value.inputParameters || [])),
    outputParameters: JSON.parse(JSON.stringify(skill.value.outputParameters || [])),
  }
  uploadedFile.value = null
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  if (props.isNew) {
    // 新建模式：返回列表页
    goBack()
  } else {
    // 编辑模式：退出编辑模式，恢复原始数据
    isEditing.value = false
    uploadedFile.value = null
  }
}

// 保存编辑
const saveEdit = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入名称')
    return
  }

  // 新建模式时必须上传文件
  if (props.isNew && !uploadedFile.value) {
    ElMessage.warning('请上传执行套件文件')
    return
  }

  saving.value = true
  try {
    // 构建请求数据对象（API 内部会处理 FormData）
    const data = {
      name: form.value.name,
      description: form.value.description || '',
      executionType: form.value.executionType,
      category: 'USER', // 默认分类为 USER
      accessType: form.value.accessType,
      isContainer: false, // 默认不启用容器
      allowAddInputParams: form.value.allowAddInputParams,
      allowAddOutputParams: form.value.allowAddOutputParams,
      inputParameters: form.value.inputParameters,
      outputParameters: form.value.outputParameters,
    }

    if (props.isNew) {
      // 新建模式
      await createSkill(data, uploadedFile.value)
      ElMessage.success('创建成功')
    } else {
      // 编辑模式
      await updateSkill(skill.value.id, data, uploadedFile.value)
      ElMessage.success('更新成功')
      // 重新获取详情
      await fetchSkillDetail()
    }

    isEditing.value = false

    // 通知父组件更新
    emit('updated')

    // 新建成功后返回列表
    if (props.isNew) {
      goBack()
    }
  } catch {
    // 错误已在 request.js 中统一处理
  } finally {
    saving.value = false
  }
}

// 点击发布/取消发布
const handlePublish = async () => {
  if (!skill.value) return

  const isPublished = skill.value.status === 'PUBLISHED'
  const action = isPublished ? '取消发布' : '发布'

  try {
    loading.value = true
    if (isPublished) {
      await unpublishSkill(skill.value.id)
    } else {
      await publishSkill(skill.value.id)
    }
    ElMessage.success(`${action}成功`)
    // 重新获取详情
    await fetchSkillDetail()
  } catch {
    // 错误已在 request.js 中统一处理
  } finally {
    loading.value = false
  }
}

// 下载执行套件
const handleDownload = async () => {
  if (!skill.value?.id) return

  try {
    const response = await fetch(getDownloadSuiteUrl(skill.value.id))
    if (!response.ok) {
      throw new Error('下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = skill.value.suiteFilename || 'suite_file'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 处理文件上传
const handleFileChange = (uploadFile) => {
  if (uploadFile && uploadFile.raw) {
    uploadedFile.value = uploadFile.raw
  }
}

// 添加入参
const addInputParam = () => {
  form.value.inputParameters.push({
    paramOrder: form.value.inputParameters.length + 1,
    paramName: '',
    paramType: 'String',
    defaultValue: '',
    required: false,
    description: '',
  })
}

// 删除入参
const removeInputParam = (index) => {
  form.value.inputParameters.splice(index, 1)
  // 重新排序
  form.value.inputParameters.forEach((param, i) => {
    param.paramOrder = i + 1
  })
}

// 添加出参
const addOutputParam = () => {
  form.value.outputParameters.push({
    paramOrder: form.value.outputParameters.length + 1,
    paramName: '',
    paramType: 'String',
    required: false,
    description: '',
  })
}

// 删除出参
const removeOutputParam = (index) => {
  form.value.outputParameters.splice(index, 1)
  // 重新排序
  form.value.outputParameters.forEach((param, i) => {
    param.paramOrder = i + 1
  })
}

// 状态配置
const statusConfig = {
  PUBLISHED: { label: '已发布', type: 'success' },
  DRAFT: { label: '草稿', type: 'warning' },
}

const getStatusConfig = (status) => statusConfig[status] || { label: status, type: 'info' }

// 分类配置
const categoryConfig = {
  SYSTEM: { label: '系统', color: '#409EFF' },
  USER: { label: '自定义', color: '#67C23A' },
}

const getCategoryConfig = (category) => categoryConfig[category] || { label: category, color: '#909399' }

// 执行类型配置
const executionTypeConfig = {
  AUTOMATED: '自动化',
  AI: 'AI驱动',
}

// 访问类型配置
const accessTypeConfig = {
  PUBLIC: '公开',
  PRIVATE: '私有',
  WHITELIST: '白名单',
  PROJECT: '项目级',
}

// 参数类型 - 级联选择器选项
const basicTypeOptions = [
  { value: 'String', label: 'String' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Object', label: 'Object' },
  { value: 'Times', label: 'Times' },
]

const arrayElementTypeOptions = [
  { value: 'String', label: 'String' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Time', label: 'Time' },
  { value: 'Object', label: 'Object' },
]

const fileTypeOptions = [
  { value: 'Zip', label: 'Zip' },
  { value: 'Doc', label: 'Doc' },
  { value: 'Docx', label: 'Docx' },
  { value: 'Excel', label: 'Excel' },
  { value: 'Pdf', label: 'PDF' },
  { value: 'Txt', label: 'Txt' },
]

const paramTypeOptions = computed(() => {
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
const handleTypeChange = (row, val) => {
  if (!val) {
    row.paramType = 'String'
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

  row.paramType = newType
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 计算页面标题
const pageTitle = computed(() => {
  if (props.isNew) return '新建 Skill'
  return isEditing.value ? '编辑 Skill' : 'Skill 详情'
})
const pageDesc = computed(() => {
  if (props.isNew) return '创建新的 Skill 能力'
  return isEditing.value ? '修改 Skill 信息' : '查看 Skill 的详细信息'
})

// 监听 skillId 和 isNew 变化
watch(
  [() => props.skillId, () => props.isNew],
  ([newId, isNew]) => {
    if (isNew) {
      // 新建模式：初始化空表单并进入编辑模式
      skill.value = {
        name: '',
        description: '',
        executionType: 'AUTOMATED',
        category: 'USER',
        accessType: 'PUBLIC',
        isContainer: false,
        inputParameters: [],
        outputParameters: [],
      }
      isEditing.value = true
    } else if (newId) {
      // 编辑/查看模式
      isEditing.value = false
      fetchSkillDetail().then(() => {
        // 如果 autoEdit 为 true，自动进入编辑模式
        if (props.autoEdit && skill.value) {
          enterEditMode()
        }
      })
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.isNew) {
    // 新建模式
    skill.value = {
      name: '',
      description: '',
      executionType: 'AUTOMATED',
      category: 'USER',
      accessType: 'PUBLIC',
      isContainer: false,
      inputParameters: [],
      outputParameters: [],
    }
    isEditing.value = true
  } else if (props.skillId) {
    fetchSkillDetail()
  }
})
</script>

<template>
  <div class="skill-detail-view" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header simple-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" class="icon-only-btn" />
        <h1 class="simple-title">{{ isNew ? '新建 Skill' : (isEditing ? '编辑 Skill' : skill?.name || 'Skill 详情') }}</h1>
        <el-tag v-if="!isNew && !isEditing && skill" :type="getStatusConfig(skill.status).type" size="small">
          {{ getStatusConfig(skill.status).label }}
        </el-tag>
      </div>
    </div>

    <!-- 查看模式内容（非新建模式） -->
    <div v-if="skill && !isEditing && !isNew" class="detail-content">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">名称</span>
            <span class="detail-value">{{ skill.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">执行类型</span>
            <span class="detail-value">{{ executionTypeConfig[skill.executionType] || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">访问类型</span>
            <span class="detail-value">{{ accessTypeConfig[skill.accessType] || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">是否容器</span>
            <span class="detail-value">{{ skill.isContainer ? '是' : '否' }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">描述</span>
            <span class="detail-value">{{ skill.description || '暂无描述' }}</span>
          </div>
        </div>
      </div>

      <!-- 执行套件 -->
      <div class="detail-section">
        <h3 class="section-title">执行套件</h3>
        <div class="suite-info">
          <template v-if="skill.suiteFilename">
            <span class="suite-filename">{{ skill.suiteFilename }}</span>
            <el-button type="primary" link :icon="Download" @click="handleDownload">下载</el-button>
          </template>
          <span v-else class="empty-text">暂无执行套件</span>
        </div>
      </div>

      <!-- 入参配置 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            入参配置
            <span v-if="skill.inputParameters?.length" class="param-count">
              ({{ skill.inputParameters.length }}个)
            </span>
          </h3>
          <div class="header-actions">
            <span class="allow-add-switch view-mode">
              <el-switch v-model="skill.allowAddInputParams" size="small" disabled />
              <span class="switch-label">支持额外增加</span>
            </span>
          </div>
        </div>
        <div v-if="skill.inputParameters?.length" class="param-table-wrapper">
          <el-table :data="skill.inputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="90" align="center" />
            <el-table-column prop="paramName" label="参数名称" width="180" />
            <el-table-column prop="paramType" label="参数类型" width="170" />
            <el-table-column prop="defaultValue" label="默认值" min-width="130">
              <template #default="{ row }">
                {{ row.defaultValue || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="required" label="必填" width="90" align="center">
              <template #default="{ row }">
                {{ row.required ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150">
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-text">暂无入参配置</div>
      </div>

      <!-- 出参配置 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            出参配置
            <span v-if="skill.outputParameters?.length" class="param-count">
              ({{ skill.outputParameters.length }}个)
            </span>
          </h3>
          <div class="header-actions">
            <span class="allow-add-switch view-mode">
              <el-switch v-model="skill.allowAddOutputParams" size="small" disabled />
              <span class="switch-label">支持额外增加</span>
            </span>
          </div>
        </div>
        <div v-if="skill.outputParameters?.length" class="param-table-wrapper">
          <el-table :data="skill.outputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="90" align="center" />
            <el-table-column prop="paramName" label="参数名称" width="180" />
            <el-table-column prop="paramType" label="参数类型" width="170" />
            <el-table-column prop="required" label="必填" width="90" align="center">
              <template #default="{ row }">
                {{ row.required ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="250">
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-text">暂无出参配置</div>
      </div>

      <!-- 其他信息 -->
      <div class="detail-section">
        <h3 class="section-title">其他信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">创建人</span>
            <span class="detail-value">{{ skill.createdBy || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatTime(skill.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">更新人</span>
            <span class="detail-value">{{ skill.updatedBy || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">更新时间</span>
            <span class="detail-value">{{ formatTime(skill.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部按钮区域 -->
      <div class="footer-actions">
        <el-button v-if="skill?.status === 'DRAFT'" type="success" :icon="Upload" @click="handlePublish">
          发布
        </el-button>
        <el-button v-else type="warning" :icon="Upload" @click="handlePublish">取消发布</el-button>
        <el-button type="primary" :icon="Edit" @click="enterEditMode">编辑</el-button>
      </div>
    </div>

    <!-- 编辑模式内容 -->
    <div v-if="skill && isEditing" class="detail-content edit-content">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div class="edit-grid">
          <div class="edit-item">
            <span class="edit-label"><span class="required">*</span> 名称</span>
            <el-input v-model="form.name" placeholder="请输入名称" maxlength="100" show-word-limit />
          </div>
          <div class="edit-item">
            <span class="edit-label">执行类型</span>
            <el-select v-model="form.executionType" style="width: 100%">
              <el-option label="自动化" value="AUTOMATED" />
              <el-option label="AI驱动" value="AI" />
            </el-select>
          </div>
          <div class="edit-item full-width">
            <span class="edit-label">描述</span>
            <el-input
              v-model="form.description"
              type="textarea"
              placeholder="请输入描述"
              :rows="3"
              maxlength="500"
              show-word-limit
            />
          </div>
        </div>
      </div>

      <!-- 执行套件 -->
      <div class="detail-section">
        <h3 class="section-title"><span class="required">*</span> 执行套件</h3>
        <div class="suite-edit">
          <div v-if="skill?.suiteFilename && !uploadedFile" class="current-suite">
            <span class="suite-filename">当前文件: {{ skill.suiteFilename }}</span>
            <el-upload
              :show-file-list="false"
              :on-change="handleFileChange"
              :auto-upload="false"
              accept=".zip"
            >
              <el-button type="primary" link>重新上传</el-button>
            </el-upload>
          </div>
          <div v-else-if="uploadedFile" class="new-suite">
            <span class="suite-filename">新文件: {{ uploadedFile.name }}</span>
            <el-button type="danger" link @click="uploadedFile = null">移除</el-button>
          </div>
          <el-upload
            v-else
            :show-file-list="false"
            :on-change="handleFileChange"
            :auto-upload="false"
            accept=".zip"
          >
            <el-button type="primary">上传执行套件</el-button>
          </el-upload>
        </div>
      </div>

      <!-- 入参配置 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">入参配置</h3>
          <div class="header-actions">
            <span class="allow-add-switch">
              <el-switch v-model="form.allowAddInputParams" size="small" />
              <span class="switch-label">支持额外增加</span>
            </span>
            <el-button type="primary" :icon="Plus" size="small" @click="addInputParam">添加参数</el-button>
          </div>
        </div>
        <div v-if="form.inputParameters.length > 0" class="param-table-wrapper">
          <el-table :data="form.inputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="90" align="center" />
            <el-table-column label="参数名称" width="150">
              <template #default="{ row }">
                <el-input v-model="row.paramName" placeholder="请输入" />
              </template>
            </el-table-column>
            <el-table-column label="参数类型" width="210">
              <template #default="{ row }">
                <el-cascader
                  :model-value="getTypeValue(row)"
                  :options="paramTypeOptions"
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
                  @update:model-value="(val) => handleTypeChange(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="默认值" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" placeholder="请输入默认值" />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="请输入描述" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ $index }">
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeInputParam($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-text">暂无入参配置，点击上方按钮添加</div>
      </div>

      <!-- 出参配置 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">出参配置</h3>
          <div class="header-actions">
            <span class="allow-add-switch">
              <el-switch v-model="form.allowAddOutputParams" size="small" />
              <span class="switch-label">支持额外增加</span>
            </span>
            <el-button type="primary" :icon="Plus" size="small" @click="addOutputParam">添加参数</el-button>
          </div>
        </div>
        <div v-if="form.outputParameters.length > 0" class="param-table-wrapper">
          <el-table :data="form.outputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="90" align="center" />
            <el-table-column label="参数名称" width="150">
              <template #default="{ row }">
                <el-input v-model="row.paramName" placeholder="请输入" />
              </template>
            </el-table-column>
            <el-table-column label="参数类型" width="210">
              <template #default="{ row }">
                <el-cascader
                  :model-value="getTypeValue(row)"
                  :options="paramTypeOptions"
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
                  @update:model-value="(val) => handleTypeChange(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="250">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="请输入描述" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ $index }">
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeOutputParam($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-text">暂无出参配置，点击上方按钮添加</div>
      </div>

      <!-- 底部按钮区域 -->
      <div class="footer-actions">
        <el-button :icon="Close" @click="cancelEdit">取消</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="saveEdit">保存</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-detail-view {
  padding: 0;
  background: #f5f7fa;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  margin-right: 8px;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 简化头部样式（新建模式） */
.simple-header {
  padding: 16px 24px;
}

.simple-header .header-left {
  align-items: center;
}

.simple-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.detail-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detail-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.section-header .section-title {
  margin: 0;
}

.header-tags {
  display: flex;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.allow-add-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 13px;
  color: #606266;
}

.category-tag {
  color: #fff;
  border: none;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #374151;
}

.suite-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.suite-filename {
  font-size: 14px;
  color: #374151;
}

.param-count {
  font-size: 14px;
  font-weight: normal;
  color: #9ca3af;
}

.param-table-wrapper {
  margin-top: 12px;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

/* 编辑模式样式 */
.edit-content {
  /* 编辑内容样式 */
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.edit-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-item.full-width {
  grid-column: span 2;
}

.edit-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.edit-label .required {
  color: #f56c6c;
  margin-right: 4px;
}

.section-title .required {
  color: #f56c6c;
  margin-right: 4px;
}

.suite-edit {
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.current-suite,
.new-suite {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 底部按钮区域 */
.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid #f3f4f6;
}

/* 纯图标按钮样式 */
.icon-only-btn {
  border: none;
  background: transparent;
  padding: 8px;
}

.icon-only-btn:hover {
  background: #f3f4f6;
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
