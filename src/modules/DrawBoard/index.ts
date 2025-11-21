import EventEmitter from '../EventEmitter'
import { type GenericDrawBoardPlugin } from '../BasePlugin'
import {
  Canvas,
  Point,
  type TPointerEvent,
  type TPointerEventInfo,
  type CanvasEvents,
} from 'fabric'
import WheelZoomPlugin from './plugins/WheelZoomPlugin'
import CanvasDragPlugin from './plugins/CanvasDragPlugin'
import ShapePlugin from './plugins/ShapePlugin'
import ImagePlugin from './plugins/ImagePlugin'
import CanvasRotatePlugin from './plugins/CanvasRotatePlugin'
import MousePositionPlugin from './plugins/MousePositionPlugin'
export type DrawBoradEvents = {
  rotate: [angle: number]
  load: []
  zoom: [number]
  mouseDown: [e: TPointerEventInfo]
  mouseUp: [e: TPointerEventInfo]
  mouseOver: [e: TPointerEventInfo]
  mouseOut: [e: TPointerEventInfo]
  mouseMove: [e: TPointerEventInfo]
  mouseWheel: [e: TPointerEventInfo]
}
export type DrawBoradOptions = {
  container: HTMLElement
  width: number
  height: number
  id: string
  plugins?: GenericDrawBoardPlugin[]
  img?: string
}
export default class DrawBorad extends EventEmitter<DrawBoradEvents> {
  canvas!: Canvas
  canvasDom!: HTMLCanvasElement
  plugins: GenericDrawBoardPlugin[] = []
  options?: DrawBoradOptions
  imagePlugin?: ImagePlugin
  shapePlugin?: ShapePlugin
  angle: number = 0
  protected subscriptions: Array<() => void> = []
  overlayEl?: HTMLCanvasElement
  overlayCtx?: CanvasRenderingContext2D
  constructor(options: DrawBoradOptions) {
    super()
    this.options = options
    this.initDom(options)
    this.initDefaultPlugins()
    this.initPlugins()
    this.initEvents()
  }
  async load(url: string) {
    if (!this.imagePlugin) {
      throw new Error('ImagePlugin not available')
    }
    await this.imagePlugin.loadImage(url)
  }
  // 缩放至画布初始状态
  zoom(): void
  // 缩放一定比例， 图片位置不动
  zoom(scale: number): void
  // 缩放比例， 将图片移至中心位置
  zoom(scale: number, point?: Point): void
  zoom(scale?: number, point?: Point): void {
    if (!this.canvas) return
    if (scale) {
      if (point) {
        this.canvas?.zoomToPoint(point, scale)
      } else {
        this.canvas.setZoom(scale)
      }
      this.emit('zoom', scale)
    } else {
      this.canvas.setZoom(1)
      // this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
      this.emit('zoom', 1)
    }
  }

  rotate(angle: number = 90) {
    if (!this.canvas) return

    this.angle = this.angle === 270 ? 0 : angle + this.angle

    // this.zoom()
    this.emit('rotate', this.angle)
    // 重新渲染
    this.canvas.requestRenderAll()
    // console.log(`画布旋转角度: ${currentRotation.value}°`)
  }
  get zoomLevel() {
    return this.canvas.getZoom()
  }

  /**
   * 获取当前加载的图片
   * @returns 当前图片对象或 undefined
   */
  getImage() {
    return this.imagePlugin?.getImage()
  }
  private initDom(options: DrawBoradOptions) {
    const container = options.container
    const canvas = document.createElement('canvas')
    canvas.setAttribute('id', options.id)
    this.canvasDom = canvas //
    container.appendChild(canvas)
    this.canvas = new Canvas(options.id, {
      width: options.width,
      height: options.height,
      uniformScaling: false, // 禁止滚轮缩放事件
      stopContextMenu: true, // 禁止右键菜单
      isDrawingMode: false, // 禁用绘制模式，允许对象交互
      fireRightClick: true, // 启用右键事件 button === 2
      selection: false, // 启用对象选择
      preserveObjectStacking: true, // 保持对象层级顺序，防止选中时自动置顶
    })
    const wrapper = this.canvas.wrapperEl
    const upper = this.canvas.upperCanvasEl
    const el = document.createElement('canvas')
    el.className = (upper?.className || '').replace('upper-canvas', '')
    el.classList.add('drawboard-overlay')
    el.setAttribute('data-overlay', 'drawboard')
    el.style.position = 'absolute'
    el.style.left = '0'
    el.style.top = '0'
    el.style.pointerEvents = 'none'
    el.width = upper?.width || this.canvas.getWidth()
    el.height = upper?.height || this.canvas.getHeight()
    wrapper.appendChild(el)
    this.overlayEl = el
    this.overlayCtx = el.getContext('2d') || undefined
  }
  private initPlugins() {
    if (!this.options?.plugins?.length) return
    this.options.plugins.forEach((plugin) => {
      this.registerPlugin(plugin)
    })
  }
  private initDefaultPlugins() {
    this.registerPlugin(WheelZoomPlugin.create())
    this.registerPlugin(CanvasDragPlugin.create())
    this.registerPlugin(MousePositionPlugin.create())
    this.shapePlugin = this.registerPlugin(ShapePlugin.create())
    this.imagePlugin = this.registerPlugin(ImagePlugin.create())
    this.registerPlugin(
      CanvasRotatePlugin.create({
        shortCut: 'r',
        step: 90,
      }),
    )
  }
  private initEvents() {
    const eventMap = {
      'mouse:down': 'mouseDown',
      'mouse:up': 'mouseUp',
      'mouse:over': 'mouseOver',
      'mouse:out': 'mouseOut',
      'mouse:move': 'mouseMove',
      'mouse:wheel': 'mouseWheel',
    } as const
    Object.entries(eventMap).forEach(([fabricEvent, customEvent]) => {
      this.canvas.on(fabricEvent as keyof CanvasEvents, (opt: TPointerEventInfo<TPointerEvent>) => {
        this.emit(customEvent, opt)
      })
    })
  }

  getCanvas(): Canvas {
    return this.canvas
  }
  setCoordinateOrigin(x: number, y: number) {
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = -x
      vpt[5] = -y
      this.canvas.setViewportTransform(vpt as [number, number, number, number, number, number])
      this.canvas.requestRenderAll()
    } else {
      this.canvas.setViewportTransform([1, 0, 0, 1, -x, -y])
      this.canvas.requestRenderAll()
    }
  }
  getOverlayElement(): HTMLCanvasElement | undefined {
    return this.overlayEl
  }
  getOverlayContext(): CanvasRenderingContext2D | undefined {
    return this.overlayCtx
  }
  clearOverlay(): void {
    if (this.overlayEl && this.overlayCtx) {
      this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0)
      this.overlayCtx.clearRect(0, 0, this.overlayEl.width, this.overlayEl.height)
    }
  }
  imageToScene(point: { x: number; y: number }): { x: number; y: number } {
    const img = this.getImage()
    if (!img) return point
    const cx = img.getCenterPoint().x
    const cy = img.getCenterPoint().y
    const angle = (img.angle || 0) * (Math.PI / 180)
    const scaleX = img.scaleX || 1
    const scaleY = img.scaleY || 1
    const w = img.width || 0
    const h = img.height || 0
    const dx = (point.x - w / 2) * scaleX
    const dy = (point.y - h / 2) * scaleY
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle)
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle)
    return { x: cx + rx, y: cy + ry }
  }
  sceneToImage(point: { x: number; y: number }): { x: number; y: number } {
    const img = this.getImage()
    if (!img) return point
    const cx = img.getCenterPoint().x
    const cy = img.getCenterPoint().y
    const angle = (img.angle || 0) * (Math.PI / 180)
    const scaleX = img.scaleX || 1
    const scaleY = img.scaleY || 1
    const w = img.width || 0
    const h = img.height || 0
    const dx = point.x - cx
    const dy = point.y - cy
    const ix = dx * Math.cos(-angle) - dy * Math.sin(-angle)
    const iy = dx * Math.sin(-angle) + dy * Math.cos(-angle)
    return { x: ix / scaleX + w / 2, y: iy / scaleY + h / 2 }
  }
  private registerPlugin<T extends GenericDrawBoardPlugin>(plugin: T): T {
    plugin._init(this)
    this.plugins.push(plugin)
    this.subscriptions.push(
      plugin.once('destroy', () => {
        this.plugins = this.plugins.filter((p) => p !== plugin)
      }),
    )
    return plugin
  }

  public use<T extends GenericDrawBoardPlugin>(plugin: T): T {
    return this.registerPlugin(plugin)
  }

  public destroy(): void {
    // 清理所有插件
    this.plugins.forEach((plugin) => {
      if (typeof plugin.destroy === 'function') {
        plugin.destroy()
      }
    })

    // 清理画布
    if (this.canvas) {
      this.canvas.dispose()
    }

    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl)
      this.overlayEl = undefined
      this.overlayCtx = undefined
    }

    // 清理订阅
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    // 清理事件监听器
    this.unAll()
  }
}
