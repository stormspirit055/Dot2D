import { Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import type { Canvas } from 'fabric'

export interface PointOptions {
  position?: { x: number; y: number }
  radius?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  data?: ShapeData
  interactive?: boolean
  eventListeners?: Record<string, (event: any) => void>
}

/**
 * 点创建器类
 * 负责点的创建和管理
 */
export class PointCreator extends BaseShapeCreator {
  constructor(
    canvas: Canvas,
    options: ShapeCreatorOptions,
    onShapeAdded: (shape: any) => void
  ) {
    super(canvas, options, onShapeAdded)
  }

  /**
   * 创建点
   * @param options 点配置选项
   * @returns 创建的点对象（Circle）
   */
  public createPoint(options: PointOptions): Circle {
    const isInteractive = options.interactive !== false // 默认为 true
    
    // 应用坐标量化到位置
    const quantizedPosition = this.quantizePoint(options.position || { x: 100, y: 100 })
    const radius = options.radius || 5

    const point = new Circle({
      left: quantizedPosition.x,
      top: quantizedPosition.y,
      radius: radius,
      fill: options.fill || this.options.defaultFillColor,
      stroke: options.stroke || this.options.defaultStrokeColor,
      strokeWidth: options.strokeWidth || this.options.defaultStrokeWidth,
      // 控制交互性的属性
      selectable: isInteractive, // 是否可选中
      evented: isInteractive, // 是否响应事件
      moveCursor: isInteractive ? 'move' : 'default', // 移动时的光标
      hoverCursor: isInteractive ? 'move' : 'default', // 悬停时的光标
      // 锁定形变属性 - 只允许移动，不允许缩放、旋转、倾斜
      lockScalingX: true, // 禁止水平缩放
      lockScalingY: true, // 禁止垂直缩放
      lockRotation: true, // 禁止旋转
      lockSkewingX: isInteractive, // 禁止水平倾斜
      lockSkewingY: isInteractive, // 禁止垂直倾斜
      hasControls: !isInteractive, // 隐藏控制点（缩放、旋转控制点）
      hasBorders: false, // 保留边框（用于显示选中状态）
      originX: 'center',
      originY: 'center',
      excludeFromExport: false, // 点参与导出（与顶点不同）
      scaleX: 1, // 固定X轴缩放比例
      scaleY: 1, // 固定Y轴缩放比例
    })

    // 设置数据
    point.set('data', {
      ...options.data,
      type: 'point',
    })

    // 添加移动事件监听器（应用坐标量化）
    if (isInteractive) {
      this.addPointEventListeners(point)
    }

    // 添加默认事件监听器
    this.addDefaultEventListeners(point)

    // 添加自定义事件监听器
    if (options.eventListeners) {
      Object.entries(options.eventListeners).forEach(([eventName, handler]) => {
        point.on(eventName, handler)
      })
    }

    // 添加到画布
    this.addShapeToCanvas(point)

    return point
  }

  /**
   * 为点添加事件监听器
   */
  private addPointEventListeners(point: Circle): void {
    point.on('moving', () => {
      // 应用坐标量化到点的位置
      const quantizedPosition = this.quantizePoint({ x: point.left!, y: point.top! })
      point.set({ left: quantizedPosition.x, top: quantizedPosition.y })
    })
  }

  /**
   * 添加默认事件监听器
   */
  private addDefaultEventListeners(point: Circle): void {
    // mousedown 事件
    point.on('mousedown', (event) => {
      console.log('Point mousedown event:', {
        type: 'mousedown',
        target: point,
        pointer: event.pointer,
        e: event.e,
      })
    })

    // mouseover 事件
    point.on('mouseover', (event) => {
      console.log('Point mouseover event:', {
        type: 'mouseover',
        target: point,
        pointer: event.pointer,
      })
    })

    // selected 事件
    point.on('selected', (event) => {
      console.log('Point selected event:', {
        type: 'selected',
        target: point,
      })
    })
  }
}