// 拖动画布插件
import BasePlugin from '@/modules/BasePlugin'
import type { BasePluginEvents } from '@/modules/BasePlugin'
import DrawBorad from '../index'
import { Canvas, type TPointerEventInfo, type TPointerEvent, Point } from 'fabric'
export type CanvasDragPluginEvents = BasePluginEvents & {}
export type CanvasDragPluginOptions = object | undefined
export default class CanvasDragPlugin extends BasePlugin<
  CanvasDragPluginEvents,
  CanvasDragPluginOptions,
  DrawBorad
> {
  canvas?: Canvas
  isMousedown = false
  lastPosX = 0
  lastPosY = 0
  public static create(options?: CanvasDragPluginOptions) {
    return new CanvasDragPlugin(options)
  }
  constructor(options: CanvasDragPluginOptions) {
    super(options)
  }
  protected onInit(): void {
    this._bindEvent()
  }
  private _bindEvent() {
    this.canvas = this.host?.getCanvas()
    if (!this.canvas) {
      return
    }
    this.canvas.on('mouse:move', this.handleMouseMove)
    this.canvas.on('mouse:down', this.handleMouseDown)
    this.canvas.on('mouse:up', this.handleMouseUp)
  }
  private handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
    if (this.isMousedown && this.canvas) {
      const pointer = this.canvas.getViewportPoint(opt.e)
      const deltaX = pointer.x - this.lastPosX
      const deltaY = pointer.y - this.lastPosY
      this.lastPosX = pointer.x
      this.lastPosY = pointer.y
      const point = new Point(deltaX, deltaY)
      this.canvas.relativePan(point)
    }
  }
  private handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
    if ((opt.e as MouseEvent).button === 2 && this.canvas) {
      const pointer = this.canvas.getViewportPoint(opt.e)
      this.lastPosX = pointer.x
      this.lastPosY = pointer.y
      this.isMousedown = true
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleMouseUp = (opt: TPointerEventInfo<TPointerEvent>) => {
    this.isMousedown = false
  }
}
