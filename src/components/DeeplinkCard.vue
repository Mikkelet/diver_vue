<script setup lang="ts">
import type {DeeplinkTemplate, Environment} from '@/types'

const props = defineProps<{
  deeplink: DeeplinkTemplate
  orgId: string
  appId: string
  environment: Environment | null
}>()

const emit = defineEmits<{
  launch: [deeplink: DeeplinkTemplate]
}>()

const paramCount = Object.keys(props.deeplink.queryParams).length
</script>

<template>
  <div class="deeplink-card" @click="emit('launch', deeplink)">
    <div class="deeplink-main">
      <div class="deeplink-header">
        <span class="deeplink-name">{{ deeplink.name }}</span>
        <div class="deeplink-badges">
          <span v-if="paramCount > 0" class="badge">{{ paramCount }} params</span>
        </div>
      </div>
      <div class="deeplink-path">
        <span v-if="environment" class="path-scheme">{{ environment.scheme.replace(/:\/?\/?$/, '') }}://</span>
        <span class="path-host">{{ deeplink.host }}</span>
        <span class="path-segment">{{ deeplink.path?.startsWith('/') ? deeplink.path : `/${deeplink.path || ''}` }}</span>
      </div>
      <div v-if="deeplink.description" class="deeplink-desc">
        {{ deeplink.description }}
      </div>
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

.path-scheme {
  color: var(--color-text-muted);
  opacity: 0.6;
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
</style>
