<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Download, Upload, ArrowLeft } from '@element-plus/icons-vue'
import { getSkillDetail, getDownloadSuiteUrl, publishSkill, unpublishSkill } from '@/api/skill'

// 定义 props
const props = defineProps({
  skillId: {
    type: String,
    required: true,
  },
})

// 定义 emit 事件
const emit = defineEmits(['back'])

// 加载状态
const loading = ref(false)

// Skill详情数据
const skill = ref(null)

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

// 点击编辑 - 暂时通过 emit 通知父组件
const handleEdit = () => {
  // TODO: 可以改为打开编辑弹窗或通知父组件
  ElMessage.info('编辑功能开发中')
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

// 监听 skillId 变化
watch(
  () => props.skillId,
  (newId) => {
    if (newId) {
      fetchSkillDetail()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.skillId) {
    fetchSkillDetail()
  }
})
</script>

<template>
  <div class="skill-detail-view" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" class="back-btn">返回</el-button>
        <div class="header-info">
          <h1 class="page-title">Skill 详情</h1>
          <p class="page-desc">查看 Skill 的详细信息</p>
        </div>
      </div>
      <div class="header-right">
        <el-button v-if="skill?.status === 'DRAFT'" type="success" :icon="Upload" @click="handlePublish">
          发布
        </el-button>
        <el-button v-else type="warning" :icon="Upload" @click="handlePublish">取消发布</el-button>
        <el-button type="primary" :icon="Edit" @click="handleEdit">编辑</el-button>
      </div>
    </div>

    <!-- 详情内容 -->
    <div v-if="skill" class="detail-content">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">基本信息</h3>
          <div class="header-tags">
            <el-tag size="small" :color="getCategoryConfig(skill.category).color" class="category-tag">
              {{ getCategoryConfig(skill.category).label }}
            </el-tag>
            <el-tag :type="getStatusConfig(skill.status).type" size="small">
              {{ getStatusConfig(skill.status).label }}
            </el-tag>
          </div>
        </div>
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
        <h3 class="section-title">
          入参配置
          <span v-if="skill.inputParameters?.length" class="param-count">
            ({{ skill.inputParameters.length }}个)
          </span>
        </h3>
        <div v-if="skill.inputParameters?.length" class="param-table-wrapper">
          <el-table :data="skill.inputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="60" align="center" />
            <el-table-column prop="paramName" label="参数名称" min-width="120" />
            <el-table-column prop="paramType" label="参数类型" width="140" />
            <el-table-column prop="defaultValue" label="默认值" min-width="100">
              <template #default="{ row }">
                {{ row.defaultValue || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="required" label="必填" width="60" align="center">
              <template #default="{ row }">
                {{ row.required ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="120">
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
        <h3 class="section-title">
          出参配置
          <span v-if="skill.outputParameters?.length" class="param-count">
            ({{ skill.outputParameters.length }}个)
          </span>
        </h3>
        <div v-if="skill.outputParameters?.length" class="param-table-wrapper">
          <el-table :data="skill.outputParameters" border size="small">
            <el-table-column prop="paramOrder" label="序号" width="60" align="center" />
            <el-table-column prop="paramName" label="参数名称" min-width="120" />
            <el-table-column prop="paramType" label="参数类型" width="140" />
            <el-table-column prop="required" label="必填" width="60" align="center">
              <template #default="{ row }">
                {{ row.required ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="120">
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
</style>
