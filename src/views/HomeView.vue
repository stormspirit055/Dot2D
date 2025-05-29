<script setup lang="ts">
import { onMounted } from 'vue'
import Project from '../modules/Project'
import url from '../assets/1.jpg'
onMounted(() => {
  const project = new Project({
    container: '#container',
    url: url,
  })
  project.load()
})
</script>

<template>
  <div id="container"></div>
</template>
<style lang="less" scoped>
#container {
  width: 100%;
  height: 100%;
  border: 1px solid #000;
}
</style>
