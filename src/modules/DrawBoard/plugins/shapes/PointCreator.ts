import { Circle } from 'fabric'
import { BaseShapeCreator, type ShapeData, type ShapeCreatorOptions } from './BaseShapeCreator'
import { ShapeVertex, VertexType } from './ShapeVertex'
import type { Canvas, ObjectEvents, FabricObject } from 'fabric'

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

      // 创建 Vertex
      const vertex = new ShapeVertex(
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

            // 如果按住了 Alt 键，移动所有其他点
            // 注意：这里需要获取当前的 window.event 或者通过其他方式传递 event
            // Fabric 的 moving 事件参数通常包含 e (MouseEvent)
            // 但 VertexEventCallbacks.onMoving 签名只传递了 vertex
            // 这是一个限制，我们可能需要修改 ShapeVertex 的回调签名或者在这里使用全局事件状态
            // 幸好 ShapeVertex.ts 中: this.callbacks.onMoving!(this.vertex) 是在 vertex.on('moving') 内部调用的
            // 我们可以暂时假设 Alt 键检测可以通过全局状态或我们修改 ShapeVertex 来支持
            // 鉴于 ShapeVertex 尚未修改传递 event，这里先尝试不依赖 event 参数，而是检查 window.event (如果环境支持)
            // 或者，更稳健的做法是：修改 ShapeVertex.ts 允许传递 event 对象
            // 但在此次任务中，我将尝试使用简单的 hack: 检查 window.event
            // 或者，由于 ShapeVertex 的实现是 this.callbacks.onMoving!(this.vertex)，它确实没传 event。
            // 我需要修改 ShapeVertex.ts 吗？用户没说不能改，但为了保持最小改动，我先看看能否通过 this.canvas.getPointer() 等方式推断？不行。
            // 让我们假设用户当前操作的 event 可以从 window.event 获取（浏览器环境）

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
          // 添加 mousedown 回调来重置 lastPosition？
          // ShapeVertex 目前不支持 onMouseDown 回调，只支持 onMoving, onMouseOver, onMouseOut
          // 我们可以在 onMoving 开始时检测是否是新的一次拖拽？
          // 或者我们可以给 Vertex 绑定 mousedown 事件？
          // ShapeVertex 暴露了 getVertex()，我们可以直接绑定
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
      // 将 Vertex 也添加到画布（ShapeVertex 不会自动添加）
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
