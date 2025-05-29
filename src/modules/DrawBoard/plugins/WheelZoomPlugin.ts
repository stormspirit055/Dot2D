// 鼠标滚轮缩放插件
import BasePlugin from '@/modules/BasePlugin'
import type { BasePluginEvents } from '@/modules/BasePlugin'
import DrawBorad from '../index'
import { Canvas, type TPointerEventInfo } from 'fabric'
export type WheelZoomPluginEvents = BasePluginEvents
export type WheelZoomPluginOptions = {
  /**
   * 默认每次缩放的比例为0.
   * @default 0.5
   */
  scale?: number
  /**
   * 缩放节流
   * @default 5
   */
  /**
   * 最大比例
   * @default 15
   */
  deltaThreshold?: number
  maxZoom?: number
  /**
   * 最小比例
   * @default 0.1
   */
  minZoom?: number
}
const defaultOptions = {
  scale: 0.01,
  deltaThreshold: 5,
  maxZoom: 15,
  minZoom: 0.1,
}
export default class WheelZoomPlugin extends BasePlugin<
  WheelZoomPluginEvents,
  WheelZoomPluginOptions,
  DrawBorad
> {
  protected options: WheelZoomPluginOptions & typeof defaultOptions
  canvas?: Canvas
  canvasDom: HTMLCanvasElement | undefined
  constructor(options?: WheelZoomPluginOptions) {
    super(options || {})
    this.options = { ...defaultOptions, ...options }
  }

  public static create(options?: WheelZoomPluginOptions) {
    return new WheelZoomPlugin(options)
  }
  onInit() {
    this.canvas = this.host?.getCanvas()
    if (!this.canvas) {
      return
    }
    this.canvas.on('mouse:wheel', this.handleMouseWheel)
  }
  private handleMouseWheel = (opt: TPointerEventInfo) => {
    const event = opt.e as WheelEvent
    event.preventDefault()
    event.stopPropagation()
    const zoom = this.canvas?.getZoom()
    const delta = event.deltaY < 0 ? -10 : 10
    const pointer = this.canvas?.getViewportPoint(event)  
    const result = zoom! * (1 + delta * this.options.scale)
    if (result > this.options.maxZoom || result < this.options.minZoom) {
      return
    }
    this.canvas?.zoomToPoint(pointer!, result)
  }
  public destroy(): void {
    if (this.canvas) {
      this.canvas.off('mouse:wheel', this.handleMouseWheel)
    }
    super.destroy()
  }
}
