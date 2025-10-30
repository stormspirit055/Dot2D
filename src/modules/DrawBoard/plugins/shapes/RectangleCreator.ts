import { Rect, Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import type { Canvas } from 'fabric'
import { ShapeVertex, VertexEventCallbacks } from './ShapeVertex'

export interface RectangleOptions {
  left?: number
  top?: number
  width?: number
  height?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  data?: ShapeData
  interactive?: boolean // 是否可交互，默认为 true
}

/**
 * 矩形创建器类
 * 负责矩形的创建、顶点管理和事件处理
 */
export class RectangleCreator extends BaseShapeCreator {
  constructor(canvas: Canvas, options: ShapeCreatorOptions, onShapeAdded: (shape: any) => void) {
    super(canvas, options, onShapeAdded)
  }

  /**
   * 创建矩形（包含矩形和四个可拖动的顶点圆点）
   * @param options 矩形配置选项
   * @returns 创建的矩形对象
   */
  public createRectangle(options: RectangleOptions): Rect {
    const isInteractive = options.interactive !== false // 默认为 true
    const width = options.width || 100
    const height = options.height || 100

    // 应用坐标量化
    const quantizedPosition = this.quantizePoint({
      x: options.left || 50,
      y: options.top || 50,
    })
    const left = quantizedPosition.x
    const top = quantizedPosition.y

    // 创建矩形
    const rect = new Rect({
      left: left,
      top: top,
      width: width,
      height: height,
      fill: options.fill || this.options.defaultFillColor,
      stroke: options.stroke || this.options.defaultStrokeColor,
      strokeWidth: options.strokeWidth || this.options.defaultStrokeWidth,
      // 控制交互性的属性
      selectable: isInteractive, // 是否可选中
      evented: isInteractive, // 是否响应事件
      moveCursor: isInteractive ? 'move' : 'default', // 移动时的光标
      hoverCursor: isInteractive ? 'move' : 'default', // 悬停时的光标
      // 锁定形变属性 - 只允许移动，不允许缩放、旋转、倾斜
      lockScalingX: isInteractive, // 禁止水平缩放
      lockScalingY: isInteractive, // 禁止垂直缩放
      lockRotation: isInteractive, // 禁止旋转
      lockSkewingX: isInteractive, // 禁止水平倾斜
      lockSkewingY: isInteractive, // 禁止垂直倾斜
      hasControls: !isInteractive, // 隐藏控制点（缩放、旋转控制点）
      hasBorders: isInteractive, // 保留边框（用于显示选中状态）
    })

    // 创建四个顶点圆点
    const vertices = this.createVertices(left, top, width, height, isInteractive)

    // 建立矩形和顶点之间的关联关系
    rect.set('data', {
      ...options.data,
      vertices: vertices,
      type: 'rectangle',
    })

    // 为每个顶点添加矩形引用
    const vertexTypes = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']
    vertices.forEach((vertex, index) => {
      const currentData = vertex.get('data') || {}
      vertex.set('data', { 
        ...currentData,
        rect: rect, 
        vertexType: vertexTypes[index] 
      })
    })

    // 为矩形添加移动事件监听器，同步更新顶点位置
    if (isInteractive) {
      this.addRectangleEventListeners(rect, vertices)
    }

    // 添加默认事件监听器
    this.addDefaultEventListeners(rect)

    // 将矩形和顶点都添加到画布
    this.addShapeToCanvas(rect)
    vertices.forEach((vertex) => this.addShapeToCanvas(vertex))

    return rect
  }

  /**
   * 创建矩形的四个顶点
   */
  private createVertices(
    left: number,
    top: number,
    width: number,
    height: number,
    isInteractive: boolean,
  ): Circle[] {
    // 创建顶点事件回调
    const callbacks: VertexEventCallbacks = {
      onMoving: (vertex: Circle) => {
        const data = vertex.get('data') as any
        if (data && data.rect && data.vertexType) {
          this.updateRectangleFromVertex(vertex, data.rect, data.vertexType)
        }
      },
    }

    // 使用 ShapeVertex 类创建顶点
    const shapeVertices = ShapeVertex.createRectangleVertices(
      this.canvas,
      left,
      top,
      width,
      height,
      isInteractive,
      callbacks,
    )

    // 返回 Circle 对象数组
    return shapeVertices.map((shapeVertex) => shapeVertex.getVertex())
  }



  /**
   * 为矩形添加移动事件监听器
   */
  private addRectangleEventListeners(rect: Rect, vertices: Circle[]): void {
    rect.on('moving', () => {
      // 应用坐标量化到矩形位置
      const quantizedPosition = this.quantizePoint({ x: rect.left!, y: rect.top! })
      rect.set({ left: quantizedPosition.x, top: quantizedPosition.y })
      this.updateVerticesFromRectangle(rect, vertices)
    })
  }

  /**
   * 根据顶点位置更新矩形形状
   */
  private updateRectangleFromVertex(vertex: Circle, rect: Rect, vertexType: string): void {
    const vertexLeft = vertex.left!
    const vertexTop = vertex.top!
    const currentLeft = rect.left!
    const currentTop = rect.top!
    const currentWidth = rect.width!
    const currentHeight = rect.height!

    let newLeft = currentLeft
    let newTop = currentTop
    let newWidth = currentWidth
    let newHeight = currentHeight

    // 根据顶点类型计算新的矩形属性
    switch (vertexType) {
      case 'topLeft':
        newLeft = vertexLeft
        newTop = vertexTop
        newWidth = currentLeft + currentWidth - vertexLeft
        newHeight = currentTop + currentHeight - vertexTop
        break
      case 'topRight':
        newTop = vertexTop
        newWidth = vertexLeft - currentLeft
        newHeight = currentTop + currentHeight - vertexTop
        break
      case 'bottomRight':
        newWidth = vertexLeft - currentLeft
        newHeight = vertexTop - currentTop
        break
      case 'bottomLeft':
        newLeft = vertexLeft
        newWidth = currentLeft + currentWidth - vertexLeft
        newHeight = vertexTop - currentTop
        break
    }

    // 确保宽度和高度为正值
    if (newWidth < 10) newWidth = 10
    if (newHeight < 10) newHeight = 10

    // 应用坐标量化
    const quantizedPosition = this.quantizePoint({ x: newLeft, y: newTop })

    // 更新矩形属性
    rect.set({
      left: quantizedPosition.x,
      top: quantizedPosition.y,
      width: newWidth,
      height: newHeight,
    })

    // 更新其他顶点位置
    this.updateOtherVertices(rect, vertexType)

    // 重新渲染画布
    this.canvas.renderAll()
  }

  /**
   * 更新其他顶点位置（除了正在拖动的顶点）
   */
  private updateOtherVertices(rect: Rect, excludeVertexType: string): void {
    const data = rect.get('data') as any
    if (!data || !data.vertices) return

    const vertices = data.vertices as Circle[]
    const rectLeft = rect.left!
    const rectTop = rect.top!
    const rectWidth = rect.width!
    const rectHeight = rect.height!

    vertices.forEach((vertex) => {
      const vertexData = vertex.get('data') as any
      if (!vertexData || vertexData.vertexType === excludeVertexType) return

      switch (vertexData.vertexType) {
        case 'topLeft':
          vertex.set({ left: rectLeft, top: rectTop })
          break
        case 'topRight':
          vertex.set({ left: rectLeft + rectWidth, top: rectTop })
          break
        case 'bottomRight':
          vertex.set({ left: rectLeft + rectWidth, top: rectTop + rectHeight })
          break
        case 'bottomLeft':
          vertex.set({ left: rectLeft, top: rectTop + rectHeight })
          break
      }

      // 关键修复：更新顶点的交互区域坐标
      vertex.setCoords()
    })
  }

  /**
   * 根据矩形位置更新顶点位置
   */
  private updateVerticesFromRectangle(rect: Rect, vertices: Circle[]): void {
    const rectLeft = rect.left!
    const rectTop = rect.top!
    const rectWidth = rect.width!
    const rectHeight = rect.height!

    vertices.forEach((vertex) => {
      const vertexData = vertex.get('data') as any
      if (!vertexData) return

      let newPosition: { x: number; y: number }
      switch (vertexData.vertexType) {
        case 'topLeft':
          newPosition = this.quantizePoint({ x: rectLeft, y: rectTop })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case 'topRight':
          newPosition = this.quantizePoint({ x: rectLeft + rectWidth, y: rectTop })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case 'bottomRight':
          newPosition = this.quantizePoint({ x: rectLeft + rectWidth, y: rectTop + rectHeight })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case 'bottomLeft':
          newPosition = this.quantizePoint({ x: rectLeft, y: rectTop + rectHeight })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
      }

      // 关键修复：更新顶点的交互区域坐标
      vertex.setCoords()
    })

    // 重新渲染画布
    this.canvas.renderAll()
  }

  /**
   * 添加默认事件监听器
   */
  private addDefaultEventListeners(rect: Rect): void {
    // 当矩形被选中时，将其顶点置顶
    rect.on('selected', () => {
      const data = rect.get('data') as any
      if (data && data.vertices) {
        const vertices = data.vertices as Circle[]
        vertices.forEach((vertex) => {
          this.canvas.bringObjectToFront(vertex)
        })
        this.canvas.renderAll()
      }
    })

    // 当矩形取消选中时的处理（可选）
    rect.on('deselected', () => {
      // 这里可以添加取消选中时的逻辑
      // 例如恢复顶点的原始层级等
    })
  }
}
