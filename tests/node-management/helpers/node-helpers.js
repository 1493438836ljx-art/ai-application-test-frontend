/**
 * 节点类型定义
 */
export const NODE_TYPES = {
  BASIC: {
    start: { name: '开始', icon: 'VideoPlay', color: '#22c55e' },
    end: { name: '结束', icon: 'CircleCheck', color: '#ef4444' },
  },
  LOGIC: {
    loop: { name: '循环', icon: 'Timer', color: '#8b5cf6' },
    batch: { name: '批处理', icon: 'DataLine', color: '#3b82f6' },
    async: { name: '异步处理', icon: 'Connection', color: '#0ea5e9' },
    collect: { name: '结果收集', icon: 'FolderAdd', color: '#14b8a6' },
    condition_simple: { name: '条件分支', icon: 'Share', color: '#f59e0b' },
    condition_multi: { name: '多路条件', icon: 'Grid', color: '#f97316' },
  },
  EXECUTION: {
    skill: { name: '技能执行', icon: 'Cpu', color: '#6366f1' },
  },
}

/**
 * CSS 选择器定义
 */
export const SELECTORS = {
  // 画布
  canvas: '.canvas',
  canvasContainer: '.canvas-container',

  // 节点
  node: '.flow-node',
  nodeById: (id) => `.flow-node[data-node-id="${id}"]`,
  nodeByType: (type) => `.flow-node[data-node-type="${type}"]`,
  nodeHeader: '.node-header',
  nodeName: '.node-name',
  nodeIcon: '.node-icon',

  // 端口
  inputPort: '.input-port',
  outputPort: '.output-port',
  nodePort: '.node-edge-port',

  // 节点选择器弹窗
  nodeSelectorOverlay: '.el-overlay',
  nodeSelectorDialog: '.el-dialog',
  nodeSelectorSearch: '.el-input__inner',
  nodeTypeItem: '.node-type-item',
  nodeTypeByType: (type) => `.node-type-item[data-type="${type}"]`,
  categoryHeader: '.category-header',
  categoryItems: '.category-items',

  // 连线
  connection: '.connection-path:not(.temp)',
  connectionAddButton: '.connection-add-btn',

  // 右键菜单
  contextMenu: '.context-menu',
  contextMenuItem: (text) => `.context-menu-item:has-text("${text}")`,

  // 确认对话框
  confirmDialog: '.el-message-box',
  confirmButton: '.el-message-box__btns button:has-text("确定")',
  cancelButton: '.el-message-box__btns button:has-text("取消")',

  // 消息提示
  message: '.el-message',
  messageSuccess: '.el-message--success',
  messageWarning: '.el-message--warning',
  messageError: '.el-message--error',

  // 工作流列表页面
  workflowListPage: '.workflow-list',
  newWorkflowButton: 'button:has-text("新建工作流")',
  editButton: 'button:has-text("编辑")',
}

/**
 * 导航到工作流编辑器（新建或编辑现有工作流）
 */
export async function navigateToWorkflowEditor(page, createNew = false) {
  // 先导航到工作流列表页面
  await page.goto('/app/workflow')
  await page.waitForLoadState('networkidle')

  if (createNew) {
    // 点击新建工作流按钮
    const newBtn = page.locator(SELECTORS.newWorkflowButton)
    await newBtn.click()
    await page.waitForURL(/\/workflow\/(new|\d+)/)
  } else {
    // 点击第一个编辑按钮（编辑现有工作流）
    const editBtn = page.locator(SELECTORS.editButton).first()
    await editBtn.click()
    await page.waitForURL(/\/workflow\/\d+/)
  }

  await page.waitForLoadState('networkidle')
}

/**
 * 等待画布加载完成
 */
export async function waitForCanvas(page) {
  await page.waitForSelector(SELECTORS.canvas, { state: 'visible', timeout: 15000 })
  await page.waitForSelector(SELECTORS.node, { state: 'visible', timeout: 5000 })
  await page.waitForTimeout(500)
}

/**
 * 获取节点元素
 */
export async function getNodeElement(page, nodeId) {
  return await page.locator(SELECTORS.nodeById(nodeId))
}

/**
 * 获取节点位置
 */
export async function getNodePosition(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  const box = await node.boundingBox()
  return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null
}

/**
 * 获取输出端口位置（节点右侧中心）
 */
export async function getOutputPortPosition(page, nodeId) {
  const nodeBox = await getNodePosition(page, nodeId)
  if (!nodeBox) return null
  return {
    x: nodeBox.x + nodeBox.width,
    y: nodeBox.y + nodeBox.height / 2,
  }
}

/**
 * 获取输入端口位置（节点左侧中心）
 */
export async function getInputPortPosition(page, nodeId) {
  const nodeBox = await getNodePosition(page, nodeId)
  if (!nodeBox) return null
  return {
    x: nodeBox.x,
    y: nodeBox.y + nodeBox.height / 2,
  }
}

/**
 * 点击节点输出端口
 */
export async function clickOutputPort(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  const outputPort = node.locator(SELECTORS.outputPort)
  await outputPort.click({ force: true })
  await page.waitForTimeout(300)
}

/**
 * 点击节点输入端口
 */
export async function clickInputPort(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  const inputPort = node.locator(SELECTORS.inputPort)
  await inputPort.click({ force: true })
  await page.waitForTimeout(300)
}

/**
 * 获取画布上的节点数量
 */
export async function getNodeCount(page) {
  return await page.locator(SELECTORS.node).count()
}

/**
 * 获取所有节点ID
 */
export async function getAllNodeIds(page) {
  const nodes = await page.locator(SELECTORS.node).all()
  const ids = []
  for (const node of nodes) {
    const id = await node.getAttribute('data-node-id')
    if (id) ids.push(id)
  }
  return ids
}

/**
 * 选中节点
 */
export async function selectNode(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  await node.click()
  await page.waitForTimeout(100)
}

/**
 * 多选节点
 */
export async function multiSelectNodes(page, nodeIds) {
  for (let i = 0; i < nodeIds.length; i++) {
    const node = await getNodeElement(page, nodeIds[i])
    if (i === 0) {
      await node.click()
    } else {
      await page.keyboard.down('Control')
      await node.click()
      await page.keyboard.up('Control')
    }
    await page.waitForTimeout(100)
  }
}

/**
 * 拖拽节点
 */
export async function dragNode(page, nodeId, deltaX, deltaY) {
  const node = await getNodeElement(page, nodeId)
  const box = await node.boundingBox()
  if (!box) return

  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(100)
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(200)
}

/**
 * 右键点击节点
 */
export async function rightClickNode(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  await node.click({ button: 'right' })
  await page.waitForTimeout(100)
}

/**
 * 选择节点类型（在节点选择器中）
 */
export async function selectNodeType(page, nodeType) {
  // 等待选择器对话框出现
  const dialog = page.locator(SELECTORS.nodeSelectorDialog)
  await dialog.waitFor({ state: 'visible', timeout: 5000 })

  // 查找并点击节点类型项
  const typeName = getNodeTypeName(nodeType)
  const typeItem = dialog.locator(SELECTORS.nodeTypeItem).filter({
    hasText: typeName,
  })

  await typeItem.first().click()
  await page.waitForTimeout(500)
}

/**
 * 获取节点类型名称
 */
function getNodeTypeName(type) {
  for (const category of Object.values(NODE_TYPES)) {
    if (category[type]) {
      return category[type].name
    }
  }
  return type
}

/**
 * 悬停在连线上
 */
export async function hoverOnConnection(page, connectionIndex = 0) {
  const connection = page.locator(SELECTORS.connection).nth(connectionIndex)
  await connection.hover()
  await page.waitForTimeout(500)
}

/**
 * 点击连线上的添加按钮
 */
export async function clickConnectionAddButton(page, connectionIndex = 0) {
  await hoverOnConnection(page, connectionIndex)
  const addBtn = page.locator(SELECTORS.connectionAddButton).first()
  await addBtn.waitFor({ state: 'visible', timeout: 3000 })
  await addBtn.click()
  await page.waitForTimeout(300)
}

/**
 * 确认删除对话框
 */
export async function confirmDelete(page) {
  const confirmBtn = page.locator(SELECTORS.confirmButton)
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click()
  }
}

/**
 * 取消删除对话框
 */
export async function cancelDelete(page) {
  await page.locator(SELECTORS.cancelButton).click()
}

/**
 * 检查节点是否选中
 */
export async function isNodeSelected(page, nodeId) {
  const node = await getNodeElement(page, nodeId)
  return await node.evaluate((el) => el.classList.contains('selected'))
}

/**
 * 获取选中节点数量
 */
export async function getSelectedNodeCount(page) {
  return await page.locator('.flow-node.selected').count()
}

/**
 * 复制节点（快捷键）
 */
export async function copyNodeByShortcut(page, nodeId) {
  await selectNode(page, nodeId)
  await page.keyboard.press('Control+c')
  await page.waitForTimeout(200)
}

/**
 * 粘贴节点（快捷键）
 */
export async function pasteNodeByShortcut(page) {
  await page.keyboard.press('Control+v')
  await page.waitForTimeout(300)
}

/**
 * Alt+拖拽复制节点
 */
export async function altDragToCopyNode(page, nodeId, deltaX, deltaY) {
  const node = await getNodeElement(page, nodeId)
  const box = await node.boundingBox()
  if (!box) return

  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2

  await page.keyboard.down('Alt')
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 })
  await page.mouse.up()
  await page.keyboard.up('Alt')
}

/**
 * 等待消息提示
 */
export async function waitForMessage(page, type = 'success') {
  const selector = type === 'success' ? SELECTORS.messageSuccess :
                 type === 'warning' ? SELECTORS.messageWarning :
                 SELECTORS.messageError
  await page.locator(selector).waitFor({ state: 'visible', timeout: 5000 })
}

/**
 * 获取连线数量
 */
export async function getConnectionCount(page) {
  return await page.locator(SELECTORS.connection).count()
}

/**
 * 关闭节点选择器对话框
 */
export async function closeNodeSelector(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
}

/**
 * 点击画布空白区域
 */
export async function clickCanvasBlank(page) {
  const canvas = page.locator(SELECTORS.canvasContainer)
  await canvas.click({ position: { x: 50, y: 50 } })
  await page.waitForTimeout(100)
}

/**
 * 添加节点到画布（通过端口点击）
 */
export async function addNodeFromPort(page, sourceNodeId, nodeType) {
  await clickOutputPort(page, sourceNodeId)
  await selectNodeType(page, nodeType)
  await page.waitForTimeout(500)
}
