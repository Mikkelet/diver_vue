import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'diver_favorites'

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveToStorage(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<Set<string>>(loadFromStorage())

  function isFavorite(deeplinkId: string): boolean {
    return ids.value.has(deeplinkId)
  }

  function toggle(deeplinkId: string) {
    const next = new Set(ids.value)
    if (next.has(deeplinkId)) next.delete(deeplinkId)
    else next.add(deeplinkId)
    ids.value = next
    saveToStorage(next)
  }

  return { ids, isFavorite, toggle }
})
