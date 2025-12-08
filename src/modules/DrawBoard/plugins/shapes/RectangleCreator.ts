import { Rect, Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import type { Canvas } from 'fabric'
import { Vertex, VertexEventCallbacks, VertexData, VertexType, VertexConfig } from './Vertex'
import { PointPosition } from './PointCreator'

export interface RectangleOptions {
  points: PointPosition[] // 外界传入的4个点坐标（矩形的四个角点）
  fill?: string
  stroke?: string
  strokeWidth?: number
  data: ShapeData
  interactive?: boolean // 是否可交互，默认为 true
}

/**
 * 矩形创建器类
 * 负责矩形的创建、顶点管理和事件处理
 */
export class RectangleCreator extends BaseShapeCreator {
  constructor(canvas: Canvas, options: ShapeCreatorOptions) {
    super(canvas, options)
  }

  /**
   * 创建矩形（包含矩形和四个可拖动的顶点圆点）
   * @param options 矩形配置选项
   * @returns 创建的矩形对象
   */
  public createRectangle(options: RectangleOptions): Rect {
    const isInteractive = options.interactive !== false // 默认为 true

    // 验证传入的点数量
    if (options.points.length !== 4) {
      throw new Error('Rectangle requires exactly 4 points')
    }

    // 应用坐标量化到所有点
    const quantizedPoints = options.points.map((point) => this.quantizePoint(point))

    // 计算矩形的边界框
    const bounds = this.calculateBounds(quantizedPoints)
    const left = bounds.left
    const top = bounds.top
    const width = bounds.width
    const height = bounds.height

    // 创建矩形
    const rect = new Rect({
      left: left,
      top: top,
      width: width,
      height: height,
      fill: options.fill || this.options.defaultFillColor,
      stroke: options.stroke || this.options.defaultStrokeColor,
      strokeWidth: options.strokeWidth || this.options.defaultStrokeWidth,
      ...this.commonObjectOptions(isInteractive, { hasBorders: isInteractive }),
    })

    // 创建四个顶点圆点（基于传入的角点坐标）
    const vertices = this.createVerticesFromPoints(quantizedPoints, isInteractive)

    // 建立矩形和顶点之间的关联关系
    rect.set('data', {
      ...options.data,
      vertices: vertices,
      type: 'rectangle',
    })

    // 为每个顶点添加矩形引用
    vertices.forEach((vertex) => {
      const currentData = (vertex.get('data') as Partial<VertexData>) || {}
      const newData: Partial<VertexData> = {
        ...currentData,
        shape: rect, // 使用统一的 shape 字段替代 rect
      }
      vertex.set('data', newData)
    })

    // 为矩形添加移动事件监听器，同步更新顶点位置
    if (isInteractive) {
      this.addRectangleEventListeners(rect, vertices)
    }

    // 添加默认事件监听器
    this.addDefaultEventListeners(rect)

    // 将矩形和顶点都添加到画布
    this.addShapeToCanvas(rect)
    // vertices.forEach((vertex) => this.addShapeToCanvas(vertex))

    return rect
  }

  /**
   * 为矩形添加移动事件监听器
   */
  protected addRectangleEventListeners(rect: Rect, vertices: Circle[]): void {
    rect.on('moving', () => {
      // 应用坐标量化到矩形位置
      const quantizedPosition = this.quantizePoint({ x: rect.left!, y: rect.top! })
      rect.set({ left: quantizedPosition.x, top: quantizedPosition.y })
      this.updateVerticesFromRectangle(rect, vertices)
      // 关键修复：更新矩形的交互区域坐标
      rect.setCoords()
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

    // 处理负宽度和负高度的情况 - 实现矩形翻转
    let flippedHorizontally = false
    let flippedVertically = false

    if (newWidth < 0) {
      newLeft = newLeft + newWidth
      newWidth = Math.abs(newWidth)
      flippedHorizontally = true
    }

    if (newHeight < 0) {
      newTop = newTop + newHeight
      newHeight = Math.abs(newHeight)
      flippedVertically = true
    }

    // 确保最小尺寸
    const minSize = 10
    if (newWidth < minSize) newWidth = minSize
    if (newHeight < minSize) newHeight = minSize

    // 应用坐标量化
    const quantizedPosition = this.quantizePoint({ x: newLeft, y: newTop })

    // 更新矩形属性
    rect.set({
      left: quantizedPosition.x,
      top: quantizedPosition.y,
      width: newWidth,
      height: newHeight,
    })

    // 如果发生了翻转，需要更新顶点类型
    if (flippedHorizontally || flippedVertically) {
      this.updateVertexTypesAfterFlip(rect, flippedHorizontally, flippedVertically)
    } else {
      // 正常情况下更新其他顶点位置
      this.updateOtherVertices(rect, vertexType)
    }

    // 关键修复：更新矩形的交互区域坐标
    rect.setCoords()

    // 重新渲染画布
  }

  /**
   * 翻转后更新所有顶点的类型和位置
   */
  private updateVertexTypesAfterFlip(
    rect: Rect,
    flippedHorizontally: boolean,
    flippedVertically: boolean,
  ): void {
    const data = rect.get('data') as { vertices?: Circle[] }
    if (!data || !data.vertices) return

    const vertices = data.vertices
    const rectLeft = rect.left!
    const rectTop = rect.top!
    const rectWidth = rect.width!
    const rectHeight = rect.height!

    vertices.forEach((vertex) => {
      const vertexData = vertex.get('data') as Partial<VertexData>
      if (!vertexData || !vertexData.vertexType) return

      let newVertexType = vertexData.vertexType

      // 根据翻转情况更新顶点类型
      if (flippedHorizontally && flippedVertically) {
        // 水平和垂直都翻转
        switch (vertexData.vertexType) {
          case VertexType.RECTANGLE_TOP_LEFT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_RIGHT
            break
          case VertexType.RECTANGLE_TOP_RIGHT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_LEFT
            break
          case VertexType.RECTANGLE_BOTTOM_RIGHT:
            newVertexType = VertexType.RECTANGLE_TOP_LEFT
            break
          case VertexType.RECTANGLE_BOTTOM_LEFT:
            newVertexType = VertexType.RECTANGLE_TOP_RIGHT
            break
        }
      } else if (flippedHorizontally) {
        // 只水平翻转
        switch (vertexData.vertexType) {
          case VertexType.RECTANGLE_TOP_LEFT:
            newVertexType = VertexType.RECTANGLE_TOP_RIGHT
            break
          case VertexType.RECTANGLE_TOP_RIGHT:
            newVertexType = VertexType.RECTANGLE_TOP_LEFT
            break
          case VertexType.RECTANGLE_BOTTOM_RIGHT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_LEFT
            break
          case VertexType.RECTANGLE_BOTTOM_LEFT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_RIGHT
            break
        }
      } else if (flippedVertically) {
        // 只垂直翻转
        switch (vertexData.vertexType) {
          case VertexType.RECTANGLE_TOP_LEFT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_LEFT
            break
          case VertexType.RECTANGLE_TOP_RIGHT:
            newVertexType = VertexType.RECTANGLE_BOTTOM_RIGHT
            break
          case VertexType.RECTANGLE_BOTTOM_RIGHT:
            newVertexType = VertexType.RECTANGLE_TOP_RIGHT
            break
          case VertexType.RECTANGLE_BOTTOM_LEFT:
            newVertexType = VertexType.RECTANGLE_TOP_LEFT
            break
        }
      }

      // 更新顶点类型
      vertexData.vertexType = newVertexType

      // 根据新的顶点类型设置位置
      switch (newVertexType) {
        case VertexType.RECTANGLE_TOP_LEFT:
          vertex.set({ left: rectLeft, top: rectTop })
          break
        case VertexType.RECTANGLE_TOP_RIGHT:
          vertex.set({ left: rectLeft + rectWidth, top: rectTop })
          break
        case VertexType.RECTANGLE_BOTTOM_RIGHT:
          vertex.set({ left: rectLeft + rectWidth, top: rectTop + rectHeight })
          break
        case VertexType.RECTANGLE_BOTTOM_LEFT:
          vertex.set({ left: rectLeft, top: rectTop + rectHeight })
          break
      }

      // 更新顶点的交互区域坐标
      vertex.setCoords()
    })
  }

  /**
   * 更新其他顶点位置（除了正在拖动的顶点）
   */
  private updateOtherVertices(rect: Rect, excludeVertexType: string): void {
    const data = rect.get('data') as { vertices?: Circle[] }
    if (!data || !data.vertices) return

    const vertices = data.vertices
    const rectLeft = rect.left!
    const rectTop = rect.top!
    const rectWidth = rect.width!
    const rectHeight = rect.height!

    vertices.forEach((vertex) => {
      const vertexData = vertex.get('data') as Partial<VertexData>
      if (!vertexData || vertexData.vertexType === excludeVertexType) return

      switch (vertexData.vertexType) {
        case VertexType.RECTANGLE_TOP_LEFT:
          vertex.set({ left: rectLeft, top: rectTop })
          break
        case VertexType.RECTANGLE_TOP_RIGHT:
          vertex.set({ left: rectLeft + rectWidth, top: rectTop })
          break
        case VertexType.RECTANGLE_BOTTOM_RIGHT:
          vertex.set({ left: rectLeft + rectWidth, top: rectTop + rectHeight })
          break
        case VertexType.RECTANGLE_BOTTOM_LEFT:
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
      const vertexData = vertex.get('data') as Partial<VertexData>
      if (!vertexData) return

      let newPosition: { x: number; y: number }
      switch (vertexData.vertexType) {
        case VertexType.RECTANGLE_TOP_LEFT:
          newPosition = this.quantizePoint({ x: rectLeft, y: rectTop })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case VertexType.RECTANGLE_TOP_RIGHT:
          newPosition = this.quantizePoint({ x: rectLeft + rectWidth, y: rectTop })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case VertexType.RECTANGLE_BOTTOM_RIGHT:
          newPosition = this.quantizePoint({ x: rectLeft + rectWidth, y: rectTop + rectHeight })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
        case VertexType.RECTANGLE_BOTTOM_LEFT:
          newPosition = this.quantizePoint({ x: rectLeft, y: rectTop + rectHeight })
          vertex.set({ left: newPosition.x, top: newPosition.y })
          break
      }

      // 关键修复：更新顶点的交互区域坐标
      vertex.setCoords()
    })

    // 重新渲染画布
  }

  /**
   * 计算点集的边界框
   * @param points 点坐标数组
   * @returns 边界框信息
   */
  private calculateBounds(points: { x: number; y: number }[]): {
    left: number
    top: number
    width: number
    height: number
  } {
    if (points.length === 0) {
      return { left: 0, top: 0, width: 0, height: 0 }
    }

    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * 基于传入的角点坐标创建顶点
   * @param points 4个角点坐标
   * @param isInteractive 是否可交互
   * @returns 顶点圆点数组
   */
  private createVerticesFromPoints(
    points: { x: number; y: number }[],
    isInteractive: boolean,
  ): Circle[] {
    // 创建顶点事件回调
    const callbacks: VertexEventCallbacks = {
      onMoving: (vertex: Circle) => {
        const data = vertex.get('data') as Partial<VertexData>
        if (data && data.shape && data.vertexType) {
          this.updateRectangleFromVertex(vertex, data.shape as Rect, data.vertexType as string)
        }
      },
    }

    // 为每个角点创建顶点
    const vertices: Circle[] = []
    const vertexTypes = [
      VertexType.RECTANGLE_TOP_LEFT,
      VertexType.RECTANGLE_TOP_RIGHT,
      VertexType.RECTANGLE_BOTTOM_RIGHT,
      VertexType.RECTANGLE_BOTTOM_LEFT,
    ]

    points.forEach((point, index) => {
      const config: VertexConfig = {
        x: point.x,
        y: point.y,
        isInteractive,
        vertexType: vertexTypes[index % 4],
      }

      const shapeVertex = new Vertex(this.canvas, config, callbacks, this.drawBoard)
      const vertex = shapeVertex.getVertex()

      vertices.push(vertex)
    })

    return vertices
  }
}
