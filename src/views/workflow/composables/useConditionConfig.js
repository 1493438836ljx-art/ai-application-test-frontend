/**
 * 条件表达式配置 Composable
 * 用于条件分支节点的配置面板
 */
import { ref, computed } from 'vue'

/**
 * 操作符定义
 * 每个操作符指定可用的参数类型
 */
export const OPERATOR_DEFINITIONS = [
  // 字符串操作符
  { value: 'equals', label: '等于', types: ['String', 'Integer', 'File'] },
  { value: 'notEquals', label: '不等于', types: ['String', 'Integer', 'File'] },
  { value: 'contains', label: '包含', types: ['String', 'Array'] },
  { value: 'startsWith', label: '开头是', types: ['String'] },
  { value: 'endsWith', label: '结尾是', types: ['String'] },
  { value: 'isEmpty', label: '为空', types: ['String', 'Array', 'Object'] },
  { value: 'isNotEmpty', label: '不为空', types: ['String', 'Array', 'Object'] },

  // 数值操作符
  { value: 'greaterThan', label: '大于', types: ['Integer'] },
  { value: 'lessThan', label: '小于', types: ['Integer'] },
  { value: 'greaterThanOrEqual', label: '大于等于', types: ['Integer'] },
  { value: 'lessThanOrEqual', label: '小于等于', types: ['Integer'] },
  { value: 'between', label: '区间', types: ['Integer'] },

  // 布尔操作符
  { value: 'isTrue', label: '为真', types: ['Boolean'] },
  { value: 'isFalse', label: '为假', types: ['Boolean'] },

  // 数组操作符
  { value: 'sizeEquals', label: '长度等于', types: ['Array'] },
  { value: 'sizeGreaterThan', label: '长度大于', types: ['Array'] },
]

/**
 * 判断操作符是否需要右操作数
 * @param {string} operator - 操作符
 * @returns {boolean} 是否需要右操作数
 */
export function needsRightOperand(operator) {
  const unaryOperators = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse']
  return !unaryOperators.includes(operator)
}

/**
 * 判断操作符是否需要两个右操作数（区间）
 * @param {string} operator - 操作符
 * @returns {boolean} 是否需要两个右操作数
 */
export function needsTwoRightOperands(operator) {
  return operator === 'between'
}

/**
 * 条件表达式配置 Composable
 * @returns {Object} 条件配置 API
 */
export function useConditionConfig() {
  // 条件表达式数据
  const conditionData = ref({
    type: 'SIMPLE',
    expression: {
      leftOperand: '',
      leftOperandType: 'literal',
      operator: 'equals',
      rightOperand: '',
      rightOperandType: 'literal',
    },
  })

  // 左操作数变量类型（用于过滤操作符）
  const leftOperandVarType = ref(null)

  // 右操作数第二个值（用于 between 操作符）
  const rightOperandSecond = ref('')

  /**
   * 根据左操作数类型过滤可用操作符
   */
  const availableOperators = computed(() => {
    if (!leftOperandVarType.value) {
      // 类型未知时返回全部操作符
      return OPERATOR_DEFINITIONS
    }

    // 提取基础类型（处理 Array<String>, File<Excel> 等格式）
    const baseType = extractBaseType(leftOperandVarType.value)

    return OPERATOR_DEFINITIONS.filter((op) => op.types.includes(baseType))
  })

  /**
   * 当前操作符是否需要右操作数
   */
  const showRightOperand = computed(() => {
    return needsRightOperand(conditionData.value.expression.operator)
  })

  /**
   * 当前操作符是否需要两个右操作数
   */
  const showTwoRightOperands = computed(() => {
    return needsTwoRightOperands(conditionData.value.expression.operator)
  })

  /**
   * 提取基础类型
   * @param {string} type - 完整类型字符串
   * @returns {string} 基础类型
   */
  function extractBaseType(type) {
    if (!type) return null
    // 处理 Array<String>, File<Excel> 等格式
    const match = type.match(/^(\w+)/)
    return match ? match[1] : type
  }

  /**
   * 从变量引用中解析节点名和参数名
   * @param {string} expression - 变量引用表达式，如 ${节点名.参数名}
   * @returns {Object|null} { nodeName, paramName } 或 null
   */
  function parseVariableReference(expression) {
    if (!expression) return null
    const match = expression.match(/^\$\{(.+)\.(.+)\}$/)
    if (match) {
      return {
        nodeName: match[1],
        paramName: match[2],
      }
    }
    return null
  }

  /**
   * 从可用变量中查找变量类型
   * @param {string} expression - 变量引用表达式
   * @param {Array} availableVariables - 可用变量列表
   * @returns {string|null} 变量类型
   */
  function findVariableType(expression, availableVariables) {
    const parsed = parseVariableReference(expression)
    if (!parsed || !availableVariables) return null

    const variable = availableVariables.find(
      (v) => v.node === parsed.nodeName && v.param === parsed.paramName
    )
    return variable?.type || null
  }

  /**
   * 更新左操作数并推断类型
   * @param {string} value - 左操作数值
   * @param {Array} availableVariables - 可用变量列表
   */
  function updateLeftOperand(value, availableVariables) {
    conditionData.value.expression.leftOperand = value

    // 判断是引用还是固定值
    if (value && value.startsWith('${')) {
      conditionData.value.expression.leftOperandType = 'reference'
      leftOperandVarType.value = findVariableType(value, availableVariables)
    } else {
      conditionData.value.expression.leftOperandType = 'literal'
      leftOperandVarType.value = null
    }

    // 如果当前操作符不在可用列表中，重置为第一个可用操作符
    const currentOperator = conditionData.value.expression.operator
    const isOperatorAvailable = availableOperators.value.some(
      (op) => op.value === currentOperator
    )
    if (!isOperatorAvailable && availableOperators.value.length > 0) {
      conditionData.value.expression.operator = availableOperators.value[0].value
    }
  }

  /**
   * 更新操作符
   * @param {string} operator - 操作符
   */
  function updateOperator(operator) {
    conditionData.value.expression.operator = operator
  }

  /**
   * 更新右操作数
   * @param {string} value - 右操作数值
   * @param {string} type - 值类型 ('literal' | 'reference')
   */
  function updateRightOperand(value, type) {
    conditionData.value.expression.rightOperand = value
    conditionData.value.expression.rightOperandType = type
  }

  /**
   * 更新右操作数第二个值（between 使用）
   * @param {string} value - 第二个值
   */
  function updateRightOperandSecond(value) {
    rightOperandSecond.value = value
  }

  /**
   * 初始化条件数据
   * @param {Object} existingCondition - 已有的条件配置
   */
  function initConditionData(existingCondition) {
    if (existingCondition && existingCondition.expression) {
      conditionData.value = {
        type: existingCondition.type || 'SIMPLE',
        expression: {
          leftOperand: existingCondition.expression.leftOperand || '',
          leftOperandType: existingCondition.expression.leftOperandType || 'literal',
          operator: existingCondition.expression.operator || 'equals',
          rightOperand: existingCondition.expression.rightOperand || '',
          rightOperandType: existingCondition.expression.rightOperandType || 'literal',
        },
      }

      // 处理 between 操作符的第二个值
      if (
        existingCondition.expression.operator === 'between' &&
        Array.isArray(existingCondition.expression.rightOperand)
      ) {
        conditionData.value.expression.rightOperand =
          existingCondition.expression.rightOperand[0] || ''
        rightOperandSecond.value = existingCondition.expression.rightOperand[1] || ''
      }
    } else {
      // 重置为默认值
      conditionData.value = {
        type: 'SIMPLE',
        expression: {
          leftOperand: '',
          leftOperandType: 'literal',
          operator: 'equals',
          rightOperand: '',
          rightOperandType: 'literal',
        },
      }
      rightOperandSecond.value = ''
      leftOperandVarType.value = null
    }
  }

  /**
   * 获取用于保存的条件数据
   * @returns {Object} 条件配置对象
   */
  function getConditionForSave() {
    const result = {
      type: 'SIMPLE',
      expression: {
        leftOperand: conditionData.value.expression.leftOperand,
        leftOperandType: conditionData.value.expression.leftOperandType,
        operator: conditionData.value.expression.operator,
        rightOperand: conditionData.value.expression.rightOperand,
        rightOperandType: conditionData.value.expression.rightOperandType,
      },
    }

    // 处理 between 操作符
    if (conditionData.value.expression.operator === 'between') {
      result.expression.rightOperand = [
        conditionData.value.expression.rightOperand,
        rightOperandSecond.value,
      ]
    }

    return result
  }

  /**
   * 重置条件数据
   */
  function resetConditionData() {
    initConditionData(null)
  }

  return {
    // 状态
    conditionData,
    leftOperandVarType,
    rightOperandSecond,

    // 计算属性
    availableOperators,
    showRightOperand,
    showTwoRightOperands,

    // 方法
    updateLeftOperand,
    updateOperator,
    updateRightOperand,
    updateRightOperandSecond,
    initConditionData,
    getConditionForSave,
    resetConditionData,
    needsRightOperand,
    needsTwoRightOperands,
  }
}
