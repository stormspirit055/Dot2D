# 初始化坐标系设计说明（基于 `setViewportTransform`）

## 目标
- 将场景坐标系原点从“画布左上角”切换为“底图左上角”。
- 兼容场景旋转（0/90/180/270），无论如何旋转，坐标系始终以底图左上角为原点。
- 保持底图“完整可见且居中”。

代码入口：`src/modules/DrawBoard/index.ts:128-167`

## 坐标空间
- 视口坐标：`canvas.getViewportPoint(e)`，屏幕平面坐标（CSS 像素），不受视口矩阵影响。
- 场景坐标：`canvas.getScenePoint(e)`，内容平面坐标（底图像素），受视口矩阵影响；本设计令 `(0,0)` 对应底图左上角。

## 算法步骤
1. 读入尺寸（底图、画布）
   - `src/modules/DrawBoard/index.ts:130-131`
2. 计算等比缩放因子（适配画布、避免裁剪）
   - 对 90/270° 宽高投影互换
   - `scaleX = canvasWidth / (angle∈{90,270}? height : width)`
   - `scaleY = canvasHeight / (angle∈{90,270}? width  : height)`
   - `scale = Math.min(scaleX, scaleY)`（`src/modules/DrawBoard/index.ts:132-139`）
3. 计算未旋转坐标系下的居中平移 `deltaX/deltaY`
   - 针对 0/90/180/270°分别给出居中边距（`src/modules/DrawBoard/index.ts:140-155`）
4. 合成缩放+旋转线性部分（角度转弧度）
   - `cos = Math.cos(angle)`，`sin = Math.sin(angle)`
   - `a = cos*scale`，`b = sin*scale`，`c = -sin*scale`，`d = cos*scale`（`src/modules/DrawBoard/index.ts:156-161`）
5. 将居中平移向量旋转到最终屏幕平移
   - `e = cos*deltaX - sin*deltaY`
   - `f = sin*deltaX + cos*deltaY`（`src/modules/DrawBoard/index.ts:162-165`）
6. 设置视口矩阵
   - `canvas.setViewportTransform([a,b,c,d,e,f])`（`src/modules/DrawBoard/index.ts:165`）

## 矩阵含义
- 线性部分 `[[a,c],[b,d]]`：缩放 `scale` + 围绕原点旋转 `angle`（屏幕坐标，y 向下为正）。
- 平移部分 `[e,f]`：未旋转的居中位移向量 `[deltaX,deltaY]` 旋转到屏幕坐标后得到。

## 行为与效果
- 视觉：底图按角度旋转与等比缩放后居中显示。
- 坐标：场景坐标 `(0,0)` 始终为底图左上角；shape 的坐标与底图像素对齐；旋转不会改变坐标定义，只改变视觉映射。
- UI：定位使用视口坐标（不随矩阵变化），显示值使用场景坐标（与底图一致）。

## 文本示意图
```
屏幕（视口）平面 ──── 画布
-----------------------------------------------------+
|                                                     |
|            [底图旋转/缩放后被居中绘制]              |
|             ┌──────────────────────────────┐        |
|   (0,0) •───┼──────────────────────────────┼──▶ x   |
|   底图左上角 │  所有 shape 坐标以此为原点   │        |
|             └──────────────────────────────┘        |
|                                                     |
-----------------------------------------------------+
说明：
- 场景坐标系原点：(0,0) 在“底图左上角”。
- 通过 `setViewportTransform` 合成“缩放+旋转+居中平移”。
- shape 与底图共用场景坐标定义，显示时一起仿射到屏幕。
```

## 与其它 API 的关系
- `setZoom(scale)`：只改缩放并锚定 `(0,0)`；内部最终调用 `setViewportTransform`。
- `zoomToPoint(point, scale)`：围绕任意视口点缩放，自动修正平移；最终也调用 `setViewportTransform`。
- 复杂场景（旋转+居中+自定义原点）直接构造 `setViewportTransform` 更直观与完整。

## 任意角度的扩展（建议）
- 若需任意角度严格居中，可使用旋转后包围盒近似：
  - `w' = |cos|*width + |sin|*height`
  - `h' = |sin|*width + |cos|*height`
  - 用 `w'、h'` 重算 `scaleX/scaleY` 与居中位移，再按上式合成矩阵。

## 代码引用
- 初始化坐标系：`src/modules/DrawBoard/index.ts:128-167`
- 视口矩阵设置（Fabric 源码）：`node_modules/fabric/src/canvas/StaticCanvas.ts:431-435`
