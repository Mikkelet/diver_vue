<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import type {DeeplinkTemplate, App, Environment} from '@/types'
import {useHistoryStore} from '@/stores/history'

const props = defineProps<{
  deeplink: DeeplinkTemplate
  app: App
  environment: Environment
  orgId: string
  initialPathValues?: Record<string, string>
  initialQueryValues?: Record<string, string | boolean | string[]>
  hideActions?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: [deeplink: DeeplinkTemplate]
  delete: [deeplinkId: string]
}>()

const historyStore = useHistoryStore()

const selectedEnv = computed(() => props.environment)

// Extract path params from `:paramName` tokens
const pathParams = computed<string[]>(() => {
  const matches = (props.deeplink.path ?? '').match(/:[a-zA-Z]+/g) ?? []
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
      const initPath = props.initialPathValues
      const initQuery = props.initialQueryValues
      pathValues.value = {}
      queryValues.value = {}
      for (const key of pathParams.value) {
        pathValues.value[key] = initPath?.[key] ?? ''
      }
      for (const [key, { type }] of Object.entries(props.deeplink.queryParams)) {
        const seed = initQuery?.[key]
        if (type === 'boolean') {
          queryValues.value[key] = typeof seed === 'boolean' ? seed : false
        } else if (type === 'list') {
          queryValues.value[key] = Array.isArray(seed) && seed.length > 0 ? [...seed] : ['']
        } else {
          queryValues.value[key] = typeof seed === 'string' ? seed : ''
        }
      }
    },
    {immediate: true}
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

const unfilledParams = computed(() =>
    pathParams.value.filter(p => !pathValues.value[p]?.trim())
)

// Required query params that still have no value. A boolean is always satisfied
// (the toggle always holds true/false); strings and lists must be non-empty.
const unfilledRequiredQuery = computed(() =>
    Object.entries(props.deeplink.queryParams)
        .filter(([key, param]) => {
          if (!param.required) return false
          const val = queryValues.value[key]
          if (param.type === 'boolean') return false
          if (param.type === 'list') {
            return !Array.isArray(val) || val.every(v => !v.trim())
          }
          return typeof val !== 'string' || !val.trim()
        })
        .map(([key]) => key)
)

const canLaunch = computed(() =>
    unfilledParams.value.length === 0 && unfilledRequiredQuery.value.length === 0
)

// Build URI
const builtUri = computed<string>(() => {
  const env = selectedEnv.value
  if (!env) return ''

  // Normalize scheme: strip trailing :// or : if the user included it
  const scheme = env.scheme.replace(/:\/?\/?$/, '')

  // Fill path params
  let filledPath = props.deeplink.path ?? ''
  for (const [key, val] of Object.entries(pathValues.value)) {
    filledPath = filledPath.replace(`:${key}`, val.trim() || `:${key}`)
  }
  // Ensure path starts with / when non-empty
  if (filledPath && !filledPath.startsWith('/')) filledPath = `/${filledPath}`

  // Build query string
  const queryParts: string[] = []
  for (const [key, { type }] of Object.entries(props.deeplink.queryParams)) {
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
  const fragment = props.deeplink.fragment ? `#${encodeURIComponent(props.deeplink.fragment)}` : ''

  return `${scheme}://${props.deeplink.host}${filledPath}${queryString}${fragment}`
})

function launch() {
  if (!selectedEnv.value || !canLaunch.value) return
  const uri = builtUri.value
  window.open(uri)
  historyStore.addEntry({
    deeplinkName: props.deeplink.name,
    uri,
    environment: selectedEnv.value.name,
    orgId: props.orgId,
    deeplink: props.deeplink,
    app: props.app,
    environmentSnapshot: selectedEnv.value,
    pathValues: {...pathValues.value},
    queryValues: JSON.parse(JSON.stringify(queryValues.value)),
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
        <div class="modal-header-actions">
          <span v-if="!hideActions && deeplink.imported" class="imported-badge" title="This deeplink was imported and cannot be edited">
            Imported
          </span>
          <button v-else-if="!hideActions" class="action-btn" title="Edit deeplink" @click="emit('edit', deeplink)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button v-if="!hideActions" class="action-btn action-btn-danger" title="Delete deeplink" @click="emit('delete', deeplink.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
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
                v-for="[key, param] in Object.entries(deeplink.queryParams)"
                :key="key"
            >
              <!-- String -->
              <div v-if="param.type === 'string'" class="param-row">
                <label class="param-label">
                  {{ key }}
                  <span v-if="param.required" class="param-required" title="Required">*</span>
                  <span class="param-type">string</span>
                </label>
                <input
                    v-model="(queryValues[key] as string)"
                    class="form-input"
                    :placeholder="`Enter ${key}`"
                />
              </div>

              <!-- Boolean -->
              <div v-else-if="param.type === 'boolean'" class="param-row param-row-bool">
                <label class="param-label">
                  {{ key }}
                  <span v-if="param.required" class="param-required" title="Required">*</span>
                  <span class="param-type">boolean</span>
                </label>
                <label class="toggle">
                  <input type="checkbox" v-model="(queryValues[key] as boolean)"/>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- List -->
              <div v-else-if="param.type === 'list'" class="param-row param-row-list">
                <label class="param-label">
                  {{ key }}
                  <span v-if="param.required" class="param-required" title="Required">*</span>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <button
                      type="button"
                      class="add-list-btn"
                      @click="addListItem(key)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5">
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
        <div v-if="unfilledParams.length > 0" class="error-message" style="margin-bottom: 12px">
          Fill required path params: {{ unfilledParams.join(', ') }}
        </div>
        <div v-if="unfilledRequiredQuery.length > 0" class="error-message" style="margin-bottom: 12px">
          Fill required query params: {{ unfilledRequiredQuery.join(', ') }}
        </div>
        <div class="launch-actions">
          <button class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button
              class="btn btn-primary launch-btn"
              :disabled="!canLaunch"
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

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
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

.imported-badge {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: not-allowed;
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

.param-required {
  color: var(--color-error);
  font-weight: 700;
  margin-left: -2px;
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
