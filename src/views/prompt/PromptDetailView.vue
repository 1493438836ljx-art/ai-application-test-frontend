<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Calendar,
  Clock,
  EditPen,
  Plus,
  Delete,
  View,
  DocumentCopy,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// Prompt 数据
const prompt = ref(null)

// 编辑状态
const isEditing = ref(false)
const editedContent = ref('')

// 预览变量值
const previewValues = ref({})

// 变量编辑对话框
const variableDialogVisible = ref(false)
const editingVariable = ref(null)
const isNewVariable = ref(false)
const variableForm = ref({
  name: '',
  type: 'string',
  required: true,
  defaultValue: '',
  description: '',
})

// 从内容中提取变量名
const extractVariables = (content) => {
  const regex = /\{\{(\w+)\}\}/g
  const variables = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1]
    if (varName && !variables.includes(varName)) {
      variables.push(varName)
    }
  }
  return variables
}

// 从内容中自动同步变量
const syncVariables = () => {
  if (!prompt.value) return

  const contentVars = extractVariables(prompt.value.content)
  const existingVars = prompt.value.variables.map((v) => v.name)

  // 添加新变量
  contentVars.forEach((varName) => {
    if (!existingVars.includes(varName)) {
      prompt.value.variables.push({
        name: varName,
        type: 'string',
        required: true,
        description: '',
      })
    }
  })

  // 移除不存在的变量
  prompt.value.variables = prompt.value.variables.filter((v) => contentVars.includes(v.name))
}

// 加载 Prompt 数据
const loadPrompt = () => {
  const id = route.params.id

  // 模拟数据
  const mockPrompts = {
    '1': {
      id: '1',
      name: '通用对话助手',
      description: '一个通用的对话助手 Prompt，适用于日常问答、闲聊等场景',
      content:
        '你是一个友好、专业的AI助手。请用简洁清晰的语言回答用户的问题。\n\n用户问题：{{question}}',
      category: '对话',
      tags: ['通用', 'ChatGPT'],
      variables: [
        { name: 'question', type: 'string', required: true, description: '用户的问题' },
      ],
      createdAt: '2024-01-15',
      updatedAt: '2024-02-20',
    },
    '2': {
      id: '2',
      name: '代码审查专家',
      description: '专业的代码审查 Prompt，帮助发现代码中的问题和改进建议',
      content:
        '你是一位资深的代码审查专家。请仔细审查以下代码，指出潜在的问题、安全漏洞、性能问题，并提供改进建议。\n\n代码语言：{{language}}\n代码内容：\n{{code}}',
      category: '代码',
      tags: ['代码', '安全'],
      variables: [
        { name: 'language', type: 'string', required: true, description: '编程语言' },
        { name: 'code', type: 'string', required: true, description: '待审查的代码' },
      ],
      createdAt: '2024-01-20',
      updatedAt: '2024-02-18',
    },
  }

  prompt.value = mockPrompts[id] || {
    id,
    name: '示例 Prompt',
    description: '这是一个示例 Prompt',
    content: '请在此编辑 Prompt 内容...\n\n可以使用 {{变量名}} 定义变量。',
    category: '其他',
    tags: ['示例'],
    variables: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-02-01',
  }

  // 初始化预览值
  prompt.value.variables.forEach((v) => {
    if (!previewValues.value[v.name]) {
      previewValues.value[v.name] = v.defaultValue || ''
    }
  })
}

// 返回列表
const goBack = () => {
  router.push('/prompt')
}

// 开始编辑内容
const startEdit = () => {
  if (!prompt.value) return
  isEditing.value = true
  editedContent.value = prompt.value.content
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
}

// 保存内容
const saveContent = () => {
  if (!prompt.value) return
  prompt.value.content = editedContent.value
  prompt.value.updatedAt = new Date().toISOString().slice(0, 10)
  isEditing.value = false
  syncVariables()
  ElMessage.success('内容已保存')
}

// 打开变量编辑对话框
const openVariableDialog = (variable) => {
  if (variable) {
    isNewVariable.value = false
    editingVariable.value = variable
    variableForm.value = {
      name: variable.name,
      type: variable.type,
      required: variable.required,
      defaultValue: variable.defaultValue || '',
      description: variable.description || '',
    }
  } else {
    isNewVariable.value = true
    editingVariable.value = null
    variableForm.value = {
      name: '',
      type: 'string',
      required: true,
      defaultValue: '',
      description: '',
    }
  }
  variableDialogVisible.value = true
}

// 保存变量
const saveVariable = () => {
  if (!prompt.value) return

  if (!variableForm.value.name.trim()) {
    ElMessage.warning('请输入变量名')
    return
  }

  // 检查变量名是否有效（只允许字母、数字、下划线）
  if (!/^\w+$/.test(variableForm.value.name)) {
    ElMessage.warning('变量名只能包含字母、数字和下划线')
    return
  }

  if (isNewVariable.value) {
    // 检查是否已存在
    if (prompt.value.variables.some((v) => v.name === variableForm.value.name)) {
      ElMessage.warning('变量名已存在')
      return
    }
    prompt.value.variables.push({
      name: variableForm.value.name,
      type: variableForm.value.type,
      required: variableForm.value.required,
      defaultValue: variableForm.value.defaultValue || undefined,
      description: variableForm.value.description || undefined,
    })
    // 在内容中添加变量占位符
    prompt.value.content += `\n{{${variableForm.value.name}}}`
    previewValues.value[variableForm.value.name] = variableForm.value.defaultValue || ''
  } else if (editingVariable.value) {
    const index = prompt.value.variables.findIndex((v) => v.name === editingVariable.value.name)
    if (index !== -1) {
      const oldName = prompt.value.variables[index].name
      const newName = variableForm.value.name
      // 如果变量名改变了，需要更新内容和预览值
      if (oldName !== newName) {
        prompt.value.content = prompt.value.content.replace(
          new RegExp(`\\{\\{${oldName}\\}\\}`, 'g'),
          `{{${newName}}}`,
        )
        previewValues.value[newName] = previewValues.value[oldName] || ''
        delete previewValues.value[oldName]
      }
      prompt.value.variables[index] = {
        name: variableForm.value.name,
        type: variableForm.value.type,
        required: variableForm.value.required,
        defaultValue: variableForm.value.defaultValue || undefined,
        description: variableForm.value.description || undefined,
      }
    }
  }

  prompt.value.updatedAt = new Date().toISOString().slice(0, 10)
  variableDialogVisible.value = false
  ElMessage.success(isNewVariable.value ? '变量已添加' : '变量已更新')
}

// 删除变量
const deleteVariable = (variable) => {
  if (!prompt.value) return

  const index = prompt.value.variables.findIndex((v) => v.name === variable.name)
  if (index !== -1) {
    prompt.value.variables.splice(index, 1)
    // 从内容中移除变量占位符
    prompt.value.content = prompt.value.content.replace(
      new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'),
      '',
    )
    delete previewValues.value[variable.name]
    prompt.value.updatedAt = new Date().toISOString().slice(0, 10)
    ElMessage.success('变量已删除')
  }
}

// 渲染预览内容
const renderedPreview = computed(() => {
  if (!prompt.value) return ''

  let result = prompt.value.content
  Object.entries(previewValues.value).forEach(([name, value]) => {
    result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value || `[${name}]`)
  })
  return result
})

// 复制 Prompt 内容
const copyPrompt = () => {
  if (!prompt.value) return
  navigator.clipboard.writeText(prompt.value.content).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

// 复制渲染后的内容
const copyRendered = () => {
  navigator.clipboard.writeText(renderedPreview.value).then(() => {
    ElMessage.success('已复制渲染后的内容')
  })
}

// 高亮显示内容中的变量
const highlightedContent = computed(() => {
  if (!prompt.value) return ''
  return prompt.value.content.replace(/\{\{(\w+)\}\}/g, '<span class="var-highlight">{{$1}}</span>')
})

// 监听内容变化，自动同步变量
watch(
  () => prompt.value?.content,
  () => {
    syncVariables()
  },
)

onMounted(() => {
  loadPrompt()
})
</script>

<template>
  <div class="prompt-detail-page" v-if="prompt">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info">
          <h2>{{ prompt.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ prompt.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              更新于 {{ prompt.updatedAt }}
            </span>
            <span class="meta-item">
              <el-icon><EditPen /></el-icon>
              {{ prompt.variables.length }} 个变量
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="DocumentCopy" @click="copyPrompt">复制原始内容</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：内容编辑区 -->
      <div class="content-panel">
        <div class="panel-header">
          <h3>Prompt 内容</h3>
          <div class="panel-actions">
            <template v-if="!isEditing">
              <el-button type="primary" size="small" @click="startEdit">编辑</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button type="primary" size="small" @click="saveContent">保存</el-button>
            </template>
          </div>
        </div>
        <div class="panel-body">
          <template v-if="isEditing">
            <el-input
              v-model="editedContent"
              type="textarea"
              :rows="20"
              placeholder="请输入 Prompt 内容，使用 {{变量名}} 定义变量"
              class="content-editor"
            />
          </template>
          <template v-else>
            <div class="content-display" v-html="highlightedContent"></div>
          </template>
        </div>
        <div class="panel-tip">
          <el-icon><EditPen /></el-icon>
          使用 <code v-pre>{{变量名}}</code> 语法定义变量，变量会自动同步到右侧面板
        </div>
      </div>

      <!-- 右侧：变量管理和预览 -->
      <div class="side-panel">
        <!-- 变量管理 -->
        <div class="variables-section">
          <div class="section-header">
            <h3>变量管理</h3>
            <el-button
              type="primary"
              size="small"
              :icon="Plus"
              @click="openVariableDialog()"
            >
              添加变量
            </el-button>
          </div>
          <div class="variables-list">
            <div v-if="prompt.variables.length === 0" class="empty-variables">
              <p>暂无变量</p>
              <p class="tip">在内容中使用 <code v-pre>{{变量名}}</code> 语法定义变量</p>
            </div>
            <div
              v-for="variable in prompt.variables"
              :key="variable.name"
              class="variable-item"
            >
              <div class="variable-header">
                <div class="variable-info">
                  <span class="variable-name">{{ variable.name }}</span>
                  <el-tag size="small" type="info">{{ variable.type }}</el-tag>
                  <el-tag v-if="variable.required" size="small" type="danger">必填</el-tag>
                </div>
                <div class="variable-actions">
                  <el-button
                    link
                    size="small"
                    type="primary"
                    @click="openVariableDialog(variable)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    link
                    size="small"
                    type="danger"
                    @click="deleteVariable(variable)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <div class="variable-desc" v-if="variable.description">
                {{ variable.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- 实时预览 -->
        <div class="preview-section">
          <div class="section-header">
            <h3>
              <el-icon><View /></el-icon>
              实时预览
            </h3>
            <el-button size="small" text @click="copyRendered">复制</el-button>
          </div>

          <!-- 变量值输入 -->
          <div class="preview-inputs" v-if="prompt.variables.length > 0">
            <div
              v-for="variable in prompt.variables"
              :key="variable.name"
              class="input-item"
            >
              <label>
                {{ variable.name }}
                <span v-if="variable.required" class="required">*</span>
              </label>
              <el-input
                v-model="previewValues[variable.name]"
                :placeholder="variable.description || `请输入 ${variable.name}`"
                size="small"
              />
            </div>
          </div>

          <!-- 渲染结果 -->
          <div class="preview-result">
            <div class="result-label">渲染结果：</div>
            <div class="result-content">{{ renderedPreview }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 变量编辑对话框 -->
    <el-dialog
      v-model="variableDialogVisible"
      :title="isNewVariable ? '添加变量' : '编辑变量'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="variableForm" label-width="80px" label-position="left">
        <el-form-item label="变量名" required>
          <el-input
            v-model="variableForm.name"
            placeholder="请输入变量名（字母、数字、下划线）"
            :disabled="!isNewVariable"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="variableForm.type" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔值" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="variableForm.required" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input v-model="variableForm.defaultValue" placeholder="可选，变量的默认值" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="variableForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选，变量的用途说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="variableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveVariable">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.prompt-detail-page {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.content-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.panel-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.content-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.content-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.content-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  color: #303133;
}

.content-display :deep(.var-highlight) {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
}

.panel-tip {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-tip code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #606266;
}

.side-panel {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.variables-section,
.preview-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.variables-list {
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.empty-variables {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.empty-variables .tip {
  font-size: 12px;
  margin-top: 4px;
}

.variable-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 8px;
}

.variable-item:last-child {
  margin-bottom: 0;
}

.variable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.variable-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.variable-name {
  font-weight: 600;
  color: #303133;
  font-family: 'Monaco', 'Menlo', monospace;
}

.variable-desc {
  font-size: 12px;
  color: #909399;
}

.variable-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.variable-item:hover .variable-actions {
  opacity: 1;
}

.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-inputs {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  max-height: 200px;
  overflow-y: auto;
}

.input-item {
  margin-bottom: 12px;
}

.input-item:last-child {
  margin-bottom: 0;
}

.input-item label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.input-item label .required {
  color: #f56c6c;
  margin-left: 2px;
}

.preview-result {
  padding: 12px;
  flex: 1;
  overflow: auto;
}

.result-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.result-content {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  color: #303133;
}
</style>
