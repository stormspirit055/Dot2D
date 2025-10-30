<template>
  <div class="plugins-page">
    <div class="page-header">
      <h1>插件功能展示</h1>
      <p>基于插件化架构的功能模块演示</p>
    </div>

    <div class="plugins-grid">
      <!-- 滚轮缩放插件 -->
      <div class="plugin-card">
        <div class="plugin-header">
          <h3>🔍 滚轮缩放插件</h3>
          <span class="plugin-status active">已启用</span>
        </div>
        <div class="plugin-content">
          <p>通过鼠标滚轮实现画布的缩放功能</p>
          <div class="plugin-features">
            <span class="feature-tag">缩放控制</span>
            <span class="feature-tag">最大/最小限制</span>
            <span class="feature-tag">平滑缩放</span>
          </div>
          <div class="plugin-config">
            <h4>配置选项：</h4>
            <ul>
              <li>scale: 0.1 (缩放步长)</li>
              <li>maxZoom: 3 (最大缩放)</li>
              <li>minZoom: 0.1 (最小缩放)</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 画布拖拽插件 -->
      <div class="plugin-card">
        <div class="plugin-header">
          <h3>🖱️ 画布拖拽插件</h3>
          <span class="plugin-status active">已启用</span>
        </div>
        <div class="plugin-content">
          <p>支持通过鼠标拖拽来平移画布视图</p>
          <div class="plugin-features">
            <span class="feature-tag">拖拽平移</span>
            <span class="feature-tag">鼠标事件</span>
            <span class="feature-tag">流畅体验</span>
          </div>
          <div class="plugin-config">
            <h4>事件监听：</h4>
            <ul>
              <li>mouse:down - 开始拖拽</li>
              <li>mouse:move - 拖拽移动</li>
              <li>mouse:up - 结束拖拽</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 图形管理插件 -->
      <div class="plugin-card">
        <div class="plugin-header">
          <h3>🎨 图形管理插件</h3>
          <span class="plugin-status active">已启用</span>
        </div>
        <div class="plugin-content">
          <p>管理画布上的图形对象，支持添加和删除操作</p>
          <div class="plugin-features">
            <span class="feature-tag">图形创建</span>
            <span class="feature-tag">事件触发</span>
            <span class="feature-tag">数据管理</span>
          </div>
          <div class="plugin-config">
            <h4>支持功能：</h4>
            <ul>
              <li>addRectangle() - 添加矩形</li>
              <li>removeShape() - 删除图形</li>
              <li>自定义数据字段支持</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 插件架构说明 -->
      <div class="plugin-card architecture">
        <div class="plugin-header">
          <h3>🏗️ 插件架构</h3>
          <span class="plugin-status info">架构说明</span>
        </div>
        <div class="plugin-content">
          <p>基于 BasePlugin 基类的插件化架构设计</p>
          <div class="architecture-flow">
            <div class="flow-item">
              <strong>BasePlugin</strong>
              <span>基础插件类</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-item">
              <strong>具体插件</strong>
              <span>继承并实现功能</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-item">
              <strong>DrawBoard</strong>
              <span>注册并使用插件</span>
            </div>
          </div>
          <div class="plugin-config">
            <h4>核心特性：</h4>
            <ul>
              <li>职责分离 - 功能模块化</li>
              <li>松耦合 - 独立开发测试</li>
              <li>可扩展 - 易于添加新功能</li>
              <li>类型安全 - TypeScript 支持</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2>插件演示</h2>
      <p>
        前往
        <router-link to="/drawboard" class="demo-link">绘图板页面</router-link>
        体验所有插件功能的实际效果
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 3 Composition API
</script>

<style scoped>
.plugins-page {
  padding: 2rem 0;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.plugin-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.plugin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plugin-card.architecture {
  grid-column: 1 / -1;
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.plugin-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.plugin-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.plugin-status.active {
  background-color: rgba(46, 204, 113, 0.2);
  color: #27ae60;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.plugin-status.info {
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.plugin-content {
  padding: 1.5rem;
}

.plugin-content p {
  color: #7f8c8d;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.plugin-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.feature-tag {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.plugin-config h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.plugin-config ul {
  margin: 0;
  padding-left: 1.5rem;
}

.plugin-config li {
  color: #7f8c8d;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.architecture-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  min-width: 120px;
}

.flow-item strong {
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.flow-item span {
  color: #7f8c8d;
  font-size: 0.8rem;
  text-align: center;
}

.flow-arrow {
  color: #3498db;
  font-size: 1.5rem;
  font-weight: bold;
}

.demo-section {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 12px;
}

.demo-section h2 {
  margin-bottom: 1rem;
}

.demo-link {
  color: white;
  text-decoration: underline;
  font-weight: 500;
}

.demo-link:hover {
  text-decoration: none;
}

@media (max-width: 768px) {
  .plugins-grid {
    grid-template-columns: 1fr;
  }

  .architecture-flow {
    flex-direction: column;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }

  .plugin-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
