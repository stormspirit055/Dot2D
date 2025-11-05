// 拖动画布插件
// 画布旋转插件（快捷键）
import BasePlugin from '../../BasePlugin'
import type { BasePluginEvents } from '../../BasePlugin'
import DrawBorad from '../index'

export type CanvasRotatePluginEvents = BasePluginEvents & {}
export type CanvasRotatePluginOptions = {
  // 快捷键字符串，示例："Shift+R"、"Alt+R"、"Ctrl+R"、"Meta+R"
  shortCut: string
  // 每次旋转角度，默认 90°
  step?: number
}

type ParsedShortcut = {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
}

function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split('+').map((p) => p.trim().toLowerCase())
  const mod = {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command') || parts.includes('win'),
  }
  const key = parts.filter(
    (p) => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command', 'win'].includes(p),
  )[0] || ''
  return { ...mod, key }
}

function matchShortcut(e: KeyboardEvent, s: ParsedShortcut): boolean {
  // 统一比较 key（字母转小写），允许 e.key 与配置一致
  const k = (e.key || '').toLowerCase()
  return e.ctrlKey === s.ctrl && e.altKey === s.alt && e.shiftKey === s.shift && e.metaKey === s.meta && k === s.key
}

export default class CanvasRotatePlugin extends BasePlugin<CanvasRotatePluginEvents, CanvasRotatePluginOptions, DrawBorad> {
  private keydownHandler?: (e: KeyboardEvent) => void
  private parsedShortcut: ParsedShortcut
  private step: number

  public static create(options: CanvasRotatePluginOptions) {
    return new CanvasRotatePlugin(options)
  }

  constructor(options: CanvasRotatePluginOptions) {
    super(options)
    this.parsedShortcut = parseShortcut(options.shortCut)
    this.step = options.step ?? 90
  }

  protected onInit(): void {
    // 绑定键盘事件
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.host) return
      if (matchShortcut(e, this.parsedShortcut)) {
        // 若同时按下 Shift（且不是配置要求的 Shift），则反向旋转；否则正常旋转
        const reverse = !this.parsedShortcut.shift && e.shiftKey
        const angle = reverse ? -this.step : this.step
        // 阻止与浏览器默认快捷键（如 Ctrl+R/Meta+R 刷新）冲突
        e.preventDefault()
        e.stopPropagation()
        this.host.rotate(angle)
      }
    }
    window.addEventListener('keydown', this.keydownHandler)
  }

  protected onDestroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = undefined
    }
  }
}
