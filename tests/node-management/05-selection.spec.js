import { test, expect } from '@playwright/test'
import {
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  selectNode,
  multiSelectNodes,
  isNodeSelected,
  getSelectedNodeCount,
  getAllNodeIds,
  clickCanvasBlank,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('选择状态 - 单选', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加两个节点用于测试
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

  test('TC-SEL-001: 点击节点应选中该节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await selectNode(page, loopNodeId)

    const selected = await isNodeSelected(page, loopNodeId)
    expect(selected).toBe(true)
  })

  test('TC-SEL-002: 选中节点应有选中样式', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await selectNode(page, loopNodeId)

    const node = page.locator(SELECTORS.nodeById(loopNodeId))
    await expect(node).toHaveClass(/selected/)
  })

  test('TC-SEL-003: 选中新节点应取消之前选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    await selectNode(page, loopNodeId)
    await selectNode(page, batchNodeId)

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(1)

    const batchSelected = await isNodeSelected(page, batchNodeId)
    expect(batchSelected).toBe(true)

    const loopSelected = await isNodeSelected(page, loopNodeId)
    expect(loopSelected).toBe(false)
  })

  test('TC-SEL-004: 点击画布空白区域应取消选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await selectNode(page, loopNodeId)
    await clickCanvasBlank(page)

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(0)
  })
})

test.describe('选择状态 - 多选', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加三个节点用于测试
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

  test('TC-SEL-005: Ctrl+点击应切换选择状态（添加到选择）', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    await selectNode(page, loopNodeId)

    await page.keyboard.down('Control')
    await selectNode(page, batchNodeId)
    await page.keyboard.up('Control')

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(2)
  })

  test('TC-SEL-006: Ctrl+点击已选中节点应取消选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await selectNode(page, loopNodeId)

    await page.keyboard.down('Control')
    await selectNode(page, loopNodeId)
    await page.keyboard.up('Control')

    const selected = await isNodeSelected(page, loopNodeId)
    expect(selected).toBe(false)
  })

  test('TC-SEL-007: 多选三个节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    await multiSelectNodes(page, [startNodeId, loopNodeId, batchNodeId])

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(3)
  })
})

test.describe('选择状态 - 键盘导航', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加两个节点
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

  test('TC-SEL-012: Escape键应取消选中', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await selectNode(page, loopNodeId)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    const selectedCount = await getSelectedNodeCount(page)
    expect(selectedCount).toBe(0)
  })

  test('TC-SEL-013: Ctrl+A应全选所有节点', async ({ page }) => {
    await page.keyboard.press('Control+a')
    await page.waitForTimeout(200)

    const selectedCount = await getSelectedNodeCount(page)
    const totalNodes = await page.locator(SELECTORS.node).count()

    expect(selectedCount).toBe(totalNodes)
  })
})

test.describe('选择状态 - 视觉反馈', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-SEL-009: 悬停节点应有悬停样式', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]

    const node = page.locator(SELECTORS.nodeById(startNodeId))
    await node.hover()
    await page.waitForTimeout(300)

    // 悬停后节点边框颜色应该变化
    const borderColor = await node.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })
    // 边框颜色不应该是透明的
    expect(borderColor).not.toBe('transparent')
  })

  test('TC-SEL-011: 多个选中节点应都显示选中样式', async ({ page }) => {
    // 添加一个节点
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await multiSelectNodes(page, [startNodeId, loopNodeId])

    const selectedNodes = page.locator('.flow-node.selected')
    const count = await selectedNodes.count()
    expect(count).toBe(2)
  })
})
