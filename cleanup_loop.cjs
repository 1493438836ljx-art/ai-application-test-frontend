const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/workflow/WorkflowEditorView.vue');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 要删除的行范围（基于 1-based 行号）
const rangesToRemove = [
  // 嵌套画布状态变量 (73-75)
  [73, 75],
  // enterLoopBody 函数 (77-100)
  [77, 100],
  // exitLoopBody 函数 (102-130)
  [102, 130],
  // 循环体编辑器状态 (132-141)
  [132, 141],
  // toggleLoopBodyAddMenu 函数 (143-152)
  [143, 152],
  // addNodeToLoopBodyInline 函数 (154-208)
  [154, 208],
  // saveLoopBodyEditor 函数 (220-241)
  [220, 241],
  // addNodeToLoopBody 函数 (243-267)
  [243, 267],
  // deleteNodeFromLoopBody 函数 (262-267)
  [262, 267],
  // showLoopBodyAddMenu 和 showLoopBodyAddPopover (269-278)
  [269, 278],
  // addNodeToLoopBodyFromPort 函数 (280-336)
  [280, 336],
  // selectLoopBodyNode 函数 (347-359)
  [347, 359],
  // startDragLoopBodyNode 函数 (361-388)
  [361, 388],
  // startLoopBodyConnection 函数 (389-418)
  [389, 418],
  // endLoopBodyConnection 函数 (419-443)
  [419, 443],
  // getLoopBodyConnectionPath 函数 (444-475)
  [444, 475],
  // handleLoopBodyCanvasClick 函数 (529-531)
  [529, 531],
  // handleLoopBodyCanvasPortMouseUp 函数 (547-576)
  [547, 576],
  // handleLoopBodyCanvasPortMouseDown 函数 (577-602)
  [577, 602],
  // startDragLoopBodyInnerNode 函数 (618-660)
  [618, 660],
  // selectLoopBodyInnerNode 函数 (662-669)
  [662, 669],
  // getLoopBodyTempConnectionPath 函数 (670-691)
  [670, 691],
  // isInNestedCanvas computed (692-693)
  [692, 693],
  // getLoopBodyNodeSize 函数 (756-767)
  [756, 767],
  // getConnectionMidpoint 中的循环体代码 (251-266)
  [251, 266],
  // getConnectionPathPart 中的循环体代码 (320-371)
  [320, 371],
  // addConnectedNode 中的循环体代码 (3094-3102)
  [3094, 3102],
  // 循环节点特殊处理 (2059-2069)
  [2059, 2069],
  // selectNode 中的循环体检查 (2279-2283)
  [2279, 2283],
  // 模板中的循环体 breadcrumb (3636-3646)
  [3636, 3646],
  // 模板中的循环体相关代码 (3915-3928)
  [3915, 3928],
  [3969-3982],
  [3989-4002],
  [4050-4060],
  // 循环体编辑器对话框 (5315-5431)
  [5315, 5431],
];

// 标记要删除的行
const linesToRemove = new Set();
rangesToRemove.forEach(([start, end]) => {
  for (let i = start; i <= end; i++) {
    linesToRemove.add(i);
  }
});

// 收集要保留的行
const result = [];
for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1; // 1-based
  if (!linesToRemove.has(lineNum)) {
    result.push(lines[i]);
  }
}

// 写回文件
fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
console.log(`Cleaned WorkflowEditorView.vue: removed ${linesToRemove.size} lines`);
console.log(`Original: ${lines.length} lines, New: ${result.length} lines`);
