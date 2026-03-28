<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Delete, Plus, Download } from '@element-plus/icons-vue'
import ParamConfigTable from './ParamConfigTable.vue'
import { getDownloadSuiteUrl } from '@/api/skill'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  skill: {
    type: Object,
    default: null,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

// 上传的套件文件
const suiteFile = ref(null)
const uploadRef = ref(null)
const hiddenFileInput = ref(null)

// 表单数据
const formData = ref({
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

// 表单引用
const formRef = ref(null)

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入Skill名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度为1-100个字符', trigger: 'blur' },
  ],
}

// 执行类型选项
const executionTypeOptions = [
  { value: 'AUTOMATED', label: '自动化' },
  { value: 'AI', label: 'AI驱动' },
]

// 分类选项
const categoryOptions = [
  { value: 'SYSTEM', label: '系统' },
  { value: 'USER', label: '用户' },
]

// 访问类型选项
const accessTypeOptions = [
  { value: 'PUBLIC', label: '公开' },
  { value: 'PRIVATE', label: '私有' },
  { value: 'WHITELIST', label: '白名单' },
  { value: 'PROJECT', label: '项目级' },
]

// 对话框标题
const dialogTitle = computed(() => (props.isEdit ? '编辑 Skill' : '新建 Skill'))

// 监听skill变化，填充表单数据
watch(
  () => props.skill,
  (newSkill) => {
    if (newSkill && props.isEdit) {
      formData.value = {
        name: newSkill.name || '',
        description: newSkill.description || '',
        executionType: newSkill.executionType || 'AUTOMATED',
        category: newSkill.category || 'USER',
        accessType: newSkill.accessType || 'PRIVATE',
        isContainer: newSkill.isContainer || false,
        allowAddInputParams: newSkill.allowAddInputParams || false,
        allowAddOutputParams: newSkill.allowAddOutputParams || false,
        inputParameters: newSkill.inputParameters || [],
        outputParameters: newSkill.outputParameters || [],
      }
    }
  },
  { immediate: true },
)

// 处理文件选择
const handleFileChange = (uploadFile) => {
  suiteFile.value = uploadFile.raw
}

// 处理文件移除
const handleFileRemove = () => {
  suiteFile.value = null
}

// 从路径中提取文件名
const getFileNameFromPath = (path) => {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

// 触发文件上传
const triggerFileInput = () => {
  hiddenFileInput.value?.click()
}

// 处理隐藏文件输入的变化
const handleHiddenFileChange = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    suiteFile.value = file
  }
  // 清空 input 以便可以重复选择同一个文件
  event.target.value = ''
}

// 下载执行套件
const handleDownload = () => {
  if (props.skill?.id) {
    const downloadUrl = getDownloadSuiteUrl(props.skill.id)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = props.skill?.suiteFilename || 'suite.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
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
  }
  suiteFile.value = null
  formRef.value?.resetFields()
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 手动验证执行套件文件
    if (!suiteFile.value && !props.skill?.suitePath) {
      ElMessage.warning('请上传执行套件文件')
      return
    }

    emit('submit', { ...formData.value }, suiteFile.value)
    handleClose()
  } catch {
    // 验证失败
  }
}

// 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>

      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入Skill名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="执行套件" required>
        <div class="suite-upload-wrapper">
          <!-- 新上传的文件 -->
          <div v-if="suiteFile" class="file-preview">
            <el-icon class="file-icon" :size="24"><Upload /></el-icon>
            <div class="file-info">
              <span class="file-name">{{ suiteFile.name }}</span>
              <span class="file-size">{{ (suiteFile.size / 1024).toFixed(2) }} KB</span>
            </div>
            <el-button type="danger" size="small" circle @click="handleFileRemove">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <!-- 编辑时显示已有的套件路径 -->
          <div v-else-if="isEdit && (props.skill?.suiteFilename || props.skill?.suitePath)" class="file-preview existing-file">
            <el-icon class="file-icon existing" :size="24"><Upload /></el-icon>
            <div class="file-info">
              <span class="file-name">{{ props.skill?.suiteFilename || getFileNameFromPath(props.skill.suitePath) }}</span>
              <span class="file-size existing-hint">已上传的执行套件</span>
            </div>
            <el-button type="primary" size="small" text :icon="Download" @click="handleDownload">
              下载
            </el-button>
            <el-button type="primary" size="small" text @click="triggerFileInput">
              重新上传
            </el-button>
          </div>
          <!-- 上传组件 -->
          <el-upload
            v-else
            ref="uploadRef"
            class="suite-uploader"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".zip"
            :on-change="handleFileChange"
          >
            <div class="upload-content">
              <el-icon class="upload-icon" :size="32"><Plus /></el-icon>
              <div class="upload-text">
                <span>点击或拖拽上传</span>
                <span class="upload-hint">仅支持 ZIP 格式的执行套件文件</span>
              </div>
            </div>
          </el-upload>
          <!-- 隐藏的文件输入，用于重新上传 -->
          <input
            ref="hiddenFileInput"
            type="file"
            accept=".zip"
            style="display: none"
            @change="handleHiddenFileChange"
          />
        </div>
      </el-form-item>

      <!-- 类型配置 -->
      <el-divider content-position="left">类型配置</el-divider>

      <el-form-item label="执行类型" prop="executionType">
        <el-select v-model="formData.executionType" placeholder="请选择执行类型">
          <el-option
            v-for="item in executionTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="分类" prop="category">
        <el-select v-model="formData.category" placeholder="请选择分类">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="访问类型" prop="accessType">
        <el-select v-model="formData.accessType" placeholder="请选择访问类型">
          <el-option
            v-for="item in accessTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="是否容器" prop="isContainer">
        <el-switch v-model="formData.isContainer" />
      </el-form-item>

      <!-- 入参配置 -->
      <el-divider content-position="left">入参配置</el-divider>

      <el-form-item prop="inputParameters">
        <ParamConfigTable
          v-model="formData.inputParameters"
          :is-output="false"
          v-model:allow-add-params="formData.allowAddInputParams"
        />
      </el-form-item>

      <el-divider content-position="left">出参配置</el-divider>
      <!-- 出参配置 -->
      <el-form-item  prop="outputParameters">
        <ParamConfigTable
          v-model="formData.outputParameters"
          :is-output="true"
          v-model:allow-add-params="formData.allowAddOutputParams"
        />
      </el-form-item>

    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-divider {
  margin: 16px 0;
}

.el-select {
  width: 100%;
}

.suite-upload-wrapper {
  width: 100%;
}

.suite-uploader {
  width: 100%;
}

.suite-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #fafafa;
  padding: 24px;
  transition: all 0.2s ease;
}

.suite-uploader :deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #9ca3af;
}

.suite-uploader :deep(.el-upload-dragger:hover) .upload-icon {
  color: #3b82f6;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-text span:first-child {
  font-size: 14px;
  color: #374151;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.file-icon {
  color: #409eff;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-preview.existing-file {
  background: #f0f9ff;
  border-color: #bfdbfe;
}

.file-icon.existing {
  color: #67c23a;
}

.existing-hint {
  color: #67c23a;
}
</style>
