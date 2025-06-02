import EventEmitter from '../EventEmitter'
import { type GenericPlugin } from '../BasePlugin'
import {
  FabricImage,
  Canvas,
  Point,
  type TPointerEventInfo,
  type TPointerEvent,
  util,
  type TMat2D,
} from 'fabric'
export type DrawBoradEvents = {
  load: []
  zoom: [number]
  mouseDown: [e: TPointerEventInfo]
  mouseUp: [e: TPointerEventInfo]
  mouseOver: [e: TPointerEventInfo]
  mouseOut: [e: TPointerEventInfo]
}
export type DrawBoradOptions = {
  container: HTMLElement
  width: number
  height: number
  id: string
  plugins?: GenericPlugin[]
}
export default class DrawBorad extends EventEmitter<DrawBoradEvents> {
  canvas!: Canvas
  canvasDom!: HTMLCanvasElement
  plugins: GenericPlugin[] = []
  options?: DrawBoradOptions
  img: FabricImage | undefined
  protected subscriptions: Array<() => void> = []
  constructor(options: DrawBoradOptions) {
    super()
    this.options = options
    this.initDom(options)
    this.initPlugins()
    this.initEvents()
  }
  async load(url: string) {
    await this.loadImage(url)
  }
  // 缩放至画布初始状态
  zoom(): void
  // 缩放一定比例， 图片位置不动
  zoom(scale: number): void
  // 缩放比例， 将图片移至中心位置
  zoom(scale: number, point: Point): void
  zoom(scale?: number, point?: Point) {
    console.log('zoom', scale, point)
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
  rotate(angle: number) {
    const vpt = this.canvas.viewportTransform
    const center = this.canvas.getCenterPoint()
    const centerX = center.x
    const centerY = center.y
    const rad = util.degreesToRadians(angle)
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    // 计算旋转矩阵
    const rotationMatrix: TMat2D = [
      cos,
      sin,
      -sin,
      cos,
      centerX - centerX * cos + centerY * sin,
      centerY - centerX * sin - centerY * cos,
    ]
    const newVpt = util.multiplyTransformMatrices(vpt, rotationMatrix)
    console.log(newVpt)
    this.canvas.setViewportTransform(newVpt)
    console.log(this.getZoom)
    // const canvasWidth = this.canvas.getWidth()
    // const canvasHeight = this.canvas.getHeight()
    // const scaleX = canvasWidth / this.img!.height
    // const scaleY = canvasHeight / this.img!.width
    // const scale = Math.min(scaleX, scaleY)
    // this.img.scale(scale)
  }
  get getZoom() {
    return this.canvas.getZoom()
  }
  private initDom(options: DrawBoradOptions) {
    const container = options.container
    const canvas = document.createElement('canvas')
    canvas.setAttribute('id', options.id)
    canvas.setAttribute('width', options.width.toString())
    canvas.setAttribute('height', options.height.toString())
    this.canvasDom = canvas //
    container.appendChild(canvas)
    this.canvas = new Canvas(options.id, {
      uniformScaling: false, // 禁止滚轮缩放事件
      stopContextMenu: true, // 禁止右键菜单
      isDrawingMode: true, // 绘制模式，禁用默认的鼠标拖拽画布
      freeDrawingCursor: 'default', // 默认鼠标样式
      fireRightClick: true, // 启用右键事件 button === 2
      // controlsAboveOverlay: true,
      // imageSmoothingEnabled: false,
      // preserveObjectStacking: true,
    })
  }
  private loadImage(url: string) {
    const canvas = this.canvas
    // return new Promise
    return new Promise<void>((resolve, reject) => {
      FabricImage.fromURL(url)
        .then((img) => {
          const canvasWidth = canvas.getWidth()
          const canvasHeight = canvas.getHeight()
          const scaleX = canvasWidth / img.width
          const scaleY = canvasHeight / img.height
          const scale = Math.min(scaleX, scaleY)
          img.scale(scale)
          const newWidth = img.getScaledWidth()
          const newHeight = img.getScaledHeight()
          img.set({
            left: (canvasWidth - newWidth) / 2,
            top: (canvasHeight - newHeight) / 2,
          })
          this.img = img
          img.hasControls = false
          canvas.add(img)
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
  private initPlugins() {
    if (!this.options?.plugins?.length) return
    this.options.plugins.forEach((plugin) => {
      this.registerPlugin(plugin)
    })
  }
  private initEvents() {
    this.canvas.on('mouse:down', (opt: TPointerEventInfo<TPointerEvent>) => {
      this.emit('mouseDown', opt)
    })
    this.canvas.on('mouse:up', (opt: TPointerEventInfo<TPointerEvent>) => {
      this.emit('mouseUp', opt)
    })
    this.canvas.on('mouse:over', (opt: TPointerEventInfo<TPointerEvent>) => {
      this.emit('mouseOver', opt)
    })
    this.canvas.on('mouse:out', (opt: TPointerEventInfo<TPointerEvent>) => {
      this.emit('mouseOut', opt)
    })
  }

  getCanvas(): Canvas {
    return this.canvas
  }
  public registerPlugin<T extends GenericPlugin>(plugin: T): T {
    console.log('registerPlugin')
    plugin._init(this)
    this.plugins.push(plugin)
    this.subscriptions.push(
      plugin.once('destroy', () => {
        this.plugins = this.plugins.filter((p) => p !== plugin)
      }),
    )
    return plugin
  }
}
