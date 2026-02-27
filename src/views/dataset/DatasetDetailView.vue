<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  FolderOpened,
  Calendar,
  Edit,
  Plus,
  Upload,
  Delete,
  DataAnalysis,
  Document,
  ChatDotRound,
  Cpu,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()

// 测评集数据（模拟）
const dataset = ref(null)

// 测试数据列表（模拟）
const testData = ref([])

// 选中的单元格
const selectedCell = ref(null)

// 表格编辑模式
const isTableEditMode = ref(false)

// 编辑中的单元格
const editingCell = ref(null)

// 编辑内容
const editContent = ref('')

// 图标映射
const iconMap = {
  ChatDotRound,
  Cpu,
  Document,
  DataAnalysis,
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FolderOpened
}

// 列定义
const columns = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'input', label: '输入', width: 300 },
  { key: 'expectedOutput', label: '期望输出', width: 300 },
  { key: 'category', label: '分类', width: 100 },
  { key: 'difficulty', label: '难度', width: 80 },
]

// 加载测评集数据
const loadDataset = () => {
  const id = route.params.id
  // 模拟数据
  const mockDatasets = {
    '1': {
      id: '1',
      name: '通用对话测评集',
      icon: 'ChatDotRound',
      iconType: 'preset',
      tags: ['对话', '通用'],
      description:
        '包含多轮对话、常识问答等通用场景的测试数据，用于评估模型的对话能力。',
      dataCount: 25,
      createdAt: '2024-01-15',
      updatedAt: '2024-02-20',
    },
  }

  dataset.value = mockDatasets[id] || {
    id,
    name: '示例测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    tags: ['示例', '测试'],
    description: '这是一个示例测评集的描述信息。',
    dataCount: 15,
    createdAt: '2024-01-01',
    updatedAt: '2024-02-01',
  }

  // 模拟测试数据
  testData.value = Array.from({ length: dataset.value.dataCount }, (_, i) => ({
    id: `${i + 1}`,
    input: `测试输入内容 ${i + 1}`,
    expectedOutput: `期望输出内容 ${i + 1}`,
    category: ['问候', '询问', '建议', '闲聊'][i % 4],
    difficulty: ['简单', '中等', '困难'][i % 3],
  }))
}

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)

// 当前页数据
const currentTestData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return testData.value.slice(start, end)
})

// 总数
const total = computed(() => testData.value.length)

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  selectedCell.value = null
  editingCell.value = null
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  selectedCell.value = null
  editingCell.value = null
}

// 返回列表
const goBack = () => {
  router.push('/dataset')
}

// 编辑测评集
const handleEdit = () => {
  ElMessage.info('编辑功能开发中')
}

// 解析文件数据
const parseFileData = (file, importMode) => {
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        ElMessage.error('文件中没有工作表')
        return
      }
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        ElMessage.error('无法读取工作表')
        return
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        ElMessage.warning('文件内容为空或只有表头')
        return
      }

      // 获取表头
      const headers = jsonData[0]
      const headerMap = {}
      headers.forEach((h, i) => {
        if (h) headerMap[h.trim().toLowerCase()] = i
      })

      // 查找列索引
      const inputCol = headerMap['input'] ?? headerMap['输入'] ?? 0
      const outputCol = headerMap['output'] ?? headerMap['期望输出'] ?? headerMap['输出'] ?? 1
      const categoryCol = headerMap['category'] ?? headerMap['分类'] ?? 2
      const difficultyCol = headerMap['difficulty'] ?? headerMap['难度'] ?? 3

      // 解析数据行
      const newRows = []
      const startId = importMode === 'replace' ? 1 : testData.value.length + 1
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        newRows.push({
          id: `${startId + newRows.length}`,
          input: String(row[inputCol] || ''),
          expectedOutput: String(row[outputCol] || ''),
          category: String(row[categoryCol] || '问候'),
          difficulty: String(row[difficultyCol] || '简单'),
        })
      }

      if (newRows.length === 0) {
        ElMessage.warning('没有解析到有效数据')
        return
      }

      // 根据导入方式处理数据
      if (importMode === 'replace') {
        testData.value = newRows
      } else {
        testData.value.push(...newRows)
      }

      if (dataset.value) {
        dataset.value.dataCount = testData.value.length
      }

      const modeText = importMode === 'replace' ? '覆盖导入' : '追加导入'
      ElMessage.success(`${modeText}成功，共 ${newRows.length} 条数据`)
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

// 选择文件并导入
const selectFile = (importMode) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls,.csv'
  input.onchange = (e) => {
    const target = e.target
    const file = target.files?.[0]
    if (!file) return
    parseFileData(file, importMode)
  }
  input.click()
}

// 导入文件
const handleImport = () => {
  ElMessageBox.confirm('请选择导入方式', '导入数据', {
    distinguishCancelAndClose: true,
    confirmButtonText: '覆盖导入',
    cancelButtonText: '追加导入',
    type: 'info',
  })
    .then(() => {
      // 点击确认 - 覆盖导入
      selectFile('replace')
    })
    .catch((action) => {
      if (action === 'cancel') {
        // 点击取消 - 追加导入
        selectFile('append')
      }
      // 点击关闭按钮则不做任何操作
    })
}

// 选中单元格
const selectCell = (rowIndex, colIndex) => {
  if (!isTableEditMode.value) return
  selectedCell.value = { row: rowIndex, col: colIndex }
}

// 双击编辑
const startEdit = (rowIndex, colIndex) => {
  if (!isTableEditMode.value) return
  const col = columns[colIndex]
  if (!col || col.key === 'id') return // ID列不可编辑

  editingCell.value = { row: rowIndex, col: colIndex }
  const row = currentTestData.value[rowIndex]
  if (row) {
    editContent.value = row[col.key] || ''
  }
}

// 保存编辑
const saveEdit = () => {
  if (!editingCell.value) return

  const { row, col } = editingCell.value
  const colDef = columns[col]
  if (!colDef) return

  const colKey = colDef.key
  const actualIndex = (currentPage.value - 1) * pageSize.value + row
  if (testData.value[actualIndex]) {
    testData.value[actualIndex][colKey] = editContent.value
  }

  editingCell.value = null
  editContent.value = ''
  ElMessage.success('保存成功')
}

// 取消编辑
const cancelEdit = () => {
  editingCell.value = null
  editContent.value = ''
}

// 添加行
const handleAddRow = () => {
  if (!isTableEditMode.value) return
  const newId = testData.value.length + 1
  testData.value.push({
    id: `${newId}`,
    input: '',
    expectedOutput: '',
    category: '问候',
    difficulty: '简单',
  })
  if (dataset.value) {
    dataset.value.dataCount = testData.value.length
  }
  // 跳转到最后一页
  currentPage.value = Math.ceil(testData.value.length / pageSize.value)
  ElMessage.success('已添加新行')
}

// 删除选中行
const handleDeleteRow = () => {
  if (!isTableEditMode.value) return
  if (!selectedCell.value) {
    ElMessage.warning('请先选择要删除的行')
    return
  }

  const rowIndex = selectedCell.value.row
  const actualIndex = (currentPage.value - 1) * pageSize.value + rowIndex
  const row = testData.value[actualIndex]

  ElMessageBox.confirm(`确定要删除第 ${row.id} 行数据吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    testData.value.splice(actualIndex, 1)
    if (dataset.value) {
      dataset.value.dataCount = testData.value.length
    }
    selectedCell.value = null
    ElMessage.success('删除成功')
  })
}

// 键盘导航
const handleKeyDown = (e) => {
  if (!isTableEditMode.value) return

  if (editingCell.value) {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
    return
  }

  if (!selectedCell.value) return

  const { row, col } = selectedCell.value
  const maxRow = currentTestData.value.length - 1
  const maxCol = columns.length - 1

  switch (e.key) {
    case 'ArrowUp':
      selectedCell.value = { row: Math.max(0, row - 1), col }
      break
    case 'ArrowDown':
      selectedCell.value = { row: Math.min(maxRow, row + 1), col }
      break
    case 'ArrowLeft':
      selectedCell.value = { row, col: Math.max(0, col - 1) }
      break
    case 'ArrowRight':
      selectedCell.value = { row, col: Math.min(maxCol, col + 1) }
      break
    case 'Enter':
    case 'F2':
      startEdit(row, col)
      break
    case 'Delete':
      handleDeleteRow()
      break
  }
}

onMounted(() => {
  loadDataset()
  nextTick(() => {
    window.addEventListener('keydown', handleKeyDown)
  })
})
</script>

<template>
  <div class="dataset-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info" v-if="dataset">
          <h2>{{ dataset.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ dataset.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><FolderOpened /></el-icon>
              {{ dataset.dataCount }} 条数据
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="Upload" @click="handleImport">导入</el-button>
        <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
      </div>
    </div>

    <!-- 测评集信息卡片 -->
    <el-card class="info-card" v-if="dataset">
      <div class="info-content">
        <div class="info-icon">
          <img
            v-if="dataset.iconType === 'custom' && dataset.customIconUrl"
            :src="dataset.customIconUrl"
            :alt="dataset.name"
            class="custom-icon"
          />
          <el-icon v-else :size="48">
            <component :is="getIconComponent(dataset.icon)" />
          </el-icon>
        </div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">描述：</span>
            <span class="info-value">{{ dataset.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">标签：</span>
            <div class="info-tags">
              <el-tag v-for="tag in dataset.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">更新时间：</span>
            <span class="info-value">{{ dataset.updatedAt }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 测试数据 Excel 表格 -->
    <div class="excel-container">
      <div class="excel-toolbar">
        <div class="toolbar-left">
          <el-button
            v-if="!isTableEditMode"
            type="primary"
            :icon="Edit"
            size="small"
            @click="isTableEditMode = true"
          >
            编辑
          </el-button>
          <template v-else>
            <el-button type="success" size="small" @click="isTableEditMode = false">
              完成编辑
            </el-button>
            <el-button type="primary" :icon="Plus" size="small" @click="handleAddRow">
              添加行
            </el-button>
            <el-button :icon="Delete" size="small" @click="handleDeleteRow">删除行</el-button>
          </template>
        </div>
        <div class="toolbar-right">
          <span v-if="isTableEditMode" class="toolbar-tip">
            提示：双击单元格编辑，方向键导航，Enter保存
          </span>
          <span v-else class="toolbar-tip">点击"编辑"按钮进入编辑模式</span>
        </div>
      </div>

      <div class="excel-wrapper" :class="{ 'edit-mode': isTableEditMode }">
        <table class="excel-table">
          <thead>
            <tr>
              <th class="row-header"></th>
              <th
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :style="{ width: col.width + 'px' }"
                :class="{
                  'col-selected': selectedCell?.col === colIndex,
                }"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in currentTestData"
              :key="row.id"
              :class="{ 'row-selected': selectedCell?.row === rowIndex }"
            >
              <td class="row-header">{{ (currentPage - 1) * pageSize + rowIndex + 1 }}</td>
              <td
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :class="{
                  'cell-selected':
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex,
                  'cell-editing':
                    editingCell?.row === rowIndex && editingCell?.col === colIndex,
                }"
                @click="selectCell(rowIndex, colIndex)"
                @dblclick="startEdit(rowIndex, colIndex)"
              >
                <template
                  v-if="editingCell?.row === rowIndex && editingCell?.col === colIndex"
                >
                  <input
                    v-if="col.key !== 'difficulty'"
                    v-model="editContent"
                    class="cell-input"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                    ref="editInput"
                    autofocus
                  />
                  <select
                    v-else
                    v-model="editContent"
                    class="cell-select"
                    @change="saveEdit"
                    @blur="cancelEdit"
                  >
                    <option value="简单">简单</option>
                    <option value="中等">中等</option>
                    <option value="困难">困难</option>
                  </select>
                </template>
                <template v-else>
                  <span class="cell-text">{{ row[col.key] }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </div>
  </div>
</template>

<style scoped>
.dataset-detail-page {
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

.info-icon .custom-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
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

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Excel 表格样式 */
.excel-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.excel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-tip {
  font-size: 12px;
  color: #909399;
}

.excel-wrapper {
  overflow: auto;
  max-height: 600px;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.excel-table th,
.excel-table td {
  border: 1px solid #d4d4d4;
  padding: 0;
  height: 32px;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
  box-sizing: border-box;
}

.excel-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
  padding: 0 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table th.row-header {
  width: 50px;
  text-align: center;
  background: #e8e8e8;
}

.excel-table td.row-header {
  text-align: center;
  background: #f5f5f5;
  color: #666;
  font-weight: 500;
}

.excel-table td {
  padding: 0 8px;
  background: #fff;
  color: #303133;
}

.excel-wrapper.edit-mode .excel-table td {
  cursor: cell;
}

.excel-wrapper.edit-mode .excel-table td:hover {
  background: #f0f7ff;
}

.excel-table td.cell-selected {
  background: #e6f4ff;
  outline: 2px solid #1890ff;
  outline-offset: -2px;
}

.excel-table tr.row-selected td {
  background: #f5f9ff;
}

.excel-table tr.row-selected td.cell-selected {
  background: #e6f4ff;
}

.excel-table td.cell-editing {
  padding: 0;
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  background: #fffbe6;
}

.cell-select {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 13px;
  background: #fffbe6;
  cursor: pointer;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.difficulty-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #303133;
}

.difficulty-简单 {
  background: #e6f7e6;
}

.difficulty-中等 {
  background: #fff7e6;
}

.difficulty-困难 {
  background: #fff1f0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
