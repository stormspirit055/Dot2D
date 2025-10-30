import { Polygon, Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import type { Canvas } from 'fabric'
import { ShapeVertex, VertexEventCallbacks } from './ShapeVertex'

export interface PolygonOptions {
  center?: { x: number; y: number }
  radius?: number
  pointCount?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  data?: ShapeData
  interactive?: boolean
  eventListeners?: Record<string, (event: any) => void>
}

/**
 * 多边形创建器类
 * 负责多边形的创建、顶点管理和事件处理
 */
export class PolygonCreator extends BaseShapeCreator {
  constructor(canvas: Canvas, options: ShapeCreatorOptions, onShapeAdded: (shape: any) => void) {
    super(canvas, options, onShapeAdded)
  }

  /**
   * 创建多边形（包含多边形和可拖动的顶点圆点）
   * @param options 多边形配置选项
   * @returns 创建的多边形对象
   */
  public createPolygon(options: PolygonOptions): Polygon {
    const isInteractive = options.interactive !== false // 默认为 true

    // 应用坐标量化到中心点
    const quantizedCenter = this.quantizePoint(options.center || { x: 200, y: 200 })
    const center = quantizedCenter
    const radius = options.radius || 80
    const pointCount = options.pointCount || 10

    // 生成随机的多边形点
    const points: { x: number; y: number }[] = []
    for (let i = 0; i < pointCount; i++) {
      // 在圆周上均匀分布角度，然后添加随机偏移
      const baseAngle = (i / pointCount) * 2 * Math.PI
      const angleOffset = (Math.random() - 0.5) * 0.5 // 角度随机偏移
      const angle = baseAngle + angleOffset

      // 半径也添加随机变化
      const radiusOffset = radius * (0.6 + Math.random() * 0.4) // 半径在 60%-100% 之间变化

      const x = Math.cos(angle) * radiusOffset
      const y = Math.sin(angle) * radiusOffset

      // 应用坐标量化到每个点
      const quantizedPoint = this.quantizePoint({ x, y })
      points.push(quantizedPoint)
    }

    const polygon = new Polygon(points, {
      left: center.x,
      top: center.y,
      fill: options.fill || this.options.defaultFillColor,
      stroke: options.stroke || this.options.defaultStrokeColor,
      strokeWidth: options.strokeWidth || this.options.defaultStrokeWidth,
      // 控制交互性的属性
      selectable: isInteractive, // 是否可选中
      evented: isInteractive, // 是否响应事件
      moveCursor: isInteractive ? 'move' : 'default', // 移动时的光标
      hoverCursor: isInteractive ? 'move' : 'default', // 悬停时的光标
      // 精确点击检测配置
      perPixelTargetFind: false, // 启用像素级精确检测，只有点击到实际形状内部才能拖动
      targetFindTolerance: 2, // 设置2像素的容差，提高点击精度同时保持易用性
      // 锁定形变属性 - 只允许移动，不允许缩放、旋转、倾斜
      lockScalingX: isInteractive, // 禁止水平缩放
      lockScalingY: isInteractive, // 禁止垂直缩放
      lockRotation: isInteractive, // 禁止旋转
      lockSkewingX: isInteractive, // 禁止水平倾斜
      lockSkewingY: isInteractive, // 禁止垂直倾斜
      hasControls: !isInteractive, // 隐藏控制点（缩放、旋转控制点）
      hasBorders: false, // 保留边框（用于显示选中状态）
      originX: 'center',
      originY: 'center',
      objectCaching: false, // 禁用缓存以确保形变时实时更新
    })

    // 创建顶点圆点
    const vertices = this.createVertices(points, center, isInteractive)

    // 为多边形添加顶点引用
    polygon.set('data', {
      ...options.data,
      vertices: vertices,
      type: 'polygon',
    })

    // 为顶点添加多边形引用
    if (isInteractive && vertices.length > 0) {
      vertices.forEach((vertex, index) => {
        const currentData = vertex.get('data') || {}
        vertex.set('data', {
          ...currentData,
          polygon: polygon,
          vertexIndex: index,
        })
      })
      this.addPolygonEventListeners(polygon, vertices)
    }

    // 添加默认事件监听器
    this.addDefaultEventListeners(polygon)

    // 添加自定义事件监听器
    if (options.eventListeners) {
      Object.entries(options.eventListeners).forEach(([eventName, handler]) => {
        polygon.on(eventName, handler)
      })
    }

    // 将多边形和顶点都添加到画布
    this.addShapeToCanvas(polygon)
    vertices.forEach((vertex) => this.addShapeToCanvas(vertex))

    return polygon
  }

  /**
   * 创建多边形的顶点
   */
  private createVertices(
    points: { x: number; y: number }[],
    center: { x: number; y: number },
    isInteractive: boolean,
  ): Circle[] {
    if (!isInteractive) {
      return []
    }

    // 创建顶点事件回调
    const callbacks: VertexEventCallbacks = {
      onMoving: (vertex: Circle) => {
        const data = vertex.get('data') as any
        if (data && data.polygon && typeof data.vertexIndex === 'number') {
          this.updatePolygonFromVertex(vertex, data.polygon, data.vertexIndex)
        }
      },
    }

    // 使用 ShapeVertex 类创建顶点
    const shapeVertices = ShapeVertex.createPolygonVertices(
      this.canvas,
      points,
      center,
      isInteractive,
      callbacks,
    )

    // 返回 Circle 对象数组
    return shapeVertices.map((shapeVertex) => shapeVertex.getVertex())
  }

  /**
   * 为多边形添加移动事件监听器
   */
  private addPolygonEventListeners(polygon: Polygon, vertices: Circle[]): void {
    polygon.on('moving', () => {
      // 应用坐标量化到多边形位置
      const quantizedPosition = this.quantizePoint({ x: polygon.left!, y: polygon.top! })
      polygon.set({ left: quantizedPosition.x, top: quantizedPosition.y })
      this.updateVerticesFromPolygon(polygon, vertices)
    })
  }

  /**
   * 根据顶点位置更新多边形形状
   */
  private updatePolygonFromVertex(vertex: Circle, polygon: Polygon, vertexIndex: number): void {
    // 1. 保存原始状态（深拷贝避免引用问题）
    const originalPoints = polygon.points ? polygon.points.map((p) => ({ x: p.x, y: p.y })) : []
    const originalLeft = polygon.left
    const originalTop = polygon.top
    const originalWidth = polygon.width
    const originalHeight = polygon.height

    // 更新当前顶点的绝对坐标存储，应用坐标量化
    const vertexData = vertex.get('data') as any
    if (vertexData) {
      const quantizedPosition = this.quantizePoint({ x: vertex.left!, y: vertex.top! })
      vertexData.absoluteX = quantizedPosition.x
      vertexData.absoluteY = quantizedPosition.y
      vertex.set('data', vertexData)
      // 同时更新顶点的实际位置
      vertex.set({ left: quantizedPosition.x, top: quantizedPosition.y })
    }

    // 获取所有顶点的绝对坐标
    const absolutePoints = this.getAbsolutePointsFromVertices(polygon)

    // 使用绝对坐标更新多边形（O(n)操作，但避免了复杂的坐标转换）
    this.updatePolygonFromAbsolutePoints(polygon, absolutePoints)

    // 2. 触发带有详细信息的 modified 事件，确保在 setCoords() 之后触发
    polygon.fire('modified', {
      target: polygon,
      // 提供变化前后的对比信息
      originalPoints: originalPoints,
      newPoints: polygon.points ? polygon.points.map((p) => ({ x: p.x, y: p.y })) : [],
      originalBounds: {
        left: originalLeft,
        top: originalTop,
        width: originalWidth,
        height: originalHeight,
      },
      newBounds: {
        left: polygon.left,
        top: polygon.top,
        width: polygon.width,
        height: polygon.height,
      },
      // 变化详情
      changedVertexIndex: vertexIndex,
      changeType: 'vertex-drag',
    })

    // 更新其他顶点位置（现在只需要同步位置，不需要重新计算坐标）
    this.updateOtherPolygonVertices(polygon, vertexIndex)

    // 重新渲染画布
    this.canvas.renderAll()
  }

  /**
   * 从多边形的所有顶点获取绝对坐标数组
   */
  private getAbsolutePointsFromVertices(polygon: Polygon): { x: number; y: number }[] {
    const data = polygon.get('data') as any
    if (!data || !data.vertices) return []

    const vertices = data.vertices as Circle[]
    return vertices.map((vertex) => {
      const vertexData = vertex.get('data') as any
      return {
        x: vertexData.absoluteX || vertex.left!,
        y: vertexData.absoluteY || vertex.top!,
      }
    })
  }

  /**
   * 根据绝对坐标数组更新多边形的相对坐标points数组
   */
  private updatePolygonFromAbsolutePoints(
    polygon: Polygon,
    absolutePoints: { x: number; y: number }[],
  ): void {
    if (absolutePoints.length === 0) return

    // 计算所有点的边界框
    const minX = Math.min(...absolutePoints.map((p) => p.x))
    const maxX = Math.max(...absolutePoints.map((p) => p.x))
    const minY = Math.min(...absolutePoints.map((p) => p.y))
    const maxY = Math.max(...absolutePoints.map((p) => p.y))

    // 计算新的中心点
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // 转换为相对于中心的坐标
    const relativePoints = absolutePoints.map((point) => ({
      x: point.x - centerX,
      y: point.y - centerY,
    }))

    // 更新多边形
    polygon.set({
      left: centerX,
      top: centerY,
      points: relativePoints,
      width: maxX - minX,
      height: maxY - minY,
      objectCaching: false,
    })

    polygon.setCoords()
  }

  /**
   * 更新其他多边形顶点位置（除了正在拖动的顶点）
   */
  private updateOtherPolygonVertices(polygon: Polygon, excludeVertexIndex: number): void {
    const data = polygon.get('data') as any
    if (!data || !data.vertices) return

    const vertices = data.vertices as Circle[]
    const polygonLeft = polygon.left!
    const polygonTop = polygon.top!
    const points = polygon.points as { x: number; y: number }[]

    vertices.forEach((vertex, index) => {
      if (index === excludeVertexIndex) return

      const point = points[index]
      if (!point) return

      // 计算顶点的绝对坐标
      const absoluteX = polygonLeft + point.x
      const absoluteY = polygonTop + point.y

      vertex.set({ left: absoluteX, top: absoluteY })

      // 关键修复：更新顶点的交互区域坐标
      vertex.setCoords()
    })
  }

  /**
   * 根据多边形位置更新顶点位置
   */
  private updateVerticesFromPolygon(polygon: Polygon, vertices: Circle[]): void {
    const polygonLeft = polygon.left!
    const polygonTop = polygon.top!
    const points = polygon.points as { x: number; y: number }[]

    vertices.forEach((vertex, index) => {
      const point = points[index]
      if (!point) return

      // 计算顶点的新绝对坐标
      const newAbsoluteX = polygonLeft + point.x
      const newAbsoluteY = polygonTop + point.y

      // 更新顶点位置
      vertex.set({ left: newAbsoluteX, top: newAbsoluteY })

      // 同时更新顶点的绝对坐标存储
      const vertexData = vertex.get('data') as any
      if (vertexData) {
        vertexData.absoluteX = newAbsoluteX
        vertexData.absoluteY = newAbsoluteY
        vertex.set('data', vertexData)
      }

      // 更新顶点的交互区域坐标
      vertex.setCoords()
    })

    // 重新渲染画布
    this.canvas.renderAll()
  }

  /**
   * 添加默认事件监听器
   */
  private addDefaultEventListeners(polygon: Polygon): void {
    // 当多边形被选中时，将其顶点置顶
    polygon.on('selected', () => {
      const data = polygon.get('data') as any
      if (data && data.vertices) {
        const vertices = data.vertices as Circle[]
        vertices.forEach((vertex) => {
          this.canvas.bringObjectToFront(vertex)
        })
        this.canvas.renderAll()
      }
    })

    // 当多边形取消选中时的处理（可选）
    polygon.on('deselected', () => {
      // 这里可以添加取消选中时的逻辑
      // 例如恢复顶点的原始层级等
    })

    // mousedown 事件
    polygon.on('modified', (event) => {})
  }
}
