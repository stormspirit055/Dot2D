// 拖动画布插件
import BasePlugin from '../../BasePlugin'
import type { BasePluginEvents } from '../../BasePlugin'
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
    this.canvas = this.host?.getCanvas()
    this._bindEvent()
  }
  private _bindEvent() {
    if (!this.canvas || !this.host) {
      return
    }
    this.host.on('mouseMove', this.handleMouseMove)
    this.host.on('mouseDown', this.handleMouseDown)
    this.host.on('mouseUp', this.handleMouseUp)
  }

  protected onDestroy(): void {
    if (this.canvas && this.host) {
      this.host.un('mouseMove', this.handleMouseMove)
      this.host.un('mouseDown', this.handleMouseDown)
      this.host.un('mouseUp', this.handleMouseUp)
    }
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
  handleMouseUp = (_opt: TPointerEventInfo<TPointerEvent>) => {
    this.isMousedown = false
  }
}
