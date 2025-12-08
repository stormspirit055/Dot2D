import { Circle, Canvas, FabricObject } from 'fabric'
import { enableScalingCompensation, DrawBoardEventEmitter } from '../../utils/scaling'

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
 * 顶点数据接口 - 统一的顶点数据结构
 */
export interface VertexData {
  /** 关联的形状对象（统一字段，替代原来的 polygon、rectangle 等） */
  shape: FabricObject
  /** 顶点类型 */
  vertexType: VertexType
  /** 顶点在形状中的索引（对于多边形顶点） */
  vertexIndex?: number
  /** 顶点内部事件清理函数 */
  disposers?: {
    moving?: VoidFunction
    mouseover?: VoidFunction
    mouseout?: VoidFunction
  }
  /** 其他自定义数据 */
  [key: string]: unknown
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
  data?: Partial<VertexData>
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
export class Vertex {
  private canvas: Canvas
  private vertex: Circle
  private config: VertexConfig
  private callbacks: VertexEventCallbacks
  private originalColor: string
  private drawBoard: DrawBoardEventEmitter | null
  private scalingDisposer: VoidFunction | null = null

  constructor(
    canvas: Canvas,
    config: VertexConfig,
    callbacks: VertexEventCallbacks = {},
    drawBoard?: DrawBoardEventEmitter,
  ) {
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
    this.originalColor = this.config.color!
    this.drawBoard = drawBoard || null

    this.vertex = this.createVertex()
    this.setupEventListeners()

    // 启用缩放补偿
    if (this.drawBoard) {
      console.log('启用缩放补偿')
      this.scalingDisposer = enableScalingCompensation(this.vertex, this.drawBoard, this.canvas)
    }
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
      strokeUniform: true,
      selectable: this.config.isInteractive,
      evented: this.config.isInteractive,
      moveCursor: this.config.isInteractive ? 'move' : 'default',
      hoverCursor: this.config.isInteractive ? 'move' : 'default',
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      visible: false, // 默认隐藏顶点
      // 顶点特有属性
      excludeFromExport: true, // 顶点不参与导出
      isVertex: true, // 标识这是一个顶点，用于缩放补偿
      // 优化交互区域
      perPixelTargetFind: false,
      targetFindTolerance: 5,
      objectCaching: false,
    })

    // 设置顶点数据
    const vertexData: Partial<VertexData> = {
      vertexType: this.config.vertexType || VertexType.POINT,
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

    // 获取或初始化 disposers
    const vertexData = (this.vertex.get('data') as VertexData) || {}
    const disposers = vertexData.disposers || {}

    // 移动事件
    if (this.callbacks.onMoving) {
      const movingDisposer = this.vertex.on('moving', () => {
        this.callbacks.onMoving!(this.vertex)
      })
      disposers.moving = movingDisposer
    }

    // 鼠标悬停效果
    const mouseOverDisposer = this.vertex.on('mouseover', () => {
      this.applyHoverEffect()
      if (this.callbacks.onMouseOver) {
        this.callbacks.onMouseOver(this.vertex)
      }
    })
    disposers.mouseover = mouseOverDisposer

    const mouseOutDisposer = this.vertex.on('mouseout', () => {
      this.removeHoverEffect()
      if (this.callbacks.onMouseOut) {
        this.callbacks.onMouseOut(this.vertex)
      }
    })
    disposers.mouseout = mouseOutDisposer

    // 保存 disposers
    this.vertex.set('data', {
      ...vertexData,
      disposers,
    })
  }

  /**
   * 应用悬停效果
   */
  private applyHoverEffect(): void {
    this.vertex.set({
      fill: 'orange',
      stroke: 'darkorange',
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
    })
    this.canvas.renderAll()
  }

  /**
   * 获取顶点对象
   */
  public getVertex(): Circle {
    return this.vertex
  }

  /**
   * 销毁顶点
   */
  public destroy(): void {
    if (this.vertex) {
      // 使用保存的 disposers 清理事件
      const vertexData = this.vertex.get('data') as VertexData
      if (vertexData && vertexData.disposers) {
        Object.values(vertexData.disposers).forEach((dispose) => {
          if (typeof dispose === 'function') dispose()
        })
        // 清空引用
        vertexData.disposers = {}
      }
    }

    // 清理缩放补偿监听器
    if (this.scalingDisposer) {
      this.scalingDisposer()
      this.scalingDisposer = null
    }
  }
}
