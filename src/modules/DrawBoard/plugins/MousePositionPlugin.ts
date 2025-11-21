// 拖动画布插件
import BasePlugin from '../../BasePlugin'
import type { BasePluginEvents } from '../../BasePlugin'
import DrawBorad from '../index'
import { Canvas, type TPointerEventInfo, type TPointerEvent } from 'fabric'
export type MousePositionPluginEvents = BasePluginEvents & {}
export type MousePositionPluginOptions = object | undefined
export default class MousePositionPlugin extends BasePlugin<
  MousePositionPluginEvents,
  MousePositionPluginOptions,
  DrawBorad
> {
  canvas?: Canvas
  overlayCtx?: CanvasRenderingContext2D
  public static create(options?: MousePositionPluginOptions) {
    return new MousePositionPlugin(options)
  }
  constructor(options: MousePositionPluginOptions) {
    super(options)
  }
  protected onInit(): void {
    this.canvas = this.host?.getCanvas()
    this._bindEvent()
    this.overlayCtx = this.host?.getOverlayContext()
  }
  private _bindEvent() {
    if (!this.canvas || !this.host) {
      return
    }
    this.host.on('mouseMove', this.handleMouseMove)
  }

  protected onDestroy(): void {
    if (this.canvas && this.host) {
      this.host.un('mouseMove', this.handleMouseMove)
    }
    this.host?.clearOverlay()
  }
  private handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
    if (!this.canvas || !this.overlayCtx) return
    const vp = this.canvas.getViewportPoint(opt.e)
    const scene = this.canvas.getScenePoint(opt.e)
    const imgPt = this.host?.sceneToImage(scene) || scene
    const x = Math.round(imgPt.x)
    const y = Math.round(imgPt.y)
    const text = `(${x}, ${y})`
    const ctx = this.overlayCtx
    this.host?.clearOverlay()
    const padding = 4
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    const metrics = ctx.measureText(text)
    const boxW = metrics.width + padding * 2
    const boxH = 18
    const left = vp.x + 10
    const top = vp.y + 10
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(left, top, boxW, boxH)
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    ctx.fillText(text, left + padding, top + (boxH - 12) / 2)
  }
}
