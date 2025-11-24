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
  constructor(options: DrawBoradOptions) {
    super()
    this.options = options
    this.initDom(options)
    this.initEvents()
    this.initDefaultPlugins()
    this.initPlugins()
  }
  async load(url: string) {
    if (!this.imagePlugin) {
      throw new Error('ImagePlugin not available')
    }
    await this.imagePlugin.loadImage(url)
  }
  zoom(scale: number): void {
    if (!this.canvas) return
    this.canvas.setZoom(scale)
    this.emit('zoom', scale)
    this.canvas.requestRenderAll()
  }
  rotate(angle: number = 90) {
    if (!this.canvas) return
    this.angle = this.angle === 270 ? 0 : angle + this.angle
    this.emit('rotate', this.angle)
    this.canvas.requestRenderAll()
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
    // 清理订阅
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    // 清理事件监听器
    this.unAll()
  }
}
