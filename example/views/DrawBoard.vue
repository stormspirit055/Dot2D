<template>
  <div class="drawboard-page">
    <div class="toolbar">
      <h2>绘图板</h2>
      <div class="toolbar-buttons">
        <button @click="addRectangle" class="btn btn-primary">添加矩形</button>
        <button @click="addPolygon" class="btn btn-primary">添加多边形</button>
        <button @click="addPoint" class="btn btn-primary">添加点</button>
        <button @click="loadImage" class="btn btn-success" :disabled="loading">
          {{ loading ? '加载中...' : '加载图片' }}
        </button>
        <button @click="clearCanvas" class="btn btn-secondary">清空画布</button>
        <button
          @click="toggleShapesControl"
          :class="shapesInteractive ? 'btn btn-warning' : 'btn btn-info'"
        >
          {{ shapesInteractive ? '禁用控制' : '启用控制' }}
        </button>
        <button @click="zoomIn" class="btn btn-outline">放大</button>
        <button @click="zoomOut" class="btn btn-outline">缩小</button>
      </div>
    </div>

    <!-- 坐标粒度控制面板 -->
    <div class="coordinate-grid-panel">
      <h3>坐标粒度控制</h3>
      <div class="grid-info">
        <span class="current-grid">当前粒度: {{ currentCoordinateGrid }}</span>
        <span class="grid-description">
          {{ getGridDescription(currentCoordinateGrid) }}
        </span>
      </div>
      <div class="grid-controls">
        <div class="preset-buttons">
          <button 
            @click="setCoordinateGrid(1)" 
            :class="currentCoordinateGrid === 1 ? 'btn btn-grid active' : 'btn btn-grid'"
          >
            整数坐标 (1)
          </button>
          <button 
            @click="setCoordinateGrid(0.5)" 
            :class="currentCoordinateGrid === 0.5 ? 'btn btn-grid active' : 'btn btn-grid'"
          >
            半像素 (0.5)
          </button>
          <button 
            @click="setCoordinateGrid(5)" 
            :class="currentCoordinateGrid === 5 ? 'btn btn-grid active' : 'btn btn-grid'"
          >
            5像素网格 (5)
          </button>
          <button 
            @click="setCoordinateGrid(10)" 
            :class="currentCoordinateGrid === 10 ? 'btn btn-grid active' : 'btn btn-grid'"
          >
            10像素网格 (10)
          </button>
        </div>
        <div class="custom-grid">
          <label for="customGrid">自定义粒度:</label>
          <input 
            id="customGrid"
            v-model.number="customGridValue" 
            type="number" 
            step="0.1" 
            min="0.1" 
            max="100"
            class="grid-input"
            @keyup.enter="setCoordinateGrid(customGridValue)"
          />
          <button @click="setCoordinateGrid(customGridValue)" class="btn btn-apply">应用</button>
        </div>
      </div>
      <div class="grid-explanation">
        <p><strong>说明:</strong> 坐标粒度控制可以限制图形的坐标精度。设置为1时，所有图形坐标都会是整数；设置为0.5时，坐标会是0.5的倍数；设置为10时，坐标会是10的倍数。这有助于保持图形对齐和精确定位。</p>
      </div>
    </div>

    <div ref="canvasRef" class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DrawBoard from '@/modules/DrawBoard'

const canvasRef = ref<HTMLCanvasElement>()
let drawBoard: DrawBoard | null = null
const loading = ref(false)
const shapesInteractive = ref(true) // 矩形可控制状态

// 坐标粒度控制相关
const currentCoordinateGrid = ref(1) // 当前坐标粒度，默认为1（整数坐标）
const customGridValue = ref(1) // 自定义粒度输入值

// 设置坐标粒度
const setCoordinateGrid = (grid: number) => {
  if (!drawBoard?.shapePlugin) {
    console.warn('ShapePlugin not available')
    return
  }
  
  if (grid <= 0) {
    console.warn('坐标粒度必须大于0')
    return
  }
  
  drawBoard.shapePlugin.setCoordinateGrid(grid)
  currentCoordinateGrid.value = grid
  console.log(`坐标粒度已设置为: ${grid}`)
}

// 获取粒度描述
const getGridDescription = (grid: number): string => {
  if (grid === 1) return '所有坐标都是整数'
  if (grid === 0.5) return '坐标精度为半像素'
  if (grid < 1) return `坐标精度为 ${grid} 像素`
  return `坐标对齐到 ${grid} 像素网格`
}

onMounted(() => {
  if (canvasRef.value) {
    // 初始化绘图板
    drawBoard = new DrawBoard({
      container: canvasRef.value,
      width: canvasRef.value.clientWidth,
      height: canvasRef.value.clientHeight,
      id: 'drawboard-canvas',
    })

    // 监听事件
    drawBoard.on('zoom', (data) => {
      console.log('缩放事件:', data)
    })

    // 初始化坐标粒度为整数坐标
    if (drawBoard.shapePlugin) {
      drawBoard.shapePlugin.setCoordinateGrid(1)
      currentCoordinateGrid.value = 1
    }
  }
})

onUnmounted(() => {
  // 清理资源
  if (drawBoard) {
    drawBoard.destroy()
  }
})

// 添加矩形
const addRectangle = () => {
  if (drawBoard?.shapePlugin) {
    const randomColor = `hsl(${Math.random() * 360}, 70%, 60%)`
    const rectId = Date.now().toString()

    drawBoard?.shapePlugin.addRectangle({
      left: Math.random() * 300 + 50,
      top: Math.random() * 200 + 50,
      width: 200,
      height: 160,
      fill: randomColor,
      interactive: true,
      data: {
        id: rectId,
        DrawType: 'rectangle',
      },
    })
  }
}

// 添加多边形
const addPolygon = () => {
  if (drawBoard?.shapePlugin) {
    const randomColor = `hsl(${Math.random() * 360}, 70%, 60%)`
    const polygonId = Date.now().toString()

    drawBoard?.shapePlugin.addPolygon({
      center: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      },
      radius: 60 + Math.random() * 40, // 随机半径 60-100
      pointCount: 10, // 固定10个点
      fill: randomColor,
      stroke: '#333',
      strokeWidth: 2,
      interactive: true, // 默认可交互
      data: {
        id: polygonId,
        DrawType: 'polygon',
      },
    })
  }
}

// 添加点
const addPoint = () => {
  if (drawBoard?.shapePlugin) {
    const randomColor = `hsl(${Math.random() * 360}, 70%, 60%)`
    const pointId = Date.now().toString()

    drawBoard?.shapePlugin.addPoint({
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      radius: 8, // 点的半径
      fill: randomColor,
      stroke: '#333',
      strokeWidth: 2,
      interactive: true, // 默认可交互
      data: {
        id: pointId,
        DrawType: 'point',
      },
    })
  }
}

// 清空画布
const clearCanvas = () => {
  if (drawBoard) {
    drawBoard.canvas.clear()
  }
}

// 放大
const zoomIn = () => {
  if (drawBoard) {
    const currentZoom = drawBoard.canvas.getZoom()
    drawBoard.zoom(currentZoom * 1.2)
  }
}

// 缩小
const zoomOut = () => {
  if (drawBoard) {
    const currentZoom = drawBoard.canvas.getZoom()
    drawBoard.zoom(currentZoom * 0.8)
  }
}

// 加载图片
const loadImage = async () => {
  if (!drawBoard) return

  loading.value = true
  try {
    await drawBoard.load('/example/assets/1.jpg')
    console.log('图片加载成功')
  } catch (error) {
    console.error('图片加载失败:', error)
    alert('图片加载失败，请检查图片路径是否正确')
  } finally {
    loading.value = false
  }
}

// 切换矩形控制状态
const toggleShapesControl = () => {
  if (!drawBoard?.shapePlugin) {
    console.warn('ShapePlugin not available')
    return
  }

  // 切换所有矩形的可控制状态
  drawBoard.shapePlugin.toggleAllShapesInteractivity()

  // 更新响应式变量
  shapesInteractive.value = drawBoard.shapePlugin.getCurrentInteractivityState()

  console.log(`矩形控制状态已切换为: ${shapesInteractive.value ? '可控制' : '不可控制'}`)
}
</script>

<style scoped>
.drawboard-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.toolbar h2 {
  margin: 0;
  color: #2c3e50;
}

.toolbar-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #e74c3c;
  color: white;
}

.btn-secondary:hover {
  background-color: #c0392b;
}

.btn-outline {
  background-color: transparent;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
}

.btn-outline:hover {
  background-color: #ecf0f1;
}

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover {
  background-color: #229954;
}

.btn-success:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover {
  background-color: #e67e22;
}

.btn-info {
  background-color: #3498db;
  color: white;
}

.btn-info:hover {
  background-color: #2980b9;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

#drawboard-canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 600px;
  height: 400px;
}

.info-panel {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.info-panel h3 {
  margin-top: 0;
  color: #2c3e50;
}

.info-panel ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-panel li {
  margin-bottom: 0.5rem;
  color: #7f8c8d;
}

/* 坐标粒度控制面板样式 */
.coordinate-grid-panel {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #27ae60;
}

.coordinate-grid-panel h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.grid-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.current-grid {
  font-weight: bold;
  color: #27ae60;
  background-color: #d5f4e6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.grid-description {
  color: #7f8c8d;
  font-style: italic;
  font-size: 0.9rem;
}

.grid-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-grid {
  background-color: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.btn-grid:hover {
  background-color: #d5dbdb;
  border-color: #95a5a6;
}

.btn-grid.active {
  background-color: #27ae60;
  color: white;
  border-color: #27ae60;
}

.custom-grid {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.custom-grid label {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.grid-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  width: 80px;
  font-size: 0.9rem;
}

.grid-input:focus {
  outline: none;
  border-color: #27ae60;
  box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.2);
}

.btn-apply {
  background-color: #27ae60;
  color: white;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-apply:hover {
  background-color: #229954;
}

.grid-explanation {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f5e8;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
}

.grid-explanation p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-buttons {
    justify-content: center;
  }

  .canvas-container {
    min-height: 400px;
  }

  .preset-buttons {
    justify-content: center;
  }

  .custom-grid {
    justify-content: center;
  }

  .grid-info {
    justify-content: center;
    text-align: center;
  }
}
</style>
