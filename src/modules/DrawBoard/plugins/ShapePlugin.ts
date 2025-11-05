// 形状管理插件
import BasePlugin from '../../BasePlugin'
import type { BasePluginEvents } from '../../BasePlugin'
import DrawBorad from '../index'
import { Canvas, type FabricObject, Rect, Polygon, Circle } from 'fabric'

// 导入创建器类
import { RectangleCreator } from './shapes/RectangleCreator'
import { PolygonCreator } from './shapes/PolygonCreator'
import { PointCreator } from './shapes/PointCreator'
import type { ShapeCreatorOptions } from './shapes/BaseShapeCreator'

// 重新导出选项类型
export type { RectangleOptions } from './shapes/RectangleCreator'
export type { PolygonOptions } from './shapes/PolygonCreator'
export type { PointOptions, PointPosition } from './shapes/PointCreator'

export type ShapePluginEvents = BasePluginEvents & {
  shapeAdded: [shape: FabricObject]
  shapeRemoved: [shape: FabricObject]
  shapeSelected: [shape: FabricObject]
}

export type ShapePluginOptions = {
  /**
   * 坐标网格粒度，用于量化坐标到指定精度
   * 默认值为 1，表示坐标限制为整数
   * 设置为 0.5 表示坐标限制为 0.5 的倍数（如 1.0, 1.5, 2.0）
   * 设置为 10 表示坐标限制为 10 的倍数（如 10, 20, 30）
   */
  coordinateGrid?: number
}

export type ShapeData = Partial<{
  id: string
  DrawType: string
}>

const defaultOptions = {
  defaultFillColor: 'rgba(255, 0, 0, 0.5)',
  defaultStrokeColor: 'red',
  defaultStrokeWidth: 2,
  coordinateGrid: 1, // 默认为整数坐标
}

export default class ShapePlugin extends BasePlugin<
  ShapePluginEvents,
  ShapePluginOptions,
  DrawBorad
> {
  protected options: ShapePluginOptions & typeof defaultOptions
  canvas?: Canvas
  private shapes: FabricObject[] = []

  // 创建器实例
  private rectangleCreator?: RectangleCreator
  private polygonCreator?: PolygonCreator
  private pointCreator?: PointCreator

  constructor(options?: ShapePluginOptions) {
    super(options || {})
    this.options = { ...defaultOptions, ...options }
  }

  public static create(options?: ShapePluginOptions) {
    return new ShapePlugin(options)
  }

  protected onInit(): void {
    this.canvas = this.host?.getCanvas()
    if (!this.canvas) {
      console.warn('ShapePlugin: Canvas not available')
      return
    }

    // 初始化创建器
    this.initializeCreators()

    // 监听形状选中事件
    this.setupShapeSelectionListener()
  }

  /**
   * 初始化所有创建器
   */
  private initializeCreators(): void {
    if (!this.canvas) return

    const creatorOptions: ShapeCreatorOptions = {
      defaultFillColor: this.options.defaultFillColor,
      defaultStrokeColor: this.options.defaultStrokeColor,
      defaultStrokeWidth: this.options.defaultStrokeWidth,
      coordinateGrid: this.options.coordinateGrid,
      drawBoard: this.host, // 传入 DrawBoard 实例
      onShapeAdded: (shape: FabricObject) => {
        this.shapes.push(shape)
        this.emit('shapeAdded', shape)
      },
      onShapeModified: (shape: FabricObject) => {
        // 可以在这里添加形状修改时的逻辑
        console.log('Shape modified:', shape)
      },
      onShapeRemoved: (shape: FabricObject) => {
        // 从形状数组中移除
        const index = this.shapes.indexOf(shape)
        if (index > -1) {
          this.shapes.splice(index, 1)
        }
        this.emit('shapeRemoved', shape)
      },
    }

    this.rectangleCreator = new RectangleCreator(this.canvas, creatorOptions)
    this.polygonCreator = new PolygonCreator(this.canvas, creatorOptions)
    this.pointCreator = new PointCreator(this.canvas, creatorOptions)
  }

  /**
   * 设置形状选中事件监听器
   */
  private setupShapeSelectionListener(): void {
    if (!this.canvas) return

    // 监听画布上的对象选中事件
    this.canvas.on('selection:created', (event) => {
      this.handleShapeSelection(event)
    })

    this.canvas.on('selection:updated', (event) => {
      this.handleShapeSelection(event)
    })
  }

  /**
   * 处理形状选中事件
   */
  private handleShapeSelection(event: { selected?: FabricObject[] }): void {
    if (!event.selected || !Array.isArray(event.selected)) return

    // 遍历所有被选中的对象
    event.selected.forEach((selectedObject: FabricObject) => {
      // 检查被选中的对象是否是由 ShapePlugin 管理的形状
      if (this.shapes.includes(selectedObject)) {
        // 触发 shapeSelected 事件
        this.emit('shapeSelected', selectedObject)
      }
    })
  }

  /**
   * 将坐标量化到指定的网格粒度
   * @param coordinate 原始坐标值
   * @returns 量化后的坐标值
   */
  /**
   * 动态设置坐标网格粒度
   * @param grid 新的网格粒度值
   */
  public setCoordinateGrid(grid: number): void {
    if (grid <= 0) {
      console.warn('ShapePlugin: coordinateGrid must be greater than 0')
      return
    }
    this.options.coordinateGrid = grid

    // 更新所有创建器的坐标网格
    this.rectangleCreator?.updateCoordinateGrid(grid)
    this.polygonCreator?.updateCoordinateGrid(grid)
    this.pointCreator?.updateCoordinateGrid(grid)
  }

  /**
   * 获取当前的坐标网格粒度
   * @returns 当前的网格粒度值
   */
  public getCoordinateGrid(): number {
    return this.options.coordinateGrid
  }

  /**
   * 添加矩形到画布（使用 RectangleCreator）
   * @param options 矩形配置选项
   * @returns 创建的矩形对象
   */
  public addRectangle(options: import('./shapes/RectangleCreator').RectangleOptions): Rect {
    if (!this.rectangleCreator) {
      throw new Error('ShapePlugin: RectangleCreator not initialized')
    }
    return this.rectangleCreator.createRectangle(options)
  }

  /**
   * 添加多边形到画布（使用 PolygonCreator）
   * @param options 多边形配置选项
   * @returns 创建的多边形对象
   */
  public addPolygon(options: import('./shapes/PolygonCreator').PolygonOptions): Polygon {
    if (!this.polygonCreator) {
      throw new Error('ShapePlugin: PolygonCreator not initialized')
    }
    return this.polygonCreator.createPolygon(options)
  }

  /**
   * 添加点到画布（使用 PointCreator）
   * @param options 点配置选项
   * @returns 创建的点对象数组
   */
  public addPoints(options: import('./shapes/PointCreator').PointOptions): Circle[] {
    if (!this.pointCreator) {
      throw new Error('ShapePlugin: PointCreator not initialized')
    }
    return this.pointCreator.createPoint(options)
  }

  /**
   * 移除指定形状
   * @param shape 要移除的形状
   */
  public removeShape(shape: FabricObject): void {
    if (!this.canvas) {
      console.warn('ShapePlugin: Canvas not available')
      return
    }

    // 使用创建器的 removeShapeFromCanvas 方法
    // 这将自动触发 onShapeRemoved 回调
    if (this.rectangleCreator) {
      this.rectangleCreator.removeShapeFromCanvas(shape)
    } else if (this.polygonCreator) {
      this.polygonCreator.removeShapeFromCanvas(shape)
    } else if (this.pointCreator) {
      this.pointCreator.removeShapeFromCanvas(shape)
    } else {
      // 如果没有创建器可用，直接移除
      this.canvas.remove(shape)
      const index = this.shapes.indexOf(shape)
      if (index > -1) {
        this.shapes.splice(index, 1)
      }
      this.emit('shapeRemoved', shape)
    }
  }

  /**
   * 移除所有形状
   */
  public removeAllShapes(): void {
    if (!this.canvas) {
      console.warn('ShapePlugin: Canvas not available')
      return
    }

    // 移除所有形状
    this.shapes.forEach((shape) => {
      this.canvas!.remove(shape)
      this.emit('shapeRemoved', shape)
    })

    // 清空形状数组
    this.shapes = []
  }

  /**
   * 获取所有形状
   * @returns 所有形状的数组
   */
  public getShapes(): FabricObject[] {
    return [...this.shapes] // 返回副本，避免外部修改
  }

  /**
   * 切换所有形状的可控制状态
   */
  public toggleAllShapesInteractivity(): void {
    if (!this.canvas) {
      console.warn('ShapePlugin: Canvas not available')
      return
    }

    // 获取当前状态（以第一个形状的状态为准）
    const currentState = this.getCurrentInteractivityState()
    // 切换到相反状态
    this.setAllShapesInteractivity(!currentState)
  }

  /**
   * 设置所有形状的可控制状态
   * @param interactive 是否可交互
   */
  public setAllShapesInteractivity(interactive: boolean): void {
    if (!this.canvas) {
      console.warn('ShapePlugin: Canvas not available')
      return
    }

    // 遍历所有形状，设置交互性
    this.shapes.forEach((shape) => {
      shape.set({
        selectable: interactive,
        evented: interactive,
        moveCursor: interactive ? 'move' : 'default',
        hoverCursor: interactive ? 'move' : 'default',
        // 锁定形变属性 - 只允许移动，不允许缩放、旋转、倾斜
        lockScalingX: interactive, // 禁止水平缩放
        lockScalingY: interactive, // 禁止垂直缩放
        lockRotation: interactive, // 禁止旋转
        lockSkewingX: interactive, // 禁止水平倾斜
        lockSkewingY: interactive, // 禁止垂直倾斜
        hasControls: !interactive, // 隐藏控制点（缩放、旋转控制点）
        hasBorders: interactive, // 保留边框（用于显示选中状态）
      })
    })

    // 重新渲染画布
    this.canvas.renderAll()
    console.log(`All shapes interactivity set to: ${interactive}`)
  }

  /**
   * 获取当前形状的可控制状态
   * @returns 当前是否可交互（以第一个形状为准，如果没有形状则返回 true）
   */
  public getCurrentInteractivityState(): boolean {
    if (this.shapes.length === 0) {
      return true // 默认状态
    }

    // 以第一个形状的状态为准
    const firstShape = this.shapes[0]
    return firstShape.selectable !== false
  }

  /**
   * 销毁插件，清理所有形状和事件监听
   */
  public destroy(): void {
    this.removeAllShapes()
    super.destroy()
  }
}
