import DrawBorad from '../DrawBoard'
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
    console.log(containerDom.clientWidth)
    const drawBorad = new DrawBorad({
      container: containerDom,
      width: 1000,
      height: 1000,
      id: 'drawBorad',
      plugins: [],
    })
    this.drawborads.push(drawBorad)
  }
}
