import { test, expect } from '@playwright/test'
import {
  navigateToWorkflowEditor,
  waitForCanvas,
  getAllNodeIds,
  getNodeCount,
  selectNode,
  isNodeSelected,
  getSelectedNodeCount,
  dragNode,
  getNodePosition,
  clickOutputPort,
  selectNodeType,
  closeNodeSelector,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('节点管理核心功能验证', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWorkflowEditor(page, false)
    await waitForCanvas(page)
  })

  test('画布应正确加载', async ({ page }) => {
    const canvas = page.locator(SELECTORS.canvas)
    await expect(canvas).toBeVisible()

    const nodeCount = await getNodeCount(page)
    expect(nodeCount).toBeGreaterThanOrEqual(2) // 开始和结束节点
  })

  test('TC-SEL-001: 点击节点应选中该节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await selectNode(page, startNodeId)

    const selected = await isNodeSelected(page, startNodeId)
    expect(selected).toBe(true)
  })

  test('TC-SEL-002: 选中节点应有选中样式', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await selectNode(page, startNodeId)

    const node = page.locator(SELECTORS.nodeById(startNodeId))
    await expect(node).toHaveClass(/selected/)
  })

  test('TC-SEL-003: 选中新节点应取消之前选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    const endNodeId = nodeIds.find((id) => id.includes('end'))

    await selectNode(page, startNodeId)
    await selectNode(page, endNodeId)

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(1)

    const endSelected = await isNodeSelected(page, endNodeId)
    expect(endSelected).toBe(true)
  })

  test('TC-SEL-005: Ctrl+点击应切换选择状态（多选）', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    const endNodeId = nodeIds.find((id) => id.includes('end'))

    await selectNode(page, startNodeId)

    await page.keyboard.down('Control')
    await selectNode(page, endNodeId)
    await page.keyboard.up('Control')

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(2)
  })

  test('TC-SEL-006: Ctrl+点击已选中节点应取消选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await selectNode(page, startNodeId)

    await page.keyboard.down('Control')
    await selectNode(page, startNodeId)
    await page.keyboard.up('Control')

    const selected = await isNodeSelected(page, startNodeId)
    expect(selected).toBe(false)
  })

  test('TC-SEL-012: Escape键应取消选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await selectNode(page, startNodeId)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(0)
  })

  test('TC-MOVE-001: 拖拽节点应改变位置', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const endNodeId = nodeIds.find((id) => id.includes('end'))

    const initialPos = await getNodePosition(page, endNodeId)
    await dragNode(page, endNodeId, 50, 30)
    const newPos = await getNodePosition(page, endNodeId)

    expect(newPos.x - initialPos.x).toBeGreaterThan(20)
    expect(newPos.y - initialPos.y).toBeGreaterThan(10)
  })

  test('TC-ADD-001: 点击开始节点输出端口应弹出节点选择器', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('TC-ADD-020: ESC键应关闭节点选择器', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    await clickOutputPort(page, startNodeId)

    const dialog = page.locator(SELECTORS.nodeSelectorDialog)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await closeNodeSelector(page)
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })
})
