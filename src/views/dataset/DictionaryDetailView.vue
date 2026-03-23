<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Collection,
  Calendar,
  Edit,
  Delete,
  Link,
  FolderOpened,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDictionaryDetail,
  updateDictionary,
  deleteDictionary,
  getDictionaryLinkStatus,
} from '@/api/dictionary'

const route = useRoute()
const router = useRouter()

// 数据字典数据
const dictionary = ref(null)

// 关联的测评集列表
const linkedDatasets = ref([])

// 加载状态
const loading = ref(false)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  name: '',
  description: '',
  columns: [],
})

// 编辑表单验证规则
const editFormRules = {
  name: [
    { required: true, message: '请输入数据字典名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

// 加载数据字典数据
const loadDictionary = async () => {
  const id = route.params.id
  loading.value = true
  try {
    const response = await getDictionaryDetail(id)
    if (response.code === 200) {
      dictionary.value = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || '',
        columns: response.data.columns || [],
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      }
      // 加载关联的测评集
      linkedDatasets.value = response.data.linkedDatasets || []
    } else {
      ElMessage.error(response.message || '加载数据字典失败')
    }
  } catch (error) {
    ElMessage.error('系统服务异常！')
    console.error('加载数据字典失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/dataset')
}

// 跳转到测评集详情
const goToDatasetDetail = (datasetId) => {
  router.push(`/dataset/${datasetId}`)
}

// 获取字段类型标签类型
const getFieldTypeTagType = (type) => {
  const typeMap = {
    string: '',
    number: 'success',
    boolean: 'warning',
    enum: 'info',
  }
  return typeMap[type] || ''
}

// 获取字段类型文本
const getFieldTypeText = (type) => {
  const typeMap = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    enum: '枚举',
  }
  return typeMap[type] || type
}

// 打开编辑对话框
const openEditDialog = () => {
  if (!dictionary.value) return
  editForm.name = dictionary.value.name
  editForm.description = dictionary.value.description || ''
  editForm.columns = dictionary.value.columns.map(col => ({
    id: col.id,
    key: col.key,
    label: col.label,
    type: col.type,
    ...(col.enumOptions && { enumOptions: Array.isArray(col.enumOptions) ? col.enumOptions.join(',') : col.enumOptions }),
    ...(col.min !== undefined && { min: col.min }),
    ...(col.max !== undefined && { max: col.max }),
  }))
  editDialogVisible.value = true
}

// 添加字段
const addEditColumn = () => {
  editForm.columns.push({
    key: '',
    label: '',
    type: 'string',
  })
}

// 删除字段
const removeEditColumn = (index) => {
  if (editForm.columns.length > 1) {
    editForm.columns.splice(index, 1)
  }
}

// 提交编辑
const handleEditSubmit = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()

    // 验证字段
    if (editForm.columns.length === 0) {
      ElMessage.warning('请至少添加1个字段')
      return
    }

    const hasEmptyField = editForm.columns.some(col => !col.key?.trim() || !col.label?.trim())
    if (hasEmptyField) {
      ElMessage.warning('请填写所有字段的Key和名称')
      return
    }

    const updateData = {
      name: editForm.name,
      description: editForm.description,
      columns: editForm.columns.map(col => ({
        ...(col.id && { id: col.id }),
        key: col.key.trim(),
        label: col.label.trim(),
        type: col.type,
        ...(col.type === 'number' && { min: col.min, max: col.max }),
        ...(col.type === 'enum' && { enumOptions: col.enumOptions }),
      })),
    }

    const response = await updateDictionary(dictionary.value.id, updateData)
    if (response.code === 200) {
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      loadDictionary()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error('系统服务异常！')
      console.error('更新数据字典失败:', error)
    }
  }
}

// 删除数据字典
const handleDelete = async () => {
  try {
    // 先检查关联状态
    const linkStatus = await getDictionaryLinkStatus(dictionary.value.id)

    if (linkStatus.code === 200 && !linkStatus.data.canDelete) {
      // 有关联的测评集，无法删除
      const linkedCount = linkStatus.data.linkedDatasetCount || 0
      const linkedNames = linkStatus.data.linkedDatasets?.map(d => d.name).join('、') || ''
      ElMessageBox.alert(
        `该字典已被 ${linkedCount} 个测评集关联，无法删除。关联的测评集：${linkedNames}`,
        '无法删除',
        {
          confirmButtonText: '关闭',
          type: 'warning',
        }
      )
      return
    }

    // 可以删除，弹出确认框
    await ElMessageBox.confirm('确定要删除该数据字典吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 执行删除
    const response = await deleteDictionary(dictionary.value.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      goBack()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('系统服务异常！')
      console.error('删除数据字典失败:', error)
    }
  }
}

onMounted(() => {
  loadDictionary()
})
</script>

<template>
  <div class="dictionary-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info" v-if="dictionary">
          <h2>{{ dictionary.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ dictionary.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><Collection /></el-icon>
              {{ dictionary.columns.length }} 个字段
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="Edit" @click="openEditDialog">编辑</el-button>
        <el-button :icon="Delete" type="danger" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <!-- 数据字典信息卡片 -->
    <el-card class="info-card" v-if="dictionary">
      <div class="info-content">
        <div class="info-icon">
          <el-icon :size="48"><Collection /></el-icon>
        </div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">描述：</span>
            <span class="info-value">{{ dictionary.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">更新时间：</span>
            <span class="info-value">{{ dictionary.updatedAt }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 字段定义 -->
    <el-card class="fields-card" v-if="dictionary">
      <template #header>
        <div class="card-header">
          <span class="card-title">字段定义</span>
          <el-tag type="info" size="small">{{ dictionary.columns.length }} 个字段</el-tag>
        </div>
      </template>

      <el-table :data="dictionary.columns" style="width: 100%" border>
        <el-table-column prop="key" label="字段ID" width="150">
          <template #default="{ row }">
            <code class="field-key">{{ row.key }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="字段名称" width="120" />
        <el-table-column prop="type" label="字段类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getFieldTypeTagType(row.type)" size="small">
              {{ getFieldTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enumOptions" label="枚举选项" min-width="200">
          <template #default="{ row }">
            <template v-if="row.type === 'enum' && row.enumOptions">
              <el-tag
                v-for="option in row.enumOptions"
                :key="option"
                size="small"
                type="info"
                effect="plain"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ option }}
              </el-tag>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="150">
          <template #default="{ row }">
            <span class="field-desc">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 关联的测评集 -->
    <el-card class="linked-card" v-if="dictionary">
      <template #header>
        <div class="card-header">
          <div class="card-title-wrapper">
            <span class="card-title">关联的测评集</span>
            <el-tag type="primary" size="small" effect="plain">
              {{ linkedDatasets.length }} 个
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="linkedDatasets.length > 0" class="linked-datasets">
        <div
          v-for="dataset in linkedDatasets"
          :key="dataset.id"
          class="linked-dataset-item"
          @click="goToDatasetDetail(dataset.id)"
        >
          <div class="dataset-icon">
            <el-icon :size="24"><FolderOpened /></el-icon>
          </div>
          <div class="dataset-info">
            <div class="dataset-name">{{ dataset.name }}</div>
            <div class="dataset-meta">
              <span>{{ dataset.dataCount }} 条数据</span>
              <span class="separator">·</span>
              <span>{{ dataset.testType === 'subjective' ? '主观题' : '客观题' }}</span>
            </div>
          </div>
          <div class="dataset-arrow">
            <el-icon><Link /></el-icon>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无关联的测评集" :image-size="80" />
    </el-card>

    <!-- 编辑数据字典弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑数据字典"
      width="680px"
      :close-on-click-modal="false"
      class="edit-dictionary-dialog"
    >
      <div class="edit-form-container">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon basic-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <span class="section-title">基本信息</span>
          </div>
          <div class="section-content">
            <el-form
              ref="editFormRef"
              :model="editForm"
              :rules="editFormRules"
              label-width="80px"
              label-position="left"
            >
              <el-form-item label="名称" prop="name">
                <el-input
                  v-model="editForm.name"
                  placeholder="请输入数据字典名称"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="描述" prop="description">
                <el-input
                  v-model="editForm.description"
                  type="textarea"
                  placeholder="请输入数据字典描述"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 字段定义 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon field-icon">
              <el-icon><Edit /></el-icon>
            </div>
            <span class="section-title">字段定义</span>
          </div>
          <div class="section-content">
            <div class="columns-form">
              <div
                v-for="(column, index) in editForm.columns"
                :key="index"
                class="column-item"
              >
                <div class="column-header">
                  <span class="column-index">
                    <span class="index-num">{{ index + 1 }}</span>
                    <span class="index-label">字段</span>
                  </span>
                  <el-button
                    v-if="editForm.columns.length > 1"
                    type="danger"
                    link
                    size="small"
                    @click="removeEditColumn(index)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
                <div class="column-row">
                  <div class="column-field">
                    <label class="field-label"><span class="required">*</span> 字段Key</label>
                    <el-input v-model="column.key" placeholder="如: id" />
                  </div>
                  <div class="column-field">
                    <label class="field-label"><span class="required">*</span> 字段名称</label>
                    <el-input v-model="column.label" placeholder="如: ID" />
                  </div>
                  <div class="column-field">
                    <label class="field-label">字段类型</label>
                    <el-select v-model="column.type" placeholder="选择类型">
                      <el-option label="字符串" value="string" />
                      <el-option label="数字" value="number" />
                      <el-option label="枚举" value="enum" />
                    </el-select>
                  </div>
                </div>
                <!-- 数字类型额外配置 -->
                <div v-if="column.type === 'number'" class="column-extra">
                  <div class="column-field column-field-small">
                    <label class="field-label">最小值</label>
                    <el-input v-model="column.min" placeholder="可选" type="number" />
                  </div>
                  <div class="column-field column-field-small">
                    <label class="field-label">最大值</label>
                    <el-input v-model="column.max" placeholder="可选" type="number" />
                  </div>
                </div>
                <!-- 枚举类型额外配置 -->
                <div v-if="column.type === 'enum'" class="column-extra">
                  <div class="column-field column-field-full">
                    <label class="field-label">枚举值</label>
                    <el-input
                      v-model="column.enumOptions"
                      placeholder="多个枚举值用逗号分隔，如: 选项1,选项2,选项3"
                    />
                  </div>
                </div>
              </div>
              <div class="column-actions">
                <el-button
                  v-if="editForm.columns.length < 10"
                  type="primary"
                  link
                  :icon="Edit"
                  @click="addEditColumn"
                >
                  添加字段
                </el-button>
                <span v-else class="field-limit-tip">
                  最多支持10个字段
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">保存修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dictionary-detail-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.info-card {
  margin-bottom: 24px;
}

.info-content {
  display: flex;
  gap: 24px;
}

.info-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  flex-shrink: 0;
}

.info-details {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.fields-card,
.linked-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.field-key {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.field-desc {
  font-size: 13px;
  color: #909399;
}

.linked-datasets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.linked-dataset-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.linked-dataset-item:hover {
  background: #f0f4ff;
  border-color: #409eff;
}

.dataset-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  flex-shrink: 0;
}

.dataset-info {
  flex: 1;
}

.dataset-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.dataset-meta {
  font-size: 13px;
  color: #909399;
}

.separator {
  margin: 0 8px;
}

.dataset-arrow {
  color: #909399;
  transition: transform 0.2s ease;
}

.linked-dataset-item:hover .dataset-arrow {
  color: #409eff;
  transform: translateX(4px);
}
</style>
