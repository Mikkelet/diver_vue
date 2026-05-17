<script setup lang="ts">
import {computed} from 'vue'
import {useHistoryStore} from '@/stores/history'
import AppLayout from '@/components/AppLayout.vue'

const historyStore = useHistoryStore()

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function clearHistory() {
  if (confirm('Clear all launch history?')) {
    historyStore.clearHistory()
  }
}

async function copyUri(uri: string) {
  await navigator.clipboard.writeText(uri)
}

function relaunch(uri: string) {
  window.open(uri)
}

const grouped = computed(() => {
  const groups: { date: string; entries: typeof historyStore.entries }[] = []
  const seen: Record<string, number> = {}

  for (const entry of historyStore.entries) {
    const date = new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(
        new Date(entry.timestamp)
    )
    if (seen[date] === undefined) {
      seen[date] = groups.length
      groups.push({date, entries: []})
    }
    groups[seen[date]].entries.push(entry)
  }

  return groups
})
</script>

<template>
  <AppLayout>
    <div class="history-view">
      <div class="content-header">
        <div>
          <h1 class="page-title">Launch History</h1>
          <div class="page-subtitle">{{ historyStore.entries.length }} launches recorded</div>
        </div>
        <button
            v-if="historyStore.entries.length > 0"
            class="btn btn-danger btn-sm"
            @click="clearHistory"
        >
          Clear All
        </button>
      </div>

      <!-- Empty -->
      <div v-if="historyStore.entries.length === 0" class="empty-state">
        <div class="empty-state-icon">🕐</div>
        <h3>No launches yet</h3>
        <p>Deeplink launches will appear here.</p>
      </div>

      <!-- History grouped by date -->
      <div v-else class="history-content">
        <div
            v-for="group in grouped"
            :key="group.date"
            class="history-group"
        >
          <div class="group-date">{{ group.date }}</div>
          <div class="entries-list">
            <div
                v-for="entry in group.entries"
                :key="entry.id"
                class="history-entry"
            >
              <div class="entry-main">
                <div class="entry-header">
                  <span class="entry-name">{{ entry.deeplinkName }}</span>
                  <span class="env-badge">{{ entry.environment }}</span>
                  <span class="entry-time">{{ formatDate(entry.timestamp).split(',')[1]?.trim() }}</span>
                </div>
                <div class="entry-uri">{{ entry.uri }}</div>
              </div>
              <div class="entry-actions">
                <button
                    class="entry-btn"
                    title="Copy URI"
                    @click="copyUri(entry.uri)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
                <button
                    class="entry-btn launch-btn"
                    title="Re-launch"
                    @click="relaunch(entry.uri)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.history-view {
  height: 100%;
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  gap: 12px;
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

.history-content {
  padding: 0 24px 24px;
}

.history-group {
  margin-bottom: 24px;
}

.group-date {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color 0.12s;
}

.history-entry:hover {
  border-color: var(--color-primary);
}

.entry-main {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.entry-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.env-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(74, 158, 255, 0.15);
  color: var(--color-primary);
}

.entry-time {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-left: auto;
}

.entry-uri {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.12s;
}

.history-entry:hover .entry-actions {
  opacity: 1;
}

.entry-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.entry-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.launch-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

@media (max-width: 600px) {
  .content-header {
    padding: 16px 16px 12px;
  }

  .history-content {
    padding: 0 16px 16px;
  }
}
</style>
