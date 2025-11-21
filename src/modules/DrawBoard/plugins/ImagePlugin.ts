// 图片管理插件
import BasePlugin from '../../BasePlugin'
import type { BasePluginEvents } from '../../BasePlugin'
import DrawBorad from '../index'
import { Canvas, FabricImage } from 'fabric'

export type ImagePluginEvents = BasePluginEvents & {
  imageLoaded: [image: FabricImage]
  imageLoadError: [error: Error]
}

export type ImagePluginOptions = object

const defaultOptions = {}

export default class ImagePlugin extends BasePlugin<
  ImagePluginEvents,
  ImagePluginOptions,
  DrawBorad
> {
  protected options: ImagePluginOptions & typeof defaultOptions
  canvas?: Canvas
  private currentImage: FabricImage | undefined

  constructor(options?: ImagePluginOptions) {
    super(options || {})
    this.options = { ...defaultOptions, ...options }
  }

  public static create(options?: ImagePluginOptions) {
    return new ImagePlugin(options)
  }

  protected onInit(): void {
    this.canvas = this.host?.getCanvas()

    if (!this.canvas) {
      console.warn('ImagePlugin: Canvas not available')
      return
    }
    this.host?.on('rotate', (angle) => {
      if (this.currentImage && this.canvas) {
        const normalized = ((angle % 360) + 360) % 360
        this.currentImage.set({ angle: normalized })
        this.setImgCenter(this.currentImage, angle)
        this.currentImage.setCoords()
      }
    })
  }

  /**
   * 从 URL 加载图片并添加到画布
   * @param url 图片 URL
   * @returns Promise<void>
   */
  public loadImage(url: string): Promise<void> {
    const canvas = this.canvas
    if (!canvas) {
      const error = new Error('ImagePlugin: Canvas not available')
      this.emit('imageLoadError', error)
      return Promise.reject(error)
    }

    return new Promise<void>((resolve, reject) => {
      FabricImage.fromURL(url)
        .then((img) => {
          this.setImgCenter(img)
          // 禁用控制器和选择功能
          img.hasControls = false
          img.selectable = false

          // 如果已有图片，先移除
          if (this.currentImage) {
            canvas.remove(this.currentImage)
          }

          // 添加新图片到画布并移到最底层作为背景
          this.currentImage = img
          canvas.add(img)
          canvas.sendObjectToBack(img)
          const tl = img.getCoords()[0]
          console.log(tl)
          this.host?.setCoordinateOrigin(tl.x, tl.y)

          // 触发图片加载成功事件
          this.emit('imageLoaded', img)
          resolve()
        })
        .catch((err) => {
          const error = new Error(`Failed to load image: ${err.message}`)
          this.emit('imageLoadError', error)
          reject(error)
        })
    })
  }
  setImgCenter(img: FabricImage, angle: number = 0) {
    const canvasWidth = this.canvas?.getWidth() || 0
    const canvasHeight = this.canvas?.getHeight() || 0
    const scaleX = angle === 0 || angle === 180 ? canvasWidth / img.width : canvasWidth / img.height
    const scaleY =
      angle === 0 || angle === 180 ? canvasHeight / img.height : canvasHeight / img.width
    const scale = Math.min(scaleX, scaleY)

    // 应用缩放
    img.scale(scale)
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    img.set({
      originX: 'center',
      originY: 'center',
      left: centerX,
      top: centerY,
    })
    img.setCoords()
  }
  /**
   * 获取当前加载的图片
   * @returns 当前图片对象或 undefined
   */
  public getImage(): FabricImage | undefined {
    return this.currentImage
  }

  /**
   * 移除当前图片
   */
  public removeImage(): void {
    if (!this.canvas || !this.currentImage) {
      return
    }

    this.canvas.remove(this.currentImage)
    this.currentImage = undefined
    this.canvas.requestRenderAll()
  }

  /**
   * 销毁插件，清理图片和事件监听
   */
  public destroy(): void {
    this.removeImage()
    super.destroy()
  }
}
