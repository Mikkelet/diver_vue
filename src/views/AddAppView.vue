<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useOrganizationsStore} from '@/stores/organizations'
import {createApp, deleteApp, getApp, updateApp} from '@/api/client'
import type {Environment} from '@/types'
import AppLayout from '@/components/AppLayout.vue'
import EnvironmentEditor from '@/components/EnvironmentEditor.vue'

const route = useRoute()
const router = useRouter()
const orgStore = useOrganizationsStore()

const orgId = route.params.orgId as string
const appId = route.params.appId as string | undefined
const isEdit = computed(() => !!appId)

const name = ref('')
const environments = ref<Environment[]>([{name: '', scheme: ''}])
const loading = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const initialLoading = ref(false)

const org = computed(() => orgStore.organizations.find(o => o.id === orgId))

onMounted(async () => {
  if (isEdit.value && appId) {
    initialLoading.value = true
    try {
      const app = await getApp(orgId, appId)
      name.value = app.name
      environments.value = app.environments.length > 0
          ? app.environments.map(e => ({...e}))
          : [{name: '', scheme: ''}]
    } catch {
      error.value = 'Failed to load app details'
    } finally {
      initialLoading.value = false
    }
  }
})

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'App name is required'
    return
  }

  const validEnvs = environments.value.filter(e => e.name.trim() && e.scheme.trim())

  // Build environments map
  const envsMap: Record<string, string> = {}
  for (const env of validEnvs) {
    envsMap[env.name.trim()] = env.scheme.trim()
  }

  loading.value = true
  error.value = null

  try {
    if (isEdit.value && appId) {
      const updated = await updateApp(orgId, appId, {
        name: name.value.trim(),
        environments: envsMap,
      })
      orgStore.addApp(updated)
      router.push(`/org/${orgId}/app/${appId}`)
    } else {
      const app = await createApp(orgId, {
        name: name.value.trim(),
        environments: envsMap,
      })
      orgStore.addApp(app)
      router.push(`/org/${orgId}/app/${app.id}`)
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    } else {
      console.error(e)
      error.value = "Failed to save app"
    }
  } finally {
    loading.value = false
  }
}

const backUrl = computed(() =>
    isEdit.value && appId ? `/org/${orgId}/app/${appId}` : `/org/${orgId}`
)

async function handleDelete() {
  if (!appId) return
  if (!confirm('Delete this app? This cannot be undone.')) return
  deleting.value = true
  error.value = null
  try {
    await deleteApp(orgId, appId)
    orgStore.removeApp(appId)
    router.push(`/org/${orgId}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to delete app'
  } finally {
    deleting.value = false
  }
}
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
            <h1 class="form-title">{{ isEdit ? 'Edit App' : 'Add App' }}</h1>
            <div class="form-subtitle" v-if="org">in {{ org.name }}</div>
          </div>
        </div>

        <div v-if="initialLoading" class="loading">
          <div class="spinner"></div>
          Loading…
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-group">
            <label class="form-label">App Name</label>
            <input
                v-model="name"
                class="form-input"
                placeholder="e.g. My Mobile App"
                autofocus
            />
          </div>

          <div class="form-group">
            <label class="form-label">Environments</label>
            <div class="env-header-hint">Each environment needs a name and a URL scheme.</div>
            <EnvironmentEditor v-model="environments"/>
          </div>

          <div class="form-actions">
            <button
                v-if="isEdit"
                type="button"
                class="btn btn-danger"
                :disabled="deleting || loading"
                @click="handleDelete"
            >
              {{ deleting ? 'Deleting…' : 'Delete App' }}
            </button>
            <div class="form-actions-right">
              <RouterLink :to="backUrl" class="btn btn-secondary">Cancel</RouterLink>
              <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="loading || deleting"
              >
                <div v-if="loading" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
                {{ loading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create App') }}
              </button>
            </div>
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

.env-header-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.form-actions-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
