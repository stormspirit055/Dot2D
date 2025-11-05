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
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
      this.emit('zoom', 1)
    }
  }

  rotate(angle: number = 90) {
    console.log('rotate')
    if (!this.canvas) return
    // 获取画布中心点
    const canvasWidth = this.canvas.getWidth()
    const canvasHeight = this.canvas.getHeight()
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    // 将角度转换为弧度
    this.angle += angle
    const radians = (this.angle * Math.PI) / 180
    // 计算旋转变换矩阵
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    // 创建旋转变换矩阵：先平移到中心，旋转，再平移回来
    const transform = [
      cos,
      sin,
      -sin,
      cos,
      centerX - centerX * cos + centerY * sin,
      centerY - centerX * sin - centerY * cos,
    ]
    // 应用变换到画布视口
    this.canvas.setViewportTransform(transform as [number, number, number, number, number, number])
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
    // 注册旋转插件：按 'r' 顺时针旋转 90°，按 'Shift+R' 逆时针旋转 90°
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
        this.emit(customEvent as keyof DrawBoradEvents, opt)
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
