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
  overlayEl?: HTMLCanvasElement
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
    if (this.canvas) {
      const wrapper = this.canvas.wrapperEl
      const upper = this.canvas.upperCanvasEl
      const el = document.createElement('canvas')
      el.className = (upper?.className || '').replace('upper-canvas', '')
      el.classList.add('mousepos-overlay')
      el.setAttribute('data-overlay', 'mousepos')
      el.style.position = 'absolute'
      el.style.left = '0'
      el.style.top = '0'
      el.style.pointerEvents = 'none'
      const rect = upper?.getBoundingClientRect()
      if (rect) {
        el.width = Math.round(rect.width)
        el.height = Math.round(rect.height)
        el.style.width = `${Math.round(rect.width)}px`
        el.style.height = `${Math.round(rect.height)}px`
      } else {
        el.width = this.canvas.getWidth()
        el.height = this.canvas.getHeight()
        el.style.width = `${this.canvas.getWidth()}px`
        el.style.height = `${this.canvas.getHeight()}px`
      }
      wrapper.appendChild(el)
      this.overlayEl = el
      this.overlayCtx = el.getContext('2d') || undefined
    }
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
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl)
      this.overlayEl = undefined
      this.overlayCtx = undefined
    }
  }
  private handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
    if (!this.canvas || !this.overlayCtx || !this.overlayEl) return
    const vp = this.canvas.getViewportPoint(opt.e)
    const scene = this.canvas.getScenePoint(opt.e)
    const x = Math.round(scene.x)
    const y = Math.round(scene.y)
    const text = `(${x}, ${y})`
    const ctx = this.overlayCtx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.overlayEl.width, this.overlayEl.height)
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
