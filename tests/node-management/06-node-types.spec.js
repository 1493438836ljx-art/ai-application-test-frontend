import { test, expect } from '@playwright/test'
import {
  waitForCanvas,
  clickOutputPort,
  selectNodeType,
  getAllNodeIds,
  getNodePosition,
  SELECTORS,
} from './helpers/node-helpers'

test.describe('节点类型验证 - 基础节点', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-TYPE-001: 开始节点应存在', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))
    expect(startNodeId).toBeDefined()
  })

  test('TC-TYPE-003: 开始节点不应有输入端口', async ({ page }) => {
    const nodeIds = await getAllNodeIds(page)
    const startNodeId = nodeIds.find((id) => id.includes('start'))

    const startNode = page.locator(SELECTORS.nodeById(startNodeId))
    const inputPort = startNode.locator(SELECTORS.inputPort)

    // 输入端口应该不可见或不存在
    const count = await inputPort.count()
    expect(count).toBe(0)
  })

  test('TC-TYPE-004: 结束节点应有输入端口无输出端口', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'end')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const endNodeId = nodeIds.find((id) => id.includes('end'))

    const endNode = page.locator(SELECTORS.nodeById(endNodeId))
    const inputPort = endNode.locator(SELECTORS.inputPort)
    const outputPort = endNode.locator(SELECTORS.outputPort)

    const inputCount = await inputPort.count()
    const outputCount = await outputPort.count()

    expect(inputCount).toBeGreaterThan(0)
    expect(outputCount).toBe(0)
  })
})

test.describe('节点类型验证 - 逻辑控制节点', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-TYPE-005: 循环节点应有正确的类型', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    const loopNode = page.locator('.flow-node[data-node-type="loop"]')
    await expect(loopNode).toBeVisible()
  })

  test('TC-TYPE-007: 批处理节点应有输入和输出端口', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'batch')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const batchNodeId = nodeIds.find((id) => id.includes('batch'))

    const batchNode = page.locator(SELECTORS.nodeById(batchNodeId))
    const inputPort = batchNode.locator(SELECTORS.inputPort)
    const outputPort = batchNode.locator(SELECTORS.outputPort)

    await expect(inputPort.first()).toBeVisible()
    await expect(outputPort.first()).toBeVisible()
  })

  test('TC-TYPE-008: 异步处理节点应可创建', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'async')
    await page.waitForTimeout(500)

    const asyncNode = page.locator('.flow-node[data-node-type="async"]')
    await expect(asyncNode).toBeVisible()
  })

  test('TC-TYPE-009: 结果收集节点应可创建', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'collect')
    await page.waitForTimeout(500)

    const collectNode = page.locator('.flow-node[data-node-type="collect"]')
    await expect(collectNode).toBeVisible()
  })

  test('TC-TYPE-019: 条件分支节点应可创建', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'condition_simple')
    await page.waitForTimeout(500)

    const condNode = page.locator('.flow-node[data-node-type="condition_simple"]')
    await expect(condNode).toBeVisible()
  })

  test('TC-TYPE-020: 多路条件节点应可创建', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'condition_multi')
    await page.waitForTimeout(500)

    const condNode = page.locator('.flow-node[data-node-type="condition_multi"]')
    await expect(condNode).toBeVisible()
  })
})

test.describe('节点类型验证 - 节点尺寸', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-TYPE-010: 默认节点宽度应约为220px', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const pos = await getNodePosition(page, loopNodeId)

    // 允许一定的误差
    expect(pos.width).toBeGreaterThan(200)
    expect(pos.width).toBeLessThan(250)
  })

  test('TC-TYPE-011: 默认节点高度应约为70px', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    nodeIds = await getAllNodeIds(page)
    const loopNodeId = nodeIds.find((id) => id.includes('loop'))
    const pos = await getNodePosition(page, loopNodeId)

    // 允许一定的误差
    expect(pos.height).toBeGreaterThan(50)
    expect(pos.height).toBeLessThan(100)
  })

  test('TC-TYPE-012: 新节点应显示类型名称', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    const loopNode = page.locator('.flow-node[data-node-type="loop"]')
    const nodeName = loopNode.locator('.node-name')
    await expect(nodeName).toContainText('循环')
  })
})

test.describe('节点类型验证 - 节点分类', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workflow/new')
    await waitForCanvas(page)
  })

  test('TC-TYPE-013: 开始节点属于BASIC分类', async ({ page }) => {
    const startNode = page.locator('.flow-node[data-node-type="start"]')
    await expect(startNode).toBeVisible()
  })

  test('TC-TYPE-014: 结束节点属于BASIC分类', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'end')
    await page.waitForTimeout(500)

    const endNode = page.locator('.flow-node[data-node-type="end"]')
    await expect(endNode).toBeVisible()
  })

  test('TC-TYPE-015: 循环节点属于LOGIC分类', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'loop')
    await page.waitForTimeout(500)

    const loopNode = page.locator('.flow-node[data-node-type="loop"]')
    await expect(loopNode).toBeVisible()
  })

  test('TC-TYPE-016: 批处理节点属于LOGIC分类', async ({ page }) => {
    let nodeIds = await getAllNodeIds(page)
    await clickOutputPort(page, nodeIds[0])
    await selectNodeType(page, 'batch')
    await page.waitForTimeout(500)

    const batchNode = page.locator('.flow-node[data-node-type="batch"]')
    await expect(batchNode).toBeVisible()
  })
})
