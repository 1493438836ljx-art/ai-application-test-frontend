const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/workflow/WorkflowEditorView.vue');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 要删除的行范围（1-based）
const rangesToRemove = [
  // Timer 和 Grid from imports (23-24, 41)
  [23, 23],
  [24, 24],
  [41, 41],

  // 嵌套画布状态 (73-75)
  [73, 75],

  // enterLoopBody (77-100)
  [77, 100],

  // exitLoopBody (102-130)
  [102, 130],

  // 循环体编辑器状态 (132-141)
  [132, 141],

  // toggleLoopBodyAddMenu (143-152)
  [143, 152],

  // addNodeToLoopBodyInline (154-208)
  [154, 208],

  // saveLoopBodyEditor (220-241)
  [220, 241],

  // addNodeToLoopBody (243-267)
  [243, 267],

  // deleteNodeFromLoopBody (262-267)
  [262, 267],

  // showLoopBodyAddMenu 等状态 (269-278)
  [269, 278],

  // addNodeToLoopBodyFromPort (280-336)
  [280, 336],

  // selectLoopBodyNode (347-359)
  [347, 359],

  // startDragLoopBodyNode (361-388)
  [361, 388],

  // startLoopBodyConnection (389-418)
  [389, 418],

  // endLoopBodyConnection (419-443)
  [419, 443],

  // getLoopBodyConnectionPath (444-475)
  [444, 475],

  // handleLoopBodyCanvasClick (529-531)
  [529, 531],

  // handleLoopBodyCanvasPortMouseUp (547-576)
  [547, 576],

  // handleLoopBodyCanvasPortMouseDown (577-602)
  [577, 602],

  // startDragLoopBodyInnerNode (618-660)
  [618, 660],

  // selectLoopBodyInnerNode (662-669)
  [662, 669],

  // getLoopBodyTempConnectionPath (670-691)
  [670, 691],

  // isInNestedCanvas computed (692-693)
  [692, 693],

  // getLoopBodyNodeSize (756-767)
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
  [3969, 3982],
  [3989, 4002],
  [4050, 4060],

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

// 动态删除 nodeTypes 中的 loop 和 loopBody
let inNodeTypes = false;
let braceCount = 0;
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (line.includes('const nodeTypes = [')) {
    inNodeTypes = true;
  }
  if (inNodeTypes) {
    if (line.includes('{')) braceCount++;
    if (line.includes('}')) braceCount--;
    if (line.includes("type: 'loop'") && line.includes("name: '循环'")) {
      // 删除整个 loop 节点配置块
      linesToRemove.add(lineNum);
      let i = idx + 1;
      while (i < lines.length && !lines[i].includes('},')) {
        linesToRemove.add(i + 1);
        i++;
      }
      linesToRemove.add(i + 1);
    }
    if (line.includes("type: 'loopBody'")) {
      linesToRemove.add(lineNum);
    }
    if (braceCount === 0 && lineNum > 300) {
      inNodeTypes = false;
    }
  }
});

// 删除 Timer, Grid, loop, loopBody 导入
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (lineNum <= 50) {
    if (line.trim() === 'Timer,' || line.trim() === 'Grid,' ||
        line.trim() === '  Timer,' || line.trim() === '  Grid,') {
      linesToRemove.add(lineNum);
    }
  }
});

// 删除 nodes 中的 loop-1 和 loopBody-1
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if ((line.includes("'loop-1'") || line.includes("'loopBody-1'")) && line.includes('id:')) {
    // 找到节点定义的开始，删除整个块
    linesToRemove.add(lineNum);
    let i = idx + 1;
    while (i < lines.length && !lines[i].trim().startsWith('  }')) {
      linesToRemove.add(i + 1);
      i++;
    }
    linesToRemove.add(i + 1);
  }
});

// 删除 connections 中的 loop 相关连线
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (lineNum > 500 && lineNum < 600) { // connections 数组范围
    if ((line.includes("'loop-1'") || line.includes("'loopBody-1'")) && !line.includes('//')) {
      linesToRemove.add(lineNum);
    }
  }
});

// 收集要保留的行
const result = [];
for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  if (!linesToRemove.has(lineNum)) {
    result.push(lines[i]);
  }
}

// 写回文件
fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
console.log(`Cleaned WorkflowEditorView.vue`);
console.log(`Original: ${lines.length} lines, Removed: ${linesToRemove.size} lines, New: ${result.length} lines`);
