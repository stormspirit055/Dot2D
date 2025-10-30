import { Circle, Canvas } from 'fabric'

/**
 * 顶点类型枚举
 */
export enum VertexType {
  RECTANGLE_TOP_LEFT = 'topLeft',
  RECTANGLE_TOP_RIGHT = 'topRight',
  RECTANGLE_BOTTOM_RIGHT = 'bottomRight',
  RECTANGLE_BOTTOM_LEFT = 'bottomLeft',
  POLYGON_VERTEX = 'polygonVertex',
  POINT = 'point',
}

/**
 * 顶点配置接口
 */
export interface VertexConfig {
  x: number
  y: number
  radius?: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  isInteractive?: boolean
  vertexType?: VertexType
  vertexIndex?: number
  data?: any
}

/**
 * 顶点事件回调接口
 */
export interface VertexEventCallbacks {
  onMoving?: (vertex: Circle) => void
  onMouseOver?: (vertex: Circle) => void
  onMouseOut?: (vertex: Circle) => void
}

/**
 * 图形顶点类
 * 抽象了顶点的创建、样式设置、事件监听等功能
 */
export class ShapeVertex {
  private canvas: Canvas
  private vertex: Circle
  private config: VertexConfig
  private callbacks: VertexEventCallbacks
  private originalRadius: number
  private originalColor: string

  constructor(canvas: Canvas, config: VertexConfig, callbacks: VertexEventCallbacks = {}) {
    this.canvas = canvas
    this.config = {
      radius: 7,
      color: 'red',
      strokeColor: 'darkred',
      strokeWidth: 2,
      isInteractive: true,
      ...config,
    }
    this.callbacks = callbacks
    this.originalRadius = this.config.radius!
    this.originalColor = this.config.color!

    this.vertex = this.createVertex()
    this.setupEventListeners()
  }

  /**
   * 创建顶点对象
   */
  private createVertex(): Circle {
    const vertex = new Circle({
      left: this.config.x,
      top: this.config.y,
      radius: this.config.radius,
      fill: this.config.color,
      stroke: this.config.strokeColor,
      strokeWidth: this.config.strokeWidth,
      selectable: this.config.isInteractive,
      evented: this.config.isInteractive,
      moveCursor: this.config.isInteractive ? 'move' : 'default',
      hoverCursor: this.config.isInteractive ? 'move' : 'default',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      // 顶点特有属性
      excludeFromExport: true, // 顶点不参与导出
      lockScalingX: true, // 锁定X轴缩放
      lockScalingY: true, // 锁定Y轴缩放
      lockRotation: true, // 锁定旋转
      scaleX: 1, // 固定X轴缩放比例
      scaleY: 1, // 固定Y轴缩放比例
      isVertex: true, // 标识这是一个顶点，用于缩放补偿
      // 优化交互区域
      perPixelTargetFind: false,
      targetFindTolerance: 5,
    })

    // 设置顶点数据
    const vertexData = {
      vertexType: this.config.vertexType,
      vertexIndex: this.config.vertexIndex,
      ...this.config.data,
    }
    vertex.set('data', vertexData)

    // 确保顶点的交互区域正确设置
    vertex.setCoords()

    return vertex
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.config.isInteractive) return

    // 移动事件
    if (this.callbacks.onMoving) {
      this.vertex.on('moving', () => {
        this.callbacks.onMoving!(this.vertex)
      })
    }

    // 鼠标悬停效果
    this.vertex.on('mouseover', () => {
      this.applyHoverEffect()
      if (this.callbacks.onMouseOver) {
        this.callbacks.onMouseOver(this.vertex)
      }
    })

    this.vertex.on('mouseout', () => {
      this.removeHoverEffect()
      if (this.callbacks.onMouseOut) {
        this.callbacks.onMouseOut(this.vertex)
      }
    })
  }

  /**
   * 应用悬停效果
   */
  private applyHoverEffect(): void {
    this.vertex.set({
      fill: 'orange',
      stroke: 'darkorange',
      strokeWidth: this.config.strokeWidth! + 1,
      radius: this.originalRadius + 1,
    })
    this.canvas.renderAll()
  }

  /**
   * 移除悬停效果
   */
  private removeHoverEffect(): void {
    this.vertex.set({
      fill: this.originalColor,
      stroke: this.config.strokeColor,
      strokeWidth: this.config.strokeWidth,
      radius: this.originalRadius,
    })
    this.canvas.renderAll()
  }

  /**
   * 更新顶点位置
   */
  public updatePosition(x: number, y: number): void {
    this.vertex.set({ left: x, top: y })
    this.vertex.setCoords()
  }

  /**
   * 更新顶点数据
   */
  public updateData(data: any): void {
    const currentData = this.vertex.get('data') || {}
    this.vertex.set('data', { ...currentData, ...data })
  }

  /**
   * 获取顶点对象
   */
  public getVertex(): Circle {
    return this.vertex
  }

  /**
   * 获取顶点位置
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.vertex.left!, y: this.vertex.top! }
  }

  /**
   * 获取顶点数据
   */
  public getData(): any {
    return this.vertex.get('data')
  }

  /**
   * 销毁顶点
   */
  public destroy(): void {
    if (this.vertex) {
      this.vertex.off() // 移除所有事件监听器
    }
  }

  /**
   * 静态方法：创建矩形顶点
   */
  static createRectangleVertices(
    canvas: Canvas,
    left: number,
    top: number,
    width: number,
    height: number,
    isInteractive: boolean,
    callbacks: VertexEventCallbacks = {},
  ): ShapeVertex[] {
    const positions = [
      { x: left, y: top, type: VertexType.RECTANGLE_TOP_LEFT },
      { x: left + width, y: top, type: VertexType.RECTANGLE_TOP_RIGHT },
      { x: left + width, y: top + height, type: VertexType.RECTANGLE_BOTTOM_RIGHT },
      { x: left, y: top + height, type: VertexType.RECTANGLE_BOTTOM_LEFT },
    ]

    return positions.map(
      (pos, index) =>
        new ShapeVertex(
          canvas,
          {
            x: pos.x,
            y: pos.y,
            isInteractive,
            vertexType: pos.type,
            vertexIndex: index,
          },
          callbacks,
        ),
    )
  }

  /**
   * 静态方法：创建多边形顶点
   */
  static createPolygonVertices(
    canvas: Canvas,
    points: { x: number; y: number }[],
    center: { x: number; y: number },
    isInteractive: boolean,
    callbacks: VertexEventCallbacks = {},
  ): ShapeVertex[] {
    return points.map((point, index) => {
      const absoluteX = center.x + point.x
      const absoluteY = center.y + point.y

      return new ShapeVertex(
        canvas,
        {
          x: absoluteX,
          y: absoluteY,
          isInteractive,
          vertexType: VertexType.POLYGON_VERTEX,
          vertexIndex: index,
          data: {
            absoluteX,
            absoluteY,
          },
        },
        callbacks,
      )
    })
  }
}