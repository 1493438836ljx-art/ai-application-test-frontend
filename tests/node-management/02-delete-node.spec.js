import { test, expect } from '@playwright/test'
import {
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  selectNode,
  multiSelectNodes,
  getNodeCount,
  getAllNodeIds,
  rightClickNode,
  isNodeSelected,
  waitForMessage,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('删除节点 - 键盘方式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-DEL-001: Delete键应删除选中节点', async ({ page }) => {
    // 添加一个可删除的节点
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const initialCount = await getNodeCount(page)

    await selectNode(page, loopNodeId)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount - 1)
  })

  test('TC-DEL-002: Backspace键应删除选中节点', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const initialCount = await getNodeCount(page)

    await selectNode(page, loopNodeId)
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(300)

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount - 1)
  })

  test('TC-DEL-003: 开始节点不应被删除', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await selectNode(page, startNodeId)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    // 应显示警告消息
    await expect(page.locator(SELECTORS.messageWarning)).toBeVisible()

    // 节点应该仍然存在
    const startNode = page.locator(SELECTORS.nodeById(startNodeId))
    await expect(startNode).toBeVisible()
  })

  test('TC-DEL-004: 结束节点不应被删除', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'end')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const endNodeId = nodeIds.find((id) => id.includes('end'))

    await selectNode(page, endNodeId)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    // 应显示警告消息
    await expect(page.locator(SELECTORS.messageWarning)).toBeVisible()

    // 节点应该仍然存在
    const endNode = page.locator(SELECTORS.nodeById(endNodeId))
    await expect(endNode).toBeVisible()
  })
})

test.describe('删除节点 - 右键菜单方式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-DEL-005: 右键节点应显示上下文菜单', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await rightClickNode(page, loopNodeId)

    const contextMenu = page.locator(SELECTORS.contextMenu)
    await expect(contextMenu).toBeVisible()
  })

  test('TC-DEL-006: 右键菜单应包含删除选项', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await rightClickNode(page, loopNodeId)

    const deleteOption = page.locator('.context-menu-item:has-text("删除")')
    await expect(deleteOption).toBeVisible()
  })

  test('TC-DEL-007: 右键菜单删除应成功删除节点', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const initialCount = await getNodeCount(page)

    await rightClickNode(page, loopNodeId)
    await page.locator('.context-menu-item:has-text("删除")').click()
    await page.waitForTimeout(300)

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount - 1)
  })
})

test.describe('删除节点 - 级联删除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-DEL-011: 删除节点应删除所有相关连线', async ({ page }) => {
    // 创建 开始 -> loop -> end 的结构
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    await clickOutputPort(page, loopNodeId)
    await selectNodeType(page, 'end')
    await page.waitForTimeout(500)

    const initialConnCount = await page.locator(SELECTORS.connection).count()

    // 删除 loop 节点
    await selectNode(page, loopNodeId)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    const newConnCount = await page.locator(SELECTORS.connection).count()
    expect(newConnCount).toBeLessThan(initialConnCount)
  })
})

test.describe('删除节点 - 批量删除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加多个节点用于批量删除测试
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    await clickOutputPort(page, loopNodeId)
    await selectNodeType(page, 'batch')
    await page.waitForTimeout(500)
  })

  test('TC-SEL-005: Ctrl+点击应切换选择状态（多选）', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    // 先选中 loop
    await selectNode(page, loopNodeId)
    let selected = await isNodeSelected(page, loopNodeId)
    expect(selected).toBe(true)

    // Ctrl+点击选中 batch
    await page.keyboard.down('Control')
    await selectNode(page, batchNodeId)
    await page.keyboard.up('Control')

    selected = await isNodeSelected(page, batchNodeId)
    expect(selected).toBe(true)

    // loop 应该仍然被选中
    selected = await isNodeSelected(page, loopNodeId)
    expect(selected).toBe(true)
  })
})
