<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLogsStore, type LogLevel } from '@/stores/logs'
import AppLayout from '@/components/AppLayout.vue'

const logsStore = useLogsStore()

const activeFilter = ref<LogLevel | 'all'>('all')

const filters: { label: string; value: LogLevel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Log', value: 'log' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
]

const filtered = computed(() =>
  activeFilter.value === 'all'
    ? logsStore.entries
    : logsStore.entries.filter((e) => e.level === activeFilter.value),
)

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function clearLogs() {
  if (confirm('Clear all logs?')) {
    logsStore.clear()
  }
}
</script>

<template>
  <AppLayout>
    <div class="debug-view">
      <div class="content-header">
        <div>
          <h1 class="page-title">Debug Logs</h1>
          <div class="page-subtitle">{{ logsStore.entries.length }} entries captured this session</div>
        </div>
        <button
          v-if="logsStore.entries.length > 0"
          class="btn btn-danger btn-sm"
          @click="clearLogs"
        >
          Clear
        </button>
      </div>

      <div class="toolbar">
        <button
          v-for="f in filters"
          :key="f.value"
          :class="['filter-btn', f.value, { active: activeFilter === f.value }]"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon">🪵</div>
        <h3>No logs</h3>
        <p>Console output will be captured here.</p>
      </div>

      <div v-else class="log-list">
        <div
          v-for="entry in filtered"
          :key="entry.id"
          :class="['log-entry', `log-entry--${entry.level}`]"
        >
          <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
          <span :class="['log-level', `log-level--${entry.level}`]">{{ entry.level }}</span>
          <pre class="log-message">{{ entry.message }}</pre>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.debug-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  gap: 12px;
  flex-shrink: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.toolbar {
  display: flex;
  gap: 6px;
  padding: 0 24px 12px;
  flex-shrink: 0;
}

.filter-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.12s;
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--color-surface-raised);
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

.filter-btn.warn.active { color: #f59e0b; border-color: #f59e0b80; background: #f59e0b15; }
.filter-btn.error.active { color: #ef4444; border-color: #ef444480; background: #ef444415; }
.filter-btn.info.active { color: #3b82f6; border-color: #3b82f680; background: #3b82f615; }

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-muted);
  padding: 40px;
}

.empty-state-icon {
  font-size: 40px;
  margin-bottom: 4px;
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-entry {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid transparent;
  background: var(--color-surface);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.log-entry--warn {
  border-left-color: #f59e0b;
  background: #f59e0b08;
}

.log-entry--error {
  border-left-color: #ef4444;
  background: #ef444408;
}

.log-entry--info {
  border-left-color: #3b82f6;
  background: #3b82f608;
}

.log-time {
  color: var(--color-text-muted);
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.log-level {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.log-level--log   { color: var(--color-text-muted); background: var(--color-surface-raised); }
.log-level--info  { color: #3b82f6; background: #3b82f615; }
.log-level--warn  { color: #f59e0b; background: #f59e0b15; }
.log-level--error { color: #ef4444; background: #ef444415; }

.log-message {
  flex: 1;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .content-header {
    padding: 16px 16px 12px;
  }
  .toolbar {
    padding: 0 16px 10px;
  }
  .log-list {
    padding: 0 16px 16px;
  }
}
</style>
