# WheelZoomPlugin - 滚轮缩放插件

## 概述

WheelZoomPlugin 是一个专门用于实现鼠标滚轮缩放功能的插件，允许用户通过滚轮操作来放大或缩小画布视图，并支持以鼠标位置为中心的智能缩放。

## 主要特性

* **滚轮缩放**：支持鼠标滚轮进行画布缩放操作

* **智能中心点**：以鼠标当前位置为缩放中心点

* **可配置参数**：支持自定义缩放比例、最大最小缩放值

* **平滑缩放**：提供流畅的缩放体验

* **边界控制**：自动限制缩放范围，防止过度缩放

## 配置选项

### WheelZoomOptions

```typescript
interface WheelZoomOptions {
  zoomStep?: number;    // 缩放步长，默认 0.1
  minZoom?: number;     // 最小缩放值，默认 0.1
  maxZoom?: number;     // 最大缩放值，默认 5
}
```

### 默认配置

* **zoomStep**: 0.1 (每次滚轮操作的缩放增量)

* **minZoom**: 0.1 (最小缩放到 10%)

* **maxZoom**: 5 (最大缩放到 500%)

## 核心功能

### 缩放算法

插件使用以下算法实现智能缩放：

```typescript
// 计算新的缩放值
const delta = e.e.deltaY;
const zoom = canvas.getZoom();
let newZoom = zoom;

if (delta > 0) {
  newZoom = Math.max(zoom - this.options.zoomStep, this.options.minZoom);
} else {
  newZoom = Math.min(zoom + this.options.zoomStep, this.options.maxZoom);
}

// 以鼠标位置为中心进行缩放
canvas.zoomToPoint(new fabric.Point(e.e.offsetX, e.e.offsetY), newZoom);
```

### 中心点缩放

* 获取鼠标在画布上的精确位置

* 使用 `zoomToPoint` 方法实现以鼠标为中心的缩放

* 保持缩放过程中鼠标下方内容的相对位置不变

## API 接口

### 构造函数

```typescript
constructor(canvas: fabric.Canvas, options?: WheelZoomOptions)
```

**参数：**

* `canvas`: Fabric.js 画布实例

* `options`: 可选的配置参数

### 生命周期方法

#### onInit()

插件初始化方法，设置滚轮事件监听器。

```typescript
onInit(): void
```

#### onDestroy()

插件销毁方法，清理事件监听器。

```typescript
onDestroy(): void
```

### 配置方法

#### updateOptions(options: Partial<WheelZoomOptions>)

动态更新插件配置。

```typescript
updateOptions(options: Partial<WheelZoomOptions>): void
```

## 事件系统

### 监听的画布事件

* **mouse:wheel**: 鼠标滚轮事件，用于触发缩放操作

### 缩放边界处理

插件会自动处理以下边界情况：

* 达到最小缩放值时，忽略继续缩小的操作

* 达到最大缩放值时，忽略继续放大的操作

* 确保缩放值始终在合理范围内

## 使用方法

### 基本使用

```typescript
import { WheelZoomPlugin } from './plugins/WheelZoomPlugin';

// 创建画布
const canvas = new fabric.Canvas('canvas');

// 使用默认配置
const zoomPlugin = new WheelZoomPlugin(canvas);
drawBoard.registerPlugin('wheelZoom', zoomPlugin);
```

### 自定义配置

```typescript
// 自定义缩放参数
const zoomPlugin = new WheelZoomPlugin(canvas, {
  zoomStep: 0.2,    // 更大的缩放步长
  minZoom: 0.5,     // 最小缩放到 50%
  maxZoom: 10       // 最大缩放到 1000%
});

drawBoard.registerPlugin('wheelZoom', zoomPlugin);
```

### 动态配置更新

```typescript
// 运行时更新配置
zoomPlugin.updateOptions({
  zoomStep: 0.05,   // 更精细的缩放控制
  maxZoom: 3        // 降低最大缩放值
});
```

## 设计理念

### 用户体验优先

* 以鼠标位置为缩放中心，符合用户直觉

* 平滑的缩放过渡，避免突兀的跳跃

* 合理的默认参数，适合大多数使用场景

### 性能优化

* 使用 Fabric.js 原生缩放方法

* 避免频繁的重绘操作

* 智能的边界检查，减少无效计算

### 灵活配置

* 支持自定义缩放参数

* 运行时配置更新

* 适应不同的应用场景需求

## 优势

1. **操作自然**：滚轮缩放符合用户操作习惯
2. **精确控制**：以鼠标位置为中心的智能缩放
3. **高度可配置**：支持多种缩放参数自定义
4. **性能优秀**：使用高效的原生缩放机制
5. **边界安全**：自动限制缩放范围，防止异常状态
6. **易于集成**：插件化设计，配置简单

## 使用场景

* **图形编辑器**：提供精确的视图缩放控制

* **地图应用**：支持地图的放大缩小操作

* **设计工具**：帮助用户查看设计细节

* **数据可视化**：支持图表的缩放查看

## 注意事项

* 缩放操作会影响画布上所有对象的显示大小

* 建议根据应用场景调整缩放范围参数

* 在移动设备上可能需要额外的触摸缩放支持

* 确保在销毁画布前正确清理插件资源

