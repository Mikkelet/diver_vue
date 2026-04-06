import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'diver_theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(
    localStorage.getItem(STORAGE_KEY)
      ? localStorage.getItem(STORAGE_KEY) === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  // Apply on init
  applyTheme()

  watch(isDark, applyTheme)

  return { isDark, toggleTheme }
})
