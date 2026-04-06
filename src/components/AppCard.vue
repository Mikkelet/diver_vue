<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { App } from '@/types'

const props = defineProps<{
  app: App
  orgId: string
}>()

const emit = defineEmits<{
  delete: [appId: string]
}>()

const router = useRouter()

function open() {
  router.push(`/org/${props.orgId}/app/${props.app.id}`)
}

function editApp(e: Event) {
  e.stopPropagation()
  router.push(`/org/${props.orgId}/app/${props.app.id}/edit-app`)
}

function deleteApp(e: Event) {
  e.stopPropagation()
  emit('delete', props.app.id)
}
</script>

<template>
  <div class="app-card" @click="open">
    <div class="app-card-main">
      <div class="app-icon">
        {{ app.name.charAt(0).toUpperCase() }}
      </div>
      <div class="app-info">
        <div class="app-name">{{ app.name }}</div>
        <div class="app-meta">
          <span class="badge">{{ app.deeplinksCount }} deeplinks</span>
          <span class="meta-dot">·</span>
          <span class="meta-text">{{ app.environments.length }} env{{ app.environments.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
    <div class="app-card-actions">
      <button class="action-btn" title="Edit app" @click="editApp">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn action-btn-danger" title="Delete app" @click="deleteApp">
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
.app-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.app-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.app-card:active {
  transform: scale(0.99);
}

.app-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.app-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary), #7c4dff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: var(--color-text-muted);
  font-size: 12px;
}

.meta-text {
  font-size: 12px;
  color: var(--color-text-muted);
}

.app-card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.app-card:hover .app-card-actions {
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
</style>
