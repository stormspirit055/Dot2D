import { FabricObject, Canvas } from 'fabric'

export type DrawBoardEventEmitter = {
  on(event: 'zoom', listener: (zoomLevel: number) => void): void
  un(event: 'zoom', listener: (zoomLevel: number) => void): void
}

export interface ScalingCompensationOptions {
  strokeOnly?: boolean
}

/**
 * 启用缩放补偿
 * 使对象在画布缩放时保持视觉大小不变
 * @param object 需要应用补偿的 Fabric 对象
 * @param drawBoard DrawBoard 实例（提供 zoom 事件）
 * @param canvas Fabric Canvas 实例（提供当前 zoom 和渲染能力）
 * @param options 配置选项
 * @returns 返回一个清理函数（disposer），调用它可移除监听器
 */
export function enableScalingCompensation(
  object: FabricObject,
  drawBoard: DrawBoardEventEmitter,
  canvas: Canvas,
  options: ScalingCompensationOptions = {},
): () => void {
  // 捕获初始描边宽度
  const originalStrokeWidth = object.strokeWidth || 0

  // 核心补偿逻辑
  const compensate = (zoomLevel: number) => {
    const compensationScale = 1 / zoomLevel

    if (options.strokeOnly) {
      // 仅补偿描边宽度（适用于普通 Shape）
      // 当 strokeUniform 为 true 时，Fabric 默认就会保持描边视觉宽度恒定（相对于画布缩放）
      // 但是，如果画布缩放了，strokeUniform: true 会让描边随对象一起缩放吗？
      // 不，strokeUniform: true 的意思是“非均匀缩放时保持描边一致”，但在 Zoom 场景下：
      // 如果我们希望描边不随 zoom 变大，我们需要：
      // 1. 如果 strokeUniform=false: 描边随对象缩放。如果对象随 zoom 变大，描边也变大。
      //    此时我们需要 set strokeWidth = original / zoom
      // 2. 如果 strokeUniform=true: Fabric 尝试保持描边在对象变换下的一致性。
      //    在 Zoom 下，通常我们希望 strokeWidth = original / zoom

      object.set({
        strokeWidth: originalStrokeWidth / zoomLevel,
      })
    } else {
      // 全量补偿（适用于 Vertex）
      console.log(compensationScale)
      object.set({
        scaleX: compensationScale,
        scaleY: compensationScale,
        // 如果 strokeUniform 为 true，需要手动调整 strokeWidth 以保持视觉一致
        strokeWidth: object.strokeUniform ? originalStrokeWidth / zoomLevel : originalStrokeWidth,
      })
    }

    object.setCoords() // 确保交互区域同步更新
    canvas.requestRenderAll()
  }

  // 1. 初始化时立即执行一次
  compensate(canvas.getZoom())

  // 2. 监听 zoom 事件
  const listener = (zoomLevel: number) => {
    compensate(zoomLevel)
  }
  drawBoard.on('zoom', listener)

  // 3. 返回清理函数
  return () => {
    drawBoard.un('zoom', listener)
  }
}
