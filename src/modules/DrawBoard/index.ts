import EventEmitter from '../EventEmitter'
import { type GenericPlugin } from '../BasePlugin'
import {
  Canvas,
  Point,
  TMat2D,
  type TPointerEvent,
  type TPointerEventInfo,
  type CanvasEvents,
} from 'fabric'
import WheelZoomPlugin from './plugins/WheelZoomPlugin'
import CanvasDragPlugin from './plugins/CanvasDragPlugin'
import ShapePlugin from './plugins/ShapePlugin'
import ImagePlugin from './plugins/ImagePlugin'
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
  plugins?: GenericPlugin[]
  img?: string
}
export default class DrawBorad extends EventEmitter<DrawBoradEvents> {
  canvas!: Canvas
  canvasDom!: HTMLCanvasElement
  plugins: GenericPlugin[] = []
  options?: DrawBoradOptions
  imagePlugin?: ImagePlugin
  shapePlugin?: ShapePlugin
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
  zoom(scale: number, point: Point): void
  zoom(scale?: number, point?: Point) {
    if (scale) {
      if (point) {
        this.canvas?.zoomToPoint(point, scale)
      } else {
        this.canvas.setZoom(scale)
      }
      this.emit('zoom', scale)
      // 对所有顶点进行缩放补偿，使其保持固定视觉大小
      this.compensateVertexScaling(scale)
    } else {
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
      this.emit('zoom', 1)
      // 重置时也需要补偿顶点缩放
      this.compensateVertexScaling(1)
    }
  }
  rotate(angleDeg: number) {
    // const angleDeg = 30 // 旋转角度
    const angleRad = (angleDeg * Math.PI) / 180 // 弧度

    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)

    // 画布中心
    const centerX = this.canvas.getWidth() / 2
    const centerY = this.canvas.getHeight() / 2

    // 构造旋转视口矩阵：先平移到中心，再旋转，再平移回来
    const transform: TMat2D = [
      cos,
      sin,
      -sin,
      cos,
      centerX - cos * centerX + sin * centerY,
      centerY - sin * centerX - cos * centerY,
    ]

    this.canvas.setViewportTransform(transform)
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
  private registerPlugin<T extends GenericPlugin>(plugin: T): T {
    plugin._init(this)
    this.plugins.push(plugin)
    this.subscriptions.push(
      plugin.once('destroy', () => {
        this.plugins = this.plugins.filter((p) => p !== plugin)
      }),
    )
    return plugin
  }

  public use<T extends GenericPlugin>(plugin: T): T {
    return this.registerPlugin(plugin)
  }

  /**
   * 对所有顶点进行缩放补偿，使其在画布缩放时保持固定的视觉大小
   * @param zoomLevel 当前画布的缩放级别
   */
  private compensateVertexScaling(zoomLevel: number): void {
    if (!this.canvas) return

    // 计算反向缩放比例
    const compensationScale = 1 / zoomLevel

    // 遍历画布上的所有对象
    this.canvas.getObjects().forEach((obj) => {
      // 检查是否是顶点对象（Circle 类型且有 isVertex 标识）
      if (obj.type === 'circle' && (obj as any).isVertex) {
        // 设置反向缩放比例，抵消画布缩放的影响
        obj.set({
          scaleX: compensationScale,
          scaleY: compensationScale,
        })
      }
    })

    // 重新渲染画布
    this.canvas.renderAll()
  }

  public destroy(): void {
    // 清理所有插件
    this.plugins.forEach((plugin) => {
      if (typeof plugin.destroy === 'function') {
        plugin.destroy()
      }
    })
    this.plugins = []

    // 清理所有订阅
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    // 清理画布
    if (this.canvas) {
      this.canvas.dispose()
    }

    // 移除 DOM 元素
    if (this.canvasDom && this.canvasDom.parentNode) {
      this.canvasDom.parentNode.removeChild(this.canvasDom)
    }
  }
}
