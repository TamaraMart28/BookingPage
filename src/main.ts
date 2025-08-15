import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import '@/assets/style.css'
import { applyTheme } from './helpers'

function initTheme() {
  const saved = localStorage.getItem('theme') as 'light' | 'dark' | null

  if (saved) {
    applyTheme(saved)
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }
}
initTheme()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
