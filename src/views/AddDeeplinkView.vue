<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationsStore } from '@/stores/organizations'
import { createDeeplink, getDeeplink, updateDeeplink, getApp } from '@/api/client'
import type { QueryParamType } from '@/types'
import AppLayout from '@/components/AppLayout.vue'
import QueryParamEditor from '@/components/QueryParamEditor.vue'

const route = useRoute()
const router = useRouter()
const orgStore = useOrganizationsStore()

const orgId = route.params.orgId as string
const appId = route.params.appId as string
const deeplinkId = route.params.deeplinkId as string | undefined
const isEdit = computed(() => !!deeplinkId)

// Form fields
const name = ref('')
const description = ref('')
const host = ref('')
const path = ref('')
const fragment = ref('')
const queryParams = ref<Record<string, QueryParamType>>({})

const loading = ref(false)
const error = ref<string | null>(null)
const initialLoading = ref(false)

const org = computed(() => orgStore.organizations.find(o => o.id === orgId))
const appName = ref('')

const importUri = ref('')
const importError = ref<string | null>(null)

function parseUri() {
  importError.value = null
  const raw = importUri.value.trim()
  if (!raw) return

  try {
    const schemeEnd = raw.indexOf('://')
    if (schemeEnd === -1) {
      importError.value = 'URI must contain :// (e.g. scheme://host/path)'
      return
    }

    const afterScheme = raw.slice(schemeEnd + 3)

    // Split off fragment
    const hashIdx = afterScheme.indexOf('#')
    const beforeFragment = hashIdx >= 0 ? afterScheme.slice(0, hashIdx) : afterScheme
    const fragmentPart = hashIdx >= 0 ? decodeURIComponent(afterScheme.slice(hashIdx + 1)) : ''

    // Split off query string
    const qIdx = beforeFragment.indexOf('?')
    const beforeQuery = qIdx >= 0 ? beforeFragment.slice(0, qIdx) : beforeFragment
    const queryString = qIdx >= 0 ? beforeFragment.slice(qIdx + 1) : ''

    // Extract host and path
    const firstSlash = beforeQuery.indexOf('/')
    const parsedHost = firstSlash >= 0 ? beforeQuery.slice(0, firstSlash) : beforeQuery
    const parsedPath = firstSlash >= 0 ? decodeURIComponent(beforeQuery.slice(firstSlash)) : ''

    if (!parsedHost) {
      importError.value = 'Could not extract host from URI'
      return
    }

    // Parse query params — infer types from values
    const parsedParams: Record<string, QueryParamType> = {}
    if (queryString) {
      const seen = new Set<string>()
      for (const pair of queryString.split('&')) {
        const eqIdx = pair.indexOf('=')
        const key = decodeURIComponent(eqIdx >= 0 ? pair.slice(0, eqIdx) : pair)
        const val = eqIdx >= 0 ? decodeURIComponent(pair.slice(eqIdx + 1)) : ''

        if (!key) continue

        if (seen.has(key)) {
          parsedParams[key] = 'list'
        } else {
          seen.add(key)
          if (val === 'true' || val === 'false' || val === 'boolean') {
            parsedParams[key] = 'boolean'
          } else if (val === 'list') {
            parsedParams[key] = 'list'
          } else {
            parsedParams[key] = 'string'
          }
        }
      }
    }

    host.value = parsedHost
    path.value = parsedPath
    fragment.value = fragmentPart
    queryParams.value = parsedParams
    importUri.value = ''
  } catch {
    importError.value = 'Failed to parse URI'
  }
}

onMounted(async () => {
  initialLoading.value = true
  try {
    // Load app name
    const app = await getApp(orgId, appId)
    appName.value = app.name

    if (isEdit.value && deeplinkId) {
      const dl = await getDeeplink(orgId, appId, deeplinkId)
      name.value = dl.name ?? ''
      description.value = dl.description ?? ''
      host.value = dl.host ?? ''
      path.value = dl.path ?? ''
      fragment.value = dl.fragment ?? ''
      queryParams.value = { ...dl.queryParams }
    }
  } catch {
    error.value = 'Failed to load data'
  } finally {
    initialLoading.value = false
  }
})

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'Deeplink name is required'
    return
  }
  if (!host.value.trim()) {
    error.value = 'Host is required'
    return
  }
  const badSegment = [...path.value.matchAll(/:([^/]*)/g)]
    .map(m => m[1])
    .find(seg => !/^[a-zA-Z]+$/.test(seg))
  if (badSegment !== undefined) {
    error.value = `Dynamic path segment ":${badSegment}" must contain only alphabet characters`
    return
  }

  loading.value = true
  error.value = null

  const payload = {
    name: name.value.trim(),
    description: description.value.trim(),
    host: host.value.trim(),
    path: path.value.trim(),
    fragment: fragment.value.trim(),
    queryParams: queryParams.value,
  }

  try {
    if (isEdit.value && deeplinkId) {
      await updateDeeplink(orgId, appId, deeplinkId, payload)
    } else {
      await createDeeplink(orgId, appId, payload)
    }
    router.push(`/org/${orgId}/app/${appId}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save deeplink'
  } finally {
    loading.value = false
  }
}

const backUrl = computed(() => `/org/${orgId}/app/${appId}`)

// Live URI preview (using placeholder scheme)
const previewUri = computed(() => {
  if (!host.value) return ''
  const q = Object.keys(queryParams.value)
    .map(k => `${k}=…`)
    .join('&')
  const qStr = q ? `?${q}` : ''
  const frag = fragment.value ? `#${fragment.value}` : ''
  const p = path.value ? (path.value.startsWith('/') ? path.value : `/${path.value}`) : '/'
  return `[scheme]://${host.value}${p}${qStr}${frag}`
})
</script>

<template>
  <AppLayout>
    <div class="form-view">
      <div class="form-container">
        <div class="form-header">
          <RouterLink :to="backUrl" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </RouterLink>
          <div>
            <h1 class="form-title">{{ isEdit ? 'Edit Deeplink' : 'Add Deeplink' }}</h1>
            <div class="form-subtitle" v-if="appName">{{ org?.name }} › {{ appName }}</div>
          </div>
        </div>

        <div v-if="initialLoading" class="loading">
          <div class="spinner"></div>
          Loading…
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <div v-if="error" class="error-message">{{ error }}</div>

          <!-- Import from URI -->
          <div v-if="!isEdit" class="import-section">
            <div class="import-row">
              <input
                v-model="importUri"
                class="form-input import-input"
                placeholder="Paste a URI to prefill — e.g. scheme://host/path?key=string#frag"
                @keydown.enter.prevent="parseUri"
              />
              <button type="button" class="btn btn-secondary import-btn" @click="parseUri" :disabled="!importUri.trim()">
                Import
              </button>
            </div>
            <div v-if="importError" class="import-error">{{ importError }}</div>
            <div class="form-hint">
              Query param values set the type: <code>true</code>/<code>false</code>/<code>boolean</code> → boolean, <code>list</code> or duplicate keys → list, anything else → string.
            </div>
          </div>

          <!-- Basic info -->
          <div class="section-heading">Basic Info</div>

          <div class="form-group">
            <label class="form-label">Name</label>
            <input
              v-model="name"
              class="form-input"
              placeholder="e.g. Product Detail"
              autofocus
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <input
              v-model="description"
              class="form-input"
              placeholder="Optional description"
            />
          </div>

          <!-- URL structure -->
          <div class="section-heading">URL Structure</div>

          <div class="form-group">
            <label class="form-label">Host</label>
            <input
              v-model="host"
              class="form-input"
              placeholder="e.g. products"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Path</label>
            <input
              v-model="path"
              class="form-input"
              placeholder="e.g. /detail/:productId"
            />
            <div class="form-hint">Use <code>:paramName</code> for dynamic path segments.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Fragment <span class="optional">(optional)</span></label>
            <input
              v-model="fragment"
              class="form-input"
              placeholder="e.g. section1"
            />
          </div>

          <!-- URI Preview -->
          <div v-if="host" class="form-group">
            <label class="form-label">Preview</label>
            <div class="uri-preview">{{ previewUri }}</div>
          </div>

          <!-- Query params -->
          <div class="section-heading">Query Parameters</div>
          <div class="form-group">
            <QueryParamEditor v-model="queryParams" />
          </div>

          <div class="form-actions">
            <RouterLink :to="backUrl" class="btn btn-secondary">Cancel</RouterLink>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading"
            >
              <div v-if="loading" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
              {{ loading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Deeplink') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.form-view {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.form-container {
  width: 100%;
  max-width: 540px;
}

.form-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 28px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: background 0.12s;
  flex-shrink: 0;
  margin-top: 2px;
}

.back-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.form-title {
  font-size: 22px;
  font-weight: 700;
}

.form-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.section-heading {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 20px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.section-heading:first-of-type {
  margin-top: 0;
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.form-hint code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: var(--color-surface-raised);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
}

.import-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.import-row {
  display: flex;
  gap: 8px;
}

.import-input {
  flex: 1;
  min-width: 0;
}

.import-btn {
  flex-shrink: 0;
}

.import-error {
  font-size: 12px;
  color: var(--color-error, #e53e3e);
  margin-top: 6px;
}

.optional {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
</style>
