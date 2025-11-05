import { Canvas, Circle, type FabricObject } from 'fabric'

// 添加 DrawBoard 类型导入
type DrawBoardEventEmitter = {
  on(event: 'zoom', listener: (zoomLevel: number) => void): void
  un(event: 'zoom', listener: (zoomLevel: number) => void): void
}

export type ShapeData = Partial<{
  id: string
  DrawType: string
  zIndex: number
  originalZIndex: number
}>

export interface ShapeCreatorOptions {
  coordinateGrid: number
  defaultFillColor: string
  defaultStrokeColor: string
  defaultStrokeWidth: number
  onShapeAdded?: (shape: FabricObject) => void
  onShapeModified?: (shape: FabricObject) => void
  onShapeRemoved?: (shape: FabricObject) => void
  drawBoard?: DrawBoardEventEmitter // 添加 DrawBoard 实例
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
  protected drawBoard?: DrawBoardEventEmitter

  constructor(canvas: Canvas, options: ShapeCreatorOptions) {
    this.canvas = canvas
    this.options = options
    this.onShapeAdded = options.onShapeAdded
    this.onShapeModified = options.onShapeModified
    this.onShapeRemoved = options.onShapeRemoved
    this.drawBoard = options.drawBoard
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

    // 移除所有事件监听器
    shape.off()

    // 从画布移除图形
    this.canvas.remove(shape)

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
    // 移除之前可能存在的事件监听器，避免重复绑定
    vertex.off('mouseover')
    vertex.off('mouseout')

    // 当鼠标移入顶点时
    vertex.on('mouseover', () => {
      shape.set('isVertexHovered', true)
    })

    // 当鼠标移出顶点时
    vertex.on('mouseout', () => {
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
          vertex.off('mouseover')
          vertex.off('mouseout')
        }
      })
      // 清理 shape 的 hover 状态
      shape.set('isVertexHovered', false)
      this.canvas.renderAll()
    }
  }

  /**
   * 将形状置顶并保存原始 zIndex
   * @param shape 形状对象
   */
  protected bringShapeToFront(shape: FabricObject): void {
    const data = shape.get('data') as ShapeData
    if (data && typeof data.zIndex === 'number') {
      // 保存原始 zIndex
      const newData: ShapeData = {
        ...data,
        originalZIndex: data.zIndex,
      }
      shape.set('data', newData)

      // 将形状置顶
      this.canvas.bringObjectToFront(shape)

      // 同时将相关顶点也置顶
      this.bringVerticestoFront(shape)
    }
  }

  /**
   * 恢复形状到原始 zIndex 位置
   * @param shape 形状对象
   */
  protected restoreShapeZIndex(shape: FabricObject): void {
    const data = shape.get('data') as ShapeData
    if (data && typeof data.originalZIndex === 'number') {
      // 获取画布上所有对象
      const objects = this.canvas.getObjects()

      // 收集所有主要形状（非顶点）及其 zIndex
      const shapes: Array<{ shape: FabricObject; zIndex: number }> = []

      objects.forEach((obj) => {
        const isVertex = obj.get('isVertex') === true
        if (!isVertex) {
          const objData = obj.get('data') as ShapeData
          if (objData && typeof objData.zIndex === 'number') {
            const zIndex = obj === shape ? data.originalZIndex : objData.zIndex
            if (typeof zIndex === 'number') {
              shapes.push({
                shape: obj,
                zIndex: zIndex,
              })
            }
          }
        }
      })

      // 按 zIndex 排序
      shapes.sort((a, b) => a.zIndex - b.zIndex)

      // 重新排列所有形状
      shapes.forEach(({ shape: shapeObj }) => {
        this.canvas.bringObjectToFront(shapeObj)
      })

      // 清除 originalZIndex
      const newData: ShapeData = {
        ...data,
        originalZIndex: undefined,
      }
      shape.set('data', newData)

      this.canvas.renderAll()
    }
  }

  /**
   * 将形状的顶点置顶
   * @param shape 形状对象
   */
  protected bringVerticestoFront(shape: FabricObject): void {
    const data = shape.get('data') as { vertices?: Circle[] }
    if (data && data.vertices) {
      data.vertices.forEach((vertex) => {
        if (vertex) {
          this.canvas.bringObjectToFront(vertex)
        }
      })
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
