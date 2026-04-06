<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DeeplinkTemplate, App, Environment } from '@/types'
import { useHistoryStore } from '@/stores/history'

const props = defineProps<{
  deeplink: DeeplinkTemplate
  app: App
}>()

const emit = defineEmits<{ close: [] }>()

const historyStore = useHistoryStore()

// Selected environment
const selectedEnvIndex = ref(0)
const selectedEnv = computed<Environment | null>(
  () => props.app.environments[selectedEnvIndex.value] ?? null
)

// Extract path params from `:paramName` tokens
const pathParams = computed<string[]>(() => {
  const matches = props.deeplink.path.match(/:[a-zA-Z]+/g) ?? []
  return matches.map(m => m.slice(1))
})

// State for path param values
const pathValues = ref<Record<string, string>>({})

// State for query param values
const queryValues = ref<Record<string, string | boolean | string[]>>({})

// Initialize states when deeplink changes
watch(
  () => props.deeplink,
  () => {
    pathValues.value = {}
    queryValues.value = {}
    for (const key of pathParams.value) {
      pathValues.value[key] = ''
    }
    for (const [key, type] of Object.entries(props.deeplink.queryParams)) {
      if (type === 'boolean') {
        queryValues.value[key] = false
      } else if (type === 'list') {
        queryValues.value[key] = ['']
      } else {
        queryValues.value[key] = ''
      }
    }
  },
  { immediate: true }
)

function addListItem(key: string) {
  const arr = queryValues.value[key] as string[]
  queryValues.value[key] = [...arr, '']
}

function removeListItem(key: string, index: number) {
  const arr = queryValues.value[key] as string[]
  queryValues.value[key] = arr.filter((_, i) => i !== index)
}

function updateListItem(key: string, index: number, val: string) {
  const arr = [...(queryValues.value[key] as string[])]
  arr[index] = val
  queryValues.value[key] = arr
}

// Build URI
const builtUri = computed<string>(() => {
  const env = selectedEnv.value
  if (!env) return ''

  // Fill path params
  let filledPath = props.deeplink.path
  for (const [key, val] of Object.entries(pathValues.value)) {
    filledPath = filledPath.replace(`:${key}`, encodeURIComponent(val || `:${key}`))
  }

  // Build query string
  const queryParts: string[] = []
  for (const [key, type] of Object.entries(props.deeplink.queryParams)) {
    const val = queryValues.value[key]
    if (type === 'boolean') {
      if (val === true) queryParts.push(`${encodeURIComponent(key)}=true`)
    } else if (type === 'list') {
      const arr = (val as string[]).filter(v => v.trim())
      for (const item of arr) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
      }
    } else {
      const str = val as string
      if (str.trim()) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(str)}`)
      }
    }
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  const fragment = props.deeplink.fragment ? `#${props.deeplink.fragment}` : ''

  return `${env.scheme}://${props.deeplink.host}${filledPath}${queryString}${fragment}`
})

function launch() {
  if (!selectedEnv.value) return
  const uri = builtUri.value
  window.open(uri)
  historyStore.addEntry({
    deeplinkName: props.deeplink.name,
    uri,
    environment: selectedEnv.value.name,
  })
  emit('close')
}

function copyUri() {
  navigator.clipboard.writeText(builtUri.value)
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click="onOverlayClick">
    <div class="modal launch-modal">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <div class="modal-title">{{ deeplink.name }}</div>
          <div class="modal-subtitle" v-if="deeplink.description">{{ deeplink.description }}</div>
        </div>
        <button class="modal-close" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Environment selector -->
        <div v-if="app.environments.length > 0" class="section">
          <div class="section-label">Environment</div>
          <div class="env-tabs">
            <button
              v-for="(env, idx) in app.environments"
              :key="idx"
              :class="['env-tab', { active: selectedEnvIndex === idx }]"
              @click="selectedEnvIndex = idx"
            >
              {{ env.name }}
            </button>
          </div>
        </div>

        <div v-else class="error-message">
          This app has no environments configured.
        </div>

        <!-- Path params -->
        <div v-if="pathParams.length > 0" class="section">
          <div class="section-label">Path Parameters</div>
          <div class="params-list">
            <div
              v-for="param in pathParams"
              :key="param"
              class="param-row"
            >
              <label class="param-label">{{ param }}</label>
              <input
                v-model="pathValues[param]"
                class="form-input"
                :placeholder="`Enter ${param}`"
              />
            </div>
          </div>
        </div>

        <!-- Query params -->
        <div
          v-if="Object.keys(deeplink.queryParams).length > 0"
          class="section"
        >
          <div class="section-label">Query Parameters</div>
          <div class="params-list">
            <template
              v-for="[key, type] in Object.entries(deeplink.queryParams)"
              :key="key"
            >
              <!-- String -->
              <div v-if="type === 'string'" class="param-row">
                <label class="param-label">
                  {{ key }}
                  <span class="param-type">string</span>
                </label>
                <input
                  v-model="(queryValues[key] as string)"
                  class="form-input"
                  :placeholder="`Enter ${key}`"
                />
              </div>

              <!-- Boolean -->
              <div v-else-if="type === 'boolean'" class="param-row param-row-bool">
                <label class="param-label">
                  {{ key }}
                  <span class="param-type">boolean</span>
                </label>
                <label class="toggle">
                  <input type="checkbox" v-model="(queryValues[key] as boolean)" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- List -->
              <div v-else-if="type === 'list'" class="param-row param-row-list">
                <label class="param-label">
                  {{ key }}
                  <span class="param-type">list</span>
                </label>
                <div class="list-items">
                  <div
                    v-for="(item, idx) in (queryValues[key] as string[])"
                    :key="idx"
                    class="list-item-row"
                  >
                    <input
                      :value="item"
                      class="form-input"
                      :placeholder="`Item ${idx + 1}`"
                      @input="updateListItem(key, idx, ($event.target as HTMLInputElement).value)"
                    />
                    <button
                      type="button"
                      class="list-remove-btn"
                      @click="removeListItem(key, idx)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    class="add-list-btn"
                    @click="addListItem(key)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add item
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- URI Preview -->
        <div class="section">
          <div class="section-label-row">
            <span class="section-label">URI Preview</span>
            <button class="copy-btn" @click="copyUri" title="Copy URI">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <div class="uri-preview">{{ builtUri || '(select an environment)' }}</div>
        </div>

        <!-- Actions -->
        <div class="launch-actions">
          <button class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button
            class="btn btn-primary launch-btn"
            :disabled="!selectedEnv"
            @click="launch"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Launch
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.launch-modal {
  max-width: 580px;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.env-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.env-tab {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.env-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.env-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-row-bool {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.param-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-type {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  padding: 1px 5px;
  border-radius: 3px;
}

.param-row-list {
  flex-direction: column;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-item-row {
  display: flex;
  gap: 6px;
}

.list-remove-btn {
  width: 34px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

.list-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.add-list-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.add-list-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.12s, color 0.12s;
}

.copy-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-primary);
}

.launch-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.launch-btn {
  min-width: 110px;
  justify-content: center;
}
</style>
