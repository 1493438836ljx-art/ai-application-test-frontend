import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getVariableTypes,
  getVariableTypeCategories,
  getVariableTypesByCategory,
} from '@/api/variableType.js'

export const useVariableTypeStore = defineStore('variableType', () => {
  // 变量类型列表（原始数据）
  const variableTypes = ref([])

  // 分类列表
  const categories = ref([])

  // 加载状态
  const loading = ref(false)

  // 错误信息
  const error = ref(null)

  // 是否已加载
  const loaded = ref(false)

  /**
   * 获取基本类型列表
   * 后端返回 category: "BASIC"
   */
  const basicTypes = computed(() => {
    return variableTypes.value
      .filter((t) => t.category === 'BASIC')
      .map((t) => ({
        value: t.code,
        label: t.name,
      }))
  })

  /**
   * 获取数组元素类型列表
   * 后端返回 category: "COMPOSITE" 且有 elementType 字段
   */
  const arrayElementTypes = computed(() => {
    // 获取Array的子类型（有elementType的Array类型）
    const arrayTypes = variableTypes.value
      .filter((t) => t.category === 'COMPOSITE' && t.elementType && t.code.startsWith('Array<'))
      .map((t) => ({
        value: t.elementType,
        label: t.elementType,
      }))
    // 如果没有Array子类型，使用基本类型作为选项
    if (arrayTypes.length === 0) {
      return basicTypes.value
    }
    return arrayTypes
  })

  /**
   * 获取文件类型列表
   * 后端返回 category: "COMPOSITE" 且有 fileType 字段
   */
  const fileTypes = computed(() => {
    return variableTypes.value
      .filter((t) => t.category === 'COMPOSITE' && t.fileType)
      .map((t) => ({
        value: t.fileType,
        label: t.fileType,
      }))
  })

  /**
   * 获取数据字典类型列表
   * 后端返回 category: "COMPOSITE" 且有 dictionaryType 字段
   */
  const dictionaryTypes = computed(() => {
    const dictTypes = variableTypes.value
      .filter((t) => t.category === 'COMPOSITE' && t.dictionaryType)
      .map((t) => ({
        value: t.dictionaryType,
        label: t.dictionaryType,
      }))
    // 如果没有从后端获取到，返回默认的数据字典类型
    if (dictTypes.length === 0) {
      return [
        { value: '公文写作数据字典', label: '公文写作数据字典' },
        { value: '会议纪要数据字典', label: '会议纪要数据字典' },
      ]
    }
    return dictTypes
  })

  /**
   * 获取基本类型选项（不含 Array 和 File，用于循环节点输出变量类型选择）
   */
  const basicTypeOptions = computed(() => {
    return basicTypes.value
  })

  /**
   * 生成级联选择器选项
   * 格式: [{ value: 'String', label: 'String' }, { value: 'Array', label: 'Array', children: [...] }, ...]
   */
  const typeOptions = computed(() => {
    const options = []

    // 基本类型
    basicTypes.value.forEach((t) => {
      options.push(t)
    })

    // Array 复合类型
    if (arrayElementTypes.value.length > 0) {
      options.push({
        value: 'Array',
        label: 'Array',
        children: arrayElementTypes.value,
      })
    }

    // File 复合类型
    if (fileTypes.value.length > 0) {
      options.push({
        value: 'File',
        label: 'File',
        children: fileTypes.value,
      })
    }

    // Dictionary 复合类型（数据字典）
    if (dictionaryTypes.value.length > 0) {
      options.push({
        value: 'Dictionary',
        label: 'Dictionary',
        children: dictionaryTypes.value,
      })
    }

    return options
  })

  /**
   * 加载所有变量类型数据
   */
  async function loadVariableTypes() {
    if (loaded.value) return

    loading.value = true
    error.value = null

    try {
      const data = await getVariableTypes()
      variableTypes.value = data
      loaded.value = true
    } catch (e) {
      error.value = e.message
      console.error('加载变量类型失败:', e)
      // 使用默认数据
      loadDefaultTypes()
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载分类列表
   */
  async function loadCategories() {
    try {
      const data = await getVariableTypeCategories()
      categories.value = data
    } catch (e) {
      console.error('加载分类列表失败:', e)
    }
  }

  /**
   * 加载指定分类的变量类型
   */
  async function loadTypesByCategory(category) {
    try {
      const data = await getVariableTypesByCategory(category)
      return data
    } catch (e) {
      console.error(`加载分类 ${category} 的变量类型失败:`, e)
      return []
    }
  }

  /**
   * 加载默认类型（后端不可用时使用）
   * 格式与后端返回的数据一致
   */
  function loadDefaultTypes() {
    variableTypes.value = [
      // 基本类型 (BASIC)
      { code: 'String', name: '字符串', category: 'BASIC' },
      { code: 'Boolean', name: '布尔值', category: 'BASIC' },
      { code: 'Integer', name: '整数', category: 'BASIC' },
      { code: 'Object', name: '对象', category: 'BASIC' },
      { code: 'Times', name: '时间', category: 'BASIC' },
      // 复合类型 - Array (COMPOSITE with elementType)
      { code: 'Array', name: '数组', category: 'COMPOSITE' },
      { code: 'Array<String>', name: '字符串数组', category: 'COMPOSITE', elementType: 'String' },
      { code: 'Array<Boolean>', name: '布尔值数组', category: 'COMPOSITE', elementType: 'Boolean' },
      { code: 'Array<Integer>', name: '整数数组', category: 'COMPOSITE', elementType: 'Integer' },
      { code: 'Array<Object>', name: '对象数组', category: 'COMPOSITE', elementType: 'Object' },
      { code: 'Array<Times>', name: '时间数组', category: 'COMPOSITE', elementType: 'Times' },
      // 复合类型 - File (COMPOSITE with fileType)
      { code: 'File', name: '文件', category: 'COMPOSITE' },
      { code: 'File<Zip>', name: 'ZIP文件', category: 'COMPOSITE', fileType: 'Zip' },
      { code: 'File<Doc>', name: '文档文件', category: 'COMPOSITE', fileType: 'Doc' },
      { code: 'File<Excel>', name: 'Excel文件', category: 'COMPOSITE', fileType: 'Excel' },
      { code: 'File<Txt>', name: '文本文件', category: 'COMPOSITE', fileType: 'Txt' },
      // 复合类型 - Dictionary (COMPOSITE with dictionaryType)
      { code: 'Dictionary', name: '数据字典', category: 'COMPOSITE' },
      { code: 'Dictionary<公文写作数据字典>', name: '公文写作数据字典', category: 'COMPOSITE', dictionaryType: '公文写作数据字典' },
      { code: 'Dictionary<会议纪要数据字典>', name: '会议纪要数据字典', category: 'COMPOSITE', dictionaryType: '会议纪要数据字典' },
    ]
    loaded.value = true
  }

  /**
   * 重新加载数据
   */
  async function refresh() {
    loaded.value = false
    await loadVariableTypes()
  }

  return {
    // 状态
    variableTypes,
    categories,
    loading,
    error,
    loaded,

    // 计算属性
    basicTypes,
    arrayElementTypes,
    fileTypes,
    dictionaryTypes,
    typeOptions,
    basicTypeOptions,

    // 方法
    loadVariableTypes,
    loadCategories,
    loadTypesByCategory,
    refresh,
  }
})
