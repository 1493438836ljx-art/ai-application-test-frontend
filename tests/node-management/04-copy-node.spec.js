import { test, expect } from '@playwright/test'
import {
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  selectNode,
  copyNodeByShortcut,
  pasteNodeByShortcut,
  getNodeCount,
  getAllNodeIds,
  getNodePosition,
  altDragToCopyNode,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('复制节点 - 快捷键方式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加一个可复制的节点
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)
  })

  test('TC-COPY-001: Ctrl+C应复制选中节点到剪贴板', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await copyNodeByShortcut(page, loopNodeId)

    // 应该显示成功消息
    await expect(page.locator(SELECTORS.messageSuccess)).toBeVisible()
  })

  test('TC-COPY-003: Ctrl+V应粘贴剪贴板中的节点', async ({ page }) => {
    const initialCount = await getNodeCount(page)
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await copyNodeByShortcut(page, loopNodeId)
    await pasteNodeByShortcut(page)
    await page.waitForTimeout(300)

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount + 1)
  })

  test('TC-COPY-004: 粘贴的节点应有偏移位置', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const originalPos = await getNodePosition(page, loopNodeId)

    await copyNodeByShortcut(page, loopNodeId)
    await pasteNodeByShortcut(page)
    await page.waitForTimeout(300)

    const newNodeIds = await getAllNodeIds(page)
    // 找到新创建的节点（最后一个 loop 节点）
    const newNodeId = newNodeIds.filter((id) => id.includes('loop')).pop()
    const newPos = await getNodePosition(page, newNodeId)

    // 应该有位置偏移
    expect(Math.abs(newPos.x - originalPos.x)).toBeGreaterThan(10)
    expect(Math.abs(newPos.y - originalPos.y)).toBeGreaterThan(10)
  })

  test('TC-COPY-005: 粘贴的节点应自动生成新名称', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await copyNodeByShortcut(page, loopNodeId)
    await pasteNodeByShortcut(page)
    await page.waitForTimeout(300)

    // 检查是否有带"副本"或数字后缀的节点名称
    const nodeNames = await page.locator('.node-name').allTextContents()
    const hasCopyName = nodeNames.some((name) =>
      name.includes('副本') || /\d+$/.test(name.trim())
    )
    expect(hasCopyName).toBe(true)
  })

  test('TC-COPY-007: 连续粘贴应创建多个副本', async ({ page }) => {
    const initialCount = await getNodeCount(page)
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await copyNodeByShortcut(page, loopNodeId)

    for (let i = 0; i < 3; i++) {
      await pasteNodeByShortcut(page)
      await page.waitForTimeout(200)
    }

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount + 3)
  })
})

test.describe('复制节点 - Alt+拖拽方式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)

    // 添加一个节点
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)
  })

  test('TC-COPY-009: Alt+拖拽应复制节点', async ({ page }) => {
    const initialCount = await getNodeCount(page)
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await altDragToCopyNode(page, loopNodeId, 100, 50)
    await page.waitForTimeout(500)

    const newCount = await getNodeCount(page)
    expect(newCount).toBe(initialCount + 1)
  })

  test('TC-COPY-010: Alt+拖拽副本应在拖拽目标位置', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const originalPos = await getNodePosition(page, loopNodeId)

    await altDragToCopyNode(page, loopNodeId, 100, 50)
    await page.waitForTimeout(500)

    // 原节点位置应该不变
    const newOriginalPos = await getNodePosition(page, loopNodeId)
    expect(newOriginalPos.x).toBe(originalPos.x)
    expect(newOriginalPos.y).toBe(originalPos.y)
  })
})

test.describe('复制节点 - 边界情况', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-COPY-015: 复制节点应有新的ID', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds[0]

    // 添加一个可复制的节点
    await clickOutputPort(page, startNodeId)
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    await copyNodeByShortcut(page, loopNodeId)
    await pasteNodeByShortcut(page)
    await page.waitForTimeout(300)

    const newNodeIds = await getAllNodeIds(page)
    const loopNodes = newNodeIds.filter((id) => id.includes('loop'))

    // 应该有两个不同的 loop 节点 ID
    expect(loopNodes.length).toBe(2)
    expect(loopNodes[0]).not.toBe(loopNodes[1])
  })

  test('TC-COPY-016: 复制节点不应复制连线', async ({ page }) => {
    // 创建一个有连线的节点
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))

    const initialConnCount = await page.locator(SELECTORS.connection).count()

    await copyNodeByShortcut(page, loopNodeId)
    await pasteNodeByShortcut(page)
    await page.waitForTimeout(300)

    const newConnCount = await page.locator(SELECTORS.connection).count()
    // 连线数量应该不变（新节点没有连线）
    expect(newConnCount).toBe(initialConnCount)
  })
})
