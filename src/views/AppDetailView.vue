<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganizationsStore } from '@/stores/organizations'
import { useHistoryStore } from '@/stores/history'
import { getAppBySlug, getDeeplinks, deleteDeeplink, getOrganizationBySlug } from '@/api/client'
import type { DeeplinkTemplate, App, Environment } from '@/types'
import AppLayout from '@/components/AppLayout.vue'
import DeeplinkCard from '@/components/DeeplinkCard.vue'
import LaunchModal from '@/components/LaunchModal.vue'

const route = useRoute()
const router = useRouter()
const orgStore = useOrganizationsStore()
const historyStore = useHistoryStore()

const orgSlug = route.params.orgSlug as string
const appSlug = route.params.appSlug as string

const orgId = ref<string>('')

const app = ref<App | null>(null)
const deeplinks = ref<DeeplinkTemplate[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const launchDeeplink = ref<DeeplinkTemplate | null>(null)
const launchEnvOverride = ref<Environment | null>(null)
const launchInitialPath = ref<Record<string, string> | undefined>(undefined)
const launchInitialQuery = ref<Record<string, string | boolean | string[]> | undefined>(undefined)
const selectedEnvIndex = ref(0)
const selectedEnv = computed<Environment | null>(
  () => app.value?.environments[selectedEnvIndex.value] ?? null
)
const launchEnv = computed<Environment | null>(
  () => launchEnvOverride.value ?? selectedEnv.value
)

const org = computed(() => orgStore.organizations.find(o => o.slug === orgSlug))

async function resolveOrgId(): Promise<string> {
  const cached = orgStore.organizations.find(o => o.slug === orgSlug)
  if (cached) return cached.id
  const fetched = await getOrganizationBySlug(orgSlug)
  orgStore.addOrganization(fetched)
  return fetched.id
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const id = await resolveOrgId()
    orgId.value = id
    const appData = await getAppBySlug(orgSlug, appSlug)
    const deeplinksData = await getDeeplinks(id, appData.id)
    app.value = appData
    deeplinks.value = deeplinksData
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
}

function maybeOpenFromHistory() {
  const entryId = route.query.launchEntry as string | undefined
  if (!entryId) return
  const entry = historyStore.entries.find(e => e.id === entryId)
  if (entry?.deeplink && entry.environmentSnapshot) {
    launchDeeplink.value = entry.deeplink
    launchEnvOverride.value = entry.environmentSnapshot
    launchInitialPath.value = entry.pathValues
    launchInitialQuery.value = entry.queryValues
    const matchIdx = app.value?.environments.findIndex(e => e.name === entry.environmentSnapshot!.name) ?? -1
    if (matchIdx >= 0) selectedEnvIndex.value = matchIdx
  }
  router.replace({query: {...route.query, launchEntry: undefined}})
}

onMounted(async () => {
  await loadData()
  maybeOpenFromHistory()
})

watch(() => route.query.launchEntry, (v) => {
  if (v && !loading.value) maybeOpenFromHistory()
})

async function handleDeleteDeeplink(deeplinkId: string) {
  if (!app.value) return
  if (!confirm('Delete this deeplink? This cannot be undone.')) return
  try {
    await deleteDeeplink(orgId.value, app.value.id, deeplinkId)
    deeplinks.value = deeplinks.value.filter(d => d.id !== deeplinkId)
    app.value = { ...app.value, deeplinksCount: app.value.deeplinksCount - 1 }
  } catch {
    alert('Failed to delete deeplink')
  }
}

function handleEditDeeplink(deeplink: DeeplinkTemplate) {
  router.push(`/org/${orgSlug}/app/${appSlug}/deeplink/${deeplink.id}/edit`)
}

function handleLaunchDeeplink(deeplink: DeeplinkTemplate) {
  launchDeeplink.value = deeplink
}

function closeLaunchModal() {
  launchDeeplink.value = null
  launchEnvOverride.value = null
  launchInitialPath.value = undefined
  launchInitialQuery.value = undefined
}
</script>

<template>
  <AppLayout>
    <div class="app-detail-view">
      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        Loading…
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-message" style="margin: 20px">
        {{ error }}
        <button class="btn btn-secondary btn-sm" style="margin-left: 8px" @click="loadData">
          Retry
        </button>
      </div>

      <template v-else-if="app">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <RouterLink :to="`/org/${orgSlug}`" class="breadcrumb-link">
            {{ org?.name || 'Org' }}
          </RouterLink>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">{{ app.name }}</span>
        </div>

        <!-- Header -->
        <div class="content-header">
          <div>
            <h1 class="page-title">{{ app.name }}</h1>
            <div class="app-envs">
              <button
                v-for="(env, idx) in app.environments"
                :key="env.name"
                :class="['env-chip', { 'env-chip--active': selectedEnvIndex === idx }]"
                @click="selectedEnvIndex = idx"
              >
                {{ env.name }}
              </button>
            </div>
          </div>
          <div class="header-actions">
            <RouterLink
              :to="`/org/${orgSlug}/app/${appSlug}/edit-app`"
              class="btn btn-secondary"
              title="Edit app"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </RouterLink>
            <RouterLink
              :to="`/org/${orgSlug}/app/${appSlug}/add-deeplink`"
              class="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Deeplink
            </RouterLink>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="deeplinks.length === 0" class="empty-state">
          <div class="empty-state-icon">🔗</div>
          <h3>No deeplinks yet</h3>
          <p>Add your first deeplink template to start launching.</p>
          <RouterLink
            :to="`/org/${orgSlug}/app/${appSlug}/add-deeplink`"
            class="btn btn-primary"
            style="margin-top: 16px; display: inline-flex;"
          >
            Add Deeplink
          </RouterLink>
        </div>

        <!-- Deeplinks list -->
        <div v-else class="deeplinks-list">
          <DeeplinkCard
            v-for="deeplink in deeplinks"
            :key="deeplink.id"
            :deeplink="deeplink"
            :environment="selectedEnv"
            @launch="handleLaunchDeeplink"
          />
        </div>
      </template>
    </div>

    <!-- Launch modal -->
    <Teleport to="body">
      <LaunchModal
        v-if="launchDeeplink && app && launchEnv"
        :deeplink="launchDeeplink"
        :app="app"
        :environment="launchEnv"
        :orgId="orgId"
        :initialPathValues="launchInitialPath"
        :initialQueryValues="launchInitialQuery"
        @close="closeLaunchModal"
        @edit="dl => { closeLaunchModal(); handleEditDeeplink(dl) }"
        @delete="id => { closeLaunchModal(); handleDeleteDeeplink(id) }"
      />
    </Teleport>
  </AppLayout>
</template>

<style scoped>
.app-detail-view {
  height: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 24px 0;
  font-size: 13px;
}

.breadcrumb-link {
  color: var(--color-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-sep {
  color: var(--color-border);
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: 500;
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 24px 16px;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}

.app-envs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.env-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.env-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.env-chip--active,
.env-chip--active:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.deeplinks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 24px 24px;
}

@media (max-width: 600px) {
  .breadcrumb {
    padding: 12px 16px 0;
  }
  .content-header {
    padding: 12px 16px 12px;
  }
  .deeplinks-list {
    padding: 0 16px 16px;
  }
}
</style>
