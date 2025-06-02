import { defineStore } from 'pinia'
import { ref } from 'vue'
import Project from '@/modules/Project'
import EventController from '@/modules/DrawBoard/midware/EventController'
export const useCoreStore = defineStore('coreStore', () => {
  const project = ref<Project | null>(null)
  const eventController = ref<EventController | null>(null)
  return {
    project,
    eventController,
  }
})
