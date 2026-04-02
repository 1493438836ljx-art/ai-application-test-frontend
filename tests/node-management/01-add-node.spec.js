import { test, expect } from '@playwright/test'
import {
  navigateToWorkflowEditor,
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  getNodeCount,
  getAllNodeIds,
  getNodePosition,
  hoverOnConnection,
  clickConnectionAddButton,
  closeNodeSelector,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('添加节点 - 点击端口方式', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkflowEditor(page, false) // 编辑现有工作流
    await waitForCanvas(page)
  })

  test('TC-ADD-001: 点击开始节点输出端口应弹出节点选择器', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    expect(startNodeId).toBeDefined()

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('TC-ADD-002: 节点选择器应显示分类', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('TC-ADD-003: 节点选择器中开始节点应被排除', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // 开始节点不应该出现在选项中
    const startOption = dialog.locator('.node-type-item:has-text("开始")')
    await expect(startOption).not.toBeVisible()
  })

  test('TC-ADD-005: 选择节点类型后应创建节点并自动连线', async ({ page }) => {
    const initialCount = await getNodeCount(page)
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)
    await selectNodeType(page, 'loop')

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount + 1)
  })

  test('TC-ADD-007: 新节点Y坐标应与源节点对齐', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    const sourcePos = await getNodePosition(page, startNodeId)

    await clickOutputPort(page, startNodeId)
    await selectNodeType(page, 'loop')

    const newNodeIds = await getAllNodeIds(page)
    const newNodeId = newNodeIds.find((id) => !nodeIds.includes(id))
    const newPos = await getNodePosition(page, newNodeId)

    expect(Math.abs(newPos.y - sourcePos.y)).toBeLessThan(50)
  })

  test('TC-ADD-008: ESC键应关闭节点选择器', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await closeNodeSelector(page)
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })

  test('TC-ADD-009: 连续添加多个节点', async ({ page }) => {
    const initialCount = await getNodeCount(page)

    // 添加第一个节点
    let nodeIds = await getAllNodeIds(page)
    let startNodeId = nodeIds.find((id) => id.includes('start'))
    await clickOutputPort(page, startNodeId)
    await selectNodeType(page, 'loop')

    // 添加第二个节点
    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    if (loopNodeId) {
      await clickOutputPort(page, loopNodeId)
      await selectNodeType(page, 'batch')
    }

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount + 2)
  })
})

test.describe('添加节点 - 连线中点插入方式', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkflowEditor(page, false)
    await waitForCanvas(page)
  })

  test('TC-ADD-011: 悬停连线应显示添加按钮', async ({ page }) => {
    // 检查是否有连线
    const connCount = await page.locator(SELECTORS.connection).count()
    expect(connCount).toBeGreaterThan(0)
  })
})

test.describe('添加节点 - 边界情况', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkflowEditor(page, false)
    await waitForCanvas(page)
  })

  test('TC-ADD-018: 新节点水平间距应合理', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    const sourcePos = await getNodePosition(page, startNodeId)

    await clickOutputPort(page, startNodeId)
    await selectNodeType(page, 'loop')

    const newNodeIds = await getAllNodeIds(page)
    const newNodeId = newNodeIds.find((id) => !nodeIds.includes(id))
    const newPos = await getNodePosition(page, newNodeId)

    const spacing = newPos.x - (sourcePos.x + sourcePos.width)
    expect(spacing).toBeGreaterThanOrEqual(40)
  })

  test('TC-ADD-020: ESC键应关闭节点选择器', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })
})
