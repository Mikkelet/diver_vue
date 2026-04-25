import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LaunchHistoryEntry } from '@/types'

const STORAGE_KEY = 'diver_history'

function loadFromStorage(): LaunchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(entries: LaunchHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<LaunchHistoryEntry[]>(loadFromStorage())

  function addEntry(entry: Omit<LaunchHistoryEntry, 'id' | 'timestamp'>) {
    const newEntry: LaunchHistoryEntry = {
      id: self.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      ...entry,
    }
    entries.value.unshift(newEntry)
    // Keep at most 100 entries
    if (entries.value.length > 100) {
      entries.value = entries.value.slice(0, 100)
    }
    saveToStorage(entries.value)
  }

  function clearHistory() {
    entries.value = []
    saveToStorage(entries.value)
  }

  return { entries, addEntry, clearHistory }
})
