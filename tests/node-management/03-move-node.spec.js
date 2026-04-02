import { test, expect } from '@playwright/test'
import {
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  dragNode,
  getNodePosition,
  getAllNodeIds,
  isNodeSelected,
  multiSelectNodes,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('移动节点 - 基础拖拽', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加一个节点用于测试
    const nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)
  })

  test('TC-MOVE-001: 拖拽节点应改变位置', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    const initialPos = await getNodePosition(page, loopNodeId)
    await dragNode(page, loopNodeId, 100, 50)
    const newPos = await getNodePosition(page, loopNodeId)

    expect(newPos.x - initialPos.x).toBeGreaterThan(50)
    expect(newPos.y - initialPos.y).toBeGreaterThan(20)
  })

  test('TC-MOVE-002: 拖拽应选中节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await dragNode(page, loopNodeId, 20, 20)

    const selected = await isNodeSelected(page, loopNodeId)
    expect(selected).toBe(true)
  })

  test('TC-MOVE-003: 连线应跟随节点移动', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    const initialConnCount = await page.locator(SELECTORS.connection).count()
    await dragNode(page, loopNodeId, 100, 50)
    const newConnCount = await page.locator(SELECTORS.connection).count()

    // 连线数量应该保持不变
    expect(newConnCount).toBe(initialConnCount)
  })

  test('TC-MOVE-005: 向左拖拽节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    const initialPos = await getNodePosition(page, loopNodeId)
    await dragNode(page, loopNodeId, -30, 0)
    const newPos = await getNodePosition(page, loopNodeId)

    expect(newPos.x).toBeLessThan(initialPos.x)
  })

  test('TC-MOVE-006: 向上拖拽节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    const initialPos = await getNodePosition(page, loopNodeId)
    await dragNode(page, loopNodeId, 0, -30)
    const newPos = await getNodePosition(page, loopNodeId)

    expect(newPos.y).toBeLessThan(initialPos.y)
  })
})

test.describe('移动节点 - 边界约束', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-MOVE-008: 节点不能拖出画布左边界', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]

    // 尝试向左拖拽开始节点
    const initialPos = await getNodePosition(page, startNodeId)
    await dragNode(page, startNodeId, -500, 0)
    const newPos = await getNodePosition(page, startNodeId)

    // X 坐标不应小于 0
    expect(newPos.x).toBeGreaterThanOrEqual(0)
  })

  test('TC-MOVE-009: 节点不能拖出画布上边界', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]

    // 尝试向上拖拽开始节点
    await dragNode(page, startNodeId, 0, -500)
    const newPos = await getNodePosition(page, startNodeId)

    // Y 坐标不应小于 0
    expect(newPos.y).toBeGreaterThanOrEqual(0)
  })
})

test.describe('移动节点 - 多节点拖拽', () => {
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

  test('TC-MOVE-007: 拖拽时移动多个选中节点', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    // 多选节点
    await multiSelectNodes(page, [loopNodeId, batchNodeId])

    const loopInitialPos = await getNodePosition(page, loopNodeId)
    const batchInitialPos = await getNodePosition(page, batchNodeId)

    // 拖拽其中一个节点
    await dragNode(page, loopNodeId, 50, 30)

    const loopNewPos = await getNodePosition(page, loopNodeId)
    const batchNewPos = await getNodePosition(page, batchNodeId)

    // 两个节点都应该移动
    expect(loopNewPos.x - loopInitialPos.x).toBeGreaterThan(20)
    expect(batchNewPos.x - batchInitialPos.x).toBeGreaterThan(20)
  })
})
