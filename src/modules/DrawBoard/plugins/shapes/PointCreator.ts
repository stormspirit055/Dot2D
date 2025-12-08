import { Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import { Vertex, VertexType } from './Vertex'
import { enableScalingCompensation } from '../../utils/scaling'
import type { Canvas, ObjectEvents } from 'fabric'

/**
 * 纯位置信息接口
 * 只包含 x, y 坐标
 */
export interface PointPosition {
  x: number
  y: number
}

/**
 * 点选项接口
 * 统一的接口设计，与 PolygonCreator 保持一致
 */
export interface PointOptions {
  points: PointPosition[] // 点坐标数组
  fill?: string
  stroke?: string
  strokeWidth?: number
  data: ShapeData
  interactive?: boolean
  eventListeners?: Record<keyof ObjectEvents, (event: unknown) => void>
}

/**
 * 点创建器类
 * 负责点的创建和管理
 */
export class PointCreator extends BaseShapeCreator {
  constructor(canvas: Canvas, options: ShapeCreatorOptions) {
    super(canvas, options)
  }

  /**
   * 创建点（支持批量创建）
   * @param options 点配置选项
   * @returns 创建的点对象数组
   */
  public createPoint(options: PointOptions): Circle[] {
    const isInteractive = options.interactive !== false // 默认为 true
    const points: Circle[] = []

    for (const pointPosition of options.points) {
      // 应用坐标量化到位置
      const quantizedPosition = this.quantizePoint(pointPosition)
      const radius = 5 // 固定半径

      const point = new Circle({
        left: quantizedPosition.x,
        top: quantizedPosition.y,
        radius: radius,
        fill: options.fill || this.options.defaultFillColor,
        stroke: options.stroke || this.options.defaultStrokeColor,
        strokeWidth: options.strokeWidth || this.options.defaultStrokeWidth,
        strokeUniform: true,
        originX: 'center',
        originY: 'center',
        excludeFromExport: false,
        scaleX: 1,
        scaleY: 1,
        ...this.commonObjectOptions(isInteractive, {
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          lockSkewingX: true,
          lockSkewingY: true,
          // 锁定自身的移动，交由 Vertex 控制
          lockMovementX: true,
          lockMovementY: true,
          hasControls: false,
          hasBorders: false,
        }),
      })

      // 记录上一次的位置，用于计算位移增量
      let lastPosition = { x: quantizedPosition.x, y: quantizedPosition.y }

      // 启用缩放补偿（全量补偿，类似 Vertex）
      if (this.options.drawBoard) {
        const pointDisposer = enableScalingCompensation(
          point,
          this.options.drawBoard,
          this.canvas,
          {
            strokeOnly: false,
          },
        )
        // 存入 data.vertexDisposers
        const updatedData = point.get('data') as ShapeData
        console.log(updatedData)
        point.set('data', {
          vertexDisposers: {
            scaling: pointDisposer,
          },
        })
      }

      // 创建 Vertex
      const vertex = new Vertex(
        this.canvas,
        {
          x: quantizedPosition.x,
          y: quantizedPosition.y,
          vertexType: VertexType.POINT,
          data: { shape: point },
        },
        {
          onMoving: (v) => {
            // 应用坐标量化到点的位置
            const quantizedPosition = this.quantizePoint({ x: v.left!, y: v.top! })
            v.set({ left: quantizedPosition.x, top: quantizedPosition.y })
            v.setCoords()

            // 更新 Point Shape 位置
            point.set({ left: quantizedPosition.x, top: quantizedPosition.y })
            point.setCoords()

            // 计算位移增量
            const dx = quantizedPosition.x - lastPosition.x
            const dy = quantizedPosition.y - lastPosition.y
            const e = window.event as MouseEvent | undefined
            if (e && e.altKey) {
              const allObjects = this.canvas.getObjects()
              allObjects.forEach((obj) => {
                // 跳过当前正在移动的点
                if (obj === point) return

                const data = obj.get('data') as ShapeData & { type?: string; vertices?: Circle[] }
                // 检查是否是点类型
                if (data && data.type === 'point') {
                  const newLeft = (obj.left || 0) + dx
                  const newTop = (obj.top || 0) + dy

                  // 移动 Shape
                  obj.set({
                    left: newLeft,
                    top: newTop,
                  })
                  obj.setCoords()

                  // 同时也移动该 Shape 对应的 Vertex
                  if (data.vertices && data.vertices[0]) {
                    const v = data.vertices[0]
                    v.set({
                      left: newLeft,
                      top: newTop,
                    })
                    v.setCoords()
                  }
                }
              })
              this.canvas.requestRenderAll()
            }
            // 更新上一次的位置
            lastPosition = { x: quantizedPosition.x, y: quantizedPosition.y }
          },
        },
        this.options.drawBoard,
      )

      const vertexObj = vertex.getVertex()

      // 为 Vertex 绑定 mousedown 以重置 lastPosition
      vertexObj.on('mousedown', () => {
        lastPosition = { x: point.left || 0, y: point.top || 0 }
      })

      // 设置数据
      point.set('data', {
        ...options.data,
        type: 'point',
        vertices: [vertexObj], // 关联 Vertex
      })

      // 添加默认事件监听器
      this.addDefaultEventListeners(point)

      // 添加自定义事件监听器
      if (options.eventListeners) {
        Object.entries(options.eventListeners).forEach(([eventName, handler]) => {
          ;(point as Circle).on(eventName as keyof ObjectEvents, handler)
        })
      }

      // 添加到画布
      this.addShapeToCanvas(point)
      // 将 Vertex 也添加到画布（Vertex 不会自动添加）
      this.canvas.add(vertexObj)

      points.push(point)
    }

    return points
  }

  /**
   * 添加默认事件监听器
   */
  protected addDefaultEventListeners(point: Circle): void {
    // mousedown 事件
    super.addDefaultEventListeners(point)
    // selected 事件
    point.on('selected', () => {
      console.log('Point selected event:', {
        type: 'selected',
        target: point,
      })
    })
  }
}
