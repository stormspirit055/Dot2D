/* eslint-disable @typescript-eslint/no-explicit-any */
import { Canvas, Circle, type FabricObject } from 'fabric'
import DrawBoard from '../../index'
import { enableScalingCompensation } from '../../utils/scaling'
export type ShapeData = Partial<{
  id: string
  DrawType: string
  zIndex: number
  originalZIndex: number
  vertexDisposers?: Record<string, VoidFunction>
}>

export interface ShapeCreatorOptions {
  coordinateGrid: number
  defaultFillColor: string
  defaultStrokeColor: string
  defaultStrokeWidth: number
  onShapeAdded?: (shape: FabricObject) => void
  onShapeModified?: (shape: FabricObject) => void
  onShapeRemoved?: (shape: FabricObject) => void
  drawBoard: DrawBoard
}

/**
 * 基础图形创建器抽象类
 * 提供通用的坐标量化功能和事件处理方法
 */
export abstract class BaseShapeCreator {
  // 全局 zIndex 计数器，用于跟踪层级顺序
  private static currentZIndex = 0

  protected canvas: Canvas
  protected options: ShapeCreatorOptions
  protected onShapeAdded?: (shape: FabricObject) => void
  protected onShapeModified?: (shape: FabricObject) => void
  protected onShapeRemoved?: (shape: FabricObject) => void
  protected drawBoard?: DrawBoard

  constructor(canvas: Canvas, options: ShapeCreatorOptions) {
    this.canvas = canvas
    this.options = options
    this.onShapeAdded = options.onShapeAdded
    this.onShapeModified = options.onShapeModified
    this.onShapeRemoved = options.onShapeRemoved
    this.drawBoard = options.drawBoard
  }

  protected commonObjectOptions(
    isInteractive: boolean,
    overrides: Record<string, any> = {},
  ): Record<string, any> {
    return {
      selectable: isInteractive,
      evented: isInteractive,
      moveCursor: isInteractive ? 'move' : 'default',
      hoverCursor: isInteractive ? 'move' : 'default',
      lockScalingX: isInteractive,
      lockScalingY: isInteractive,
      lockRotation: isInteractive,
      lockSkewingX: isInteractive,
      lockSkewingY: isInteractive,
      hasControls: !isInteractive,
      hasBorders: isInteractive,
      objectCaching: false,
      ...overrides,
    }
  }

  /**
   * 将坐标量化到指定的网格粒度
   * @param coordinate 原始坐标值
   * @returns 量化后的坐标值
   */
  protected quantizeCoordinate(coordinate: number): number {
    const grid = this.options.coordinateGrid
    if (grid <= 0) return coordinate
    return Math.round(coordinate / grid) * grid
  }

  /**
   * 将坐标点量化到指定的网格粒度
   * @param point 原始坐标点 {x, y}
   * @returns 量化后的坐标点
   */
  protected quantizePoint(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: this.quantizeCoordinate(point.x),
      y: this.quantizeCoordinate(point.y),
    }
  }

  /**
   * 添加图形到画布并触发事件
   * @param shape 要添加的图形对象
   */
  protected addShapeToCanvas(shape: FabricObject): void {
    if (!this.canvas) {
      console.warn('BaseShapeCreator: Canvas not available')
      return
    }
    // 设置形状为可选择，这样才能触发交互事件
    shape.selectable = true

    // 为主要形状分配 zIndex（排除顶点）
    const isVertex = shape.get('isVertex') === true
    if (!isVertex) {
      BaseShapeCreator.currentZIndex++
      const currentData = (shape.get('data') as ShapeData) || {}
      const newData: ShapeData = {
        ...currentData,
        zIndex: BaseShapeCreator.currentZIndex,
      }
      shape.set('data', newData)

      // 启用缩放补偿（针对 strokeWidth）
      if (this.drawBoard) {
        // 使用新模式：strokeOnly
        // 由于没有方便的地方存储 disposer，且对象销毁时 Fabric 会自动清理引用（但监听器需要手动清理）
        // 我们可以将 disposer 存入 data 字段，类似 vertexDisposers
        const strokeDisposer = enableScalingCompensation(shape, this.drawBoard, this.canvas, {
          strokeOnly: true,
        })

        // 存入 data.vertexDisposers (借用这个字段，或者新建一个字段)
        // 既然已经有 vertexDisposers 结构，我们可以扩展它或者新建 shapeDisposers
        // 简单起见，我们扩展 ShapeData 类型增加 scalingDisposer
        const updatedData = shape.get('data') as ShapeData
        shape.set('data', {
          ...updatedData,
          vertexDisposers: {
            ...(updatedData.vertexDisposers || {}),
            scaling: strokeDisposer,
          },
        })
      }
    }

    this.canvas.add(shape)
    // 添加 modified 事件监听
    shape.on('modified', () => {
      this.onShapeModified?.(shape)
    })

    // 触发形状添加事件
    this.onShapeAdded?.(shape)
  }
  /**
   * 从画布移除图形并触发事件
   * @param shape 要移除的图形对象
   */
  public removeShapeFromCanvas(shape: FabricObject): void {
    if (!this.canvas) {
      console.warn('BaseShapeCreator: Canvas not available')
      return
    }

    // 从画布移除图形
    this.canvas.remove(shape)

    // 清理 scaling 监听器
    const data = shape.get('data') as ShapeData
    if (data && data.vertexDisposers && data.vertexDisposers.scaling) {
      data.vertexDisposers.scaling()
      delete data.vertexDisposers.scaling
    }

    // 调用 dispose 清理对象资源和所有事件监听器
    // 注意：dispose 是异步的，如果需要等待清理完成，可以 await，
    // 但通常在移除场景下，同步调用即可，Fabric 会处理后续清理。
    // 为了类型安全，确保 shape 确实有 dispose 方法（FabricObject 实例都有）
    shape.dispose()

    // 触发形状移除事件
    this.onShapeRemoved?.(shape)
  }

  /**
   * 更新坐标网格粒度
   * @param grid 新的网格粒度值
   */
  public updateCoordinateGrid(grid: number): void {
    if (grid <= 0) {
      console.warn('BaseShapeCreator: coordinateGrid must be greater than 0')
      return
    }
    this.options.coordinateGrid = grid
  }

  /**
   * 获取当前的坐标网格粒度
   * @returns 当前的网格粒度值
   */
  public getCoordinateGrid(): number {
    return this.options.coordinateGrid
  }

  /**
   * 为形状添加默认事件监听器
   * @param shape 形状对象
   */
  protected addDefaultEventListeners(shape: FabricObject): void {
    // 当形状被选中时，显示顶点
    shape.on('selected', () => {
      this.showVertices(shape)
    })

    // 当形状失去选中状态时，隐藏顶点
    shape.on('deselected', () => {
      // 延迟检查，避免与 hover 事件冲突
      setTimeout(() => {
        if (!shape.get('isHovered') && !shape.get('isVertexHovered')) {
          this.hideVertices(shape)
        }
      }, 10)
    })

    // 当鼠标悬停在形状上时，显示顶点
    shape.on('mouseover', () => {
      console.log('mouseover')
      shape.set('isHovered', true)
      this.showVertices(shape)
    })

    // 当鼠标离开形状时，使用延时检查是否真正离开整个"组"
    shape.on('mouseout', () => {
      shape.set('isHovered', false)
      // 延迟检查，给鼠标移动到顶点的时间
      setTimeout(() => {
        // 只有当鼠标既不在 shape 上，也不在任何顶点上，且 shape 未被选中时，才隐藏顶点
        if (
          !shape.get('isHovered') &&
          !shape.get('isVertexHovered') &&
          (!this.canvas.getActiveObject() || this.canvas.getActiveObject() !== shape)
        ) {
          this.hideVertices(shape)
        }
      }, 50) // 增加延时，给鼠标移动到顶点更多时间
    })

    // 添加通用的形状变形事件处理
    this.addShapeTransformEventListeners(shape)
  }

  /**
   * 显示形状的顶点
   * @param shape 形状对象
   */
  protected showVertices(shape: FabricObject): void {
    const data = shape.get('data') as { vertices?: Circle[] }
    if (data && data.vertices) {
      data.vertices.forEach((vertex) => {
        if (vertex) {
          vertex.set('visible', true)
          // 将顶点置顶
          this.canvas.bringObjectToFront(vertex)
          // 为顶点添加 hover 事件监听器
          this.addVertexHoverListeners(vertex, shape)
        }
      })
      this.canvas.renderAll()
    }
  }

  /**
   * 为顶点添加 hover 事件监听器
   * @param vertex 顶点对象
   * @param shape 对应的形状对象
   */
  protected addVertexHoverListeners(vertex: Circle, shape: FabricObject): void {
    // 获取或初始化 disposers 存储
    const vertexData = (vertex.get('data') as ShapeData) || {}
    const disposers = vertexData.vertexDisposers || {}

    // 清理旧的监听器
    if (disposers.mouseover) disposers.mouseover()
    if (disposers.mouseout) disposers.mouseout()

    // 当鼠标移入顶点时
    const mouseOverDisposer = vertex.on('mouseover', () => {
      shape.set('isVertexHovered', true)
    })

    // 当鼠标移出顶点时
    const mouseOutDisposer = vertex.on('mouseout', () => {
      shape.set('isVertexHovered', false)
      // 延迟检查，确保鼠标真正离开了整个"组"
      setTimeout(() => {
        if (
          !shape.get('isHovered') &&
          !shape.get('isVertexHovered') &&
          (!this.canvas.getActiveObject() || this.canvas.getActiveObject() !== shape)
        ) {
          this.hideVertices(shape)
        }
      }, 50)
    })

    // 保存新的 disposers
    vertex.set('data', {
      ...vertexData,
      vertexDisposers: {
        ...disposers,
        mouseover: mouseOverDisposer,
        mouseout: mouseOutDisposer,
      },
    })
  }

  /**
   * 隐藏形状的顶点
   * @param shape 形状对象
   */
  protected hideVertices(shape: FabricObject): void {
    const data = shape.get('data') as { vertices?: Circle[] }
    if (data && data.vertices) {
      data.vertices.forEach((vertex) => {
        if (vertex) {
          vertex.set('visible', false)

          // 清理顶点的事件监听器
          const vertexData = (vertex.get('data') as ShapeData) || {}
          const disposers = vertexData.vertexDisposers

          if (disposers) {
            if (disposers.mouseover) disposers.mouseover()
            if (disposers.mouseout) disposers.mouseout()

            // 清空 disposers
            vertex.set('data', {
              ...vertexData,
              vertexDisposers: {},
            })
          }
        }
      })
      // 清理 shape 的 hover 状态
      shape.set('isVertexHovered', false)
      this.canvas.renderAll()
    }
  }

  /**
   * 为形状添加通用的变形事件监听器
   * @param shape 形状对象
   */
  protected addShapeTransformEventListeners(shape: FabricObject): void {
    // 监听形状的变形事件
    shape.on('modified', () => {
      // 更新形状的交互区域坐标
      shape.setCoords()

      // 如果形状有顶点，也更新顶点的坐标
      const data = shape.get('data') as { vertices?: Circle[] }
      if (data && data.vertices) {
        data.vertices.forEach((vertex) => {
          if (vertex) {
            vertex.setCoords()
          }
        })
      }
    })
  }
}
