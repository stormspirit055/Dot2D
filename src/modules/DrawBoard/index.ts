import EventEmitter from '../EventEmitter'
import { type GenericPlugin } from '../BasePlugin'
import { FabricImage, Canvas } from 'fabric'
export type DrawBoradEvents = {
  load: []
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
  protected subscriptions: Array<() => void> = []
  constructor(options: DrawBoradOptions) {
    super()
    this.options = options
    this.initDom(options)
    this.initPlugins()
  }
  async load(url: string) {
    await this.loadImage(url)
  }
  zoom(scale: number) {
    this.canvas.setZoom(scale)
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
