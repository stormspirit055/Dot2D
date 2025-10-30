# CanvasDragPlugin - 画布拖拽插件

## 概述

CanvasDragPlugin 是一个专门用于实现画布拖拽功能的插件，允许用户通过鼠标右键拖拽来移动整个画布视图，提供流畅的画布导航体验。

## 主要特性

* **右键拖拽**：使用鼠标右键进行画布拖拽，避免与左键选择功能冲突

* **实时响应**：拖拽过程中实时更新画布视图位置

* **自动状态管理**：自动处理拖拽开始、进行中和结束状态

* **性能优化**：使用 requestAnimationFrame 确保流畅的拖拽体验

## 核心功能

### 拖拽机制

插件通过监听以下鼠标事件实现拖拽功能：

* `mouse:down`：检测右键按下，开始拖拽

* `mouse:move`：计算鼠标移动距离，更新画布位置

* `mouse:up`：结束拖拽状态

### 坐标计算

```typescript
// 计算拖拽偏移量
const deltaX = e.e.clientX - this.lastPosX;
const deltaY = e.e.clientY - this.lastPosY;

// 更新画布视图位置
const vpt = canvas.viewportTransform!;
vpt[4] += deltaX;
vpt[5] += deltaY;
```

## API 接口

### 构造函数

```typescript
constructor(canvas: fabric.Canvas)
```

**参数：**

* `canvas`: Fabric.js 画布实例

### 生命周期方法

#### onInit()

插件初始化方法，设置事件监听器。

```typescript
onInit(): void
```

#### onDestroy()

插件销毁方法，清理事件监听器和状态。

```typescript
onDestroy(): void
```

## 事件系统

### 监听的画布事件

* **mouse:down**: 鼠标按下事件，用于检测拖拽开始

* **mouse:move**: 鼠标移动事件，用于实时更新画布位置

* **mouse:up**: 鼠标释放事件，用于结束拖拽

### 状态管理

插件维护以下内部状态：

* `isDragging`: 是否正在拖拽

* `lastPosX`: 上次鼠标 X 坐标

* `lastPosY`: 上次鼠标 Y 坐标

## 使用方法

### 基本使用

```typescript
import { CanvasDragPlugin } from './plugins/CanvasDragPlugin';

// 创建画布
const canvas = new fabric.Canvas('canvas');

// 注册插件
const dragPlugin = new CanvasDragPlugin(canvas);
drawBoard.registerPlugin('canvasDrag', dragPlugin);
```

### 在 DrawBoard 中使用

```typescript
// DrawBoard 会自动注册此插件
const drawBoard = new DrawBoard(canvasElement);
// 用户可以直接使用右键拖拽功能
```

## 设计理念

### 用户体验优先

* 使用右键拖拽避免与对象选择冲突

* 提供直观的画布导航方式

* 确保拖拽操作的流畅性

### 性能考虑

* 最小化重绘次数

* 使用高效的坐标变换

* 避免不必要的事件处理

### 兼容性设计

* 与其他插件无冲突

* 不影响画布的其他交互功能

* 支持各种画布缩放状态

## 优势

1. **操作直观**：右键拖拽符合用户习惯
2. **性能优秀**：使用原生 Fabric.js 变换机制
3. **兼容性好**：不干扰其他画布功能
4. **易于集成**：插件化设计，即插即用
5. **维护简单**：代码结构清晰，逻辑简单

## 注意事项

* 拖拽功能仅在右键按下时激活

* 拖拽过程中会暂时禁用对象选择

* 插件会自动处理画布边界和缩放状态

* 确保在销毁画布前正确清理插件资源

