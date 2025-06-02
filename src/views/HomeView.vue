<template>
  <div id="container"></div>
  <NButton @click="handleZoomToFit" type="primary">按钮</NButton>
  {{ zoom }}
</template>
<script setup lang="ts">
import { NButton } from 'naive-ui'
import { onMounted, ref } from 'vue'
import Project from '../modules/Project'
import url from '../assets/1.jpg'
const zoom = ref(1)
let project: Project
onMounted(() => {
  project = new Project({
    container: '#container',
    url: url,
  })
  project.load()
  project.drawborads[0].on('zoom', (e) => {
    zoom.value = e
  })
  zoom.value = project.drawborads[0].getZoom
})
const handleZoomToFit = () => {
  project.drawborads[0].rotate(90)
}
</script>
<style lang="less" scoped>
#container {
  width: 100%;
  height: 100%;
  border: 1px solid #000;
}
</style>
