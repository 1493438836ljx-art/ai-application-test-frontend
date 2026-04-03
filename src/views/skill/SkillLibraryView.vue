<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Clock,
  MoreFilled,
  Edit,
  Delete,
  CopyDocument,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import {
  getSkillList,
  getSkillDetail,
  createSkill,
  updateSkill,
  deleteSkill as deleteSkillApi,
  copySkill as copySkillApi,
  publishSkill,
  unpublishSkill,
} from '@/api/skill'
import SkillFormDialog from './components/SkillFormDialog.vue'

// 定义 emit 事件
const emit = defineEmits(['viewDetail'])

// 加载状态
const loading = ref(false)

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// Skill列表数据
const skillList = ref([])

// 总数
const total = ref(0)

// 搜索关键词
const searchKeyword = ref('')

// 分类筛选
const categoryFilter = ref('')

// 状态筛选
const statusFilter = ref('')

// 是否有筛选条件
const hasFilter = computed(() => {
  return searchKeyword.value || categoryFilter.value || statusFilter.value
})

// 表单弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentSkill = ref(null)

// 点击卡片查看详情
const handleCardClick = (item) => {
  emit('viewDetail', item.id)
}

// 从详情页点击编辑（供详情页调用）
const handleEditFromDetail = (skill) => {
  editSkill(skill)
}

// 获取Skill列表
const fetchSkillList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      name: searchKeyword.value,
      category: categoryFilter.value,
      status: statusFilter.value,
    }
    const response = await getSkillList(params)
    if (response) {
      skillList.value = response.content || []
      total.value = response.totalElements || 0
    }
  } catch {
    skillList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听搜索和筛选条件变化
watch([searchKeyword, categoryFilter, statusFilter], () => {
  currentPage.value = 1
  fetchSkillList()
})

// 分页大小变化处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchSkillList()
}

// 页码变化处理
const handlePageChange = (val) => {
  currentPage.value = val
  fetchSkillList()
}

// 状态配置
const statusConfig = {
  PUBLISHED: { label: '已发布', type: 'success' },
  DRAFT: { label: '草稿', type: 'warning' },
}

// 获取状态配置
const getStatusConfig = (status) => statusConfig[status] || { label: status, type: 'info' }

// 分类配置
const categoryConfig = {
  SYSTEM: { label: '系统', color: '#409EFF' },
  USER: { label: '自定义', color: '#67C23A' },
}

// 获取分类配置
const getCategoryConfig = (category) => categoryConfig[category] || { label: category, color: '#909399' }

// 访问类型配置
const accessTypeConfig = {
  PUBLIC: { label: '公开', color: '#67C23A' },
  PRIVATE: { label: '私有', color: '#909399' },
  WHITELIST: { label: '白名单', color: '#E6A23C' },
  PROJECT: { label: '项目级', color: '#409EFF' },
}

// 获取访问类型配置
const getAccessTypeConfig = (accessType) => accessTypeConfig[accessType] || { label: accessType, color: '#909399' }

// 执行类型配置
const executionTypeConfig = {
  AUTOMATED: '自动化',
  AI: 'AI驱动',
}

// 新建Skill
const handleCreateSkill = () => {
  isEdit.value = false
  currentSkill.value = null
  dialogVisible.value = true
}

// 编辑Skill
const editSkill = async (item) => {
  try {
    loading.value = true
    // 调用详情接口获取完整数据（包含入参出参）
    const skillDetail = await getSkillDetail(item.id)
    isEdit.value = true
    currentSkill.value = skillDetail
    dialogVisible.value = true
  } catch {
    // 错误已在 request.js 中统一处理
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async (formData, file) => {
  try {
    loading.value = true
    if (isEdit.value && currentSkill.value) {
      await updateSkill(currentSkill.value.id, formData, file)
      ElMessage.success('更新成功')
    } else {
      await createSkill(formData, file)
      ElMessage.success('创建成功')
    }
    fetchSkillList()
  } catch {
    // 错误已在 request.js 中统一处理
  } finally {
    loading.value = false
  }
}

// 复制Skill
const copySkill = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要复制Skill"${item.name}"吗？`, '确认复制', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    loading.value = true
    await copySkillApi(item.id)
    ElMessage.success('复制成功')
    fetchSkillList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 删除Skill
const deleteSkill = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除Skill"${item.name}"吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    await deleteSkillApi(item.id)
    ElMessage.success('删除成功')
    fetchSkillList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 发布/取消发布Skill
const handlePublishSkill = async (item) => {
  const isPublished = item.status === 'PUBLISHED'
  const action = isPublished ? '取消发布' : '发布'

  try {
    await ElMessageBox.confirm(`确定要${action}Skill"${item.name}"吗？`, `确认${action}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    loading.value = true
    if (isPublished) {
      await unpublishSkill(item.id)
    } else {
      await publishSkill(item.id)
    }
    ElMessage.success(`${action}成功`)
    fetchSkillList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在 request.js 中统一处理
    }
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  // 处理后端返回的时间格式，转换为 yyyy-mm-dd hh:mm:ss
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 下拉菜单命令
const handleCommand = (command, item) => {
  switch (command) {
    case 'edit':
      editSkill(item)
      break
    case 'copy':
      copySkill(item)
      break
    case 'delete':
      deleteSkill(item)
      break
    case 'publish':
      handlePublishSkill(item)
      break
  }
}

onMounted(() => {
  fetchSkillList()
})
</script>

<template>
  <div class="skill-library-view" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Skill库管理</h1>
        <p class="page-desc">管理和配置可复用的 Skill 能力</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreateSkill">
          新建 Skill
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索Skill名称或描述"
          :prefix-icon="Search"
          clearable
          style="width: 320px"
        />
      </div>
      <div class="filter-options">
        <el-select v-model="categoryFilter" placeholder="分类筛选" clearable style="width: 120px">
          <el-option label="系统" value="SYSTEM" />
          <el-option label="自定义" value="USER" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px">
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="草稿" value="DRAFT" />
        </el-select>
      </div>
    </div>

    <!-- Skill列表 -->
    <div class="skill-list">
      <div v-if="skillList.length === 0 && !loading" class="empty-state">
        <el-empty :description="hasFilter ? '未筛选出符合条件的Skill' : '暂无Skill数据'">
          <el-button v-if="!hasFilter" type="primary" :icon="Plus" @click="handleCreateSkill">
            创建第一个 Skill
          </el-button>
        </el-empty>
      </div>

      <div v-else class="skill-grid">
        <div v-for="item in skillList" :key="item.id" class="skill-card" @click="handleCardClick(item)">
          <!-- 右上角角标 -->
          <div class="card-corner-tag">
            <span v-if="item.status === 'DRAFT'" class="corner-tag draft">草稿</span>
            <span v-else-if="item.status === 'PUBLISHED' && item.accessType === 'PUBLIC'" class="corner-tag public">公开</span>
          </div>

          <!-- 标题行 -->
          <div class="card-header">
            <h3 class="card-title">{{ item.name }}</h3>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, item)" @click.stop>
              <el-button text :icon="MoreFilled" class="more-btn" @click.stop />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Edit" command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item :icon="CopyDocument" command="copy">复制</el-dropdown-item>
                  <el-dropdown-item
                    :icon="item.status === 'PUBLISHED' ? Download : Upload"
                    command="publish"
                  >
                    {{ item.status === 'PUBLISHED' ? '取消发布' : '发布' }}
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Delete" command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 执行类型 -->
          <div class="card-execution-type">
            <el-tag
              size="small"
              :class="item.executionType === 'AI' ? 'ai-tag' : item.executionType === 'AUTOMATED' ? 'automated-tag' : ''"
            >
              {{ executionTypeConfig[item.executionType] || '-' }}
            </el-tag>
          </div>

          <!-- 描述 -->
          <p class="card-description">{{ item.description || '暂无描述' }}</p>

          <!-- 入参出参 -->
          <div class="card-params">
            <span class="param-item">入参 {{ item.inputParamCount || 0 }}</span>
            <span class="param-item">出参 {{ item.outputParamCount || 0 }}</span>
          </div>

          <!-- 底部信息 -->
          <div class="card-footer">
            <div class="footer-row">
              <span class="footer-label">创建人</span>
              <span class="footer-value">{{ item.createdBy || '-' }}</span>
              <span class="footer-label">创建时间</span>
              <span class="footer-value">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="footer-row">
              <span class="footer-label">更新人</span>
              <span class="footer-value">{{ item.updatedBy || '-' }}</span>
              <span class="footer-label">更新时间</span>
              <span class="footer-value">{{ formatTime(item.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 表单弹窗 -->
    <SkillFormDialog
      v-model="dialogVisible"
      :skill="currentSkill"
      :is-edit="isEdit"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.skill-library-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
}

.filter-options {
  display: flex;
  gap: 12px;
}

.skill-list {
  min-height: 400px;
}

.empty-state {
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.skill-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  position: relative;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #6366f1;
}

/* 右上角角标 */
.card-corner-tag {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.corner-tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 0 12px 0 8px;
}

.corner-tag.draft {
  background: #f3f4f6;
  color: #6b7280;
}

.corner-tag.public {
  background: #e8f5e9;
  color: #52c41a;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.more-btn {
  padding: 4px;
  color: #9ca3af;
  flex-shrink: 0;
}

.more-btn:hover {
  color: #6366f1;
  background: #f3f4f6;
}

/* 执行类型 */
.card-execution-type {
  margin-bottom: 12px;
}

/* AI驱动标签 - 渐变紫色主题 */
.ai-tag {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  color: #fff;
  border: none;
}

/* 自动化标签 - 蓝色主题 */
.automated-tag {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

/* 描述 */
.card-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

/* 入参出参 */
.card-params {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 12px;
}

.param-item {
  font-size: 14px;
  color: #374151;
}

/* 底部信息 */
.card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.footer-label {
  color: #9ca3af;
  flex-shrink: 0;
}

.footer-value {
  color: #374151;
  min-width: 60px;
}

.footer-row .footer-value:last-child {
  flex: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
