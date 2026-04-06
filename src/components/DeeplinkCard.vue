<script setup lang="ts">
import type { DeeplinkTemplate } from '@/types'

const props = defineProps<{
  deeplink: DeeplinkTemplate
  orgId: string
  appId: string
}>()

const emit = defineEmits<{
  launch: [deeplink: DeeplinkTemplate]
  edit: [deeplink: DeeplinkTemplate]
  delete: [deeplinkId: string]
}>()

function launch(e: Event) {
  e.stopPropagation()
  emit('launch', props.deeplink)
}

function editDeeplink(e: Event) {
  e.stopPropagation()
  emit('edit', props.deeplink)
}

function deleteDeeplink(e: Event) {
  e.stopPropagation()
  emit('delete', props.deeplink.id)
}

const paramCount = Object.keys(props.deeplink.queryParams).length
</script>

<template>
  <div class="deeplink-card" @click="launch">
    <div class="deeplink-main">
      <div class="deeplink-header">
        <span class="deeplink-name">{{ deeplink.name }}</span>
        <div class="deeplink-badges">
          <span v-if="paramCount > 0" class="badge">{{ paramCount }} params</span>
        </div>
      </div>
      <div class="deeplink-path">
        <span class="path-host">{{ deeplink.host }}</span>
        <span class="path-segment">{{ deeplink.path || '/' }}</span>
      </div>
      <div v-if="deeplink.description" class="deeplink-desc">
        {{ deeplink.description }}
      </div>
    </div>
    <div class="deeplink-actions">
      <button class="action-btn launch-btn" title="Launch deeplink" @click="launch">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button class="action-btn" title="Edit deeplink" @click="editDeeplink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn action-btn-danger" title="Delete deeplink" @click="deleteDeeplink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.deeplink-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.deeplink-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.deeplink-main {
  flex: 1;
  min-width: 0;
}

.deeplink-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.deeplink-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.deeplink-badges {
  display: flex;
  gap: 4px;
}

.deeplink-path {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.path-host {
  color: var(--color-primary);
  opacity: 0.8;
}

.path-segment {
  color: var(--color-text-muted);
}

.deeplink-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deeplink-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.deeplink-card:hover .deeplink-actions {
  opacity: 1;
}

.action-btn {
  width: 30px;
  height: 30px;
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

.action-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.action-btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.launch-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
