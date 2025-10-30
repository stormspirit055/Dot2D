import { Canvas, type FabricObject } from 'fabric'

export type ShapeData = Partial<{
  id: string
  DrawType: string
}>

export interface ShapeCreatorOptions {
  coordinateGrid: number
  defaultFillColor: string
  defaultStrokeColor: string
  defaultStrokeWidth: number
}

/**
 * 基础图形创建器抽象类
 * 提供通用的坐标量化功能和事件处理方法
 */
export abstract class BaseShapeCreator {
  protected canvas: Canvas
  protected options: ShapeCreatorOptions
  protected onShapeAdded: (shape: FabricObject) => void

  constructor(
    canvas: Canvas,
    options: ShapeCreatorOptions,
    onShapeAdded: (shape: FabricObject) => void
  ) {
    this.canvas = canvas
    this.options = options
    this.onShapeAdded = onShapeAdded
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
    this.canvas.add(shape)
    
    // 触发形状添加事件
    this.onShapeAdded(shape)
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
}