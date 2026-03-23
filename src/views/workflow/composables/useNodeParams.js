/**
 * 节点参数获取 Composable
 * 根据节点类型获取输入/输出参数，用于节点显示
 */

// 格式化参数类型显示
export const formatParamType = (param) => {
  if (!param.type) return 'String'

  // Array 类型：显示元素类型，格式为 Array[ElementType]
  if (param.type === 'Array' && param.elementType) {
    return `Array[${param.elementType}]`
  }

  // File 类型：显示文件格式，格式为 File(FileType)
  if (param.type === 'File' && param.fileType) {
    return `File(${param.fileType})`
  }

  // Dictionary 类型：显示数据字典类型，格式为 Dictionary(DictionaryType)
  if (param.type === 'Dictionary' && param.dictionaryType) {
    return `Dictionary(${param.dictionaryType})`
  }

  return param.type
}

// 获取节点的输入参数（用于在节点方框中显示）
export const getNodeInputParams = (node) => {
  if (!node) return []

  // 开始节点：输入参数与输出参数相同
  if (node.type === 'start') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // 文本清洗节点：输入参数
  if (node.type === 'textClean') {
    return [
      {
        name: 'input_file',
        type: 'File',
        required: true,
        description: '需要被清洗的目标xlsx文件',
      },
      {
        name: 'cols',
        type: 'String',
        required: true,
        description: '指定xlsx文件中需要清洗的列（英文逗号分隔）',
      },
      {
        name: 'remove_extra_spaces',
        type: 'Boolean',
        required: false,
        description: '是否去除多余空格',
      },
      {
        name: 'remove_html_tags',
        type: 'Boolean',
        required: false,
        description: '是否去除HTML标签',
      },
      {
        name: 'remove_special_chars',
        type: 'Boolean',
        required: false,
        description: '是否去除特殊字符',
      },
      {
        name: 'standardized_newline_char',
        type: 'Boolean',
        required: false,
        description: '是否标准化换行符',
      },
      {
        name: 'trim_front_back',
        type: 'Boolean',
        required: false,
        description: '是否去除首尾空白',
      },
    ]
  }

  // 表格提取节点：从 inputParams 读取
  if (node.type === 'tableExtract') {
    const inputParams = node.inputParams || [
      { name: 'file', type: 'File', fileType: 'Excel', required: true, description: '需要提取数据的Excel文件' }
    ]
    return inputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
      required: param.required,
      description: param.description,
    }))
  }

  // 循环节点：从 inputParams 读取（固定参数）
  if (node.type === 'loop') {
    const inputParams = node.inputParams || []
    if (inputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return inputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // HTTPS/HTTP接口调用节点：从 inputParams 读取
  if (node.type === 'apiAuto') {
    const inputParams = node.inputParams || [
      { name: 'url', type: 'String', required: true },
      { name: 'headers', type: 'String' },
      { name: 'body', type: 'String' },
      { name: 'param', type: 'String' },
      { name: 'response', type: 'String' },
    ]
    return inputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
      required: param.required,
    }))
  }

  // 裁判模型节点：从 config 读取配置的参数
  if (node.type === 'judgeModel') {
    const config = node.config || {}
    return [
      {
        name: 'model',
        type: 'String',
        required: true,
        description: '所使用的底座大模型',
      },
      {
        name: 'prompt',
        type: 'String',
        required: true,
        description: '裁判模型的评估规则',
      },
      {
        name: 'to_evaluate',
        type: config.toEvaluateType || 'String',
        required: true,
        description: '待评估的内容',
      },
      {
        name: 'ref',
        type: config.refType || 'String',
        required: false,
        description: '参考内容（可选）',
      },
    ]
  }

  // 表格生成节点：从 config.inputParams 读取（用户自定义）
  if (node.type === 'tableGenerate') {
    const inputParams = node.config?.inputParams || []
    if (inputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return inputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // 其他节点：默认输入参数
  return [{ name: 'input', type: 'Any' }]
}

// 获取节点的输出参数（用于在节点方框中显示）
export const getNodeOutputParams = (node) => {
  if (!node) return []

  // 开始节点：从 outputParams 配置读取
  if (node.type === 'start') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // 结束节点：输出参数与输入参数相同
  if (node.type === 'end') {
    const inputParams = getNodeInputParams(node)
    if (inputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return inputParams
  }

  // 文本清洗节点：输出参数为 output_file
  if (node.type === 'textClean') {
    return [
      {
        name: 'output_file',
        type: 'File',
        description: '被清洗之后的xlsx文件',
      },
    ]
  }

  // 表格提取节点：从 outputParams 读取
  if (node.type === 'tableExtract') {
    const outputParams = node.outputParams || [
      { name: 'output', type: 'Array', elementType: 'Object', description: '提取的表格数据数组' }
    ]
    if (outputParams.length === 0) {
      return [{ name: 'output', type: 'Array[Object]', isPlaceholder: false }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
      description: param.description,
    }))
  }

  // 循环节点：从 outputParams 读取
  if (node.type === 'loop') {
    const outputParams = node.outputParams || []
    if (outputParams.length === 0) {
      return [{ name: '-', type: '-', isPlaceholder: true }]
    }
    return outputParams.map((param) => ({
      name: param.name || '',
      type: formatParamType(param),
    }))
  }

  // HTTPS/HTTP接口调用节点
  if (node.type === 'apiAuto') {
    // 从 config.responseValue 读取响应示例（与模板中绑定的字段名一致）
    const responseValue = node.config?.responseValue
    // 尝试解析response是否为JSON结构
    if (responseValue && typeof responseValue === 'string' && responseValue.trim()) {
      try {
        const parsed = JSON.parse(responseValue.trim())
        if (typeof parsed === 'object' && parsed !== null) {
          // 根据JSON结构生成输出变量
          const outputs = []
          const flattenObject = (obj, prefix = '') => {
            for (const key in obj) {
              const varName = prefix ? `${prefix}.${key}` : key
              const value = obj[key]
              if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, varName)
              } else {
                let varType = 'String'
                if (typeof value === 'number') varType = 'Number'
                else if (typeof value === 'boolean') varType = 'Boolean'
                else if (Array.isArray(value)) varType = 'Array'
                outputs.push({ name: varName, type: varType })
              }
            }
          }
          flattenObject(parsed)
          if (outputs.length > 0) {
            return outputs
          }
        }
      } catch (e) {
        // 不是有效的JSON，返回默认的response变量
      }
    }
    // 默认返回 response 和 statusCode（即使没有输入 response 示例）
    return [
      { name: 'response', type: 'String' },
      { name: 'statusCode', type: 'Number' },
    ]
  }

  // 裁判模型节点：输出参数为 output (Array<Object>)
  if (node.type === 'judgeModel') {
    return [
      {
        name: 'output',
        type: 'Array[Object]',
        description: '评估结果，数组元素是JSON字符串',
      },
    ]
  }

  // 表格生成节点：输出参数为 output_excel (File/Excel)
  if (node.type === 'tableGenerate') {
    return [
      {
        name: 'output_excel',
        type: 'File(Excel)',
        description: '生成的表格文件',
      },
    ]
  }

  // 默认情况下显示占位输出参数
  return [{ name: '-', type: '-', isPlaceholder: true }]
}

export function useNodeParams() {
  return {
    formatParamType,
    getNodeInputParams,
    getNodeOutputParams,
  }
}
