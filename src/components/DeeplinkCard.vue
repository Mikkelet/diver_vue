<script setup lang="ts">
import {computed} from 'vue'
import type {DeeplinkTemplate, Environment, UrlForm} from '@/types'
import {useFavoritesStore} from '@/stores/favorites'
import {normalizeScheme} from '@/lib/deeplinkUrl'

const props = defineProps<{
  deeplink: DeeplinkTemplate
  environment: Environment | null
  urlForm?: UrlForm
}>()

// In https form the link domain is the authority and the deeplink's host
// becomes the first path segment, so the split between "prefix" and "host"
// moves — see buildBaseUrl, which the launch modal builds the real URL with.
const prefix = computed(() => {
  const env = props.environment
  if (!env) return ''
  if (props.urlForm === 'https' && env.linkDomain) return `https://${env.linkDomain}/`
  const scheme = normalizeScheme(env.scheme)
  return scheme ? `${scheme}://` : ''
})

const emit = defineEmits<{
  launch: [deeplink: DeeplinkTemplate]
}>()

const favorites = useFavoritesStore()
const isFavorite = computed(() => favorites.isFavorite(props.deeplink.id))

function toggleFavorite(event: Event) {
  event.stopPropagation()
  favorites.toggle(props.deeplink.id)
}

const paramCount = Object.keys(props.deeplink.queryParams).length
</script>

<template>
  <div class="deeplink-card" @click="emit('launch', deeplink)">
    <button
      class="favorite-btn"
      :class="{ 'favorite-btn--active': isFavorite }"
      :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      :aria-pressed="isFavorite"
      @click="toggleFavorite"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
    <div class="deeplink-main">
      <div class="deeplink-header">
        <span class="deeplink-name">{{ deeplink.name }}</span>
        <div class="deeplink-badges">
          <span v-if="paramCount > 0" class="badge">{{ paramCount }} params</span>
        </div>
      </div>
      <div class="deeplink-path">
        <span v-if="prefix" class="path-scheme">{{ prefix }}</span>
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

.favorite-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.favorite-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.favorite-btn--active,
.favorite-btn--active:hover {
  color: #f5b301;
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
