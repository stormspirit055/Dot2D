import EventEmitter from './EventEmitter'

export type BasePluginEvents = {
  destroy: []
}

// 使用泛型避免循环依赖
export type GenericPlugin = BasePlugin<BasePluginEvents, unknown, any>
// 画板插件
export type GenericDrawBoardPlugin = BasePlugin<BasePluginEvents, unknown, any>
// 主体插件
export type GenericProjectPlugin = BasePlugin<BasePluginEvents, unknown, any>
export class BasePlugin<
  EventTypes extends BasePluginEvents,
  Options,
  T,
> extends EventEmitter<EventTypes> {
  protected host?: T
  protected subscriptions: (() => void)[] = []
  protected options: Options

  /** Create a plugin instance */
  constructor(options: Options) {
    super()
    this.options = options
  }

  /** Called after this.wavesurfer is available */
  protected onInit() {
    return
  }

  /** Do not call directly, only called by WavesSurfer internally */
  public _init(host: T) {
    this.host = host
    this.onInit()
  }

  /** Destroy the plugin and unsubscribe from all events */
  public destroy() {
    this.emit('destroy')
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
  }
}

export default BasePlugin
