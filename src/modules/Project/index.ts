import DrawBorad from '../DrawBoard'
import WheelZoomPlugin from '../DrawBoard/plugins/WheelZoomPlugin'
import CanvasDragPlugin from '../DrawBoard/plugins/CanvasDragPlugin'
type ProjectOptions = {
  container: string
  url: string
}
export default class Project {
  drawborads: DrawBorad[] = []
  url: string
  constructor(options: ProjectOptions) {
    this.url = options.url
    this._init(options)
  }

  load() {
    this.drawborads.forEach((item) => {
      item.load(this.url)
    })
  }
  private _init(options: ProjectOptions) {
    const { container } = options
    const containerDom = document.querySelector(container) as HTMLDivElement
    const drawBorad = new DrawBorad({
      container: containerDom,
      width: 1000,
      height: 1000,
      id: 'drawBorad',
      plugins: [WheelZoomPlugin.create(), CanvasDragPlugin.create()],
    })
    this.drawborads.push(drawBorad)
  }
}
