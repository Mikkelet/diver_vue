<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { App } from '@/types'

const props = defineProps<{
  app: App
  orgId: string
}>()

const router = useRouter()

function open() {
  router.push(`/org/${props.orgId}/app/${props.app.id}`)
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
</style>
