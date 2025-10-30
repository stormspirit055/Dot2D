# ShapePlugin - 形状管理插件

## 概述

ShapePlugin 是一个专门用于管理 Fabric.js 形状对象的插件，提供了添加、删除和管理各种几何形状的完整解决方案。插件支持矩形、圆形、线条等基本形状，并提供丰富的样式配置选项。

## 主要特性

- **多种形状支持**：支持矩形、圆形、线条等基本几何形状

- **丰富样式配置**：支持填充色、描边、透明度等样式属性

- **智能定位**：自动计算形状的合适位置和大小

- **事件系统**：提供形状添加、删除等事件通知

- **状态管理**：维护形状列表和相关状态信息

## 支持的形状类型

### 矩形 (Rectangle)

```typescript
interface RectOptions {
  width?: number // 宽度，默认 100
  height?: number // 高度，默认 100
  fill?: string // 填充色，默认 'rgba(255, 0, 0, 0.5)'
  stroke?: string // 描边色，默认 'red'
  strokeWidth?: number // 描边宽度，默认 2
  left?: number // X 坐标，默认 100
  top?: number // Y 坐标，默认 100
}
```

### 圆形 (Circle)

```typescript
interface CircleOptions {
  radius?: number // 半径，默认 50
  fill?: string // 填充色
  stroke?: string // 描边色
  strokeWidth?: number // 描边宽度
  left?: number // X 坐标
  top?: number // Y 坐标
}
```

## 核心功能

### 形状创建

插件提供统一的形状创建接口：

```typescript
// 添加矩形
addRect(options?: RectOptions): fabric.Rect

// 添加圆形
addCircle(options?: CircleOptions): fabric.Circle

// 通用添加方法
addShape(type: string, options?: any): fabric.Object
```

### 形状管理

```typescript
// 删除指定形状
removeShape(shape: fabric.Object): boolean

// 清空所有形状
clearShapes(): void

// 获取所有形状
getShapes(): fabric.Object[]

// 获取形状数量
getShapeCount(): number
```

## API 接口

### 构造函数

```typescript
constructor(canvas: fabric.Canvas)
```

**参数：**

- `canvas`: Fabric.js 画布实例

### 生命周期方法

#### onInit()

插件初始化方法，设置事件监听器和初始状态。

```typescript
onInit(): void
```

#### onDestroy()

插件销毁方法，清理资源和事件监听器。

```typescript
onDestroy(): void
```

### 形状操作方法

#### addRect(options?: RectOptions)

添加矩形到画布。

```typescript
addRect(options?: RectOptions): fabric.Rect
```

**返回值：** 创建的矩形对象

#### addCircle(options?: CircleOptions)

添加圆形到画布。

```typescript
addCircle(options?: CircleOptions): fabric.Circle
```

**返回值：** 创建的圆形对象

#### removeShape(shape: fabric.Object)

从画布中移除指定形状。

```typescript
removeShape(shape: fabric.Object): boolean
```

**返回值：** 是否成功移除

#### clearShapes()

清空画布上的所有形状。

```typescript
clearShapes(): void
```

## 事件系统

### 触发的事件

插件会触发以下自定义事件：

- **shape:added**: 形状添加完成

- **shape:removed**: 形状移除完成

- **shapes:cleared**: 所有形状清空完成

### 事件数据结构

```typescript
// shape:added 事件数据
{
  type: 'shape:added',
  shape: fabric.Object,
  shapeType: string
}

// shape:removed 事件数据
{
  type: 'shape:removed',
  shape: fabric.Object
}

// shapes:cleared 事件数据
{
  type: 'shapes:cleared',
  count: number  // 清空的形状数量
}
```

## 使用方法

### 基本使用

```typescript
import { ShapePlugin } from './plugins/ShapePlugin'

// 创建画布
const canvas = new fabric.Canvas('canvas')

// 注册插件
const shapePlugin = new ShapePlugin(canvas)
drawBoard.registerPlugin('shape', shapePlugin)
```

### 添加形状

```typescript
// 添加默认矩形
const rect = shapePlugin.addRect()

// 添加自定义矩形
const customRect = shapePlugin.addRect({
  width: 200,
  height: 150,
  fill: 'blue',
  left: 50,
  top: 50,
})

// 添加圆形
const circle = shapePlugin.addCircle({
  radius: 75,
  fill: 'green',
  left: 300,
  top: 100,
})
```

### 事件监听

```typescript
// 监听形状添加事件
drawBoard.on('shape:added', (data) => {
  console.log('添加了形状:', data.shapeType, data.shape)
})

// 监听形状移除事件
drawBoard.on('shape:removed', (data) => {
  console.log('移除了形状:', data.shape)
})
```

### 形状管理

```typescript
// 获取所有形状
const shapes = shapePlugin.getShapes()
console.log('当前形状数量:', shapes.length)

// 移除特定形状
shapePlugin.removeShape(rect)

// 清空所有形状
shapePlugin.clearShapes()
```

## 设计理念

### 简化操作

- 提供简单易用的 API 接口

- 合理的默认参数，减少配置复杂度

- 统一的形状管理方式

### 扩展性设计

- 支持自定义形状类型

- 灵活的样式配置系统

- 可扩展的事件机制

### 性能优化

- 避免不必要的画布重绘

- 高效的形状状态管理

- 智能的内存管理

## 优势

1. **API 简洁**：提供直观易用的形状操作接口
2. **功能完整**：支持形状的完整生命周期管理
3. **高度可配置**：丰富的样式和位置配置选项
4. **事件驱动**：完善的事件系统，便于状态同步
5. **性能优秀**：优化的渲染和状态管理机制
6. **易于扩展**：支持添加新的形状类型

## 扩展示例

### 添加新形状类型

```typescript
// 扩展插件以支持三角形
class ExtendedShapePlugin extends ShapePlugin {
  addTriangle(options?: TriangleOptions): fabric.Triangle {
    const triangle = new fabric.Triangle({
      width: options?.width || 100,
      height: options?.height || 100,
      fill: options?.fill || 'yellow',
      left: options?.left || 100,
      top: options?.top || 100,
    })

    this.canvas.add(triangle)
    this.emit('shape:added', {
      type: 'shape:added',
      shape: triangle,
      shapeType: 'triangle',
    })

    return triangle
  }
}
```

## 注意事项

- 形状添加后会自动触发画布重绘

- 建议在批量操作时使用适当的性能优化策略

- 确保在组件销毁时正确清理插件资源

- 自定义形状样式时注意颜色格式的兼容性
