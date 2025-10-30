# ImagePlugin - 图片管理插件

## 概述

ImagePlugin 是一个专门用于管理画布背景图片的插件，提供了图片加载、自适应缩放、居中显示和状态管理等功能。插件将图片作为画布的背景层，确保其他绘制对象始终显示在图片之上。

## 主要特性

- **图片加载**：支持从 URL 加载图片到画布

- **自适应缩放**：自动计算图片缩放比例，适应画布尺寸

- **智能居中**：自动将图片居中显示在画布中

- **背景层管理**：确保图片始终作为背景层，不遮挡其他对象

- **状态管理**：维护当前图片状态和相关信息

- **事件系统**：提供图片加载完成等事件通知

## 核心功能

### 图片加载机制

插件使用以下流程加载和处理图片：

1. **URL 验证**：检查图片 URL 的有效性
2. **异步加载**：使用 `fabric.Image.fromURL` 异步加载图片
3. **尺寸计算**：计算图片在画布中的最佳显示尺寸
4. **位置调整**：将图片居中显示在画布中
5. **层级管理**：将图片置于最底层作为背景
6. **状态更新**：更新插件内部状态和触发事件

### 自适应缩放算法

```typescript
// 计算缩放比例，确保图片完全显示在画布内
const scaleX = canvasWidth / img.width!
const scaleY = canvasHeight / img.height!
const scale = Math.min(scaleX, scaleY)

// 应用缩放
img.scale(scale)
```

### 居中定位算法

```typescript
// 计算居中位置
const centerX = canvasWidth / 2
const centerY = canvasHeight / 2

// 设置图片中心点位置
img.set({
  left: centerX,
  top: centerY,
  originX: 'center',
  originY: 'center',
})
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

插件初始化方法，设置初始状态。

```typescript
onInit(): void
```

#### onDestroy()

插件销毁方法，清理资源和状态。

```typescript
onDestroy(): void
```

### 图片操作方法

#### loadImage(url: string)

从指定 URL 加载图片作为画布背景。

```typescript
loadImage(url: string): Promise<fabric.Image>
```

**参数：**

- `url`: 图片的 URL 地址

**返回值：** Promise，解析为加载的图片对象

**异常：** 当图片加载失败时抛出错误

#### getImage()

获取当前的背景图片对象。

```typescript
getImage(): fabric.Image | null
```

**返回值：** 当前的图片对象，如果没有图片则返回 null

#### removeImage()

移除当前的背景图片。

```typescript
removeImage(): boolean
```

**返回值：** 是否成功移除图片

#### hasImage()

检查是否已加载背景图片。

```typescript
hasImage(): boolean
```

**返回值：** 是否存在背景图片

## 图片属性配置

### 默认属性设置

加载的图片会自动应用以下属性：

```typescript
{
  selectable: false,        // 不可选中
  evented: false,          // 不响应事件
  hasControls: false,      // 无控制器
  hasBorders: false,       // 无边框
  lockMovementX: true,     // 锁定 X 轴移动
  lockMovementY: true,     // 锁定 Y 轴移动
  lockRotation: true,      // 锁定旋转
  lockScalingX: true,      // 锁定 X 轴缩放
  lockScalingY: true       // 锁定 Y 轴缩放
}
```

### 背景层保证

- 图片加载后自动调用 `canvas.sendToBack(img)` 置于底层

- 确保后续添加的对象始终显示在图片之上

- 防止图片遮挡其他绘制内容

## 事件系统

### 触发的事件

插件会触发以下自定义事件：

- **image:loaded**: 图片加载完成

- **image:removed**: 图片移除完成

- **image:error**: 图片加载失败

### 事件数据结构

```typescript
// image:loaded 事件数据
{
  type: 'image:loaded',
  image: fabric.Image,
  url: string
}

// image:removed 事件数据
{
  type: 'image:removed',
  image: fabric.Image
}

// image:error 事件数据
{
  type: 'image:error',
  url: string,
  error: Error
}
```

## 使用方法

### 基本使用

```typescript
import { ImagePlugin } from './plugins/ImagePlugin'

// 创建画布
const canvas = new fabric.Canvas('canvas')

// 注册插件
const imagePlugin = new ImagePlugin(canvas)
drawBoard.registerPlugin('image', imagePlugin)
```

### 加载图片

```typescript
// 加载背景图片
try {
  const image = await imagePlugin.loadImage('/path/to/image.jpg')
  console.log('图片加载成功:', image)
} catch (error) {
  console.error('图片加载失败:', error)
}
```

### 事件监听

```typescript
// 监听图片加载事件
drawBoard.on('image:loaded', (data) => {
  console.log('图片加载完成:', data.url)
})

// 监听图片加载错误
drawBoard.on('image:error', (data) => {
  console.error('图片加载失败:', data.url, data.error)
})
```

### 图片管理

```typescript
// 检查是否有背景图片
if (imagePlugin.hasImage()) {
  console.log('当前背景图片:', imagePlugin.getImage())
}

// 移除背景图片
if (imagePlugin.removeImage()) {
  console.log('背景图片已移除')
}
```

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <button @click="loadImage" :disabled="loading">
      {{ loading ? '加载中...' : '加载图片' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const loading = ref(false)

const loadImage = async () => {
  loading.value = true
  try {
    await drawBoard.load('/example/assets/1.jpg')
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

## 设计理念

### 背景图片定位

- 将图片定位为画布的背景层

- 确保图片不干扰其他绘制操作

- 提供稳定的视觉基础

### 自动化处理

- 自动计算最佳显示尺寸

- 自动居中显示

- 自动层级管理

### 用户体验优先

- 异步加载，不阻塞界面

- 完善的错误处理

- 清晰的状态反馈

## 优势

1. **操作简单**：一行代码即可加载背景图片
2. **自动适配**：智能的尺寸和位置计算
3. **层级安全**：确保图片始终作为背景层
4. **性能优秀**：高效的图片加载和渲染机制
5. **状态清晰**：完善的状态管理和事件通知
6. **易于集成**：插件化设计，即插即用

## 使用场景

- **设计工具**：为设计提供背景参考图

- **地图应用**：加载地图底图

- **图片编辑**：为图片添加标注和绘制

- **教育应用**：在图片上进行标记和说明

## 注意事项

- 图片 URL 必须是可访问的有效地址

- 跨域图片可能需要配置 CORS 策略

- 大尺寸图片可能影响加载性能

- 建议在组件销毁时清理图片资源

- 图片加载是异步操作，需要适当的错误处理

## 性能优化建议

1. **图片预处理**：使用适当尺寸的图片，避免过大的原图
2. **缓存策略**：对常用图片进行缓存
3. **懒加载**：根据需要动态加载图片
4. **格式选择**：选择合适的图片格式（WebP、JPEG、PNG）
