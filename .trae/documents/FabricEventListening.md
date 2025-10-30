# Fabric.js 事件监听使用指南

## 概述

在 `ShapePlugin` 的 `addRectangle` 方法中，我们已经实现了对 Fabric.js `FabricObject` 事件的监听功能。现在可以为添加的矩形监听各种交互事件。

## 支持的事件类型

根据 Fabric.js 官方文档，`FabricObject` 支持以下事件：

### 鼠标事件
- `mousedown` - 鼠标按下
- `mouseup` - 鼠标释放
- `mouseover` - 鼠标悬停
- `mouseout` - 鼠标离开
- `mousewheel` - 鼠标滚轮
- `mousedblclick` - 鼠标双击

### 变换事件
- `modified` - 对象被修改（移动、缩放、旋转后）
- `moving` - 对象正在移动
- `scaling` - 对象正在缩放
- `rotating` - 对象正在旋转
- `skewing` - 对象正在倾斜

### 选择事件
- `selected` - 对象被选中
- `deselected` - 对象取消选中

### 拖拽事件
- `dragover` - 拖拽悬停
- `dragenter` - 拖拽进入
- `dragleave` - 拖拽离开
- `drop` - 拖拽释放

## 使用方法

### 1. 基本用法（使用默认事件监听器）

```typescript
// 添加矩形，会自动绑定默认的事件监听器
const rect = drawBoard.shapePlugin.addRectangle({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: 'red'
})
```

默认事件监听器会在控制台输出所有事件的详细信息，包括：
- 事件类型
- 目标对象
- 鼠标指针位置
- 变换信息等

### 2. 自定义事件监听器

```typescript
// 添加矩形并自定义事件监听器
const rect = drawBoard.shapePlugin.addRectangle({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: 'blue',
  eventListeners: {
    mousedown: (event) => {
      console.log('矩形被点击了！', event)
      // 自定义处理逻辑
    },
    mouseover: (event) => {
      console.log('鼠标悬停在矩形上', event)
      // 可以改变矩形样式
      event.target.set('fill', 'yellow')
      event.target.canvas.renderAll()
    },
    mouseout: (event) => {
      console.log('鼠标离开矩形', event)
      // 恢复原始样式
      event.target.set('fill', 'blue')
      event.target.canvas.renderAll()
    },
    modified: (event) => {
      console.log('矩形被修改了', event)
      // 保存修改后的状态
    },
    moving: (event) => {
      console.log('矩形正在移动', event)
      // 实时更新位置信息
    }
  }
})
```

### 3. 完整示例

```typescript
// 创建一个交互式矩形
const interactiveRect = drawBoard.shapePlugin.addRectangle({
  left: 200,
  top: 200,
  width: 150,
  height: 100,
  fill: 'rgba(0, 255, 0, 0.7)',
  stroke: 'green',
  strokeWidth: 2,
  data: {
    id: 'interactive-rect-1',
    type: 'interactive'
  },
  eventListeners: {
    mousedown: (event) => {
      console.log('开始交互:', event.target.get('data'))
    },
    mouseover: (event) => {
      // 悬停时高亮
      event.target.set({
        fill: 'rgba(255, 255, 0, 0.8)',
        stroke: 'orange',
        strokeWidth: 3
      })
      event.target.canvas.renderAll()
    },
    mouseout: (event) => {
      // 离开时恢复
      event.target.set({
        fill: 'rgba(0, 255, 0, 0.7)',
        stroke: 'green',
        strokeWidth: 2
      })
      event.target.canvas.renderAll()
    },
    modified: (event) => {
      const data = event.target.get('data')
      console.log(`矩形 ${data.id} 被修改:`, {
        left: event.target.left,
        top: event.target.top,
        scaleX: event.target.scaleX,
        scaleY: event.target.scaleY,
        angle: event.target.angle
      })
    }
  }
})
```

## 事件对象结构

每个事件处理函数都会接收一个事件对象，包含以下信息：

```typescript
interface FabricEvent {
  target: FabricObject    // 触发事件的对象
  pointer?: Point         // 鼠标指针位置
  e?: Event              // 原始 DOM 事件
  transform?: Transform   // 变换信息（仅变换事件）
}
```

## 测试方法

1. 打开浏览器开发者工具的控制台
2. 点击「添加矩形」按钮
3. 与矩形进行交互：
   - 点击矩形
   - 鼠标悬停和离开
   - 拖拽移动矩形
   - 缩放和旋转矩形
4. 观察控制台输出的事件日志

## 注意事项

1. **对象必须可选择**：只有设置了 `selectable: true` 的对象才能触发交互事件
2. **事件冒泡**：某些事件可能会冒泡到画布级别
3. **性能考虑**：避免在高频事件（如 `moving`）中执行复杂操作
4. **内存管理**：在对象销毁时记得移除事件监听器

## 扩展功能

可以进一步扩展功能：

1. **事件委托**：在画布级别统一处理事件
2. **事件过滤**：根据对象类型或数据过滤事件
3. **状态管理**：结合状态管理库保存对象状态
4. **动画效果**：在事件处理中添加动画效果

通过这种方式，你可以创建丰富的交互式图形应用程序！