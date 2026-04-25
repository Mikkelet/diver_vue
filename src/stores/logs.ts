import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LogLevel = 'log' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

const MAX_ENTRIES = 500

function serialize(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a
      try {
        return JSON.stringify(a, null, 2)
      } catch {
        return String(a)
      }
    })
    .join(' ')
}

export const useLogsStore = defineStore('logs', () => {
  const entries = ref<LogEntry[]>([])
  let installed = false

  function addEntry(level: LogLevel, message: string) {
    entries.value.unshift({
      id: self.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      level,
      message,
    })
    if (entries.value.length > MAX_ENTRIES) {
      entries.value = entries.value.slice(0, MAX_ENTRIES)
    }
  }

  function install() {
    if (installed) return
    installed = true

    const origLog = console.log.bind(console)
    const origInfo = console.info.bind(console)
    const origWarn = console.warn.bind(console)
    const origError = console.error.bind(console)

    console.log = (...args: unknown[]) => {
      origLog(...args)
      addEntry('log', serialize(args))
    }
    console.info = (...args: unknown[]) => {
      origInfo(...args)
      addEntry('info', serialize(args))
    }
    console.warn = (...args: unknown[]) => {
      origWarn(...args)
      addEntry('warn', serialize(args))
    }
    console.error = (...args: unknown[]) => {
      origError(...args)
      addEntry('error', serialize(args))
    }
  }

  function clear() {
    entries.value = []
  }

  return { entries, install, clear }
})
