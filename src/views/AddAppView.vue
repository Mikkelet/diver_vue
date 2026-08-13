<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useOrganizationsStore} from '@/stores/organizations'
import {createApp, deleteApp, getAppBySlug, updateApp, getOrganizationBySlug} from '@/api/client'
import type {Environment} from '@/types'
import AppLayout from '@/components/AppLayout.vue'
import EnvironmentEditor from '@/components/EnvironmentEditor.vue'

const route = useRoute()
const router = useRouter()
const orgStore = useOrganizationsStore()

const orgSlug = route.params.orgSlug as string
const appSlug = route.params.appSlug as string | undefined
const isEdit = computed(() => !!appSlug)

const orgId = ref<string>('')
const appId = ref<string>('')

const name = ref('')
const environments = ref<Environment[]>([{name: '', scheme: '', linkDomain: null}])
const loading = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const initialLoading = ref(false)

const org = computed(() => orgStore.organizations.find(o => o.slug === orgSlug))

async function resolveOrgId(): Promise<string> {
  const cached = orgStore.organizations.find(o => o.slug === orgSlug)
  if (cached) return cached.id
  const fetched = await getOrganizationBySlug(orgSlug)
  orgStore.addOrganization(fetched)
  return fetched.id
}

onMounted(async () => {
  initialLoading.value = true
  try {
    orgId.value = await resolveOrgId()
    if (isEdit.value && appSlug) {
      const app = await getAppBySlug(orgSlug, appSlug)
      appId.value = app.id
      name.value = app.name
      environments.value = app.environments.length > 0
          ? app.environments.map(e => ({...e}))
          : [{name: '', scheme: '', linkDomain: null}]
    }
  } catch {
    error.value = 'Failed to load app details'
  } finally {
    initialLoading.value = false
  }
})

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'App name is required'
    return
  }

  // An environment is addressable by a custom scheme, an https link domain, or
  // both; one of the two is enough to keep it.
  const validEnvs = environments.value.filter(
      e => e.name.trim() && (e.scheme?.trim() || e.linkDomain?.trim())
  )

  if (validEnvs.length === 0) {
    error.value = 'Add at least one environment with a name and a URL scheme or link domain'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (isEdit.value && appId.value) {
      const updated = await updateApp(orgId.value, appId.value, {
        name: name.value.trim(),
        environments: validEnvs,
      })
      orgStore.addApp(updated)
      router.push(`/org/${orgSlug}/app/${updated.slug}`)
    } else {
      const app = await createApp(orgId.value, {
        name: name.value.trim(),
        environments: validEnvs,
      })
      orgStore.addApp(app)
      router.push(`/org/${orgSlug}/app/${app.slug}`)
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
    isEdit.value && appSlug ? `/org/${orgSlug}/app/${appSlug}` : `/org/${orgSlug}`
)

async function handleDelete() {
  if (!appId.value) return
  if (!confirm('Delete this app? This cannot be undone.')) return
  deleting.value = true
  error.value = null
  try {
    await deleteApp(orgId.value, appId.value)
    orgStore.removeApp(appId.value)
    router.push(`/org/${orgSlug}`)
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
            <div class="env-header-hint">
              Each environment needs a name and a URL scheme, an https link domain, or both.
              Add the app identity to generate its assetlinks.json and apple-app-site-association.
            </div>
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
