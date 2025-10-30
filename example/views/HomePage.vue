<template>
  <div class="home">
    <div class="hero-section">
      <h1 class="hero-title">欢迎使用 Dot2D</h1>
      <p class="hero-subtitle">基于插件化架构的 2D 绘图工具</p>
      <div class="hero-buttons">
        <router-link to="/drawboard" class="btn btn-primary"> 开始绘图 </router-link>
        <router-link to="/plugins" class="btn btn-secondary"> 查看插件 </router-link>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">核心特性</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>绘图功能</h3>
          <p>支持多种图形绘制，包括矩形、圆形等基础图形</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔧</div>
          <h3>插件化架构</h3>
          <p>基于插件系统，功能模块化，易于扩展和维护</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>高性能</h3>
          <p>基于 Fabric.js 和 Canvas，提供流畅的绘图体验</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>交互体验</h3>
          <p>支持缩放、拖拽、旋转等丰富的交互操作</p>
        </div>
      </div>
    </div>

    <div class="tech-section">
      <h2 class="section-title">技术栈</h2>
      <div class="tech-list">
        <span class="tech-tag">Vue 3</span>
        <span class="tech-tag">TypeScript</span>
        <span class="tech-tag">Fabric.js</span>
        <span class="tech-tag">Canvas</span>
        <span class="tech-tag">Vite</span>
        <span class="tech-tag">插件化架构</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 3 Composition API
</script>

<style scoped>
.home {
  padding: 2rem 0;
}

.hero-section {
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background-color: #fff;
  color: #667eea;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: white;
  color: #667eea;
  transform: translateY(-2px);
}

.features-section {
  margin-bottom: 4rem;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

.tech-section {
  text-align: center;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.tech-tag {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
